# AudioTricks Backend Architecture

## Overview

The AudioTricks backend is a Node.js/Express application that provides RESTful APIs for user authentication, data persistence, and secure API key management. It follows a layered architecture pattern with clear separation of concerns.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Logging**: Winston

## Directory Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client setup
│   │   └── environment.ts # Environment validation
│   ├── controllers/     # Request handlers
│   │   └── auth.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   └── errorHandler.ts
│   ├── models/          # Data models (Prisma generates these)
│   ├── routes/          # API route definitions
│   │   └── auth.routes.ts
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   │   ├── encryption.ts # API key encryption
│   │   └── logger.ts    # Winston logger
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── migrations/          # Database migrations
├── tests/              # Test files
└── package.json
```

## Core Components

### 1. Database Layer (Prisma)

The database layer uses Prisma ORM for type-safe database access:

- **Connection pooling** for efficient resource usage
- **Automatic migrations** for schema changes
- **Type generation** from schema to TypeScript

### 2. Authentication System

JWT-based authentication with secure session management:

- **Registration**: Email/username validation, password strength requirements
- **Login**: Credential verification, JWT generation
- **Session Management**: Token storage, expiration handling
- **Middleware**: Request authentication for protected routes

### 3. Security Measures

Multiple layers of security:

- **Helmet.js**: Sets security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: express-validator for all inputs
- **Password Hashing**: bcrypt with 12 rounds
- **API Key Encryption**: AES-256-GCM for stored keys

### 4. Error Handling

Centralized error handling:

- **Global error middleware**: Catches all errors
- **Logging**: Winston for structured logging
- **Client-friendly responses**: No stack traces in production
- **HTTP status codes**: Proper REST conventions

## API Design Principles

### RESTful Conventions

- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT**: Update existing resources
- **DELETE**: Remove resources

### Response Format

Success responses:
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "error": "Error message",
  "errors": [ ... ] // For validation errors
}
```

### Authentication Flow

1. **Registration**:
   - User provides email, username, password
   - Server validates input
   - Password is hashed with bcrypt
   - User record created in database

2. **Login**:
   - User provides credentials
   - Server verifies password
   - JWT token generated with user ID and session ID
   - Session record created in database
   - Token returned to client

3. **Authenticated Requests**:
   - Client sends token in Authorization header
   - Middleware verifies token and session
   - User ID attached to request
   - Route handler processes request

## Data Models

### User Model
```typescript
{
  id: string (UUID)
  email: string (unique)
  username: string (unique)
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date?
  isActive: boolean
}
```

### Session Model
```typescript
{
  id: string (UUID)
  userId: string (foreign key)
  tokenHash: string (SHA256)
  expiresAt: Date
  createdAt: Date
}
```

### UserSettings Model
```typescript
{
  userId: string (foreign key)
  openaiApiKeyEncrypted: string?
  elevenlabsApiKeyEncrypted: string?
  preferredLanguage: string
  summaryQuality: string
  settingsJson: JSON
  updatedAt: Date
}
```

## Environment Configuration

Environment variables are validated using Zod:

- **Required**: DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY
- **Optional**: API keys, rate limit settings
- **Defaults**: Provided for development

## Development Workflow

### Local Development

```bash
npm run dev     # Start with hot reload
npm run build   # Compile TypeScript
npm run test    # Run tests
```

### Database Management

```bash
npm run migrate      # Apply migrations
npm run studio       # Open Prisma Studio
npm run generate     # Generate Prisma Client
```

## Production Considerations

### Deployment Checklist

1. Set NODE_ENV=production
2. Use strong JWT_SECRET and ENCRYPTION_KEY
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Implement monitoring
6. Configure backup strategy

### Performance Optimization

- Connection pooling for database
- Caching for frequently accessed data
- Indexed database queries
- Gzip compression
- CDN for static assets

### Monitoring

- Health check endpoint
- Structured logging with Winston
- Error tracking
- Performance metrics
- Database query monitoring

## Future Enhancements

1. **API Versioning**: /api/v1, /api/v2
2. **WebSocket Support**: Real-time updates
3. **Redis Caching**: Session storage, API responses
4. **Queue System**: Background job processing
5. **Microservices**: Service separation as needed