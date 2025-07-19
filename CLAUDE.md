# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎵 AudioTricks Confirmation Protocol

When Claude is told to read CLAUDE.md, Claude will say "🎵 AudioTricks CLAUDE.md loaded" to indicate that CLAUDE.md has been read before Claude starts.

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

**When implementing client-side features:**
1. **NO BACKEND DEPENDENCIES** - This is a pure frontend React application
2. **NO SERVER-SIDE LOGIC** - All processing happens in the browser
3. **API-FIRST APPROACH** - Direct integration with OpenAI and ElevenLabs APIs
4. **SECURE BY DEFAULT** - Never expose sensitive information

## 🔐 Client-Side Security Standards (CRITICAL)

### MANDATORY: API Key Security
- **Local Storage Only**: API keys stored in localStorage, never in source code
- **No Transmission**: API keys never sent to any server except target APIs
- **Secure Input**: API key inputs must be password-type with proper validation
- **Error Handling**: API errors must not expose key information

### MANDATORY: Input Validation
- **File Upload**: Validate file types, sizes, and content before processing
- **API Responses**: Always validate and sanitize API responses
- **User Input**: Sanitize all user inputs before processing or display

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

### 🗂️ Component Organization

**MANDATORY STRUCTURE**:
```
src/
├── components/           # React components (max 250 lines each)
│   ├── audio/           # Audio-related components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   └── modals/          # Modal components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript definitions
├── services/            # API services
└── tests/               # Test files (required!)
```

**COMPONENT PATTERNS**:
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use component composition
- **Custom Hooks**: Extract complex logic into custom hooks
- **TypeScript**: All components must use proper TypeScript

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

**API Integration**:
- **OpenAI Whisper**: For audio transcription
- **OpenAI GPT**: For text summarization
- **ElevenLabs**: For voice synthesis
- **Error Handling**: Robust error handling for all API calls

### 💾 LocalStorage Best Practices

**Data Storage**:
- **History Management**: Implement proper history storage with size limits
- **Settings Persistence**: User preferences should persist across sessions
- **Key Management**: Secure storage of API keys
- **Migration Support**: Handle localStorage schema changes

### 🔄 State Management

**React Patterns**:
- **Custom Hooks**: Extract complex state logic
- **Context API**: For global state (settings, keys)
- **Local State**: Component-specific state
- **Error Boundaries**: Implement error boundaries for reliability

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
- **No Data Retention**: Don't store user audio on servers
- **Local Processing**: All processing happens client-side
- **User Control**: Users control their data and API keys

## 🚀 Development Workflow

### 📦 Build System

**Requirements**:
- **Vite**: Fast build tool with HMR
- **TypeScript**: Strict type checking
- **Tailwind CSS**: Utility-first styling
- **ESLint**: Code linting (when configured)

### 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check
```

## 🚫 Prohibited Patterns

### ❌ NEVER DO THIS

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
- Backend dependencies
- Server-side logic
- Database requirements
- Complex state management without proper hooks

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

## 📋 Current Technical Debt

### 🔥 Immediate Actions Required

1. **Refactor AudioEditor.tsx** (511 lines → multiple components)
2. **Add comprehensive test suite** (currently missing)
3. **Implement ESLint configuration**
4. **Add proper error boundaries**
5. **Improve TypeScript strictness**

### 🎯 Medium-term Goals

1. **Performance optimization** (memoization, lazy loading)
2. **Accessibility improvements** (ARIA labels, keyboard navigation)
3. **Bundle size optimization**
4. **Progressive Web App features**

## 🧠 AI Behavior Rules

- **Never assume missing context** - Ask questions if uncertain
- **Never hallucinate libraries** - Only use verified packages from package.json
- **Always confirm file paths** - Verify files exist before referencing
- **Never delete existing code** - Unless explicitly instructed
- **Follow the 250-line limit** - Refactor oversized files immediately
- **Always add tests** - No feature is complete without tests

## 🎵 AudioTricks Philosophy

**Simple, Secure, and Powerful**:
- Client-side audio processing
- No backend complexity
- User-controlled API keys
- Privacy-first approach
- Modern React patterns
- Comprehensive error handling

---

*This CLAUDE.md file serves as the single source of truth for development standards and practices in the AudioTricks project. All contributors must follow these guidelines to ensure code quality, security, and maintainability.*