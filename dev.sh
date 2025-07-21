#!/bin/bash

# AudioTricks Development Server
# Runs everything from the root directory on port 3000

echo "🎵 Starting AudioTricks Development Server..."
echo "📁 Working directory: $(pwd)"
echo "🌐 Server will be available at: http://localhost:3000"
echo ""

# Kill any existing processes on port 3000
echo "🔧 Stopping any existing servers..."
pkill -f "tsx watch" > /dev/null 2>&1
lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1

echo "📦 Building frontend..."
npm run build

echo "🚀 Starting backend server (serves frontend on port 3000)..."
cd backend
npm run dev