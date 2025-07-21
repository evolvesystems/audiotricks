import crypto from 'crypto';
import { env } from '../config/environment.js';

const algorithm = 'aes-256-gcm';
const keyBuffer = Buffer.from(env.ENCRYPTION_KEY, 'utf-8').slice(0, 32);

/**
 * Encrypts a string using AES-256-GCM
 * @param text - Text to encrypt
 * @returns Encrypted text with IV and auth tag
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a string encrypted with AES-256-GCM
 * @param encryptedText - Encrypted text with IV and auth tag
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hashes a token for secure storage
 * @param token - Token to hash
 * @returns SHA256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}