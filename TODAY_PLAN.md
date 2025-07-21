# Today's Implementation Plan

## 🎯 Goal: Get Basic Backend Working

Since we now have everything on one port, let's focus on getting the core backend functionality running.

## 📅 Today's Tasks (Prioritized)

### Morning (2-3 hours)
#### 1. Database Setup ✅
```bash
# 1.1 Install PostgreSQL locally or use Docker
docker run --name audiotricks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 1.2 Create database
createdb audiotricks

# 1.3 Install Prisma
npm install prisma @prisma/client
npm install -D @types/node

# 1.4 Initialize Prisma
npx prisma init
```

#### 2. Basic Database Schema
Create minimal working schema first:
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
  
  apiKeys   ApiKey[]
  sessions  Session[]
}

model Session {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model ApiKey {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  openaiKeyEncrypted    String?
  elevenLabsKeyEncrypted String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Late Morning (2 hours)
#### 3. Authentication Implementation
Update `server.js` with real auth:
- [ ] Add bcrypt for password hashing
- [ ] Add JWT for tokens
- [ ] Implement login endpoint
- [ ] Implement session check
- [ ] Add auth middleware

```javascript
// Key packages to install
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Afternoon (3 hours)
#### 4. API Key Storage Backend
- [ ] Add encryption for API keys
- [ ] Implement `/api/settings/api-keys` endpoints
- [ ] Test with frontend migration flow
- [ ] Verify secure storage works

```javascript
// Encryption package
npm install crypto-js
```

#### 5. Basic File Upload
- [ ] Add multer for file uploads
- [ ] Create `/api/upload` endpoint
- [ ] Store file metadata in database
- [ ] Return file info to frontend

```javascript
npm install multer
```

### Late Afternoon (2 hours)
#### 6. OpenAI Integration
- [ ] Create OpenAI proxy endpoints
- [ ] Use stored API keys from database
- [ ] Implement `/api/proxy/openai/transcription`
- [ ] Test with frontend

```javascript
npm install openai
```

## 📋 Simplified Task List

1. **Database** (30 min)
   - Install PostgreSQL
   - Create database
   - Setup Prisma

2. **Schema** (30 min)
   - Create basic schema
   - Run migrations

3. **Auth** (2 hours)
   - Login/logout
   - Sessions
   - Middleware

4. **API Keys** (1.5 hours)
   - Encryption
   - Storage endpoints
   - Frontend testing

5. **File Upload** (1 hour)
   - Basic upload endpoint
   - File metadata

6. **OpenAI Proxy** (1.5 hours)
   - Transcription endpoint
   - Use secure keys

## 🚫 NOT Today (Save for Later)
- Complex workspace features
- Payment integration
- Email system
- Advanced analytics
- Chat bot
- Storage optimization

## 💻 Commands to Run

```bash
# Start your day
cd /Users/johnnorth/CascadeProjects/AudioTricks

# Install backend dependencies
npm install prisma @prisma/client bcryptjs jsonwebtoken crypto-js multer openai
npm install -D @types/node @types/bcryptjs @types/jsonwebtoken @types/multer

# Setup database
npx prisma init
npx prisma migrate dev --name init

# Run the app
npm run dev

# Test at
http://localhost:3000
```

## ✅ Success Criteria

By end of day, you should be able to:
1. Create a user account
2. Login and get a session
3. Save API keys (encrypted)
4. Upload an audio file
5. Transcribe using OpenAI (through backend)

## 📝 Notes

- Keep it simple - MVP first
- Don't worry about perfect code
- Test each feature as you go
- Commit working code frequently
- Ask for help if stuck

## 🎯 Focus

**One Port, One Day, Core Features Working**

The goal is to have a working backend by end of day, not a perfect one. We can refine later!