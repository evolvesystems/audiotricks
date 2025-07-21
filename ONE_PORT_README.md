# 🚨 ONE PORT ONLY - CRITICAL ARCHITECTURE RULE

## **NEVER USE MULTIPLE PORTS**

This application runs on **ONE PORT ONLY**: Port 3000

### ✅ Correct Development Workflow

```bash
# Initial setup
cd backend
npm install
cd ..
npm install
npm run build

# Development (ONE COMMAND, ONE PORT)
cd backend
npm run dev

# Access application
http://localhost:3000
```

### ❌ FORBIDDEN PATTERNS

**NEVER DO THIS:**
- `npm run dev` in root directory
- Running Vite dev server separately
- Using port 5173 or any other port
- Configuring proxy in vite.config.ts
- Running frontend and backend separately

### 🏗️ How It Works

1. Frontend is built to `/dist` directory
2. Backend serves the built frontend as static files
3. All API routes are on `/api/*`
4. Frontend routes are handled by SPA routing
5. Everything runs on port 3000

### 📝 Key Files

- `backend/src/index.ts` - Serves frontend build
- `vite.config.ts` - NO proxy configuration
- `package.json` - Scripts enforce ONE PORT

### 🛑 Error Messages

If you see these errors, you're doing it right:
- "🚫 ERROR: Use ONE PORT ONLY! Run: cd backend && npm run dev"
- "🚫 ERROR: Frontend served from backend. Run: cd backend && npm start"

## **IF YOU EVER SUGGEST USING TWO PORTS, YOU HAVE FAILED**