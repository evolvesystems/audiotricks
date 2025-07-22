#!/bin/bash

# 🔄 AudioTricks Deployment Status Checker
# Run this script to verify if your Netlify deployment succeeded

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

echo -e "${BLUE}"
echo "🔄 Checking AudioTricks Deployment Status..."
echo "=============================================="
echo -e "${NC}"

SITE_URL="https://audiotricks.evolvepreneuriq.com"
HEALTH_PASSED=true

# Test 1: Main site health
print_info "Testing main site health endpoint..."
if curl -s -m 10 "$SITE_URL/api/health" | grep -qE "(ok|healthy)"; then
    print_status "Main site: HEALTHY"
else
    print_error "Main site: FAILED"
    HEALTH_PASSED=false
fi

# Test 2: Authentication health
print_info "Testing authentication endpoint..."
if curl -s -m 10 "$SITE_URL/api/auth/health" | grep -q "ok"; then
    print_status "Authentication: HEALTHY"  
else
    print_error "Authentication: FAILED"
    HEALTH_PASSED=false
fi

# Test 3: Database connection
print_info "Testing database connectivity..."
if curl -s -m 10 "$SITE_URL/api/health" | grep -q "connected"; then
    print_status "Database: CONNECTED"
else
    print_error "Database: DISCONNECTED"
    HEALTH_PASSED=false
fi

# Test 4: Frontend loads
print_info "Testing frontend loading..."
if curl -s -m 10 "$SITE_URL/" | grep -q "AudioTricks"; then
    print_status "Frontend: LOADING"
else
    print_error "Frontend: FAILED TO LOAD"
    HEALTH_PASSED=false
fi

# Test 5: Admin endpoint (optional)
print_info "Testing admin functionality..."
admin_response=$(curl -s -m 10 "$SITE_URL/api/admin/stats" -w "%{http_code}")
http_code="${admin_response: -3}"
if [[ "$http_code" == "200" || "$http_code" == "401" ]]; then
    print_status "Admin endpoints: RESPONDING"
else
    print_warning "Admin endpoints: UNEXPECTED RESPONSE ($http_code)"
fi

echo ""
echo "=============================================="

if [ "$HEALTH_PASSED" = true ]; then
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}✅ All systems operational${NC}"
    echo ""
    echo -e "🌐 Live site: ${BLUE}$SITE_URL${NC}"
    exit 0
else
    echo -e "${RED}💥 DEPLOYMENT ISSUES DETECTED!${NC}"
    echo -e "${RED}❌ Some systems are not responding${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting steps:${NC}"
    echo "1. Check Netlify deploy logs"
    echo "2. Verify environment variables are set"
    echo "3. Ensure database is accessible"
    echo "4. Check for recent code changes that might cause issues"
    echo ""
    echo -e "📊 Detailed health info: ${BLUE}$SITE_URL/api/health${NC}"
    exit 1
fi