const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
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
  const path = event.path.replace('/api/auth', '').replace('/.netlify/functions/auth', '');
  return path || '/';
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

    // Login endpoint
    if (endpoint === '/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email }
          ]
        }
      });

      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          token
        })
      };
    }

    // Me endpoint - verify token and return user info
    if (endpoint === '/me' && method === 'GET') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No token provided' })
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';

      try {
        const decoded = jwt.verify(token, jwtSecret);
        
        // Get fresh user data from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user || !user.isActive) {
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'User not found or inactive' })
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          })
        };
      } catch (error) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid token' })
        };
      }
    }

    // Logout endpoint
    if (endpoint === '/logout' && method === 'POST') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logged out successfully' })
      };
    }

    // Health check endpoint for debugging
    if (endpoint === '/health' && method === 'GET') {
      const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          hasDbUrl: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV,
          dbUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set'
        }
      };

      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        healthCheck.database = 'connected';
      } catch (dbError) {
        healthCheck.database = 'failed';
        healthCheck.dbError = dbError.message;
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(healthCheck)
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Auth endpoint not found' })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      endpoint: getEndpoint(event),
      method: event.httpMethod,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
    
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