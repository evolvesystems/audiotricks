# AudioTricks Backend API Documentation

## Overview

The AudioTricks backend is a comprehensive API built with Node.js, Express, TypeScript, and PostgreSQL. It provides secure audio file processing, transcription, and AI-powered analysis capabilities.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Authentication**: JWT-based with secure sessions
- **AI Integration**: OpenAI (Whisper & GPT), ElevenLabs
- **Security**: bcrypt, AES-256-GCM encryption, rate limiting

### Key Features
1. **Secure Authentication & Authorization**
2. **Multi-workspace Support**
3. **Large File Upload with Chunking**
4. **AI-Powered Audio Processing**
5. **API Key Management with Encryption**
6. **Usage Tracking & Quota Enforcement**
7. **Comprehensive Audit Logging**

## API Endpoints

### Authentication (`/api/auth`)

#### Register
```
POST /api/auth/register
Body: { email, password, username }
Response: { user, token }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Response: { user, token }
```

#### Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { message }
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { user }
```

### Workspaces (`/api/workspaces`)

#### Create Workspace
```
POST /api/workspaces
Headers: Authorization: Bearer <token>
Body: { name, description?, slug? }
Response: { workspace }
```

#### List Workspaces
```
GET /api/workspaces
Headers: Authorization: Bearer <token>
Response: { workspaces }
```

#### Get Workspace
```
GET /api/workspaces/:id
Headers: Authorization: Bearer <token>
Response: { workspace }
```

#### Update Workspace
```
PUT /api/workspaces/:id
Headers: Authorization: Bearer <token>
Body: { name?, description?, settings? }
Response: { workspace }
```

#### Invite User
```
POST /api/workspaces/:id/invite
Headers: Authorization: Bearer <token>
Body: { email, role }
Response: { invitation }
```

### File Upload (`/api/upload`)

#### Initialize Upload
```
POST /api/upload/initialize
Headers: Authorization: Bearer <token>
Body: { filename, fileSize, mimeType, workspaceId }
Response: { 
  uploadId, 
  multipart: boolean,
  uploadUrls?: string[], 
  chunkSize?: number 
}
```

#### Upload File (Small Files)
```
POST /api/upload
Headers: Authorization: Bearer <token>
Body: FormData { file, uploadId }
Response: { success, upload }
```

#### Upload Chunk (Large Files)
```
POST /api/upload/chunk
Headers: Authorization: Bearer <token>
Body: FormData { file, uploadId, chunkIndex, totalChunks }
Response: { success, chunk, progress }
```

#### Get Upload Status
```
GET /api/upload/:uploadId/status
Headers: Authorization: Bearer <token>
Response: { upload details }
```

#### List Uploads
```
GET /api/upload
Headers: Authorization: Bearer <token>
Query: { workspaceId?, status?, limit?, offset? }
Response: { uploads, pagination }
```

### Audio Processing (`/api/processing`)

#### Start Processing
```
POST /api/processing/start
Headers: Authorization: Bearer <token>
Body: { 
  uploadId, 
  jobType: 'transcription' | 'summary' | 'analysis',
  options?: { language?, model?, temperature? }
}
Response: { success, job }
```

#### Get Job Status
```
GET /api/processing/job/:jobId
Headers: Authorization: Bearer <token>
Response: { jobId, status, progress, result?, error? }
```

#### List Jobs
```
GET /api/processing/jobs
Headers: Authorization: Bearer <token>
Query: { workspaceId?, status?, jobType?, limit?, offset? }
Response: { jobs, pagination }
```

### API Key Management (`/api/api-keys`)

#### Store API Key
```
POST /api/api-keys
Headers: Authorization: Bearer <token>
Body: { provider: 'openai' | 'elevenlabs', apiKey, metadata? }
Response: { success, keyInfo }
```

#### List API Keys
```
GET /api/api-keys
Headers: Authorization: Bearer <token>
Response: { keys }
```

#### Validate API Key
```
POST /api/api-keys/validate
Headers: Authorization: Bearer <token>
Body: { provider, apiKey }
Response: { valid, provider }
```

#### Delete API Key
```
DELETE /api/api-keys/:provider
Headers: Authorization: Bearer <token>
Response: { success }
```

#### Get API Key Usage
```
GET /api/api-keys/:provider/usage
Headers: Authorization: Bearer <token>
Query: { days? }
Response: { provider, stats }
```

#### Test API Key
```
POST /api/api-keys/:provider/test
Headers: Authorization: Bearer <token>
Response: { provider, test }
```

### Usage Tracking (`/api/usage`)

#### Get Workspace Usage
```
GET /api/usage/:workspaceId
Headers: Authorization: Bearer <token>
Response: { 
  usage: {
    storage, processing, apiCalls, 
    transcription, aiTokens 
  }
}
```

#### Get Usage Report
```
GET /api/usage/:workspaceId/report
Headers: Authorization: Bearer <token>
Query: { period: 'daily' | 'weekly' | 'monthly' }
Response: { report }
```

#### Get Usage History
```
GET /api/usage/:workspaceId/history
Headers: Authorization: Bearer <token>
Query: { days? }
Response: { records, reports }
```

#### Check Quota
```
GET /api/usage/:workspaceId/quota/:resourceType
Headers: Authorization: Bearer <token>
Query: { amount? }
Response: { current, limit, percentUsed, exceeded }
```

## Security Features

### Authentication
- JWT tokens with secure HTTP-only cookies
- Session management with token rotation
- Rate limiting on auth endpoints
- Account lockout after failed attempts

### API Key Security
- AES-256-GCM encryption for stored keys
- PBKDF2 key derivation
- Secure key validation without exposure
- Audit logging for all key operations

### Data Protection
- All sensitive data encrypted at rest
- TLS/SSL for data in transit
- Input validation and sanitization
- SQL injection prevention with Prisma

## Quota System

### Resource Types
1. **Storage**: Total file storage per workspace
2. **Processing Minutes**: Audio processing time
3. **API Calls**: External API usage count
4. **Transcription Minutes**: Audio transcription time
5. **AI Tokens**: GPT token usage

### Quota Enforcement
- Pre-operation quota checks
- Real-time usage tracking
- Automatic quota reset (monthly)
- Warning notifications at 80% usage

### Default Quotas (Free Tier)
- Storage: 1GB
- Processing: 60 minutes
- API Calls: 1,000/month
- Transcription: 30 minutes
- AI Tokens: 50,000/month

## Database Schema

### Core Tables
- `users`: User accounts and profiles
- `workspaces`: Multi-tenant workspaces
- `workspace_users`: User-workspace relationships
- `sessions`: JWT session management

### Audio Processing
- `audio_uploads`: File upload tracking
- `audio_chunks`: Multipart upload chunks
- `processing_jobs`: Job queue and status
- `audio_history`: Processed audio records
- `audio_segments`: Transcript segments

### Security & Billing
- `api_key_management`: Encrypted API keys
- `api_key_usage_log`: Usage tracking
- `workspace_subscriptions`: Plan subscriptions
- `subscription_plans`: Available plans
- `usage_tracking`: Real-time usage data
- `usage_reports`: Historical reports

### Storage
- `storage_providers`: Storage configurations
- `file_storage`: File metadata
- `storage_quotas`: Quota allocations

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Quota Exceeded
- `500`: Internal Server Error

## Development

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=3001
NODE_ENV=production

# Auth
JWT_SECRET="..."
ENCRYPTION_KEY="..."

# Storage
DO_SPACES_KEY="..."
DO_SPACES_SECRET="..."
DO_SPACES_ENDPOINT="..."
DO_SPACES_BUCKET="..."
DO_SPACES_CDN="..."

# Email (Future)
SENDGRID_API_KEY="..."

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### Running the Backend
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

## Deployment

### Requirements
- Node.js 18+
- PostgreSQL 14+
- DigitalOcean Spaces or S3-compatible storage
- SSL/TLS certificate

### Production Checklist
- [ ] Set secure environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Enable rate limiting
- [ ] Set up log aggregation

## Future Enhancements

### Planned Features
1. **Email Service**: SendGrid integration for notifications
2. **Payment Gateway**: eWAY integration for subscriptions
3. **Webhook System**: Real-time event notifications
4. **Advanced Analytics**: Usage dashboards and insights
5. **Team Collaboration**: Comments and sharing
6. **Mobile SDK**: iOS/Android client libraries

### API Versioning
Future versions will use URL versioning:
- v1: `/api/v1/...` (current)
- v2: `/api/v2/...` (future)

## Support

For issues or questions:
- GitHub Issues: [AudioTricks Backend](https://github.com/yourusername/audiotricks-backend)
- API Status: `/health` endpoint
- Documentation: This file