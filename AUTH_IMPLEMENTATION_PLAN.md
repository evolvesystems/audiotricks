# Auth Implementation Plan - Avoiding the Maze

## Overview

Step-by-step implementation plan to build auth correctly from the start, avoiding the endless fix cycles.

## 📋 Pre-Implementation Checklist

### Environment Setup
```bash
# Generate secure keys BEFORE starting
# API Keys (32 bytes hex)
openssl rand -hex 32  # Generate 3-5 of these

# JWT Secret (64 bytes for extra security)
openssl rand -hex 64

# Add to .env immediately
API_KEYS=["dev_key_abc123...","prod_key_def456..."]
JWT_SECRET_KEY=your_64_byte_hex_here
```

### Decisions Made Upfront
- ✅ **Auth Type**: API Key (required) + JWT (optional)
- ✅ **Header Names**: X-API-Key, Authorization (Bearer)
- ✅ **Token Format**: JWT with 7-day expiration
- ✅ **Error Codes**: 401 (no auth), 403 (bad auth)
- ✅ **User Roles**: admin, user, viewer (for future)

## 🚀 Implementation Steps

### Step 1: Core Auth Module

```python
# /app/core/auth/__init__.py
"""
Centralized auth module - all auth logic lives here
"""
from .config import auth_settings
from .dependencies import auth
from .jwt import create_access_token, decode_access_token
from .api_keys import validate_api_key

__all__ = [
    "auth_settings",
    "auth", 
    "create_access_token",
    "decode_access_token",
    "validate_api_key"
]
```

```python
# /app/core/auth/config.py
from pydantic import BaseSettings, Field
from typing import List
import json

class AuthSettings(BaseSettings):
    # API Key Configuration
    api_keys_json: str = Field(..., env="API_KEYS")
    api_key_header_name: str = "X-API-Key"
    
    # JWT Configuration  
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    
    # Feature Flags
    require_api_key: bool = True
    require_user_auth: bool = False
    
    @property
    def api_keys(self) -> List[str]:
        """Parse JSON API keys from env"""
        return json.loads(self.api_keys_json)
    
    class Config:
        env_file = ".env"
        case_sensitive = False

auth_settings = AuthSettings()
```

```python
# /app/core/auth/api_keys.py
from typing import Optional
import hashlib
import secrets

class APIKeyManager:
    """Manage API keys securely"""
    
    @staticmethod
    def generate_api_key(prefix: str = "gbl") -> str:
        """Generate a new API key with prefix"""
        random_bytes = secrets.token_urlsafe(32)
        return f"{prefix}_{random_bytes}"
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @staticmethod
    def validate_api_key(api_key: str, valid_keys: List[str]) -> bool:
        """Constant-time comparison of API keys"""
        for valid_key in valid_keys:
            if secrets.compare_digest(api_key, valid_key):
                return True
        return False
```

### Step 2: JWT Implementation (For Future User Auth)

```python
# /app/core/auth/jwt.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from jwt.exceptions import InvalidTokenError

from .config import auth_settings

class JWTManager:
    """Handle JWT operations cleanly"""
    
    @staticmethod
    def create_access_token(
        data: dict, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=auth_settings.jwt_expire_minutes
            )
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        return jwt.encode(
            to_encode,
            auth_settings.jwt_secret_key,
            algorithm=auth_settings.jwt_algorithm
        )
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                auth_settings.jwt_secret_key,
                algorithms=[auth_settings.jwt_algorithm]
            )
            
            # Additional validation
            if payload.get("type") != "access":
                return None
                
            return payload
            
        except InvalidTokenError:
            return None

jwt_manager = JWTManager()
```

### Step 3: Unified Dependencies

```python
# /app/core/auth/dependencies.py
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from .config import auth_settings
from .api_keys import APIKeyManager
from .jwt import jwt_manager
from ..database import get_db

# Security schemes
bearer_scheme = HTTPBearer(auto_error=False)

class AuthDependencies:
    """All auth dependencies in one place"""
    
    @staticmethod
    async def verify_api_key(
        x_api_key: str = Header(..., alias="X-API-Key", description="API Key for access")
    ) -> str:
        """Verify API key - always required"""
        if not auth_settings.require_api_key:
            return "bypass"  # For testing only
            
        if not APIKeyManager.validate_api_key(x_api_key, auth_settings.api_keys):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        
        return x_api_key
    
    @staticmethod
    async def get_current_user_optional(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
        api_key: str = Depends(verify_api_key),
        db: Session = Depends(get_db)
    ) -> Optional[Dict[str, Any]]:
        """Get current user if JWT provided (optional)"""
        if not credentials:
            return None
            
        token = credentials.credentials
        payload = jwt_manager.decode_access_token(token)
        
        if not payload:
            return None  # Invalid token, but optional so return None
            
        # TODO: Load user from database
        user_id = payload.get("sub")
        if user_id:
            # For now, return payload as user
            return {
                "id": user_id,
                "email": payload.get("email"),
                "role": payload.get("role", "user"),
                "api_key": api_key
            }
        
        return None
    
    @staticmethod  
    async def get_current_user_required(
        user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
    ) -> Dict[str, Any]:
        """Get current user - authentication required"""
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    
    @staticmethod
    async def require_admin(
        user: Dict[str, Any] = Depends(get_current_user_required)
    ) -> Dict[str, Any]:
        """Require admin role"""
        if user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return user

# Export single instance
auth = AuthDependencies()
```

### Step 4: Apply to Routes

```python
# /app/api/v1/__init__.py
from fastapi import APIRouter, Depends
from app.core.auth.dependencies import auth

# Create main v1 router with API key requirement
v1_router = APIRouter(
    prefix="/api/v1",
    dependencies=[Depends(auth.verify_api_key)]  # All v1 routes need API key
)

# Import sub-routers
from .endpoints import books, formats, platforms, admin

# Include sub-routers
v1_router.include_router(
    books.router,
    prefix="/books",
    tags=["books"]
)
v1_router.include_router(
    formats.router,
    prefix="/formats", 
    tags=["formats"]
)
v1_router.include_router(
    platforms.router,
    prefix="/platforms",
    tags=["platforms"]
)
v1_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(auth.require_admin)]  # Extra admin check
)
```

```python
# /app/api/v1/endpoints/books.py
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from sqlalchemy.orm import Session

from app.core.auth.dependencies import auth
from app.core.database import get_db
from app.services.book_service import BookService
from app.schemas.book import BookResponse, BookCreate

router = APIRouter()

# Public endpoint (API key only)
@router.get("/lookup/{identifier}", response_model=BookResponse)
async def universal_book_lookup(
    identifier: str,
    include_unavailable: bool = Query(False),
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(auth.get_current_user_optional)
):
    """
    Universal book lookup - available to anyone with API key
    Optionally tracks who's looking if user auth provided
    """
    # Log if user provided
    if user:
        logger.info(f"User {user['id']} looked up {identifier}")
    
    book = await BookService.universal_lookup(identifier, db, include_unavailable)
    if not book:
        raise HTTPException(404, f"Book not found: {identifier}")
    
    return book

# Protected endpoint (user required)
@router.post("/", response_model=BookResponse)
async def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_required)
):
    """Create a new book - requires user authentication"""
    return await BookService.create_book(book_data, user["id"], db)

# Admin endpoint
@router.delete("/{book_id}")
async def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.require_admin)
):
    """Delete a book - requires admin role"""
    return await BookService.delete_book(book_id, db)
```

### Step 5: Testing Utilities

```python
# /tests/utils/auth.py
from app.core.auth.jwt import jwt_manager
from app.core.auth.config import auth_settings

class AuthTestUtils:
    """Auth utilities for testing"""
    
    @staticmethod
    def get_test_api_key() -> str:
        """Get first API key for testing"""
        return auth_settings.api_keys[0]
    
    @staticmethod
    def get_test_headers(include_user: bool = False, role: str = "user") -> dict:
        """Get headers for test requests"""
        headers = {
            "X-API-Key": AuthTestUtils.get_test_api_key()
        }
        
        if include_user:
            token = jwt_manager.create_access_token({
                "sub": "test-user-123",
                "email": "test@example.com",
                "role": role
            })
            headers["Authorization"] = f"Bearer {token}"
            
        return headers
```

```python
# /tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_no_api_key():
    """Test request without API key"""
    response = client.get("/api/v1/books/lookup/123")
    assert response.status_code == 422  # Missing required header

def test_invalid_api_key():
    """Test request with invalid API key"""
    response = client.get(
        "/api/v1/books/lookup/123",
        headers={"X-API-Key": "invalid_key"}
    )
    assert response.status_code == 403

def test_valid_api_key():
    """Test request with valid API key"""
    headers = AuthTestUtils.get_test_headers()
    response = client.get(
        "/api/v1/books/lookup/123",
        headers=headers
    )
    # Should work (or 404 if book not found)
    assert response.status_code in [200, 404]

def test_optional_user_auth():
    """Test endpoint with optional user auth"""
    # Without user token
    headers = AuthTestUtils.get_test_headers(include_user=False)
    response = client.get("/api/v1/books/lookup/123", headers=headers)
    assert response.status_code in [200, 404]
    
    # With user token
    headers = AuthTestUtils.get_test_headers(include_user=True)
    response = client.get("/api/v1/books/lookup/123", headers=headers)
    assert response.status_code in [200, 404]

def test_required_user_auth():
    """Test endpoint requiring user auth"""
    # Without user token
    headers = AuthTestUtils.get_test_headers(include_user=False)
    response = client.post("/api/v1/books/", json={}, headers=headers)
    assert response.status_code == 401
    
    # With user token
    headers = AuthTestUtils.get_test_headers(include_user=True)
    response = client.post("/api/v1/books/", json={}, headers=headers)
    # Should work (or validation error)
    assert response.status_code in [200, 422]
```

## 📝 Documentation

### API Key Management

```markdown
# API Key Management

## Generating API Keys

```bash
# Generate a new API key
python -m app.core.auth.cli generate-api-key --name "Web App"

# Output:
# API Key: gbl_Lh3Kj9mN2pQ5rS7tV1wX3yZ5bD7fG9h
# Add this to your .env file in the API_KEYS array
```

## Using API Keys

All requests must include the API key in the header:

```bash
curl -H "X-API-Key: your_api_key_here" \
     https://api.globalbooks.com/api/v1/books/lookup/9780123456789
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for different environments
3. **Rotate keys** periodically
4. **Monitor usage** per API key
5. **Rate limit** by API key
```

## 🎯 Result: Clean Auth from Day One

With this implementation:

1. **No maze** - Everything is in `/app/core/auth/`
2. **No confusion** - Clear patterns for every auth scenario
3. **No tech debt** - Proper structure from the start
4. **Easy testing** - Utility functions ready
5. **Future ready** - JWT infrastructure in place

**Time saved**: Hours of refactoring and debugging auth issues later!