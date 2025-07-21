# AudioTricks Documentation

Welcome to the AudioTricks documentation. This directory contains comprehensive guides for setting up, developing, and maintaining the AudioTricks platform.

## Quick Links

### Backend Documentation
- [Database Setup Guide](./backend/DATABASE_SETUP.md) - Step-by-step PostgreSQL setup
- [Architecture Overview](./backend/ARCHITECTURE.md) - Backend design and structure

### API Documentation
- [Authentication API](./api/AUTHENTICATION.md) - User registration and login endpoints

### Database Documentation
- [Database Schema](./database/SCHEMA.md) - Complete schema reference

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

### Quick Setup

1. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run migrate
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Documentation Structure

```
docs/
├── README.md              # This file
├── backend/               # Backend-specific documentation
│   ├── DATABASE_SETUP.md  # Database configuration guide
│   └── ARCHITECTURE.md    # Backend architecture overview
├── api/                   # API documentation
│   └── AUTHENTICATION.md  # Auth endpoints reference
└── database/              # Database documentation
    └── SCHEMA.md          # Database schema details
```

## Key Features

### Security
- JWT-based authentication
- Encrypted API key storage
- Rate limiting and CORS protection
- Input validation on all endpoints

### Architecture
- RESTful API design
- PostgreSQL with Prisma ORM
- TypeScript for type safety
- Modular code organization

### Database
- User management system
- Session tracking
- Encrypted settings storage
- Audio processing history

## Common Tasks

### Adding a New API Endpoint

1. Create controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Update API documentation
4. Write tests

### Modifying Database Schema

1. Update `backend/prisma/schema.prisma`
2. Create migration: `npm run migrate`
3. Update schema documentation
4. Test migration in development

### Implementing Frontend Authentication

1. Create auth context/hooks
2. Add login/register components
3. Implement protected routes
4. Handle token storage

## Troubleshooting

### Database Connection Issues
See [Database Setup Guide](./backend/DATABASE_SETUP.md#troubleshooting)

### Authentication Problems
Check [Authentication API](./api/AUTHENTICATION.md#error-handling)

### Development Issues
- Ensure all dependencies are installed
- Check environment variables
- Verify database is running
- Review logs for errors

## Contributing

When adding new features:
1. Update relevant documentation
2. Follow existing code patterns
3. Write comprehensive tests
4. Update schema if needed

## Support

For issues or questions:
1. Check existing documentation
2. Review troubleshooting guides
3. Check backend logs
4. Verify configuration

---

Last updated: January 2024