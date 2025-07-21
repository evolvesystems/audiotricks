const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Helper to parse request path
const getEndpoint = (event) => {
  const path = event.path.replace('/api/admin', '').replace('/.netlify/functions/admin', '');
  return path || '/';
};

// Helper to verify admin token
const verifyAdminToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.replace('Bearer ', '');
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if user has admin role
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      throw new Error('Insufficient permissions');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const endpoint = getEndpoint(event);
    const method = event.httpMethod;
    
    // Verify admin authentication for all endpoints
    const decoded = verifyAdminToken(event);

    // Get users list
    if (endpoint === '/users' && method === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || {});
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '20');
      const search = params.get('search') || '';
      const offset = (page - 1) * limit;

      const whereCondition = search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      // Get users with pagination
      const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
          where: whereCondition,
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                workspaces: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.user.count({ where: whereCondition })
      ]);

      const totalPages = Math.ceil(totalUsers / limit);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          users: users.map(user => ({
            ...user,
            workspaceCount: user._count.workspaces
          })),
          pagination: {
            page,
            limit,
            total: totalUsers,
            pages: totalPages
          }
        })
      };
    }

    // Get admin stats
    if (endpoint === '/stats' && method === 'GET') {
      const [
        totalUsers,
        activeUsers,
        totalWorkspaces,
        recentUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.workspace.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          stats: {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            totalWorkspaces,
            recentUsers
          }
        })
      };
    }

    // Toggle user status
    if (endpoint.match(/^\/users\/[^\/]+\/toggle-status$/) && method === 'PUT') {
      const userId = endpoint.split('/')[2];
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'User status updated',
          user: {
            id: updatedUser.id,
            isActive: updatedUser.isActive
          }
        })
      };
    }

    // Update user role
    if (endpoint.match(/^\/users\/[^\/]+\/role$/) && method === 'PUT') {
      const userId = endpoint.split('/')[2];
      const { role } = JSON.parse(event.body);

      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid role' })
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'User role updated',
          user: {
            id: updatedUser.id,
            role: updatedUser.role
          }
        })
      };
    }

    // Delete user
    if (endpoint.match(/^\/users\/[^\/]+$/) && method === 'DELETE') {
      const userId = endpoint.split('/')[2];
      
      // Don't allow deleting yourself
      if (userId === decoded.userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cannot delete your own account' })
        };
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User deleted successfully' })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Admin endpoint not found' })
    };

  } catch (error) {
    console.error('Admin function error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    if (error.message === 'Insufficient permissions') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};