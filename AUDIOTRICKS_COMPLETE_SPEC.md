# AudioTricks Complete Specification Document

This document extracts all design decisions, features, and specifications from the current AudioTricks React/Node.js application for redevelopment in Symfony.

## Table of Contents
1. [Application Overview](#application-overview)
2. [Feature Inventory](#feature-inventory)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Route Structure](#route-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Business Logic](#business-logic)
8. [UI Components](#ui-components)
9. [Integrations](#integrations)
10. [Security & Authentication](#security--authentication)

---

## Application Overview

**AudioTricks** is an AI-powered audio processing platform that allows users to:
- Upload audio files for transcription
- Edit and enhance audio with AI
- Generate summaries and insights
- Collaborate in workspaces
- Manage subscriptions and billing

### Core Value Proposition
- **Fast Audio Transcription**: Using OpenAI Whisper API
- **Smart Summarization**: AI-powered content summaries
- **Team Collaboration**: Workspace-based sharing
- **Enterprise Features**: Admin panel, analytics, billing

---

## Feature Inventory

### 1. Audio Processing Features

#### 1.1 Audio Upload
- **Supported Formats**: MP3, WAV, OGG, M4A, FLAC
- **Max File Size**: 100MB (configurable per plan)
- **Upload Methods**:
  - Drag and drop
  - File browser selection
  - Chunked upload for large files
  - Resume capability
- **Progress Tracking**: Real-time progress bar
- **Batch Upload**: Multiple files at once

#### 1.2 Audio Transcription
- **Provider**: OpenAI Whisper API
- **Features**:
  - Automatic language detection
  - Speaker identification
  - Timestamp generation
  - Multiple output formats (SRT, VTT, TXT, JSON)
- **Accuracy Options**:
  - Fast (lower quality)
  - Standard (balanced)
  - High (best quality)

#### 1.3 Audio Editor
- **Waveform Visualization**: Interactive waveform display
- **Editing Features**:
  - Trim/Cut sections
  - Normalize audio
  - Noise reduction
  - Volume adjustment
  - Speed control
- **Export Options**:
  - Original quality
  - Compressed versions
  - Multiple formats

#### 1.4 AI Features
- **Summarization**: Automatic content summaries
- **Key Points Extraction**: Bullet point highlights
- **Sentiment Analysis**: Mood detection
- **Topic Categorization**: Auto-tagging
- **Translation**: Multi-language support

### 2. User Features

#### 2.1 Dashboard
- **Stats Overview**:
  - Total files processed
  - Storage used
  - API calls this month
  - Recent activity
- **Quick Actions**:
  - Upload new file
  - View recent transcriptions
  - Access projects
- **Activity Feed**: Recent file activities

#### 2.2 Projects
- **Organization**: Group related audio files
- **Features**:
  - Create/Edit/Delete projects
  - Project templates
  - Batch operations
  - Project sharing
- **Metadata**: Tags, descriptions, custom fields

#### 2.3 File Management
- **List View**: Sortable, filterable table
- **Grid View**: Thumbnail previews
- **Search**: Full-text search across transcriptions
- **Filters**:
  - Date range
  - File type
  - Processing status
  - Tags

### 3. Collaboration Features

#### 3.1 Workspaces
- **Multi-tenant**: Isolated environments
- **Features**:
  - Create multiple workspaces
  - Workspace switching
  - Custom branding
  - Workspace settings
- **Limits**: Based on subscription plan

#### 3.2 Team Management
- **User Invitations**: Email-based invites
- **Roles**:
  - Owner (full control)
  - Admin (manage users)
  - Editor (create/edit content)
  - Viewer (read-only)
- **Permissions**: Granular access control

#### 3.3 Sharing
- **Internal Sharing**: Within workspace
- **External Sharing**:
  - Public links
  - Password protection
  - Expiration dates
  - Download permissions

### 4. Admin Features

#### 4.1 User Management
- **User List**: Paginated, searchable
- **Actions**:
  - View user details
  - Edit user profile
  - Change roles
  - Suspend/Activate accounts
  - Delete users
- **Bulk Operations**: Select multiple users

#### 4.2 Workspace Management
- **Overview**: All workspaces
- **Metrics**:
  - User count
  - Storage usage
  - Activity levels
- **Actions**:
  - View workspace details
  - Manage limits
  - Transfer ownership

#### 4.3 Subscription Management
- **Plans**: View/Edit subscription plans
- **Users**: Manage user subscriptions
- **Billing**: Payment history
- **Invoices**: Generate/Send invoices

#### 4.4 Analytics Dashboard
- **Metrics**:
  - User growth
  - Revenue analytics
  - Usage patterns
  - API consumption
- **Charts**:
  - Line graphs
  - Bar charts
  - Pie charts
  - Heat maps

#### 4.5 System Settings
- **General Settings**:
  - Site configuration
  - Email templates
  - API limits
  - Storage settings
- **Security Settings**:
  - Password policies
  - 2FA requirements
  - Session management
- **Integration Settings**:
  - API keys management
  - Webhook configuration
  - Third-party services

### 5. Billing & Subscriptions

#### 5.1 Subscription Plans
- **Free Tier**:
  - 5 files/month
  - 50MB storage
  - Basic features
- **Pro Plan** ($29/month):
  - 100 files/month
  - 5GB storage
  - All features
  - Priority support
- **Enterprise** (Custom):
  - Unlimited files
  - Custom storage
  - SLA support
  - Custom features

#### 5.2 Payment Processing
- **Providers**: 
  - Stripe (primary)
  - eWAY (Australian gateway)
- **Payment Methods**:
  - Credit/Debit cards
  - PayPal
  - Wire transfer (Enterprise)
- **Features**:
  - Recurring billing
  - Proration
  - Refunds
  - Invoicing

#### 5.3 Usage Tracking
- **Metrics Tracked**:
  - File uploads
  - Storage usage
  - API calls
  - Processing minutes
- **Quotas**: Enforced per plan
- **Overage**: Automatic upgrades or limits

---

## User Roles & Permissions

### System Roles
1. **Super Admin**: Complete system access
2. **Admin**: Manage users and workspaces
3. **User**: Regular platform user

### Workspace Roles
1. **Owner**: Created workspace, full control
2. **Admin**: Manage workspace users and settings
3. **Editor**: Create and edit content
4. **Viewer**: Read-only access

### Permission Matrix

| Feature | Super Admin | Admin | Owner | Editor | Viewer |
|---------|------------|-------|-------|--------|---------|
| View Files | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload Files | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Files | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete Files | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✓ | ✗ | ✗ |
| Billing | ✓ | ✗ | ✓ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Route Structure

### Public Routes
```
/                      # Landing page
/pricing               # Pricing plans
/login                 # User login
/register              # User registration
/forgot-password       # Password reset
/terms                 # Terms of service
/privacy               # Privacy policy
```

### Protected User Routes
```
/dashboard             # User dashboard
/upload                # Upload interface
/projects              # Projects list
/projects/:id          # Project details
/projects/:id/edit     # Edit project
/jobs                  # Processing jobs
/jobs/:id              # Job details
/team                  # Team management
/account               # Account settings
/workspaces            # Workspace switcher
/settings              # User settings
/settings/api-keys     # API key management
/settings/billing      # Billing information
```

### Admin Routes
```
/admin                 # Admin redirect
/admin/login           # Admin login
/admin/dashboard       # Admin overview
/admin/users           # User management
/admin/workspaces      # Workspace management
/admin/subscriptions   # Subscription management
/admin/payments        # Payment gateway settings
/admin/analytics       # Analytics dashboard
/admin/settings        # System settings
/admin/super-settings  # Super admin settings
/admin/roles           # Role editor
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar VARCHAR(255),
    phone_number VARCHAR(50),
    business_name VARCHAR(255),
    country VARCHAR(2) DEFAULT 'US',
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### workspaces
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo VARCHAR(255),
    owner_id UUID REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### audio_files
```sql
CREATE TABLE audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    duration INTEGER, -- seconds
    format VARCHAR(50),
    sample_rate INTEGER,
    channels INTEGER,
    bitrate INTEGER,
    waveform_data JSONB,
    normalized_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### transcriptions
```sql
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_file_id UUID REFERENCES audio_files(id),
    text TEXT NOT NULL,
    language VARCHAR(10),
    confidence FLOAT,
    words JSONB, -- word-level timestamps
    segments JSONB, -- segment data
    speakers JSONB, -- speaker identification
    summary TEXT,
    key_points JSONB,
    sentiment VARCHAR(50),
    topics JSONB,
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100),
    processing_time INTEGER, -- milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### projects
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES project_templates(id),
    settings JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Tables

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    current_period_start DATE,
    current_period_end DATE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationship Tables

#### workspace_users
```sql
CREATE TABLE workspace_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);
```

#### api_keys
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_preview VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '[]',
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
POST   /api/auth/refresh      # Refresh JWT token
POST   /api/auth/forgot       # Request password reset
POST   /api/auth/reset        # Reset password
GET    /api/auth/verify/:token # Verify email
```

### User Management
```
GET    /api/user/profile      # Get current user
PUT    /api/user/profile      # Update profile
DELETE /api/user/account      # Delete account
PUT    /api/user/password     # Change password
POST   /api/user/avatar       # Upload avatar
```

### Audio Processing
```
POST   /api/audio/upload      # Upload audio file
GET    /api/audio/:id         # Get audio details
PUT    /api/audio/:id         # Update audio metadata
DELETE /api/audio/:id         # Delete audio file
POST   /api/audio/:id/process # Start processing
GET    /api/audio/:id/status  # Get processing status
GET    /api/audio/:id/download # Download audio
POST   /api/audio/:id/transcribe # Transcribe audio
GET    /api/audio/:id/waveform # Get waveform data
```

### Transcriptions
```
GET    /api/transcriptions/:id     # Get transcription
PUT    /api/transcriptions/:id     # Update transcription
DELETE /api/transcriptions/:id     # Delete transcription
GET    /api/transcriptions/:id/export # Export (SRT, VTT, etc)
POST   /api/transcriptions/:id/summarize # Generate summary
```

### Projects
```
GET    /api/projects          # List projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
GET    /api/projects/:id/files # List project files
POST   /api/projects/:id/duplicate # Duplicate project
```

### Workspaces
```
GET    /api/workspaces        # List user workspaces
POST   /api/workspaces        # Create workspace
GET    /api/workspaces/:id    # Get workspace details
PUT    /api/workspaces/:id    # Update workspace
DELETE /api/workspaces/:id    # Delete workspace
POST   /api/workspaces/:id/switch # Switch active workspace
GET    /api/workspaces/:id/users # List workspace users
POST   /api/workspaces/:id/invite # Invite user
```

### Admin Endpoints
```
GET    /api/admin/users       # List all users
GET    /api/admin/users/:id   # Get user details
PUT    /api/admin/users/:id   # Update user
DELETE /api/admin/users/:id   # Delete user
GET    /api/admin/stats       # System statistics
GET    /api/admin/workspaces  # List all workspaces
GET    /api/admin/subscriptions # List subscriptions
PUT    /api/admin/settings    # Update system settings
```

---

## Business Logic

### Audio Processing Workflow

```mermaid
graph TD
    A[User Uploads Audio] --> B{File Validation}
    B -->|Valid| C[Store in DigitalOcean Spaces]
    B -->|Invalid| D[Return Error]
    C --> E[Create Database Record]
    E --> F[Queue Processing Job]
    F --> G[Generate Waveform]
    G --> H[Normalize Audio]
    H --> I[Send to OpenAI Whisper]
    I --> J[Store Transcription]
    J --> K[Generate Summary]
    K --> L[Extract Key Points]
    L --> M[Update Status: Complete]
    M --> N[Send Email Notification]
    M --> O[Webhook Notification]
```

### Subscription Logic

1. **Free Tier Limits**:
   - Check on every upload
   - Block if exceeded
   - Show upgrade prompt

2. **Usage Tracking**:
   - Increment counters on action
   - Reset monthly
   - Store historical data

3. **Billing Cycle**:
   - Charge on same day each month
   - Prorate on plan changes
   - Handle failed payments

### Permission Checks

```typescript
// Pseudo-code for permission logic
function canUserAccessFile(user, file) {
  // Super admin can access everything
  if (user.role === 'super_admin') return true;
  
  // Check workspace membership
  const membership = getWorkspaceMembership(user, file.workspace);
  if (!membership) return false;
  
  // Check role permissions
  if (file.user_id === user.id) return true; // Owner
  if (membership.role === 'admin') return true;
  if (membership.role === 'editor') return true;
  if (membership.role === 'viewer' && action === 'read') return true;
  
  return false;
}
```

---

## UI Components

### Design System

#### Colors
```scss
// Primary Colors
$primary-50: #eff6ff;
$primary-100: #dbeafe;
$primary-500: #3b82f6;
$primary-600: #2563eb;
$primary-700: #1d4ed8;

// Neutral Colors
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-500: #6b7280;
$gray-900: #111827;

// Semantic Colors
$success: #10b981;
$warning: #f59e0b;
$danger: #ef4444;
$info: #3b82f6;
```

#### Typography
```scss
// Font Family
$font-sans: 'Inter', system-ui, -apple-system, sans-serif;
$font-mono: 'Fira Code', monospace;

// Font Sizes
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
```

#### Spacing
```scss
// Spacing Scale
$space-1: 0.25rem;  // 4px
$space-2: 0.5rem;   // 8px
$space-3: 0.75rem;  // 12px
$space-4: 1rem;     // 16px
$space-6: 1.5rem;   // 24px
$space-8: 2rem;     // 32px
$space-12: 3rem;    // 48px
```

### Component Library

#### 1. AudioUploader Component
```typescript
interface AudioUploaderProps {
  maxSize?: number;
  acceptedFormats?: string[];
  onUpload: (files: File[]) => void;
  onProgress?: (progress: number) => void;
  multiple?: boolean;
}

Features:
- Drag and drop zone
- File validation
- Progress tracking
- Chunked upload
- Resume capability
```

#### 2. AudioPlayer Component
```typescript
interface AudioPlayerProps {
  src: string;
  waveformData?: number[];
  showControls?: boolean;
  showWaveform?: boolean;
  onTimeUpdate?: (time: number) => void;
}

Features:
- Waveform visualization
- Play/pause controls
- Seek functionality
- Volume control
- Playback speed
```

#### 3. TranscriptionViewer Component
```typescript
interface TranscriptionViewerProps {
  transcription: Transcription;
  editable?: boolean;
  showTimestamps?: boolean;
  onEdit?: (text: string) => void;
  onExport?: (format: string) => void;
}

Features:
- Synchronized highlighting
- Edit mode
- Export options
- Search within text
- Speaker labels
```

#### 4. DataTable Component
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
}

Features:
- Sorting
- Filtering
- Pagination
- Row selection
- Bulk actions
```

### Page Layouts

#### 1. Dashboard Layout
```
+----------------------------------+
| Header (Logo, Nav, User Menu)    |
+----------------------------------+
| Stats Cards (4 columns)          |
+----------------------------------+
| Recent Activity | Quick Actions  |
| (2/3 width)     | (1/3 width)    |
+----------------------------------+
| Footer                           |
+----------------------------------+
```

#### 2. Editor Layout
```
+----------------------------------+
| Header with Breadcrumbs          |
+----------------------------------+
| Toolbar (Actions, Save, Export)  |
+----------------------------------+
| Waveform Display                 |
+----------------------------------+
| Audio Controls | Timeline        |
+----------------------------------+
| Transcription Editor             |
+----------------------------------+
```

#### 3. Admin Layout
```
+----------------------------------+
| Admin Header                     |
+--------+-------------------------+
| Side   | Main Content Area       |
| Nav    | (Tables, Forms, etc)    |
| Menu   |                         |
|        |                         |
+--------+-------------------------+
```

---

## Integrations

### 1. OpenAI Integration

#### Whisper API
```typescript
// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_MODEL = 'whisper-1';

// Usage
async function transcribeAudio(audioPath: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', WHISPER_MODEL);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  
  const response = await openai.audio.transcriptions.create(formData);
  return response;
}
```

#### GPT-4 for Summarization
```typescript
async function generateSummary(transcript: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Summarize the following transcript in 3-5 bullet points.'
      },
      {
        role: 'user',
        content: transcript
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
}
```

### 2. ElevenLabs Integration

#### Voice Synthesis
```typescript
// Text-to-Speech
async function synthesizeVoice(text: string, voiceId: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    })
  });
  
  return response.blob();
}
```

### 3. Payment Integration

#### Stripe
```typescript
// Subscription Creation
async function createSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  
  return subscription;
}
```

#### eWAY (Australian Gateway)
```typescript
// Payment Processing
async function processPayment(amount: number, cardDetails: CardDetails) {
  const client = RapidAPI.createClient(
    process.env.EWAY_API_KEY,
    process.env.EWAY_PASSWORD,
    process.env.EWAY_ENDPOINT
  );
  
  const transaction = {
    Payment: {
      TotalAmount: amount * 100, // Convert to cents
      CurrencyCode: 'AUD'
    },
    TransactionType: 'Purchase',
    SaveCustomer: true
  };
  
  return await client.createTransaction(transaction);
}
```

### 4. Storage Integration

#### DigitalOcean Spaces
```typescript
// S3-compatible configuration
const spacesClient = new S3Client({
  endpoint: 'https://syd1.digitaloceanspaces.com',
  region: 'syd1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  }
});

// Upload file
async function uploadToSpaces(file: Buffer, key: string) {
  const command = new PutObjectCommand({
    Bucket: 'audiotricks',
    Key: key,
    Body: file,
    ACL: 'private',
    ContentType: 'audio/mpeg'
  });
  
  return await spacesClient.send(command);
}
```

### 5. Email Integration

#### SendGrid
```typescript
// Email Configuration
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send notification
async function sendTranscriptionComplete(email: string, fileName: string) {
  const msg = {
    to: email,
    from: 'notifications@audiotricks.com',
    subject: 'Your transcription is ready!',
    templateId: 'd-1234567890',
    dynamicTemplateData: {
      fileName,
      downloadLink: generateDownloadLink(fileName)
    }
  };
  
  return await sgMail.send(msg);
}
```

---

## Security & Authentication

### Authentication Flow

#### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  workspaceId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token generation
function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.currentWorkspaceId
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

#### Refresh Token Flow
1. Issue refresh token on login (30 days)
2. Store hashed refresh token in database
3. Client uses refresh token when access token expires
4. Validate and issue new access token
5. Rotate refresh token on use

### Security Measures

#### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

#### Rate Limiting
```typescript
// API Rate Limits
const rateLimits = {
  auth: '5 requests per minute',
  upload: '10 requests per hour',
  api: '100 requests per hour',
  admin: '1000 requests per hour'
};
```

#### API Key Security
- Keys stored as hashed values
- Show only first 8 characters after creation
- Scope-based permissions
- IP whitelist option
- Expiration dates

### Data Protection

#### Encryption
- Passwords: bcrypt (cost factor 12)
- API Keys: SHA-256 hashing
- Sensitive data: AES-256 encryption
- Database: Encryption at rest
- Transport: TLS 1.3 only

#### Privacy
- GDPR compliance features
- Data export functionality
- Right to deletion
- Audit logs for data access
- Consent management

---

## Deployment Configuration

### Environment Variables
```bash
# Application
NODE_ENV=production
APP_URL=https://audiotricks.com
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/audiotricks

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# External APIs
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Storage
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_ENDPOINT=https://syd1.digitaloceanspaces.com
DO_SPACES_BUCKET=audiotricks

# Email
SENDGRID_API_KEY=SG...
FROM_EMAIL=notifications@audiotricks.com

# Payment
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

EWAY_API_KEY=...
EWAY_PASSWORD=...
EWAY_ENDPOINT=https://api.ewaypayments.com

# Redis
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Infrastructure Requirements
- **Server**: 4GB RAM minimum
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Storage**: 100GB+ for audio files
- **CDN**: CloudFlare or similar
- **SSL**: Let's Encrypt or commercial

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current database
- [ ] Export all user data
- [ ] Document custom configurations
- [ ] List all API integrations
- [ ] Inventory all email templates

### Data Migration
- [ ] User accounts
- [ ] Workspaces
- [ ] Audio files
- [ ] Transcriptions
- [ ] Projects
- [ ] Subscriptions
- [ ] API keys
- [ ] Settings

### Post-Migration
- [ ] Verify all data migrated
- [ ] Test all features
- [ ] Update DNS records
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## Appendix: Symfony Implementation Notes

### Entity Mappings
- React Components → Twig Components
- Redux State → Symfony Services
- Express Routes → Symfony Controllers
- Mongoose Models → Doctrine Entities
- Middleware → Event Subscribers

### Service Architecture
```php
// Example service structure
namespace App\Service\Audio;

class AudioProcessingService {
    public function __construct(
        private StorageService $storage,
        private OpenAIService $openai,
        private MessageBusInterface $messageBus
    ) {}
    
    public function processAudioFile(AudioFile $file): void {
        // Implementation matching Node.js logic
    }
}
```

This specification document contains all the information needed to rebuild AudioTricks in Symfony while maintaining feature parity with the current React/Node.js implementation.