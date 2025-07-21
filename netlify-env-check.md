# Netlify Environment Variables Required

## Essential Environment Variables for Production

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Authentication
```
JWT_SECRET=your-secure-jwt-secret-key-here
```

### Application URLs
```
FRONTEND_URL=https://audiotricks.evolvepreneuriq.com
```

## Debugging Steps

1. **Check Health Endpoint**: 
   - Visit: `https://audiotricks.evolvepreneuriq.com/api/auth/health`
   - Should show environment status

2. **Check Netlify Environment Variables**:
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Ensure all required variables are set

3. **Check Function Logs**:
   - Go to Netlify Dashboard > Functions > View Logs
   - Look for error details in the console logs

## Common Issues

### Database Connection
- ❌ `DATABASE_URL` not set or incorrect
- ❌ Database not accessible from Netlify servers
- ❌ SSL configuration issues

### JWT Secret
- ❌ `JWT_SECRET` not set (uses fallback 'dev-secret-key')
- ❌ Token verification fails

### Dependencies
- ❌ Prisma client not generated properly
- ❌ bcrypt compilation issues in serverless environment

## Fix Actions

1. Set environment variables in Netlify Dashboard
2. Ensure DATABASE_URL has `?sslmode=require` for production
3. Use a secure random JWT_SECRET (32+ characters)
4. Check Prisma schema compatibility with serverless functions