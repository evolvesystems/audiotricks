# 🎵 AudioTricks Development Guide

## Quick Start

### 🚀 Start Development Server

**From the root directory, run ONE of these commands:**

#### macOS/Linux:
```bash
npm run dev
```
or
```bash
./dev.sh
```

#### Windows:
```cmd
npm run dev:win
```
or
```cmd
dev.bat
```

### 🌐 Access the Application

The entire application runs on **ONE PORT ONLY**: **http://localhost:3000**

- **Main App**: http://localhost:3000/
- **User Dashboard**: http://localhost:3000/dashboard
- **Projects**: http://localhost:3000/projects  
- **Transcriptions**: http://localhost:3000/jobs
- **Admin Panel**: http://localhost:3000/admin
- **Admin Settings**: http://localhost:3000/admin/settings

## 🏗️ Architecture

### One Port Rule
- ✅ **Frontend** served from backend on port 3000
- ✅ **Backend API** runs on port 3000
- ❌ **NO separate frontend dev server** (enforced)

### Development Workflow

1. **Make changes** to frontend or backend code
2. **Run `npm run dev`** from root directory
3. **Automatic rebuild** and restart
4. **Visit http://localhost:3000** to see changes

## 📁 Project Structure

```
AudioTricks/
├── src/                    # Frontend React app
│   ├── components/
│   │   ├── Admin/         # Admin dashboard & management
│   │   ├── User/          # User dashboard & projects
│   │   └── App/           # Main app components
│   └── main.tsx           # Router configuration
├── backend/               # Node.js backend
│   ├── src/
│   └── package.json
├── dev.sh                 # Development script (macOS/Linux)
├── dev.bat                # Development script (Windows)
└── package.json           # Frontend build scripts
```

## 🎯 Key Features

### User Dashboard
- **Projects Management** - Organize transcriptions
- **Jobs Tracking** - Monitor transcription status
- **Usage Statistics** - Track limits and usage
- **Modern UI** - Professional sidebar design

### Admin Panel
- **User Management** - Admin user controls
- **Subscription Plans** - Create and manage plans
- **Payment Gateway** - eWAY integration
- **System Settings** - Admin and super admin settings

## 🔧 Development Scripts

| Command | Platform | Description |
|---------|----------|-------------|
| `npm run dev` | All | Start development server |
| `npm run dev:win` | Windows | Start development server (Windows) |
| `npm run build` | All | Build frontend only |
| `npm test` | All | Run tests |

## 🚫 Important Rules

### CLAUDE.md Compliance
- ✅ All files must be **under 250 lines**
- ✅ Tests required for all new features
- ✅ TypeScript strict mode
- ✅ No hardcoded API keys

### One Port Architecture
- ✅ Everything runs on port 3000
- ❌ Never use separate frontend dev server
- ❌ Never use multiple ports

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Kill existing processes
pkill -f "tsx watch"
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

### Changes Not Visible
1. **Stop server** (Ctrl+C)
2. **Restart**: `npm run dev`
3. **Hard refresh** browser (Cmd+Shift+R / Ctrl+Shift+R)

### Permission Denied (macOS/Linux)
```bash
chmod +x dev.sh
```

## 📋 Common Tasks

### Add New Feature
1. Create components in appropriate directory
2. Add routes to `main.tsx` 
3. Write tests for new functionality
4. Ensure file size < 250 lines
5. Test with `npm run dev`

### Update Styling
1. Modify Tailwind classes in components
2. Build automatically rebuilds CSS
3. Refresh browser to see changes

### Debug Issues
1. Check browser console
2. Check terminal output
3. Verify server is running on port 3000
4. Check network tab for API calls

## 🎵 Happy Coding!

The AudioTricks development environment is designed for simplicity and efficiency. Everything runs from one command, on one port, with automatic rebuilding and hot reloading.