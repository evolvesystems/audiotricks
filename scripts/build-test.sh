#!/bin/bash

# 🚨 MANDATORY BUILD TESTING PROTOCOL
# This script MUST pass before any commit is allowed

set -e  # Exit on any error

echo "🚨 STARTING MANDATORY BUILD TESTING PROTOCOL..."
echo "=================================================="

# Function to print colored output
print_status() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_info() {
    echo "📋 $1"
}

# Step 1: Clean previous builds
print_info "Step 1: Cleaning previous builds..."
rm -rf dist/
rm -rf backend/dist/
print_status "Previous builds cleaned"

# Step 2: Test direct Vite build
print_info "Step 2: Testing direct Vite build..."
if npm run build; then
    print_status "Direct Vite build successful"
else
    print_error "Direct Vite build FAILED"
    exit 1
fi

# Step 3: Verify build output integrity
print_info "Step 3: Verifying build output integrity..."

if [ ! -d "dist" ]; then
    print_error "Build output directory missing"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    print_error "index.html missing from build output"
    exit 1
fi

# Count assets
asset_count=$(find dist/assets -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
if [ "$asset_count" -lt 1 ]; then
    print_error "No assets found in build output"
    exit 1
fi

print_status "Build output integrity verified ($asset_count assets found)"

# Step 4: Test backend build (if exists)
print_info "Step 4: Testing backend compatibility..."
if [ -d "backend" ]; then
    cd backend
    if [ -f "package.json" ]; then
        print_info "Installing backend dependencies..."
        if npm install --silent; then
            print_status "Backend dependencies installed"
        else
            print_error "Backend dependency installation failed"
            exit 1
        fi
        
        # Test TypeScript compilation if available
        if npx tsc --version > /dev/null 2>&1; then
            print_info "Testing TypeScript compilation..."
            if npx tsc --noEmit --skipLibCheck; then
                print_status "TypeScript compilation successful"
            else
                print_error "TypeScript compilation failed"
                exit 1
            fi
        fi
    fi
    cd ..
else
    print_warning "No backend directory found - frontend-only build"
fi

# Step 5: Simulate production environment
print_info "Step 5: Simulating production environment..."

# Check for common production issues
if grep -r "console.log" dist/ > /dev/null 2>&1; then
    print_warning "Console.log statements found in production build"
fi

if grep -r "localhost" dist/ > /dev/null 2>&1; then
    print_warning "Localhost references found in production build"
fi

# Check file sizes
large_files=$(find dist/ -type f -size +1M 2>/dev/null)
if [ ! -z "$large_files" ]; then
    print_warning "Large files detected (>1MB):"
    echo "$large_files"
fi

print_status "Production environment simulation complete"

# Step 6: Architecture compliance check
print_info "Step 6: Checking architecture compliance..."

# Check for hardcoded sensitive data
if grep -r "sk-" src/ > /dev/null 2>&1; then
    print_error "Potential hardcoded API keys found (sk- pattern)"
    exit 1
fi

if grep -r "supabase" src/ > /dev/null 2>&1; then
    print_error "Supabase references found - use PostgreSQL only"
    exit 1
fi

print_status "Architecture compliance verified"

# Step 7: Final verification
print_info "Step 7: Final verification..."

# Verify all critical files exist
critical_files=("dist/index.html" "package.json" "CLAUDE.md")
for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Critical file missing: $file"
        exit 1
    fi
done

print_status "All critical files verified"

# SUCCESS MESSAGE - EXACTLY as specified in CLAUDE.md
echo ""
echo "=================================================="
echo "🎉 All build tests PASSED!"
echo "✅ Safe to commit and deploy"
echo "=================================================="
echo ""
echo "You can now safely run:"
echo "git add ."
echo "git commit -m \"your changes\""
echo "git push"
echo ""