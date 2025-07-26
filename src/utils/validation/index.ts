/**
 * Comprehensive Input Validation System
 * Provides validation utilities for all user inputs
 */

import { createDebugLogger } from '../debug-logger';

const debug = createDebugLogger('validation');

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
  sanitize?: (value: any) => any;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  apiKey: /^[a-zA-Z0-9_-]{20,}$/,
  url: /^https?:\/\/.+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d+)?$/,
  phone: /^\+?[\d\s()-]+$/,
  creditCard: /^\d{13,19}$/,
  postalCode: /^[A-Z0-9]{3,10}$/i
};

/**
 * Common validation rules
 */
export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && pattern.test(value),
    message
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && patterns.email.test(value),
    message,
    sanitize: (value) => value.toLowerCase().trim()
  }),

  username: (message = 'Username must be 3-30 characters, alphanumeric, _, or -'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && patterns.username.test(value),
    message
  }),

  password: (message = 'Password must be at least 8 characters with uppercase, lowercase, and number'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && patterns.password.test(value),
    message
  }),

  numeric: (message = 'Must be a number'): ValidationRule => ({
    validate: (value) => !isNaN(Number(value)),
    message,
    sanitize: (value) => Number(value)
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => Number(value) >= min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => Number(value) <= max,
    message: message || `Must be no more than ${max}`
  }),

  inRange: (min: number, max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = Number(value);
      return num >= min && num <= max;
    },
    message: message || `Must be between ${min} and ${max}`
  }),

  oneOf: (values: any[], message?: string): ValidationRule => ({
    validate: (value) => values.includes(value),
    message: message || `Must be one of: ${values.join(', ')}`
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && patterns.url.test(value),
    message,
    sanitize: (value) => value.trim()
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message
  })
};

/**
 * Validate a single value against rules
 */
export function validateValue(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  let sanitized = value;

  for (const rule of rules) {
    if (!rule.validate(sanitized)) {
      errors.push(rule.message);
    } else if (rule.sanitize) {
      sanitized = rule.sanitize(sanitized);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate an object against a schema
 */
export function validateObject(data: any, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const result = validateValue(value, rules);

    if (!result.valid) {
      errors.push(...result.errors.map(err => `${field}: ${err}`));
    } else {
      sanitized[field] = result.sanitized !== undefined ? result.sanitized : value;
    }
  }

  debug.log('Validation completed', { 
    valid: errors.length === 0, 
    errorCount: errors.length,
    fields: Object.keys(schema)
  });

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const { 
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a form validator
 */
export function createFormValidator(schema: ValidationSchema) {
  return {
    validate: (data: any) => validateObject(data, schema),
    
    validateField: (field: string, value: any) => {
      const rules = schema[field];
      return rules ? validateValue(value, rules) : { valid: true, errors: [] };
    },
    
    getFieldRules: (field: string) => schema[field] || []
  };
}