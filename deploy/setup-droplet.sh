#!/bin/bash
#
# AudioTricks Automated DigitalOcean Droplet Setup Script
# This script will automatically configure a fresh Ubuntu 22.04 droplet
# 
# Usage: 
# 1. Create a new Ubuntu 22.04 droplet on DigitalOcean
# 2. SSH into the droplet as root
# 3. Run: wget -O - https://raw.githubusercontent.com/evolvesystems/audiotricks/main/deploy/setup-droplet.sh | bash
#

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN_NAME=""
EMAIL=""
DB_CONNECTION_STRING=""
JWT_SECRET=""
GITHUB_REPO="https://github.com/evolvesystems/audiotricks.git"
APP_USER="audiotricks"
APP_DIR="/var/www/audiotricks"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Header
echo "=========================================="
echo "AudioTricks Automated Setup Script"
echo "=========================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Collect required information
read -p "Enter your domain name (e.g., audiotricks.yourdomain.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificates: " EMAIL
read -p "Enter your DigitalOcean PostgreSQL connection string: " DB_CONNECTION_STRING
read -p "Enter a secure JWT secret (or press enter to generate): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    print_status "Generated JWT secret: $JWT_SECRET"
fi

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 16)
print_status "Generated encryption key"

echo ""
echo "Configuration Summary:"
echo "Domain: $DOMAIN_NAME"
echo "Email: $EMAIL"
echo "Starting installation..."
echo ""

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y \
    curl \
    git \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    postgresql-client \
    ufw \
    fail2ban \
    htop \
    supervisor

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install global npm packages
print_status "Installing PM2..."
npm install -g pm2

# Create application user
print_status "Creating application user..."
useradd -m -s /bin/bash $APP_USER || true

# Setup firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Clone repository
print_status "Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone $GITHUB_REPO
chown -R $APP_USER:$APP_USER $APP_DIR

# Install dependencies
print_status "Installing application dependencies..."
cd $APP_DIR
sudo -u $APP_USER npm install
cd backend
sudo -u $APP_USER npm install

# Create environment file
print_status "Creating environment configuration..."
cat > $APP_DIR/backend/.env << EOF
# Database Configuration
DATABASE_URL="$DB_CONNECTION_STRING"

# Server Configuration
NODE_ENV="production"
PORT=3000

# Security
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# API Configuration
API_KEYS='["atk_$(openssl rand -hex 32)","atk_$(openssl rand -hex 32)"]'
API_KEY_HEADER_NAME="X-API-Key"
REQUIRE_API_KEY="false"
REQUIRE_USER_AUTH="true"

# CORS
FRONTEND_URL="https://$DOMAIN_NAME"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (disabled by default)
DISABLE_REDIS="true"

# External APIs (users will add their own)
OPENAI_API_KEY=""
ELEVENLABS_API_KEY=""

# eWAY Payment Gateway
EWAY_API_KEY="dummy-api-key"
EWAY_PASSWORD="dummy-password"
EWAY_ENDPOINT="https://api.sandbox.ewaypayments.com"
EOF

chown $APP_USER:$APP_USER $APP_DIR/backend/.env
chmod 600 $APP_DIR/backend/.env

# Build frontend
print_status "Building frontend..."
cd $APP_DIR
sudo -u $APP_USER npm run build:frontend

# Run database migrations
print_status "Running database migrations..."
cd $APP_DIR/backend
sudo -u $APP_USER npx prisma generate
sudo -u $APP_USER npx prisma migrate deploy

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'audiotricks',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/audiotricks/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/audiotricks/error.log',
    out_file: '/var/log/audiotricks/out.log',
    log_file: '/var/log/audiotricks/combined.log',
    time: true
  }]
};
EOF

chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js

# Create log directory
mkdir -p /var/log/audiotricks
chown -R $APP_USER:$APP_USER /var/log/audiotricks

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/audiotricks << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;

    # SSL certificates will be added by certbot
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # File upload limits
    client_max_body_size 100M;
    client_body_buffer_size 100M;
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/audiotricks /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Start application with PM2
print_status "Starting application..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save

# Setup PM2 startup
print_status "Configuring PM2 startup..."
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
systemctl enable pm2-$APP_USER

# Get SSL certificate
print_status "Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive || {
    print_warning "SSL certificate generation failed. You may need to run certbot manually."
}

# Create update script
print_status "Creating update script..."
cat > /home/$APP_USER/update-audiotricks.sh << 'EOF'
#!/bin/bash
cd /var/www/audiotricks
git pull
npm install
cd backend && npm install
cd ..
npm run build:frontend
pm2 restart audiotricks
EOF

chmod +x /home/$APP_USER/update-audiotricks.sh
chown $APP_USER:$APP_USER /home/$APP_USER/update-audiotricks.sh

# Create backup script
print_status "Creating backup script..."
cat > /home/$APP_USER/backup-audiotricks.sh << EOF
#!/bin/bash
BACKUP_DIR="/backup/audiotricks"
mkdir -p \$BACKUP_DIR

# Backup database
PGPASSWORD=\$(echo "$DB_CONNECTION_STRING" | grep -oP '(?<=:)[^@]+(?=@)') \\
pg_dump "$DB_CONNECTION_STRING" > \$BACKUP_DIR/audiotricks-\$(date +%Y%m%d-%H%M%S).sql

# Keep only last 7 days of backups
find \$BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /home/$APP_USER/backup-audiotricks.sh
chown $APP_USER:$APP_USER /home/$APP_USER/backup-audiotricks.sh

# Setup cron for backups
print_status "Setting up automated backups..."
(crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * /home/$APP_USER/backup-audiotricks.sh") | crontab -u $APP_USER -

# Create health check script
print_status "Creating health check script..."
cat > /home/$APP_USER/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Health check failed, restarting application..."
    pm2 restart audiotricks
fi
EOF

chmod +x /home/$APP_USER/health-check.sh
chown $APP_USER:$APP_USER /home/$APP_USER/health-check.sh

# Add health check to cron
(crontab -u $APP_USER -l 2>/dev/null; echo "*/5 * * * * /home/$APP_USER/health-check.sh") | crontab -u $APP_USER -

# Final status
echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
print_status "Application URL: https://$DOMAIN_NAME"
print_status "PM2 Status: pm2 status"
print_status "View Logs: pm2 logs audiotricks"
print_status "Update App: /home/$APP_USER/update-audiotricks.sh"
echo ""
echo "Next Steps:"
echo "1. Update DNS A record for $DOMAIN_NAME to point to this server's IP"
echo "2. Test the application at https://$DOMAIN_NAME"
echo "3. Create admin user: cd $APP_DIR/backend && node scripts/create-admin.js"
echo ""
echo "Security Notes:"
echo "- Firewall is enabled (ports 22, 80, 443 only)"
echo "- Fail2ban is installed for SSH protection"
echo "- SSL certificate auto-renewal is configured"
echo "- Database backups run daily at 2 AM"
echo "- Health checks run every 5 minutes"
echo ""