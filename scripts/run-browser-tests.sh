#!/bin/bash

# AudioTricks Browser Test Runner
# Starts the server and runs comprehensive browser tests
# CLAUDE.md compliant - Real browser testing

set -e

echo "🎵 AudioTricks Browser Test Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking if server is running on port 3000..."

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    print_success "Server is already running on port 3000"
    SERVER_STARTED=false
else
    print_status "Starting AudioTricks server on port 3000..."
    
    # Start the server in background
    cd /Users/johnnorth/CascadeProjects/AudioTricks
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Build the frontend first
    print_status "Building frontend..."
    npm run build
    
    # Start the backend server
    print_status "Starting backend server (serves both API and frontend)..."
    cd backend
    npm start &
    SERVER_PID=$!
    SERVER_STARTED=true
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    sleep 10
    
    # Check if server is running
    if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
        print_error "Failed to start server on port 3000"
        exit 1
    fi
    
    print_success "Server started successfully on port 3000"
fi

# Go back to project root
cd /Users/johnnorth/CascadeProjects/AudioTricks

print_status "Installing browser test dependencies..."
if ! npm list puppeteer &> /dev/null; then
    npm install --save-dev puppeteer @types/puppeteer ts-node
fi

print_status "Compiling and running browser tests..."

# Create test directories
mkdir -p test-screenshots
mkdir -p tests/browser

# Run the browser tests
node tests/browser/browser-test.js

TEST_EXIT_CODE=$?

# Cleanup
if [ "$SERVER_STARTED" = true ]; then
    print_status "Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
    # Force kill if still running
    kill -9 $SERVER_PID 2>/dev/null || true
fi

# Show results
echo ""
echo "=================================="
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All browser tests completed successfully!"
    print_status "Check the HTML report: browser-test-report.html"
    print_status "Screenshots saved in: test-screenshots/"
else
    print_error "Some browser tests failed."
    print_status "Check the HTML report for details: browser-test-report.html"
    print_status "Screenshots saved in: test-screenshots/"
fi

echo ""
print_status "Test artifacts:"
echo "  📊 HTML Report: browser-test-report.html"
echo "  📋 JSON Report: test-results.json"
echo "  📸 Screenshots: test-screenshots/"
echo ""

# Open the report if on macOS
if [[ "$OSTYPE" == "darwin"* ]] && [ $TEST_EXIT_CODE -eq 0 ]; then
    print_status "Opening test report in browser..."
    open browser-test-report.html
fi

exit $TEST_EXIT_CODE