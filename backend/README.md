# AudioTricks Backend

PostgreSQL-powered backend for the AudioTricks audio processing platform.

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection details:

```env
DATABASE_URL="postgresql://username:password@your-server:5432/audiotricks"
JWT_SECRET="generate-a-secure-32-character-string"
ENCRYPTION_KEY="generate-another-32-character-string"
```

### 3. Database Setup

#### Create the database (if not already created):

```sql
CREATE DATABASE audiotricks;
```

#### Run Prisma migrations to create tables:

```bash
# Generate Prisma client
npm run generate

# Run migrations
npm run migrate
```

This will create all necessary tables:
- `users` - User accounts
- `sessions` - Active user sessions
- `user_settings` - User preferences and encrypted API keys
- `audio_history` - Audio processing history

### 4. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Testing the Connection

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Test user registration:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123"
  }'
```

## Database Management

```bash
# View and edit data with Prisma Studio
npm run studio

# Create new migration after schema changes
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npm run migrate:prod
```

## Security Notes

- Never commit `.env` file
- Use strong JWT_SECRET and ENCRYPTION_KEY values
- API keys are encrypted before database storage
- All passwords are hashed with bcrypt
- Sessions expire after 7 days by default