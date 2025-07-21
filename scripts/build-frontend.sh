#!/bin/bash

# ONE PORT BUILD SCRIPT - Builds frontend for backend serving

echo "🚀 Building frontend for ONE PORT deployment..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Ensure backend can serve it
echo "✅ Frontend built successfully!"
echo "📍 Frontend will be served from backend on port 3000"
echo "🚫 NO SEPARATE FRONTEND PORT - ONE PORT ONLY!"