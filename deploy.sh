#!/bin/bash

# AudioTricks Production Deployment Script
# This script handles the complete deployment of AudioTricks to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="audiotricks"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker service."
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose."
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        error ".env file not found. Please copy .env.production to .env and configure it."
    fi
    
    # Check if required environment variables are set
    source "$ENV_FILE"
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "CHANGE_ME_STRONG_PASSWORD" ]; then
        error "POSTGRES_PASSWORD is not configured in .env file"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_ME_RANDOM_64_BYTE_HEX_STRING" ]; then
        error "JWT_SECRET is not configured in .env file"
    fi
    
    if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "CHANGE_ME_RANDOM_32_BYTE_HEX_STRING" ]; then
        error "ENCRYPTION_KEY is not configured in .env file"
    fi
    
    success "Prerequisites check passed"
}

# Generate secrets if needed
generate_secrets() {
    log "Checking and generating secrets..."
    
    if [ ! -f "secrets.txt" ]; then
        log "Generating new secrets..."
        
        echo "# AudioTricks Generated Secrets - $(date)" > secrets.txt
        echo "# KEEP THIS FILE SECURE AND BACKED UP" >> secrets.txt
        echo "" >> secrets.txt
        
        echo "JWT_SECRET=$(openssl rand -hex 64)" >> secrets.txt
        echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> secrets.txt
        echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)" >> secrets.txt
        echo "REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)" >> secrets.txt
        echo "GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d '=+/' | cut -c1-12)" >> secrets.txt
        
        chmod 600 secrets.txt
        success "Secrets generated and saved to secrets.txt"
        warning "Please update your .env file with these generated secrets"
    else
        log "Using existing secrets from secrets.txt"
    fi
}

# Create backup
create_backup() {
    if [ "$1" = "--skip-backup" ]; then
        log "Skipping backup as requested"
        return
    fi
    
    log "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create backup directory
    mkdir -p "$BACKUP_PATH"
    
    # Backup database if running
    if docker ps --format "table {{.Names}}" | grep -q "${PROJECT_NAME}-postgres"; then
        log "Backing up database..."
        docker exec "${PROJECT_NAME}-postgres" pg_dump -U audiotricks audiotricks > "$BACKUP_PATH/database.sql"
        success "Database backup created"
    fi
    
    # Backup volumes
    if docker volume ls --format "table {{.Name}}" | grep -q "${PROJECT_NAME}"; then
        log "Backing up Docker volumes..."
        docker run --rm \
            -v "${PROJECT_NAME}_postgres_data":/data \
            -v "$(pwd)/$BACKUP_PATH":/backup \
            alpine tar czf /backup/postgres_data.tar.gz -C /data .
        
        docker run --rm \
            -v "${PROJECT_NAME}_redis_data":/data \
            -v "$(pwd)/$BACKUP_PATH":/backup \
            alpine tar czf /backup/redis_data.tar.gz -C /data .
        
        success "Volume backups created"
    fi
    
    # Backup configuration
    cp .env "$BACKUP_PATH/" 2>/dev/null || true
    cp docker-compose.yml "$BACKUP_PATH/"
    
    success "Backup completed: $BACKUP_PATH"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest base images..."
    docker-compose pull postgres redis
    
    # Build application images
    log "Building application images..."
    docker-compose build --no-cache
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose down
    
    # Start database and wait for it to be ready
    log "Starting database services..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec "${PROJECT_NAME}-postgres" pg_isready -U audiotricks -d audiotricks &>/dev/null; then
            break
        fi
        echo -n "."
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Database failed to start within timeout"
    fi
    
    success "Database is ready"
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose run --rm backend npm run db:migrate
    
    # Start all services
    log "Starting all services..."
    docker-compose up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    log "Checking backend health..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/health &>/dev/null; then
            success "Backend is healthy"
            break
        fi
        echo -n "."
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Backend health check failed"
    fi
    
    # Check frontend health
    log "Checking frontend health..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            success "Frontend is healthy"
            break
        fi
        echo -n "."
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Frontend health check failed"
    fi
    
    # Check database connection
    log "Checking database connection..."
    if docker exec "${PROJECT_NAME}-postgres" pg_isready -U audiotricks -d audiotricks &>/dev/null; then
        success "Database connection is healthy"
    else
        error "Database connection failed"
    fi
    
    success "All health checks passed"
}

# Show status
show_status() {
    log "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    log "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3001"
    echo "  Health Checks: http://localhost:3000/health and http://localhost:3001/health"
    echo ""
    log "Logs can be viewed with: docker-compose logs -f [service_name]"
}

# Cleanup function
cleanup() {
    log "Cleaning up old images and containers..."
    docker system prune -f
    docker image prune -f
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting AudioTricks deployment process..."
    
    check_prerequisites
    generate_secrets
    
    case "${1:-deploy}" in
        "deploy")
            create_backup "$2"
            deploy
            health_check
            show_status
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "stop")
            log "Stopping all services..."
            docker-compose down
            success "All services stopped"
            ;;
        "restart")
            log "Restarting all services..."
            docker-compose restart
            health_check
            show_status
            ;;
        *)
            echo "Usage: $0 [deploy|backup|health|status|cleanup|stop|restart] [--skip-backup]"
            echo ""
            echo "Commands:"
            echo "  deploy      - Full deployment (default)"
            echo "  backup      - Create backup only"
            echo "  health      - Run health checks only"
            echo "  status      - Show current status"
            echo "  cleanup     - Clean up old Docker images"
            echo "  stop        - Stop all services"
            echo "  restart     - Restart all services"
            echo ""
            echo "Options:"
            echo "  --skip-backup - Skip backup creation during deploy"
            exit 1
            ;;
    esac
    
    success "AudioTricks deployment process completed successfully!"
}

# Run main function with all arguments
main "$@"