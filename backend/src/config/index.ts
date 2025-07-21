import { env } from './environment';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    url: env.DATABASE_URL
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  },
  
  encryption: {
    key: env.ENCRYPTION_KEY
  },
  
  cors: {
    origin: env.FRONTEND_URL
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS
  },
  
  storage: {
    digitalOcean: {
      endpoint: env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
      accessKey: env.DO_SPACES_KEY || '',
      secretKey: env.DO_SPACES_SECRET || '',
      bucket: env.DO_SPACES_BUCKET || 'audiotricks',
      region: env.DO_SPACES_REGION,
      cdnEndpoint: env.DO_CDN_ENDPOINT
    }
  },
  
  email: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY || '',
      fromEmail: env.SENDGRID_FROM_EMAIL || 'noreply@audiotricks.com',
      fromName: env.SENDGRID_FROM_NAME
    }
  },
  
  payment: {
    eway: {
      apiKey: env.EWAY_API_KEY || '',
      apiPassword: env.EWAY_API_PASSWORD || '',
      endpoint: env.EWAY_ENDPOINT
    }
  },
  
  api: {
    openai: {
      apiKey: env.OPENAI_API_KEY || ''
    },
    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY || ''
    }
  }
};