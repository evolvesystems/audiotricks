#!/bin/bash

# AudioTricks Database Migration Script
# This script handles database schema migrations and data seeding

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
    error "This script must be run from the backend directory"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
fi

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        error "Invalid DATABASE_URL format"
    fi
    
    # Test connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        error "Cannot connect to database. Please check your DATABASE_URL and ensure the database is running."
    fi
    
    success "Database connection verified"
}

# Generate Prisma client
generate_client() {
    log "Generating Prisma client..."
    npx prisma generate
    success "Prisma client generated"
}

# Push schema to database (for development)
push_schema() {
    log "Pushing schema changes to database..."
    npx prisma db push --accept-data-loss
    success "Schema pushed to database"
}

# Run migrations (for production)
run_migrations() {
    log "Running database migrations..."
    npx prisma migrate deploy
    success "Database migrations completed"
}

# Seed database with initial data
seed_database() {
    log "Seeding database with initial data..."
    
    # Check if seed script exists
    if [ -f "prisma/seed.ts" ]; then
        npx prisma db seed
        success "Database seeded successfully"
    elif [ -f "scripts/seed.js" ]; then
        node scripts/seed.js
        success "Database seeded successfully"
    else
        warning "No seed script found, skipping database seeding"
    fi
}

# Backup database
backup_database() {
    if [ "$1" = "--skip-backup" ]; then
        log "Skipping backup as requested"
        return
    fi
    
    log "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
        success "Database backup created: $BACKUP_FILE"
    else
        error "Failed to create database backup"
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file path is required for restore"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file does not exist: $backup_file"
    fi
    
    warning "This will restore the database from backup and may overwrite existing data"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    log "Restoring database from backup: $backup_file"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" < "$backup_file"; then
        success "Database restored successfully"
    else
        error "Failed to restore database"
    fi
}

# Reset database (drop and recreate)
reset_database() {
    warning "This will completely reset the database and destroy all data"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Reset cancelled"
        exit 0
    fi
    
    log "Resetting database..."
    npx prisma migrate reset --force
    success "Database reset completed"
}

# Show database status
show_status() {
    log "Database Status:"
    echo ""
    
    # Show migration status
    echo "Migration Status:"
    npx prisma migrate status
    echo ""
    
    # Show database info
    echo "Database Connection:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Show table counts
    echo "Table Counts:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows
        FROM pg_stat_user_tables 
        ORDER BY schemaname, tablename;
    " 2>/dev/null || echo "  Could not retrieve table statistics"
}

# Main function
main() {
    log "Starting AudioTricks database migration process..."
    
    case "${1:-migrate}" in
        "migrate")
            check_database
            generate_client
            backup_database "$2"
            run_migrations
            seed_database
            ;;
        "push")
            check_database
            generate_client
            backup_database "$2"
            push_schema
            seed_database
            ;;
        "generate")
            generate_client
            ;;
        "seed")
            check_database
            seed_database
            ;;
        "backup")
            check_database
            backup_database
            ;;
        "restore")
            check_database
            restore_database "$2"
            ;;
        "reset")
            reset_database
            ;;
        "status")
            check_database
            show_status
            ;;
        *)
            echo "Usage: $0 [migrate|push|generate|seed|backup|restore|reset|status] [options]"
            echo ""
            echo "Commands:"
            echo "  migrate    - Run production migrations (default)"
            echo "  push       - Push schema changes (development)"
            echo "  generate   - Generate Prisma client only"
            echo "  seed       - Seed database with initial data"
            echo "  backup     - Create database backup"
            echo "  restore    - Restore from backup file"
            echo "  reset      - Reset database (destructive)"
            echo "  status     - Show database status"
            echo ""
            echo "Options:"
            echo "  --skip-backup - Skip backup creation"
            echo ""
            echo "Examples:"
            echo "  $0 migrate --skip-backup"
            echo "  $0 restore ./backups/backup-20240101-120000.sql"
            exit 1
            ;;
    esac
    
    success "Database migration process completed successfully!"
}

# Run main function with all arguments
main "$@"