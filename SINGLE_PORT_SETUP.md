# Single Port Setup Guide

## Overview

AudioTricks now runs everything on **ONE PORT** (3000) to simplify development and deployment.

## How It Works

```
http://localhost:3000
├── /api/*        → Backend API endpoints
├── /             → Frontend (React app)
└── /assets/*     → Static files
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run everything:**
   ```bash
   npm run dev
   ```

   This starts:
   - Express server on port 3000
   - Vite dev server on port 5173 (proxied through Express)

3. **Access the app:**
   ```
   http://localhost:3000
   ```

## Available Scripts

- `npm run dev` - Run both frontend and backend (development)
- `npm run build` - Build frontend for production
- `npm start` - Run production server
- `npm test` - Run tests

## How It Works (Technical)

### Development Mode
1. Express server runs on port 3000
2. All `/api/*` requests are handled by Express
3. All other requests are proxied to Vite (port 5173)
4. Hot reload works normally

### Production Mode
1. Express server runs on port 3000
2. All `/api/*` requests are handled by Express
3. All other requests serve the built React app from `/dist`

## API Endpoints

All API endpoints are prefixed with `/api`:

```
GET  /api/health               - Health check
POST /api/auth/login          - User login
GET  /api/auth/check          - Check authentication
GET  /api/workspaces          - List workspaces
GET  /api/settings/api-keys   - Check API keys
POST /api/settings/api-keys   - Save API keys
POST /api/proxy/openai/*      - OpenAI proxy
```

## Benefits

1. **Simpler Development** - No CORS issues
2. **Easier Deployment** - One server to deploy
3. **Better Security** - API and frontend on same origin
4. **Less Configuration** - No proxy setup needed

## Migration from Multi-Port

If you were running on multiple ports before:

1. **Update .env file:**
   ```env
   # Old
   VITE_API_URL=http://localhost:3000
   VITE_APP_URL=http://localhost:5173
   
   # New (leave API_URL empty for same origin)
   VITE_API_URL=
   VITE_APP_URL=http://localhost:3000
   ```

2. **Update API calls:**
   - No changes needed! The app automatically uses the same origin

## Troubleshooting

**"Proxy error" message:**
- Make sure Vite is running (started by `npm run dev`)
- Check that port 5173 is not in use

**API returns 501 Not Implemented:**
- This is expected - backend endpoints need to be implemented

**Port 3000 already in use:**
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `PORT=3001 npm run dev`

## Production Deployment

1. Build frontend:
   ```bash
   npm run build
   ```

2. Start server:
   ```bash
   npm start
   ```

3. Configure reverse proxy (nginx/Apache) to port 3000

## Next Steps

The server skeleton is ready. Now you need to:
1. Implement the API endpoints in `server.js`
2. Add database connection
3. Add authentication middleware
4. Implement business logic

Everything runs on **http://localhost:3000** 🎉