# AudioTricks DigitalOcean Deployment

This directory contains automated deployment scripts for setting up AudioTricks on a DigitalOcean droplet.

## 🚀 Quick Start

### 1. Create a DigitalOcean Droplet
- Ubuntu 22.04 LTS
- Minimum 2GB RAM (4GB recommended)
- 2 vCPUs
- 50GB SSD

### 2. Point Your Domain
Add an A record pointing your domain to the droplet's IP address.

### 3. Run Automated Setup
SSH into your droplet as root and run:

```bash
curl -sSL https://raw.githubusercontent.com/evolvesystems/audiotricks/main/deploy/quick-setup.sh | bash
```

The script will prompt for:
- Domain name (e.g., audiotricks.yourdomain.com)
- Email for SSL certificates
- Database connection string from DigitalOcean Managed PostgreSQL
- JWT secret (or auto-generate)

## 📁 Scripts Overview

### `setup-droplet.sh`
Main automated setup script that:
- ✅ Updates system and installs dependencies
- ✅ Installs Node.js 20.x and PM2
- ✅ Configures firewall (UFW)
- ✅ Clones and builds the application
- ✅ Sets up Nginx with SSL (Let's Encrypt)
- ✅ Configures PM2 for process management
- ✅ Creates automated backup scripts
- ✅ Sets up health monitoring
- ✅ Configures log rotation

### `create-admin.js`
Creates an admin user after deployment:
```bash
cd /var/www/audiotricks/backend
node deploy/create-admin.js
```

### `monitoring-setup.sh`
Optional advanced monitoring with:
- Monit for process monitoring
- Netdata for system metrics
- Email alerts for issues
- Custom health checks

### `quick-setup.sh`
Wrapper script for easy one-line deployment.

## 🔧 Post-Installation

### 1. Create Admin User
```bash
su - audiotricks
cd /var/www/audiotricks/backend
node deploy/create-admin.js
```

### 2. Verify Installation
- Visit: https://yourdomain.com
- Admin panel: https://yourdomain.com/admin/login
- Health check: https://yourdomain.com/api/health

### 3. Configure External APIs
Edit `/var/www/audiotricks/backend/.env` to add:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

Then restart:
```bash
pm2 restart audiotricks
```

## 📊 Management Commands

### View Application Status
```bash
pm2 status
pm2 monit  # Real-time monitoring
```

### View Logs
```bash
pm2 logs audiotricks
tail -f /var/log/audiotricks/error.log
```

### Update Application
```bash
/home/audiotricks/update-audiotricks.sh
```

### Manual Backup
```bash
/home/audiotricks/backup-audiotricks.sh
```

### Restart Application
```bash
pm2 restart audiotricks
```

## 🔒 Security Features

- ✅ UFW firewall (ports 22, 80, 443 only)
- ✅ Fail2ban for SSH protection
- ✅ SSL/TLS with auto-renewal
- ✅ Security headers in Nginx
- ✅ Environment variables for secrets
- ✅ Database connection string encryption

## 🔄 Automated Tasks

- **Backups**: Daily at 2 AM (7-day retention)
- **Health Checks**: Every 5 minutes
- **SSL Renewal**: Automatic via certbot
- **Log Rotation**: Daily with 14-day retention

## 🚨 Troubleshooting

### Check PM2 Status
```bash
pm2 status
pm2 describe audiotricks
```

### Check Nginx
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Database Connection
```bash
cd /var/www/audiotricks/backend
npx prisma db push  # Test connection
```

### Regenerate SSL Certificate
```bash
certbot --nginx -d yourdomain.com
```

## 🎯 Advanced Configuration

### Enable Redis (Optional)
```bash
apt install redis-server
# Edit /var/www/audiotricks/backend/.env
# Set DISABLE_REDIS="false"
pm2 restart audiotricks
```

### Setup Monitoring
```bash
cd /var/www/audiotricks/deploy
./monitoring-setup.sh yourdomain.com your-email@example.com
```

### Configure CDN
Add Cloudflare or other CDN by updating DNS settings and configuring cache rules for `/assets/*`.

## 💡 Tips

1. **Performance**: Use DigitalOcean's monitoring to track resource usage
2. **Scaling**: Can easily snapshot and create larger droplets
3. **Backups**: Consider DigitalOcean Spaces for offsite backup storage
4. **Updates**: Test updates on a staging droplet first

## 📞 Support

For issues with:
- **Application**: Check logs with `pm2 logs`
- **Database**: Verify connection string in `.env`
- **SSL**: Run `certbot certificates`
- **General**: Create issue on GitHub