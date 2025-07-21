# Authentication API Documentation

## Overview

AudioTricks uses JWT (JSON Web Token) based authentication for secure user sessions. All authenticated endpoints require a valid JWT token.

## Base URL

```
http://localhost:3000/api/auth
```

## Authentication Endpoints

### 1. User Registration

Creates a new user account.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- Email: Valid email format, normalized
- Username: 3-30 characters, alphanumeric + underscore/hyphen
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Email or username already exists

### 2. User Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account deactivated

### 3. User Logout

Invalidates the current session.

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

### 4. Get Current User

Returns the authenticated user's information.

**Endpoint:** `GET /me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastLoginAt": "2024-01-15T14:20:00.000Z",
    "settings": {
      "preferredLanguage": "en",
      "summaryQuality": "balanced",
      "settingsJson": {}
    }
  }
}
```

## Authentication Headers

For all protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Management

### Token Structure

JWT tokens contain:
- `userId`: User's unique identifier
- `sessionId`: Session identifier for revocation
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

### Token Expiration

- Access tokens expire after 7 days by default
- Expired tokens return `401 Unauthorized`
- Sessions can be revoked server-side

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "errors": [
    {
      "type": "field",
      "value": "short",
      "msg": "Password must be at least 8 characters",
      "path": "password",
      "location": "body"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "error": "Account is deactivated"
}
```

**409 Conflict**
```json
{
  "error": "Email already registered"
}
```

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Storage**: Store tokens securely (httpOnly cookies recommended)
3. **Token Rotation**: Implement refresh token mechanism for long sessions
4. **Password Requirements**: Enforce strong password policies
5. **Account Lockout**: Implement after multiple failed attempts

## Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Get current user:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Logout:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Integration Examples

### JavaScript/TypeScript

```typescript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();

// Store token securely
localStorage.setItem('authToken', token);

// Use token for authenticated requests
const userResponse = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### React Hook Example

```typescript
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('authToken'))
      .finally(() => setLoading(false));
    }
  }, []);

  return { user, loading };
}
```