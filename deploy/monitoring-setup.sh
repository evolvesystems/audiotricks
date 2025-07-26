#!/bin/bash
#
# Monitoring and alerts setup for AudioTricks
# Sets up comprehensive monitoring with alerts
#

set -e

DOMAIN_NAME=$1
SLACK_WEBHOOK=$2
EMAIL=$3

if [ -z "$DOMAIN_NAME" ]; then
    read -p "Enter domain name: " DOMAIN_NAME
fi

if [ -z "$EMAIL" ]; then
    read -p "Enter alert email: " EMAIL
fi

echo "Setting up monitoring for AudioTricks..."

# Install monitoring tools
apt install -y monit netdata

# Configure Monit
cat > /etc/monit/conf.d/audiotricks << EOF
# Check system resources
check system \$HOST
    if loadavg (5min) > 4 then alert
    if memory usage > 80% then alert
    if cpu usage > 80% for 10 cycles then alert
    if swap usage > 25% then alert

# Check disk space
check filesystem rootfs with path /
    if space usage > 80% then alert

# Check nginx
check process nginx with pidfile /var/run/nginx.pid
    start program = "/bin/systemctl start nginx"
    stop program = "/bin/systemctl stop nginx"
    if failed host $DOMAIN_NAME port 443 protocol https then restart
    if 3 restarts within 5 cycles then timeout

# Check PM2/Node.js
check process audiotricks matching "node.*audiotricks"
    start program = "/bin/su - audiotricks -c 'cd /var/www/audiotricks && pm2 start ecosystem.config.js'"
    stop program = "/bin/su - audiotricks -c 'pm2 stop audiotricks'"
    if failed host localhost port 3000 protocol http
        request "/api/health"
        with timeout 10 seconds
        then restart
    if 3 restarts within 5 cycles then alert

# Check PostgreSQL connection
check program postgresql with path "/usr/local/bin/check_postgres.sh"
    if status != 0 then alert

# Alert settings
set alert $EMAIL
EOF

# Create PostgreSQL check script
cat > /usr/local/bin/check_postgres.sh << 'EOF'
#!/bin/bash
# Test database connection
sudo -u audiotricks psql \$DATABASE_URL -c "SELECT 1" > /dev/null 2>&1
exit \$?
EOF
chmod +x /usr/local/bin/check_postgres.sh

# Configure Netdata
cat >> /etc/netdata/netdata.conf << EOF

[global]
    update every = 5
    memory mode = save
    history = 3600

[web]
    bind to = localhost
EOF

# Setup Netdata nginx proxy
cat > /etc/nginx/sites-available/netdata << EOF
server {
    listen 443 ssl http2;
    server_name netdata.$DOMAIN_NAME;

    # Use same SSL certs as main domain
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    location / {
        proxy_pass http://localhost:19999;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        auth_basic "Netdata Monitoring";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
EOF

# Create basic auth for Netdata
echo -n "Create password for Netdata web interface: "
htpasswd -c /etc/nginx/.htpasswd admin

# Enable Netdata site
ln -sf /etc/nginx/sites-available/netdata /etc/nginx/sites-enabled/

# Create custom monitoring script
cat > /usr/local/bin/audiotricks-monitor.sh << 'EOF'
#!/bin/bash

# Check application metrics
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health)
DB_STATUS=$(echo $HEALTH_CHECK | jq -r '.database')
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/api/health)

# Log metrics
echo "$(date): DB=$DB_STATUS, Response=${RESPONSE_TIME}s" >> /var/log/audiotricks/monitor.log

# Alert if issues
if [ "$DB_STATUS" != "connected" ]; then
    echo "Database disconnected" | mail -s "AudioTricks Alert: Database Issue" $EMAIL
fi

if (( $(echo "$RESPONSE_TIME > 5" | bc -l) )); then
    echo "Slow response time: ${RESPONSE_TIME}s" | mail -s "AudioTricks Alert: Performance Issue" $EMAIL
fi
EOF
chmod +x /usr/local/bin/audiotricks-monitor.sh

# Add to cron
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/audiotricks-monitor.sh") | crontab -

# Setup log rotation
cat > /etc/logrotate.d/audiotricks << EOF
/var/log/audiotricks/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 audiotricks audiotricks
    sharedscripts
    postrotate
        /bin/kill -USR1 \$(cat /home/audiotricks/.pm2/pids/audiotricks-*.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

# Restart services
systemctl restart monit
systemctl restart netdata
nginx -t && systemctl reload nginx

echo "Monitoring setup complete!"
echo "- Monit dashboard: http://localhost:2812 (local only)"
echo "- Netdata dashboard: https://netdata.$DOMAIN_NAME"
echo "- Alerts will be sent to: $EMAIL"