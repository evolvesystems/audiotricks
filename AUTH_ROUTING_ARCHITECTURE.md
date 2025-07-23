# Auth & Routing Architecture - No More Mazes!

## Overview

This document defines a **clear, simple, maintainable** auth and routing structure for GlobalBooks to avoid the endless fixing cycles. We'll make decisions ONCE and stick to them.

## 🎯 Core Principles

1. **Make decisions now** - No "we'll figure it out later"
2. **One way to do things** - No multiple auth patterns
3. **Explicit over magic** - Clear flow, no hidden middleware
4. **Fail fast** - Auth errors should be obvious
5. **Document everything** - Future you will thank current you

## 🔐 Authentication Architecture

### Decision: API Key + Optional JWT

For an in-house tool, we need security without complexity:

```python
# Two-tier auth system:
# 1. API Key (mandatory) - Identifies the client application
# 2. JWT (optional) - Identifies specific users if needed later
```

### Auth Flow

```mermaid
graph LR
    A[Client Request] --> B{Has API Key?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid API Key?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F{Has JWT?}
    F -->|No| G[Proceed as Anonymous]
    F -->|Yes| H{Valid JWT?}
    H -->|No| I[401 Invalid Token]
    H -->|Yes| J[Proceed as User]
```

### Implementation Structure

```python
# /app/core/auth/config.py
from pydantic import BaseSettings

class AuthConfig(BaseSettings):
    # API Key Settings
    API_KEYS: List[str] = []  # List of valid API keys
    API_KEY_HEADER: str = "X-API-Key"
    
    # JWT Settings (for future user auth)
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Auth Modes
    REQUIRE_API_KEY: bool = True
    REQUIRE_USER_AUTH: bool = False  # Can enable later
    
    class Config:
        env_file = ".env"
```

```python
# /app/core/auth/dependencies.py
from fastapi import Depends, HTTPException, Header
from typing import Optional

class AuthDependencies:
    """All auth dependencies in one place - no maze!"""
    
    @staticmethod
    async def verify_api_key(
        x_api_key: str = Header(..., alias="X-API-Key")
    ) -> str:
        """Always required for API access"""
        if x_api_key not in settings.API_KEYS:
            raise HTTPException(
                status_code=403,
                detail="Invalid API key"
            )
        return x_api_key
    
    @staticmethod
    async def get_current_user_optional(
        authorization: Optional[str] = Header(None),
        api_key: str = Depends(verify_api_key)  # API key always required
    ) -> Optional[dict]:
        """Optional user auth on top of API key"""
        if not authorization:
            return None
            
        try:
            # JWT decode logic here
            return {"id": "user-123", "role": "admin"}
        except:
            return None
    
    @staticmethod
    async def get_current_user_required(
        user: Optional[dict] = Depends(get_current_user_optional)
    ) -> dict:
        """Use this when user auth is mandatory"""
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User authentication required"
            )
        return user

# Single source of auth truth
auth = AuthDependencies()
```

## 🛣️ Routing Architecture

### Decision: Versioned, Resource-Based Routes

Clear hierarchy, no ambiguity:

```
/api/v1/
├── /books/
│   ├── /lookup/{identifier}      # Universal lookup
│   ├── /search                   # Search with filters
│   └── /{book_id}               # Get specific book
├── /formats/
│   ├── /isbn/{isbn}            # Format by ISBN
│   ├── /asin/{asin}            # Format by ASIN  
│   └── /{format_id}/platforms   # Platforms for format
├── /platforms/
│   ├── /                        # List all platforms
│   └── /{platform}/products     # Products on platform
└── /admin/
    ├── /import                  # Import operations
    └── /migrate                 # Migration tools
```

### Router Organization

```python
# /app/api/v1/__init__.py
from fastapi import APIRouter, Depends
from app.core.auth.dependencies import auth

# Base router with API key requirement
api_router = APIRouter(
    prefix="/api/v1",
    dependencies=[Depends(auth.verify_api_key)]  # ALL routes need API key
)

# Include sub-routers
from .books import router as books_router
from .formats import router as formats_router
from .platforms import router as platforms_router
from .admin import router as admin_router

api_router.include_router(books_router, prefix="/books", tags=["books"])
api_router.include_router(formats_router, prefix="/formats", tags=["formats"])
api_router.include_router(platforms_router, prefix="/platforms", tags=["platforms"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
```

```python
# /app/api/v1/books.py
from fastapi import APIRouter, Depends, Query
from app.core.auth.dependencies import auth

router = APIRouter()

# Public endpoints (only need API key)
@router.get("/lookup/{identifier}")
async def universal_lookup(
    identifier: str,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(auth.get_current_user_optional)
):
    """Anyone with API key can lookup books"""
    # Log who's looking if user provided
    if user:
        logger.info(f"User {user['id']} looked up {identifier}")
    
    # Your multi-platform logic here
    return await book_service.universal_lookup(identifier, db)

# Protected endpoints (need user auth)
@router.post("/")
async def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_required)  # Must be logged in
):
    """Only authenticated users can create books"""
    return await book_service.create_book(book_data, user['id'], db)
```

## 🏗️ Directory Structure

Keep auth and routing organized:

```
/app/
├── /core/
│   ├── /auth/
│   │   ├── __init__.py
│   │   ├── config.py          # All auth settings
│   │   ├── dependencies.py    # All auth dependencies  
│   │   ├── jwt.py            # JWT utilities
│   │   └── api_keys.py       # API key management
│   ├── /database.py          # DB connection
│   └── /config.py            # General settings
├── /api/
│   ├── /v1/
│   │   ├── __init__.py       # Main v1 router
│   │   ├── books.py          # Book endpoints
│   │   ├── formats.py        # Format endpoints
│   │   ├── platforms.py      # Platform endpoints
│   │   └── admin.py          # Admin endpoints
│   └── /v2/                  # Future version
├── /models/                  # SQLAlchemy models
├── /schemas/                 # Pydantic schemas  
├── /services/                # Business logic
└── main.py                   # App entry point
```

## 🚀 Implementation Checklist

### Phase 1: Auth Foundation (Day 1)
- [ ] Create `/app/core/auth/` directory structure
- [ ] Implement `AuthConfig` with environment variables
- [ ] Create `AuthDependencies` class with all auth methods
- [ ] Set up API key validation
- [ ] Create basic JWT utilities (for later)

### Phase 2: Routing Structure (Day 2)
- [ ] Create `/app/api/v1/` directory structure
- [ ] Set up main API router with auth dependency
- [ ] Create sub-routers for each resource
- [ ] Implement health check endpoint (no auth)
- [ ] Add OpenAPI documentation

### Phase 3: Testing & Documentation (Day 3)
- [ ] Create auth testing utilities
- [ ] Write tests for all auth scenarios
- [ ] Document API key generation process
- [ ] Create example .env file
- [ ] Add auth flow to README

## 🎯 Common Patterns (No More Maze!)

### Pattern 1: Public Endpoint (API Key Only)
```python
@router.get("/public-data")
async def get_public_data(
    db: Session = Depends(get_db)
    # API key already checked by router dependency
):
    return {"data": "public"}
```

### Pattern 2: Optional User Context
```python
@router.get("/books/search")
async def search_books(
    q: str,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(auth.get_current_user_optional)
):
    # Use user context if available
    if user:
        # Log user search, apply user preferences, etc.
        pass
    return results
```

### Pattern 3: Required User Auth
```python
@router.post("/books/{book_id}/favorite")
async def favorite_book(
    book_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_required)
):
    # User is guaranteed to exist here
    return await add_favorite(user['id'], book_id, db)
```

### Pattern 4: Admin Only
```python
@router.delete("/books/{book_id}")
async def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_required)
):
    if user['role'] != 'admin':
        raise HTTPException(403, "Admin access required")
    return await delete_book(book_id, db)
```

## 🔧 Environment Configuration

```bash
# .env
# API Keys (generate with: openssl rand -hex 32)
API_KEYS=["key1_for_web_app","key2_for_mobile","key3_for_internal_tools"]

# JWT Settings (for future user auth)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080

# Auth Modes
REQUIRE_API_KEY=true
REQUIRE_USER_AUTH=false  # Enable when ready

# Database
DATABASE_URL=postgresql://user:pass@localhost/globalbooks
```

## 🚨 Anti-Patterns to Avoid

### ❌ Don't: Multiple Auth Patterns
```python
# BAD: Different auth for different endpoints
@router.get("/books")  # No auth
@router.get("/authors", dependencies=[Depends(some_auth)])  # Custom auth
@router.get("/publishers")  # Different auth
```

### ✅ Do: Consistent Auth
```python
# GOOD: All routes under v1 require API key
api_router = APIRouter(
    prefix="/api/v1",
    dependencies=[Depends(auth.verify_api_key)]
)
```

### ❌ Don't: Auth Logic in Routes
```python
# BAD: Auth logic mixed with business logic
@router.get("/books")
async def get_books(authorization: str = Header(None)):
    if authorization:
        # 50 lines of JWT decode logic
        pass
    # Actual endpoint logic buried here
```

### ✅ Do: Separate Auth Dependencies
```python
# GOOD: Clean separation
@router.get("/books")
async def get_books(
    user: Optional[dict] = Depends(auth.get_current_user_optional)
):
    # Just business logic here
```

## 🎉 Result: No More Auth Maze!

With this structure:
1. **Auth is centralized** - One place to fix issues
2. **Routes are predictable** - Clear hierarchy
3. **Patterns are consistent** - Copy-paste friendly
4. **Testing is simple** - Mock one dependency
5. **Future changes are easy** - Just flip `REQUIRE_USER_AUTH=true`

This foundation will save you hours of auth/routing debugging!