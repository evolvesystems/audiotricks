# PostgreSQL Database Setup Guide

This guide walks you through setting up PostgreSQL for AudioTricks and establishing the initial database connection.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Configuration](#database-configuration)
3. [Initial Setup Steps](#initial-setup-steps)
4. [Running Migrations](#running-migrations)
5. [Testing the Connection](#testing-the-connection)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- PostgreSQL server (accessible remotely or locally)
- Node.js 18+ installed
- Database credentials (username, password, host, port)
- Database name: `audiotricks`

## Database Configuration

### Environment Variables

The backend uses environment variables for database configuration. Create a `.env` file in the `backend` directory:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@host:port/audiotricks"

# Example:
# DATABASE_URL="postgresql://myuser:mypassword@db.example.com:5432/audiotricks"

# Security Keys (generate secure random strings)
JWT_SECRET="your-32-character-secure-random-string"
ENCRYPTION_KEY="another-32-character-secure-string"

# Server Configuration
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

### Security Considerations

1. **Never commit `.env` files** to version control
2. Use strong, randomly generated secrets for JWT_SECRET and ENCRYPTION_KEY
3. Ensure your PostgreSQL server uses SSL/TLS for remote connections
4. Use least-privilege database user accounts

## Initial Setup Steps

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Prisma ORM for database access
- Express.js for the API server
- Authentication libraries (bcrypt, jsonwebtoken)
- TypeScript and development tools

### 3. Configure Database Connection

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual database credentials.

### 4. Generate Prisma Client

```bash
npm run generate
```

This generates the TypeScript types for your database schema.

## Running Migrations

### First-Time Setup

To create all database tables:

```bash
npm run migrate
```

This will:
1. Connect to your PostgreSQL database
2. Create the following tables:
   - `users` - User accounts with authentication
   - `sessions` - Active login sessions
   - `user_settings` - User preferences and encrypted API keys
   - `audio_history` - Audio processing history

### Migration Output

You should see output like:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "audiotricks"

Applying migration `20240101000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

✔ Generated Prisma Client
```

## Testing the Connection

### 1. Start the Backend Server

```bash
npm run dev
```

Expected output:
```
[INFO] Database connection established successfully
[INFO] Server running on port 3000 in development mode
[INFO] Frontend URL: http://localhost:3001
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### 3. Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123"
  }'
```

Success response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "username": "testuser",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Troubleshooting

### Connection Refused

If you get "Connection refused" errors:

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready -h your-host -p 5432
   ```

2. **Verify credentials:**
   ```bash
   psql -h your-host -U your-username -d audiotricks
   ```

3. **Check firewall rules** - Ensure port 5432 is open

### Authentication Failed

If you get "password authentication failed":

1. Verify username and password are correct
2. Check PostgreSQL authentication method (pg_hba.conf)
3. Ensure user has CONNECT privilege on the database

### SSL/TLS Issues

For remote connections requiring SSL:

```env
DATABASE_URL="postgresql://user:pass@host:5432/audiotricks?sslmode=require"
```

### Migration Errors

If migrations fail:

1. **Check database exists:**
   ```sql
   CREATE DATABASE audiotricks;
   ```

2. **Verify user permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE audiotricks TO your_user;
   ```

3. **Reset and retry:**
   ```bash
   npx prisma migrate reset --force
   npm run migrate
   ```

## Next Steps

After successful setup:

1. Use Prisma Studio to view data: `npm run studio`
2. Implement frontend authentication
3. Set up production deployment
4. Configure backup strategies

## Database Schema Overview

The database uses four main tables:

- **users**: Core user data (email, username, password hash)
- **sessions**: JWT session tracking for security
- **user_settings**: Encrypted API keys and preferences
- **audio_history**: Processing history with metadata

See `/backend/prisma/schema.prisma` for the complete schema definition.