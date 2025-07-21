@echo off
echo 🎵 Starting AudioTricks Development Server...
echo 📁 Working directory: %cd%
echo 🌐 Server will be available at: http://localhost:3000
echo.

echo 🔧 Stopping any existing servers...
taskkill /f /im node.exe >nul 2>&1

echo 📦 Building frontend...
call npm run build

echo 🚀 Starting backend server (serves frontend on port 3000)...
cd backend
call npm run dev