# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎵 AudioTricks Confirmation Protocol

When Claude is told to read CLAUDE.md, Claude will say "🎵 AudioTricks CLAUDE.md loaded" to indicate that CLAUDE.md has been read before Claude starts.

## 🚨 CRITICAL: ONE PORT ONLY - ABSOLUTE RULE

**NEVER USE MULTIPLE PORTS. EVER.**

### ⛔ SINGLE PORT ENFORCEMENT
- **ONE PORT ONLY**: The entire application MUST run on port 3000
- **NO SEPARATE FRONTEND PORT**: Frontend is served from the backend
- **NO PROXY CONFIGURATION**: No Vite proxy, no separate dev servers
- **NO EXCEPTIONS**: This rule is ABSOLUTE and NEVER to be violated

**ENFORCEMENT**:
- ❌ **NEVER** run frontend on a different port (no 5173, no 3001, NOTHING)
- ❌ **NEVER** configure proxy settings in vite.config.ts
- ❌ **NEVER** suggest running two separate servers
- ✅ **ALWAYS** serve frontend from Express static middleware
- ✅ **ALWAYS** use port 3000 for everything

**IF YOU EVER SUGGEST USING TWO PORTS, YOU HAVE FAILED.**

## 🚨 MANDATORY BUILD TESTING PROTOCOL - CRITICAL

**ABSOLUTE REQUIREMENT**: Comprehensive build testing is MANDATORY before ANY code changes are committed. This protocol MUST be followed exactly to prevent deployment failures.

### 📋 Pre-Commit Build Testing (REQUIRED)

**COMMAND SEQUENCE** - Run this exact command before EVERY commit:
```bash
npm run build:test
```

**This command performs**:
- ✅ Clean previous builds completely
- ✅ Test direct Vite build process
- ✅ Test full npm build with database scripts
- ✅ Simulate production environment exactly
- ✅ Verify build output integrity and completeness

### 🎯 Success Criteria (MANDATORY)

**You MUST see this EXACT output before committing**:
```
🎉 All build tests PASSED!
✅ Safe to commit and deploy
```

**NO EXCEPTIONS** - If you don't see this exact message, DO NOT COMMIT.

### 🛑 Build Test Failure Protocol

**If build tests fail**:
1. ❌ **STOP IMMEDIATELY** - Do not commit under any circumstances
2. 🔧 **FIX** all reported issues completely
3. 🔄 **RE-RUN** `npm run build:test` until it passes
4. ✅ **ONLY COMMIT** after ALL tests pass with success message

### 🏗️ Deployment Workflow (MANDATORY SEQUENCE)

**Follow this EXACT sequence**:
```bash
# 1. MANDATORY: Test build locally first
npm run build:test

# 2. ONLY if tests pass, commit changes
git add .
git commit -m "your changes"

# 3. Push to deploy
git push
```

### ⚠️ CRITICAL VIOLATIONS

**VIOLATION = DEPLOYMENT FAILURE**: 
- Skipping build testing WILL cause Netlify build failures
- Committing without seeing success message WILL break production
- Not following this protocol WILL result in failed deployments

### 🎯 Architecture Compliance

**ALL code changes must comply**:
- 🚫 **NO HARDCODING** - Everything must be database-driven
- 🚫 **NO SUPABASE** references - Project uses PostgreSQL only  
- ✅ **FOLLOW CLAUDE.md** - Read this file completely for all guidelines
- ✅ **DATABASE-FIRST** - All data must come from PostgreSQL

**This build testing protocol is NON-NEGOTIABLE and must be followed by ALL contributors without exception.**

### 🌐 Enhanced Browser Testing (RECOMMENDED)

**Live Browser Verification**: Use `npm run build:test:full` for complete testing including:
- All standard build tests
- Live preview server testing
- Automated login smoke tests
- Navigation functionality verification
- Real browser environment testing

**When to use enhanced testing:**
- ✅ **Before major releases** - Always use full browser testing
- ✅ **After authentication changes** - Verify login functionality
- ✅ **After routing updates** - Test navigation works
- ✅ **Before deployment** - Comprehensive pre-deployment check

### 🔄 Netlify Deployment Status Testing (CRITICAL)

**MANDATORY**: After every deployment, you MUST verify that Netlify build succeeded and the application is functioning in production.

#### 📡 Live Build Status Checks

**PRIMARY HEALTH CHECK**: 
```bash
# Test production deployment status
curl -s https://audiotricks.evolvepreneuriq.com/api/health
```

**Expected Success Response**:
```json
{"status":"ok","timestamp":"2024-01-20T10:00:00Z","database":"connected"}
```

**Build Failure Indicators**:
- ❌ Connection refused / timeout = Netlify build failed
- ❌ 500 Internal Server Error = Backend deployment issue  
- ❌ `"database":"failed"` = Database connection problem
- ❌ Missing environment variables = Configuration issue

#### 🔍 Comprehensive Production Verification

**FULL DEPLOYMENT TEST SEQUENCE**:
```bash
# 1. Test health endpoint
curl -s https://audiotricks.evolvepreneuriq.com/api/health

# 2. Test authentication endpoint
curl -s https://audiotricks.evolvepreneuriq.com/api/auth/health

# 3. Test frontend loads
curl -s https://audiotricks.evolvepreneuriq.com/ | grep -q "AudioTricks"

# 4. Test admin functionality (if admin user exists)
curl -s https://audiotricks.evolvepreneuriq.com/api/admin/stats
```

#### 🚨 Build Failure Recovery Protocol

**If Netlify build fails**:

1. **Immediate Diagnosis**:
   ```bash
   # Check if site responds at all
   curl -I https://audiotricks.evolvepreneuriq.com/
   ```

2. **Common Build Failure Patterns**:
   - **"Module not found"** = Missing dependency in package.json
   - **"Prisma not found"** = Missing prisma in netlify functions
   - **"Environment variable not found"** = Missing Netlify env vars
   - **"Build timeout"** = Build process taking too long

3. **Fix and Redeploy**:
   ```bash
   # Fix the issue, then test locally first
   npm run build:test
   
   # Only push if local build passes
   git add .
   git commit -m "fix: resolve deployment issue"
   git push
   ```

#### 📊 Deployment Health Dashboard

**Quick Status Check** - Run this to get full deployment status:
```bash
#!/bin/bash
echo "🔄 Checking AudioTricks Deployment Status..."
echo "=============================================="

# Test main site
if curl -s https://audiotricks.evolvepreneuriq.com/api/health | grep -q "ok"; then
    echo "✅ Main site: HEALTHY"
else
    echo "❌ Main site: FAILED"
fi

# Test authentication
if curl -s https://audiotricks.evolvepreneuriq.com/api/auth/health | grep -q "ok"; then
    echo "✅ Authentication: HEALTHY"  
else
    echo "❌ Authentication: FAILED"
fi

# Test database
if curl -s https://audiotricks.evolvepreneuriq.com/api/health | grep -q "connected"; then
    echo "✅ Database: CONNECTED"
else
    echo "❌ Database: DISCONNECTED"
fi

echo "=============================================="
```

#### ⚡ Quick Deploy Status Check

**RECOMMENDED**: Use the built-in deployment checker:
```bash
npm run check:deploy
```

**ONE-LINER** to check if your latest deployment worked:
```bash
curl -s https://audiotricks.evolvepreneuriq.com/api/health | grep -q "ok" && echo "✅ DEPLOYED SUCCESSFULLY" || echo "❌ DEPLOYMENT FAILED"
```

**Post-Deployment Workflow**: 
```bash
# 1. Push your changes
git push

# 2. Wait for Netlify build (2-3 minutes)
# 3. Check deployment status
npm run check:deploy

# Expected output on success:
# 🎉 DEPLOYMENT SUCCESSFUL!
# ✅ All systems operational
```

**Integration with Build Testing**: 
- Run `npm run check:deploy` after every `git push`
- Wait 2-3 minutes for Netlify build to complete
- Verify all endpoints are responding correctly
- Check database connectivity in production environment

### 🚫 Build Testing Violations - STRICTLY FORBIDDEN

**VIOLATION = IMMEDIATE BUILD FAILURE**:
- ❌ **Committing without testing** - Skipping `npm run build:test` is prohibited
- ❌ **Ignoring test failures** - Must fix ALL errors before committing
- ❌ **Partial testing** - Must see complete success message
- ❌ **Local-only testing** - Must verify browser functionality works
- ❌ **Production hardcoding** - No hardcoded values allowed in builds
- ❌ **Untested refactors** - All code changes require full testing

**ENFORCEMENT**: Any commit that breaks builds will be reverted immediately. No exceptions.

## ⚠️ CRITICAL ARCHITECTURAL RULES - NEVER VIOLATE

### 🚫 ABSOLUTE PROHIBITION: NO HARDCODING OF SENSITIVE DATA

**RULE**: This codebase handles sensitive API keys client-side. Any attempt to hardcode API keys, credentials, or sensitive configuration is STRICTLY FORBIDDEN.

**ENFORCEMENT**:
- ❌ **NEVER** hardcode OpenAI API keys in source code
- ❌ **NEVER** hardcode ElevenLabs API keys in source code  
- ❌ **NEVER** expose API keys in console logs or error messages
- ❌ **NEVER** commit API keys to version control
- ❌ **NEVER** hardcode production URLs or endpoints

**REQUIRED APPROACH**:
- ✅ **ALL** API keys MUST be entered by users through secure input components
- ✅ **ALL** API keys MUST be stored in localStorage with proper encryption consideration
- ✅ **ALL** sensitive data MUST be handled with proper security measures
- ✅ **ALL** API calls MUST include proper error handling for unauthorized access

### 🔧 IMPLEMENTATION STANDARDS - NO EXCEPTIONS

**When implementing full-stack features:**
1. **DATABASE-FIRST APPROACH** - PostgreSQL database for persistent data storage
2. **SECURE BACKEND** - Server-side authentication and data validation
3. **API-FIRST ARCHITECTURE** - RESTful APIs between frontend and backend
4. **SECURE BY DEFAULT** - Never expose sensitive information in client-side code

## 🔐 Full-Stack Security Standards (CRITICAL)

### MANDATORY: Database Security
- **Environment Variables**: Database credentials stored in .env files, never in source code
- **Connection Pooling**: Use secure connection pooling with proper timeouts
- **SQL Injection Prevention**: Use parameterized queries and ORM validation
- **Authentication**: Server-side session management with secure tokens
- **Authorization**: Role-based access control for database operations

### MANDATORY: API Key Security
- **Server-Side Storage**: Third-party API keys stored server-side, never exposed to client
- **Proxy Pattern**: Backend proxies external API calls to protect keys
- **Secure Input**: API key inputs must be password-type with proper validation
- **Error Handling**: API errors must not expose key information

### MANDATORY: Input Validation
- **File Upload**: Validate file types, sizes, and content on both client and server
- **API Responses**: Always validate and sanitize API responses
- **User Input**: Sanitize all user inputs before processing or display
- **Database Queries**: Validate all data before database operations

## 🧱 Code Structure & Modularity

### 📏 CRITICAL FILE SIZE LIMIT

**RULE**: Never create a file longer than **250 lines of code**. If a file approaches this limit, refactor by splitting it into modules or helper files.

**CURRENT VIOLATIONS**:
- `AudioEditor.tsx` (511 lines) - MUST be refactored immediately
- `App.tsx` (401 lines) - Approaching limit, consider refactoring

**REFACTORING APPROACH**:
- **Extract hooks** for complex state management
- **Create subcomponents** for distinct UI sections
- **Separate utilities** into dedicated files
- **Group related functionality** into feature modules

### 🗂️ Full-Stack Project Organization

**MANDATORY STRUCTURE**:
```
audiotricks/
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # React components (max 250 lines each)
│   │   │   ├── audio/   # Audio-related components
│   │   │   ├── ui/      # Reusable UI components
│   │   │   ├── forms/   # Form components
│   │   │   └── modals/  # Modal components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # TypeScript definitions
│   │   ├── services/    # Frontend API services
│   │   └── tests/       # Frontend test files
│   └── package.json
├── backend/             # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/ # Route controllers (max 250 lines each)
│   │   ├── models/      # Database models
│   │   ├── routes/      # API route definitions
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Business logic services
│   │   ├── utils/       # Backend utility functions
│   │   └── tests/       # Backend test files
│   ├── migrations/      # Database migrations
│   ├── package.json
│   └── .env.example
├── database/            # Database scripts and schema
│   ├── schema.sql       # Database schema
│   ├── seeds/           # Seed data
│   └── scripts/         # Database utilities
└── docs/                # Project documentation
```

**FULL-STACK PATTERNS**:
- **Single Responsibility**: Each component/module has one clear purpose
- **API-First Design**: Frontend and backend communicate via REST APIs
- **Database Models**: Use Prisma or TypeORM for type-safe database operations
- **Authentication**: JWT tokens for secure session management
- **Error Handling**: Consistent error responses across API endpoints
- **TypeScript**: All code must use proper TypeScript (frontend and backend)

## 🧪 Testing & Reliability (MANDATORY)

### ⚠️ CRITICAL: NO CODE WITHOUT TESTS

**RULE**: Always create unit tests for new features (components, hooks, utilities, services).

**REQUIRED TESTING**:
- **Test Structure**: Tests in `/tests` folder mirroring main app structure
- **Coverage Requirements**: At least 3 test cases per feature:
  1. **Expected Use Case**: Normal operation
  2. **Edge Case**: Boundary conditions
  3. **Failure Case**: Error handling

**TEST EXAMPLES**:
```typescript
// ✅ REQUIRED: Component testing
describe('AudioUploader', () => {
  test('uploads file successfully', async () => {
    // Expected use case
  })
  
  test('handles large file size', async () => {
    // Edge case
  })
  
  test('shows error for invalid file type', async () => {
    // Failure case
  })
})
```

### 📋 Testing Stack
- **Framework**: Vitest (preferred) or Jest
- **React Testing**: React Testing Library
- **Assertions**: expect() with comprehensive matchers
- **Mocking**: Mock API calls and external dependencies

## ✅ Task Completion Standards

### 🔍 MANDATORY: Code Quality Checks

**BEFORE TASK COMPLETION**:
1. **Build Check**: `npm run build` must pass
2. **Type Check**: No TypeScript errors  
3. **Test Check**: All tests must pass
4. **Lint Check**: Code must pass linting (when configured)
5. **Browser Testing**: All code changes MUST be tested in browser before delivery
6. **Security Review**: Check for sensitive data exposure, input validation, auth/authz

### 📝 Documentation Requirements

**MANDATORY**: All functions must have JSDoc documentation:
```typescript
/**
 * Processes audio file for transcription
 * @param audioFile - The audio file to process
 * @param apiKey - OpenAI API key
 * @returns Promise<AudioProcessingResult>
 */
async function processAudioFile(audioFile: File, apiKey: string): Promise<AudioProcessingResult> {
  // Implementation
}
```

## 🎯 AudioTricks-Specific Guidelines

### 🎵 Audio Processing Patterns

**File Handling**:
- **Size Limits**: Implement proper file size validation
- **Format Support**: Handle multiple audio formats gracefully
- **Chunking**: Large files must be processed in chunks
- **Progress Tracking**: Provide user feedback during processing

**Enterprise API Integration**:
- **OpenAI Whisper**: Audio transcription with speaker identification
- **OpenAI GPT-4**: Text summarization and AI chatbot responses
- **OpenAI Embeddings**: Vector embeddings for semantic search
- **ElevenLabs**: Voice synthesis and custom voice cloning
- **eWAY Payment Gateway**: Australian payment processing
- **SendGrid**: Professional email automation and analytics
- **DigitalOcean Spaces**: File storage with global CDN delivery
- **Error Handling**: Comprehensive error handling with retry mechanisms

### 💾 Database Best Practices

**PostgreSQL Enterprise Data Storage**:
- **Enhanced Schema**: 30+ tables with complete relationships (users, workspaces, subscriptions, files, audit)
- **DigitalOcean Spaces Integration**: File metadata with CDN URLs, no local storage
- **Subscription Management**: Complex billing, plans, quotas, and usage tracking
- **AI Chatbot Data**: Vector embeddings, conversation history, semantic search
- **Audit System**: Comprehensive logging of all user actions and security events
- **Row-Level Security**: Workspace isolation and permission-based data access
- **Performance Indexes**: Optimized queries for real-time analytics and search
- **Migration Strategy**: Automated database migrations with rollback capabilities

### 🔄 State Management

**Frontend State Patterns**:
- **Custom Hooks**: Extract complex state logic
- **Context API**: For global state (user session, settings)
- **Local State**: Component-specific state
- **Error Boundaries**: Implement error boundaries for reliability
- **API State**: Use React Query or SWR for server state management

**Backend State Patterns**:
- **Database Transactions**: Use transactions for data consistency
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Redis for session storage and API response caching
- **Event Logging**: Audit trails for all user actions

## 📱 User Experience Standards

### 🎨 UI/UX Requirements

**Responsive Design**:
- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: ARIA labels, keyboard navigation
- **Loading States**: Show progress for all async operations
- **Error States**: Clear error messages with recovery options

### ⚡ Performance Considerations

**Code Splitting**:
- **Dynamic Imports**: Lazy load large components
- **Bundle Optimization**: Keep bundle size minimal
- **Memory Management**: Proper cleanup of audio resources

## 🔒 Security Guidelines

### 🛡️ Client-Side Security

**API Key Protection**:
- **No Exposure**: Never log or expose API keys
- **Local Storage**: Encrypt sensitive data when possible
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Sanitize dynamic content

### 🔐 Privacy Considerations

**Data Handling**:
- **DigitalOcean Spaces Storage**: Audio files stored in secure cloud storage with CDN
- **User Data Control**: Users can delete their data and export their information  
- **API Key Security**: Third-party API keys stored server-side, never exposed to client
- **GDPR Compliance**: Data retention policies and user consent management
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Trail**: Complete logging of all user actions and data access

## 🚀 Development Workflow

### 📦 Build System

**Frontend Requirements**:
- **Vite**: Fast build tool with HMR
- **TypeScript**: Strict type checking
- **Tailwind CSS**: Utility-first styling
- **ESLint**: Code linting (when configured)

**Backend Requirements**:
- **Node.js**: Server runtime environment
- **Express**: Web framework for APIs
- **Prisma/TypeORM**: Database ORM with migrations
- **Jest**: Testing framework for backend

### 🔄 Git Best Practices

**MANDATORY .gitignore Configuration**:
```gitignore
# Dependencies - NEVER track these
node_modules/
.pnp
.pnp.js

# Build outputs - NEVER track these
dist/
build/
*.tsbuildinfo

# Environment variables - NEVER track these
.env
.env.production
.env.local
```

**Git Workflow Rules**:
- **ALWAYS** configure .gitignore BEFORE first commit
- **NEVER** track node_modules (installs via npm/yarn)
- **NEVER** commit build artifacts (dist, build folders)
- **ALWAYS** commit package.json AND package-lock.json together
- **VERIFY** git status shows only source files before committing

### 🔧 Development Commands

```bash
# ONE PORT DEVELOPMENT - ONLY WAY ALLOWED
# Backend serves BOTH API and frontend on port 3000

# Initial setup
npm run build:frontend   # Build frontend FIRST
cd backend && npm install

# Development (ONE COMMAND, ONE PORT)
npm run dev              # Runs EVERYTHING on port 3000

# Production build
npm run build            # Builds both frontend and backend
npm run start            # Starts server on port 3000

# Testing
npm run test             # Runs all tests
npm run build:test       # MANDATORY pre-commit build testing
npm run check:deploy     # Check Netlify deployment status

# Database
npm run migrate          # Run database migrations
npm run db:seed          # Seed database
```

## 🚫 Prohibited Patterns

### ❌ NEVER DO THIS

**MULTIPLE PORTS - ABSOLUTELY FORBIDDEN**:
- Running frontend and backend on different ports
- Using Vite dev server separately from backend
- Configuring proxy in vite.config.ts
- Suggesting port 5173, 3001, or ANY port other than 3000
- Having separate dev commands for frontend and backend

**VERSION CONTROL VIOLATIONS**:
- Tracking node_modules in git (12,760 files, 402MB)
- Committing dist or build directories
- Including any generated files in version control
- Not properly configuring .gitignore before initial commit
- Tracking package-lock.json without the corresponding package.json

**Code Quality Violations**:
- Files longer than 250 lines
- Components without TypeScript
- Features without tests
- Hardcoded sensitive data
- Unhandled async operations

**Security Violations**:
- Exposed API keys
- Unvalidated user input
- Missing error boundaries
- Client-side secrets

**Architecture Violations**:
- Mixing frontend and backend code in same files
- Direct database access from frontend
- Hardcoded database credentials
- Missing API authentication middleware
- Storing sensitive data in frontend state
- Complex state management without proper patterns

## 🎯 Success Metrics

### 📊 Code Quality Indicators

**Healthy Codebase**:
- All files under 250 lines
- 100% TypeScript coverage
- Comprehensive test coverage
- No console.log statements in production
- Proper error handling throughout

**User Experience**:
- Fast loading times
- Responsive design
- Clear error messages
- Intuitive user interface
- Reliable audio processing

## 📋 Current Implementation Status

### ✅ **Completed Specifications (Ready for Implementation)**

1. **Enhanced Database Schema** - `database/schema-enhanced.prisma` (30+ tables)
2. **DigitalOcean Spaces Storage** - `database/digitalocean-spaces-storage-specification.md`
3. **SendGrid Email Integration** - `database/sendgrid-email-integration-specification.md`
4. **AI Chatbot System** - `database/chatbot-system-specification.md`
5. **eWAY Payment Gateway** - `database/eway-payment-gateway-specification.md`
6. **Subscription Management** - `database/enhanced-subscription-plans.sql`
7. **User Plan Assignment** - `database/user-plan-assignment-system.sql`
8. **Audit & Security System** - `database/audit-security-spec.md`
9. **Implementation Plan** - `IMPLEMENTATION_PLAN.md` (16-week roadmap)
10. **Task Breakdown** - `TASK_BREAKDOWN.md` (48 detailed tasks)

### 🔥 **Immediate Implementation Priorities (Phase 1: Weeks 1-4)**

1. **Deploy Enhanced Database Schema** (Critical - Week 1)
   - Migrate from basic schema to 30+ table enterprise schema
   - Configure PostgreSQL with row-level security
   - Set up performance indexes and constraints

2. **DigitalOcean Spaces Storage Integration** (Critical - Week 1)
   - Replace local storage with DigitalOcean Spaces
   - Configure CDN with custom domain
   - Implement multipart upload for large files

3. **Enhanced Authentication & Security** (Critical - Week 2)
   - Implement JWT with refresh tokens
   - Add encrypted API key management
   - Deploy comprehensive audit logging

4. **Advanced Audio Processing** (High - Week 3)
   - Implement chunked upload with resume capability
   - Add speaker identification and timestamps
   - Set up processing queue with priority handling

5. **SendGrid Email System** (High - Week 4)
   - Configure professional email automation
   - Set up welcome sequences and notifications
   - Implement email analytics and tracking

### 🎯 **Next Phase Priorities (Phase 2: Weeks 5-8)**

1. **Subscription & Billing System** (Critical)
   - Deploy subscription plan management
   - Integrate eWAY payment gateway
   - Implement quota enforcement engine

2. **Workspace Collaboration** (High)
   - Team management and invitations
   - Role-based access control
   - Workspace branding options

3. **Usage Analytics & Monitoring** (High)
   - Real-time usage dashboard
   - Business intelligence analytics
   - Performance monitoring system

### 🚀 **Advanced Features (Phase 3: Weeks 9-12)**

1. **AI Chatbot with Semantic Search**
2. **Voice Synthesis Integration**
3. **Advanced Export & API System**
4. **Mobile Optimization & PWA**

### 📋 **Legacy Technical Debt (To Address During Implementation)**

1. **Refactor AudioEditor.tsx** (511 lines → multiple components)
2. **Add comprehensive test suite** (implement during each phase)
3. **Implement ESLint configuration** (Week 1 setup)
4. **Add proper error boundaries** (Week 2 security phase)
5. **Improve TypeScript strictness** (ongoing during implementation)

## 🧠 AI Behavior Rules

### **Investigation & Problem Solving**
- **Deep Analysis Required** - Examine entire flow and all dependencies meticulously
- **Evidence-Based Approach** - No changes, patches, or guesses without concrete evidence
- **Never assume missing context** - Ask questions if uncertain
- **Trace complete data flow** - From user action to final result

### **Code Quality & Standards**
- **Never hallucinate libraries** - Only use verified packages from package.json
- **Always confirm file paths** - Verify files exist before referencing
- **Never delete existing code** - Unless explicitly instructed
- **Follow the 250-line limit** - Refactor oversized files immediately
- **Always add tests** - No feature is complete without tests

### **Implementation Standards**
- **No placeholders or mockups** - Build real, functional components
- **Connect to actual data sources** - Use database/APIs, not mock data
- **Production-ready code only** - No demonstrations or temporary solutions
- **Proper error handling** - Implement real error states, not placeholder text

## 🎵 AudioTricks Philosophy

**Enterprise-Grade, AI-Powered, Global Scale**:
- **Full-Stack Platform**: Complete React frontend with Node.js backend
- **Enterprise Database**: PostgreSQL with 30+ tables, row-level security, audit trails
- **Global File Storage**: DigitalOcean Spaces with worldwide CDN distribution
- **AI Intelligence**: Semantic search, chatbot, voice synthesis, automated insights
- **Business Ready**: Subscription management, payment processing, team collaboration
- **Email Automation**: Professional SendGrid integration with marketing workflows
- **Security First**: Encrypted API keys, comprehensive audit logging, GDPR compliance
- **Scalable Architecture**: Multi-tenant, real-time analytics, performance optimized
- **Developer Friendly**: RESTful APIs, webhook system, comprehensive documentation

---

*This CLAUDE.md file serves as the single source of truth for development standards and practices in the AudioTricks project. All contributors must follow these guidelines to ensure code quality, security, and maintainability.*