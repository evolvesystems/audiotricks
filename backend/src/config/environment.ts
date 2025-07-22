import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  ENCRYPTION_KEY: z.string().min(32),
  
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  
  // Storage Configuration
  DO_SPACES_ENDPOINT: z.string().url().optional(),
  DO_SPACES_KEY: z.string().optional(),
  DO_SPACES_SECRET: z.string().optional(),
  DO_SPACES_BUCKET: z.string().optional(),
  DO_SPACES_REGION: z.string().default('nyc3'),
  DO_CDN_ENDPOINT: z.string().url().optional(),
  
  // Email Configuration
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().default('AudioTricks'),
  
  // Payment Configuration
  EWAY_API_KEY: z.string().optional(),
  EWAY_API_PASSWORD: z.string().optional(),
  EWAY_ENDPOINT: z.string().url().default('https://api.sandbox.ewaypayments.com'),
});

/**
 * Validates and exports environment variables
 */
export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;