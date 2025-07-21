# AudioTricks Production Deployment Guide

This guide covers the complete production deployment of AudioTricks, including infrastructure setup, configuration, monitoring, and maintenance.

## 🚀 Quick Start

1. **Copy environment configuration:**
   ```bash
   cp .env.production .env
   ```

2. **Configure secrets and environment variables** (see [Environment Configuration](#environment-configuration))

3. **Deploy with the automated script:**
   ```bash
   ./deploy.sh
   ```

4. **Verify deployment:**
   ```bash
   ./deploy.sh health
   ```

## 📋 Prerequisites

### System Requirements
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Linux/macOS** with bash shell
- **4GB+ RAM** recommended for full stack
- **20GB+ disk space** for Docker images and data
- **PostgreSQL 15+** compatible environment

### Required Accounts/Services
- **DigitalOcean Spaces** (or S3-compatible storage)
- **Domain name** with DNS control (for SSL)
- **SendGrid account** (optional, for email notifications)

## 🔧 Environment Configuration

### 1. Generate Secrets

Run the deployment script to generate secure secrets:
```bash
./deploy.sh
```

This creates a `secrets.txt` file with randomly generated values:
- JWT signing secret (64 bytes)
- Encryption key for API keys (32 bytes)
- Database passwords
- Redis password
- Grafana admin password

**⚠️ IMPORTANT: Keep `secrets.txt` secure and backed up!**

### 2. Configure .env File

Update your `.env` file with the generated secrets and your specific values:

```bash
# Database (use generated password from secrets.txt)
POSTGRES_PASSWORD=your_generated_password

# Security (use generated values from secrets.txt)
JWT_SECRET=your_generated_jwt_secret
ENCRYPTION_KEY=your_generated_encryption_key

# Storage - DigitalOcean Spaces
DO_SPACES_KEY=your_spaces_access_key
DO_SPACES_SECRET=your_spaces_secret_key
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_CDN=https://your-bucket.nyc3.cdn.digitaloceanspaces.com

# Domain Configuration
FRONTEND_URL=https://yourdomain.com
FRONTEND_API_URL=https://api.yourdomain.com/api

# Optional: Email notifications
SENDGRID_API_KEY=your_sendgrid_key
```

### 3. DigitalOcean Spaces Setup

1. Create a **Spaces bucket** in your preferred region
2. Create **API credentials** with full Spaces access
3. Enable **CDN** for your bucket
4. Update `.env` with your bucket details

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │────│    Frontend     │────│    Backend      │
│  (Load Balancer)│    │   (React SPA)   │    │  (Express API)  │
│     Port 80     │    │    Port 3000    │    │    Port 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   PostgreSQL    │    │     Redis       │
         └──────────────│    Database     │────│     Cache       │
                        │    Port 5432    │    │    Port 6379    │
                        └─────────────────┘    └─────────────────┘
```

### Service Components

1. **Frontend (React + Nginx)**
   - Static file serving with gzip compression
   - SPA routing support
   - Security headers
   - Health checks

2. **Backend (Node.js + Express)**
   - RESTful API with TypeScript
   - JWT authentication
   - File upload handling
   - OpenAI integration
   - Health monitoring endpoints

3. **Database (PostgreSQL)**
   - Primary data storage
   - User accounts, workspaces, uploads
   - Usage tracking and quotas

4. **Cache (Redis)**
   - Session storage
   - API response caching
   - Rate limiting counters

5. **Storage (DigitalOcean Spaces)**
   - Audio file storage
   - CDN distribution
   - Multipart upload support

## 📊 Monitoring Stack (Optional)

Enable monitoring with Docker profiles:

```bash
# Deploy with monitoring
docker-compose --profile monitoring up -d

# Access monitoring
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/password from .env)
```

### Monitoring Components

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization dashboards
3. **Built-in metrics** - Health checks, performance data

## 🚀 Deployment Commands

### Basic Deployment
```bash
# Full deployment with backup
./deploy.sh deploy

# Deploy without backup
./deploy.sh deploy --skip-backup

# Deploy with monitoring
docker-compose --profile monitoring up -d
```

### Database Management
```bash
# Run migrations
./backend/scripts/migrate.sh migrate

# Backup database
./backend/scripts/migrate.sh backup

# Check migration status
./backend/scripts/migrate.sh status

# Reset database (development only)
./backend/scripts/migrate.sh reset
```

### Service Management
```bash
# Check service status
./deploy.sh status

# View service logs
docker-compose logs -f [service_name]

# Restart services
./deploy.sh restart

# Stop all services
./deploy.sh stop
```

## 🔐 SSL/HTTPS Configuration

### Option 1: Let's Encrypt (Recommended)

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Generate certificates:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

3. **Update nginx configuration** with SSL settings

4. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Option 2: Custom Certificates

1. **Place certificates** in `./ssl/` directory:
   ```
   ssl/
   ├── cert.pem
   ├── key.pem
   └── ca.pem
   ```

2. **Enable nginx SSL profile:**
   ```bash
   docker-compose --profile production up -d
   ```

## 🔄 Backup and Recovery

### Automated Backups

The deployment script automatically creates backups before deployment:
- Database dumps
- Docker volume backups
- Configuration file copies

### Manual Backup
```bash
# Create full backup
./deploy.sh backup

# Database-only backup
./backend/scripts/migrate.sh backup
```

### Recovery Process
```bash
# Restore from backup
./backend/scripts/migrate.sh restore ./backups/backup-YYYYMMDD-HHMMSS.sql

# Restore Docker volumes
docker run --rm \
  -v audiotricks_postgres_data:/data \
  -v $(pwd)/backups/backup-YYYYMMDD-HHMMSS:/backup \
  alpine tar xzf /backup/postgres_data.tar.gz -C /data
```

## 📋 Health Checks

### Built-in Health Endpoints

- **Basic health:** `GET /health`
- **Detailed status:** `GET /health/detailed`
- **Readiness probe:** `GET /health/ready`
- **Liveness probe:** `GET /health/live`
- **Metrics:** `GET /health/metrics` (Prometheus format)

### Monitoring Health
```bash
# Quick health check
curl http://localhost:3001/health

# Detailed system status
curl http://localhost:3001/health/detailed

# Run full health verification
./deploy.sh health
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # View database logs
   docker-compose logs postgres
   
   # Test connection manually
   docker exec audiotricks-postgres pg_isready -U audiotricks
   ```

2. **Frontend Build Errors**
   ```bash
   # Rebuild frontend with verbose logging
   docker-compose build --no-cache frontend
   
   # Check environment variables
   docker-compose config
   ```

3. **Backend API Errors**
   ```bash
   # View backend logs
   docker-compose logs -f backend
   
   # Check environment configuration
   docker exec audiotricks-backend env | grep -E "(DATABASE|JWT|ENCRYPTION)"
   ```

4. **Storage/Upload Issues**
   ```bash
   # Test DigitalOcean Spaces connectivity
   curl -I https://nyc3.digitaloceanspaces.com
   
   # Verify API keys and permissions
   # Check spaces access logs in DigitalOcean dashboard
   ```

### Log Analysis
```bash
# View all service logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Search logs for errors
docker-compose logs | grep -i error

# Export logs for analysis
docker-compose logs > deployment.log
```

## 🔧 Performance Optimization

### Database Optimization
```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_uploads_processing_status 
ON uploads(status) WHERE status IN ('processing', 'pending');

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM uploads WHERE status = 'processing';
```

### Redis Configuration
```bash
# Optimize Redis memory usage
docker exec audiotricks-redis redis-cli CONFIG SET maxmemory 256mb
docker exec audiotricks-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### File Storage Optimization
- Use CDN URLs for file serving
- Configure proper cache headers
- Enable gzip compression
- Implement file size limits

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load balancer:** Use nginx or cloud load balancer
- **Database:** Configure read replicas
- **Storage:** Implement distributed storage
- **Cache:** Use Redis cluster

### Vertical Scaling
- **Memory:** Increase container memory limits
- **CPU:** Add more CPU cores
- **Storage:** Use SSD storage for databases

### Cloud Deployment
- **DigitalOcean App Platform:** For managed deployment
- **AWS/GCP:** For enterprise scaling
- **Kubernetes:** For container orchestration

## 🔒 Security Checklist

- [ ] **Environment variables** secured and not committed
- [ ] **Database passwords** use strong, generated values
- [ ] **JWT secrets** are cryptographically secure
- [ ] **API keys** are encrypted in storage
- [ ] **SSL certificates** are valid and auto-renewing
- [ ] **Security headers** configured in nginx
- [ ] **Rate limiting** enabled and properly configured
- [ ] **File upload** restrictions and validation in place
- [ ] **Database backups** automated and tested
- [ ] **Access logs** enabled and monitored

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- **Weekly:** Review logs and performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and rotate security credentials
- **Annually:** Disaster recovery testing

### Support Resources
- **Logs:** Check service logs first
- **Health checks:** Use built-in monitoring endpoints
- **Documentation:** Refer to API documentation
- **Community:** Check GitHub issues and discussions

---

**🎵 AudioTricks Production Deployment** - Built with security, scalability, and reliability in mind.