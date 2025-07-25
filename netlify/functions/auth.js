const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeWithRetry, disconnectPrisma } = require('./db-utils');

// Cache bust: 1738330640

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

    // Registration endpoint (for testing)
    if (endpoint === '/register' && method === 'POST') {
      let email, password, username;
      try {
        const body = JSON.parse(event.body);
        email = body.email;
        password = body.password;
        username = body.username;
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid request body' })
        };
      }

      if (!email || !password || !username) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email, password, and username are required' })
        };
      }

      try {
        // Check if user exists with retry logic
        const existingUser = await executeWithRetry(
          async (prisma) => {
            return await prisma.user.findFirst({
              where: {
                OR: [{ email }, { username }]
              },
              select: {
                id: true,
                email: true,
                username: true
              }
            });
          },
          'Check existing user'
        );

        if (existingUser) {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
            })
          };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user with retry logic
        const user = await executeWithRetry(
          async (prisma) => {
            return await prisma.user.create({
              data: {
                email,
                username,
                passwordHash,
                role: 'admin', // Make first user admin
                isActive: true
              },
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true
              }
            });
          },
          'Create user'
        );

        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({
            message: 'Registration successful',
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          })
        };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Registration failed',
            details: error.message
          })
        };
      }
    }

    // Login endpoint
    if (endpoint === '/login' && method === 'POST') {
      let email, password;
      try {
        const body = JSON.parse(event.body);
        email = body.email;
        password = body.password;
      } catch (parseError) {
        console.error('Failed to parse login body:', parseError);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid request body' })
        };
      }

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }

      // Find user with retry logic
      let user;
      try {
        console.log('Looking up user with email/username:', email);
        
        user = await executeWithRetry(
          async (prisma) => {
            return await prisma.user.findFirst({
              where: {
                OR: [
                  { email: email },
                  { username: email }
                ]
              },
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                passwordHash: true
              }
            });
          },
          'User lookup'
        );
        
        console.log('User lookup result:', user ? 'Found user' : 'No user found');
      } catch (dbError) {
        console.error('Database error during user lookup:', {
          error: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
          email: email
        });
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Database error during authentication',
            details: dbError.message,
            code: dbError.code
          })
        };
      }

      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Account is deactivated' })
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
      // Use crypto.randomBytes for compatibility with older Node versions
      const sessionId = crypto.randomBytes(16).toString('hex');
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          sessionId 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Login successful',
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
        
        // Get fresh user data from database with retry
        const user = await executeWithRetry(
          async (prisma) => {
            return await prisma.user.findUnique({
              where: { id: decoded.userId },
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true
              }
            });
          },
          'Get user data'
        );

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
        // Test database connection with retry
        await executeWithRetry(
          async (prisma) => {
            await prisma.$queryRaw`SELECT 1`;
          },
          'Health check'
        );
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
    await disconnectPrisma();
  }
};