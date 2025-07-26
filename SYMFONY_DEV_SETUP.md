# Symfony Development Environment Setup Guide

This guide will help you set up your PC for developing AudioTricks with Symfony 7.3.

## Table of Contents
- [System Requirements](#system-requirements)
- [Core Development Tools](#core-development-tools)
- [PHP 8.3 Installation](#php-83-installation)
- [Database Setup](#database-setup)
- [Development Environment Options](#development-environment-options)
- [IDE Setup](#ide-setup)
- [Quick Start Commands](#quick-start-commands)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 11+, or Ubuntu 20.04+
- **RAM**: 8GB (16GB recommended)
- **Storage**: 20GB free space
- **CPU**: Dual-core processor (Quad-core recommended)

### Network Requirements
- Stable internet connection for package downloads
- Ports 3000, 5432, 6379 available for local development

## Core Development Tools

### 1. PHP 8.3 Installation

#### Windows
```powershell
# Using Chocolatey (recommended)
choco install php --version=8.3.0

# Or download from windows.php.net
# https://windows.php.net/download/
# Choose "Non Thread Safe" x64 version
```

#### macOS
```bash
# Using Homebrew
brew install php@8.3
brew link php@8.3

# Add to PATH in ~/.zshrc or ~/.bash_profile
export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"
```

#### Ubuntu/Debian
```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php
sudo apt update

# Install PHP 8.3 and required extensions
sudo apt install php8.3 php8.3-cli php8.3-fpm php8.3-mysql php8.3-pgsql \
  php8.3-sqlite3 php8.3-xml php8.3-curl php8.3-gd php8.3-mbstring \
  php8.3-intl php8.3-bcmath php8.3-opcache php8.3-zip php8.3-redis \
  php8.3-apcu php8.3-imagick php8.3-dev
```

### 2. Composer Installation

#### All Platforms
```bash
# Download installer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# Install globally
php composer-setup.php --install-dir=/usr/local/bin --filename=composer

# Verify installation
composer --version
# Should show: Composer version 2.7.x
```

### 3. Symfony CLI

#### Windows
```powershell
# Download from https://github.com/symfony/cli/releases
# Add to PATH

# Or using Scoop
scoop install symfony-cli
```

#### macOS
```bash
# Using Homebrew
brew install symfony-cli/tap/symfony-cli

# Verify installation
symfony version
```

#### Linux
```bash
# Download and install
curl -1sLf 'https://dl.cloudsmith.io/public/symfony/stable/setup.deb.sh' | sudo -E bash
sudo apt install symfony-cli

# Or download binary
wget https://get.symfony.com/cli/installer -O - | bash
sudo mv ~/.symfony*/bin/symfony /usr/local/bin/symfony
```

### 4. Node.js & npm (for frontend assets)

#### Using Node Version Manager (recommended)
```bash
# Install nvm
# Windows: https://github.com/coreybutler/nvm-windows
# macOS/Linux: https://github.com/nvm-sh/nvm

# Install Node.js 20 LTS
nvm install 20
nvm use 20

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 5. Git

#### Windows
```powershell
# Download from https://git-scm.com/download/win
# Or using Chocolatey
choco install git
```

#### macOS
```bash
# Comes with Xcode Command Line Tools
xcode-select --install

# Or using Homebrew
brew install git
```

#### Linux
```bash
sudo apt install git
```

## Database Setup

### PostgreSQL 15

#### Windows
```powershell
# Download installer from https://www.postgresql.org/download/windows/
# Or using Chocolatey
choco install postgresql15
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create default database
createdb
```

#### Linux
```bash
# Install PostgreSQL
sudo apt install postgresql-15 postgresql-client-15

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user
sudo -u postgres createuser --interactive
```

### Redis (for caching and queues)

#### Windows
```powershell
# Using WSL2 (recommended)
wsl --install
# Then follow Linux instructions

# Or use Memurai (Windows Redis port)
# Download from https://www.memurai.com/
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

## Development Environment Options

### Option 1: Docker Setup (Recommended)

#### Install Docker Desktop
- **Windows/Mac**: https://www.docker.com/products/docker-desktop/
- **Linux**: Follow official Docker CE installation

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  php:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    volumes:
      - .:/var/www/html
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://audiotricks:password@postgres:5432/audiotricks
      REDIS_URL: redis://redis:6379

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: audiotricks
      POSTGRES_USER: audiotricks
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mailcatcher:
    image: schickling/mailcatcher
    ports:
      - "1080:1080"
      - "1025:1025"

volumes:
  postgres_data:
```

### Option 2: DDEV (Easier Docker alternative)

```bash
# Install DDEV
# https://ddev.readthedocs.io/en/stable/users/install/

# Create project
mkdir audiotricks-symfony
cd audiotricks-symfony
ddev config --project-type=symfony --php-version=8.3
ddev start

# Add Redis
ddev get ddev/ddev-redis
```

### Option 3: Native Installation (Fastest)

Use Symfony CLI's built-in server:
```bash
# Start all services
symfony server:start

# Check requirements
symfony check:requirements
```

## IDE Setup

### 1. Visual Studio Code (Free)

#### Install VS Code
- Download from https://code.visualstudio.com/

#### Essential Extensions
```bash
# Install via command palette (Ctrl+P)
ext install bmewburn.vscode-intelephense-client
ext install whatwedo.twig
ext install neilbrayfield.php-docblocker
ext install felixfbecker.php-debug
ext install bradlc.vscode-tailwindcss
ext install dbaeumer.vscode-eslint
ext install esbenp.prettier-vscode
ext install eamodio.gitlens
ext install ms-azuretools.vscode-docker
```

#### VS Code Settings
```json
{
  "php.suggest.basic": false,
  "php.validate.enable": true,
  "php.validate.executablePath": "/usr/local/bin/php",
  "intelephense.environment.phpVersion": "8.3.0",
  "intelephense.files.maxSize": 5000000,
  "editor.formatOnSave": true,
  "[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
  },
  "[twig]": {
    "editor.defaultFormatter": "whatwedo.twig"
  }
}
```

### 2. PhpStorm (Professional)

#### Install PhpStorm
- Download from https://www.jetbrains.com/phpstorm/
- 30-day free trial, then paid license

#### Configure for Symfony
1. Open Settings (Ctrl+Alt+S)
2. **PHP**:
   - Set PHP 8.3 interpreter
   - Enable Symfony plugin
3. **Composer**:
   - Set composer.json path
4. **Database**:
   - Configure PostgreSQL connection
5. **Symfony**:
   - Enable Symfony support
   - Set web directory to `public/`

### 3. Sublime Text (Lightweight)

```bash
# Install Package Control
# Then install packages:
- PHP Companion
- Twig
- DocBlockr
- SublimeLinter-php
- Tailwind CSS Autocomplete
```

## Quick Start Commands

### 1. Create New Symfony Project
```bash
# Create project with webapp (includes Twig, forms, etc.)
symfony new audiotricks-symfony --version="7.3.*" --webapp

# Or using Composer
composer create-project symfony/skeleton:"7.3.*" audiotricks-symfony
cd audiotricks-symfony
composer require webapp
```

### 2. Install Required Bundles
```bash
# Core bundles
composer require symfony/orm-pack
composer require symfony/security-bundle
composer require symfony/messenger
composer require symfony/webpack-encore-bundle
composer require symfony/ux-turbo
composer require symfony/ux-live-component
composer require symfony/stimulus-bundle

# Additional bundles
composer require lexik/jwt-authentication-bundle
composer require oneup/uploader-bundle
composer require symfony/mercure-bundle
composer require nelmio/cors-bundle

# Dev tools
composer require --dev symfony/maker-bundle
composer require --dev symfony/profiler-pack
composer require --dev phpstan/phpstan
composer require --dev friendsofphp/php-cs-fixer
```

### 3. Setup Database
```bash
# Create .env.local
echo "DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/audiotricks?serverVersion=15&charset=utf8" > .env.local

# Create database
php bin/console doctrine:database:create

# Run migrations
php bin/console doctrine:migrations:migrate
```

### 4. Install Frontend Dependencies
```bash
# Install npm packages
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npm install -D @hotwired/stimulus @hotwired/turbo

# Initialize Tailwind
npx tailwindcss init -p

# Build assets
npm run dev
```

### 5. Start Development Server
```bash
# Start Symfony server with HTTPS
symfony server:start --allow-http

# In another terminal, watch assets
npm run watch

# Access at https://localhost:8000
```

## Development Workflow

### Daily Development Commands
```bash
# Start all services
symfony server:start
npm run watch

# Create new controller
php bin/console make:controller AudioController

# Create new entity
php bin/console make:entity AudioFile

# Generate migration
php bin/console make:migration
php bin/console doctrine:migrations:migrate

# Clear cache
php bin/console cache:clear

# Run tests
php bin/phpunit

# Check code style
vendor/bin/php-cs-fixer fix --dry-run

# Run static analysis
vendor/bin/phpstan analyse
```

### Debugging Tools

#### Symfony Profiler
- Automatically available in dev mode
- Access via toolbar at bottom of pages
- View detailed request information

#### Xdebug Setup
```bash
# Install Xdebug
pecl install xdebug

# Configure in php.ini
xdebug.mode=debug
xdebug.client_host=localhost
xdebug.client_port=9003
```

#### Browser Extensions
- **Symfony Profiler Toolbar**: Chrome/Firefox extension
- **Vue.js devtools**: For debugging Stimulus components

## Troubleshooting

### Common Issues

#### PHP Extensions Missing
```bash
# Check loaded extensions
php -m

# Install missing extensions (example for Ubuntu)
sudo apt install php8.3-intl php8.3-xml php8.3-mbstring
```

#### Permission Issues
```bash
# Fix var/ directory permissions
sudo chmod -R 777 var/

# Better approach
sudo chown -R www-data:www-data var/
sudo chmod -R 755 var/
```

#### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql
```

#### Composer Memory Limit
```bash
# Increase memory limit
php -d memory_limit=-1 /usr/local/bin/composer install

# Or set in php.ini
memory_limit = 2G
```

### Performance Optimization

#### Enable OPcache
```ini
# In php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```

#### Symfony Performance
```bash
# Compile container
php bin/console cache:warmup --env=prod

# Optimize Composer autoloader
composer dump-autoload --optimize
```

## Next Steps

1. **Clone the AudioTricks repository**
   ```bash
   git clone [your-repo-url] audiotricks-symfony
   cd audiotricks-symfony
   ```

2. **Copy specifications**
   - Copy `AUDIOTRICKS_COMPLETE_SPEC.md`
   - Copy `SYMFONY_MIGRATION_GUIDE.md`
   - Use as reference during development

3. **Start with authentication**
   ```bash
   php bin/console make:user
   php bin/console make:auth
   ```

4. **Create first entity**
   ```bash
   php bin/console make:entity AudioFile
   ```

5. **Build first page**
   ```bash
   php bin/console make:controller DashboardController
   ```

## Resources

### Official Documentation
- **Symfony**: https://symfony.com/doc/7.3/
- **Twig**: https://twig.symfony.com/
- **Doctrine**: https://www.doctrine-project.org/
- **Stimulus**: https://stimulus.hotwired.dev/
- **Turbo**: https://turbo.hotwired.dev/

### Learning Resources
- **SymfonyCasts**: https://symfonycasts.com/
- **Symfony Best Practices**: https://symfony.com/doc/current/best_practices.html
- **Modern PHP**: https://phptherightway.com/

### Community
- **Symfony Slack**: https://symfony.com/slack
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/symfony
- **Reddit**: https://www.reddit.com/r/symfony/

---

## Quick Reference Card

```bash
# Most used commands
symfony server:start        # Start dev server
npm run watch              # Watch assets
php bin/console            # List all commands
php bin/console make:      # List makers
php bin/console debug:     # Debug tools
php bin/console cache:clear # Clear cache
composer install           # Install PHP deps
npm install               # Install JS deps
```

**Ready to start developing!** 🚀

With this setup, you'll have a complete Symfony 7.3 development environment ready for building AudioTricks.