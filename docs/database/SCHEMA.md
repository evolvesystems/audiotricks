# AudioTricks Database Schema

## Overview

AudioTricks uses PostgreSQL as its primary database with Prisma ORM for type-safe database access. The schema is designed for scalability, security, and efficient querying.

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   users     │────<│   sessions   │     │  user_settings   │
│             │     └──────────────┘     │                  │
│             │────<──────────────────────│                  │
│             │                          └──────────────────┘
│             │     ┌──────────────────┐
│             │────<│  audio_history   │
└─────────────┘     └──────────────────┘

Legend: ────< = One to Many relationship
```

## Tables

### 1. users

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Display username |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last modification time |
| last_login_at | TIMESTAMP | NULL | Last successful login |
| is_active | BOOLEAN | DEFAULT true | Account active status |

**Indexes:**
- Primary: `id`
- Unique: `email`, `username`

### 2. sessions

Manages active user sessions for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | Session identifier |
| user_id | UUID | FOREIGN KEY, NOT NULL | Reference to users.id |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA256 hash of JWT |
| expires_at | TIMESTAMP | NOT NULL | Session expiration time |
| created_at | TIMESTAMP | DEFAULT NOW() | Session creation time |

**Indexes:**
- Primary: `id`
- Unique: `token_hash`
- Foreign Key: `user_id` → `users.id` (CASCADE DELETE)
- Index: `user_id`, `token_hash`

### 3. user_settings

Stores user preferences and encrypted API keys.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, FOREIGN KEY | Reference to users.id |
| openai_api_key_encrypted | TEXT | NULL | Encrypted OpenAI API key |
| elevenlabs_api_key_encrypted | TEXT | NULL | Encrypted ElevenLabs API key |
| preferred_language | VARCHAR(10) | DEFAULT 'en' | Language preference |
| summary_quality | VARCHAR(20) | DEFAULT 'balanced' | Summary generation quality |
| settings_json | JSONB | DEFAULT '{}' | Additional settings |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- Primary: `user_id`
- Foreign Key: `user_id` → `users.id` (CASCADE DELETE)

### 4. audio_history

Tracks audio processing history for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid() | History entry identifier |
| user_id | UUID | FOREIGN KEY, NOT NULL | Reference to users.id |
| title | VARCHAR(500) | NULL | Audio title/filename |
| audio_url | TEXT | NULL | Source audio URL |
| file_size_bytes | BIGINT | NULL | File size in bytes |
| duration_seconds | INTEGER | NULL | Audio duration |
| transcript | TEXT | NULL | Full transcription |
| summary | TEXT | NULL | Generated summary |
| key_moments | JSONB | NULL | Key moments data |
| processing_options | JSONB | NULL | Processing settings used |
| created_at | TIMESTAMP | DEFAULT NOW() | Processing time |

**Indexes:**
- Primary: `id`
- Foreign Key: `user_id` → `users.id` (CASCADE DELETE)
- Composite: `user_id, created_at DESC` (for efficient history queries)

## Data Types

### JSONB Fields

#### settings_json (user_settings)
```json
{
  "theme": "dark",
  "autoSave": true,
  "notifications": {
    "email": true,
    "browser": false
  },
  "audioDefaults": {
    "format": "mp3",
    "quality": "high"
  }
}
```

#### key_moments (audio_history)
```json
[
  {
    "timestamp": "00:01:23",
    "description": "Introduction begins",
    "confidence": 0.95
  },
  {
    "timestamp": "00:05:47",
    "description": "Main topic discussion",
    "confidence": 0.88
  }
]
```

#### processing_options (audio_history)
```json
{
  "language": "en",
  "model": "whisper-1",
  "summaryStyle": "detailed",
  "includeTimestamps": true,
  "speakerDiarization": false
}
```

## Constraints and Rules

### Foreign Key Constraints

All foreign keys use `ON DELETE CASCADE` to maintain referential integrity:
- Deleting a user removes all their sessions, settings, and history
- This ensures no orphaned records

### Data Validation

1. **Email Format**: Validated at application level before storage
2. **Username Rules**: Alphanumeric + underscore/hyphen only
3. **Password Requirements**: Minimum 8 chars, mixed case + numbers
4. **API Key Encryption**: AES-256-GCM before storage

### Default Values

- `is_active`: true (users can be soft-deleted)
- `preferred_language`: 'en'
- `summary_quality`: 'balanced'
- `settings_json`: {} (empty object)

## Migration Management

### Creating Migrations

```bash
# After schema changes
npx prisma migrate dev --name descriptive_name

# Example
npx prisma migrate dev --name add_user_preferences
```

### Production Migrations

```bash
# Apply pending migrations
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

### Rollback Strategy

1. Keep migration files in version control
2. Test migrations in staging environment
3. Create backward-compatible changes when possible
4. Have database backups before major migrations

## Performance Considerations

### Indexes

Optimized for common queries:
- User lookup by email/username (unique indexes)
- Session validation (token_hash index)
- History retrieval (composite user_id + created_at)

### Query Optimization

```sql
-- Efficient history query with pagination
SELECT * FROM audio_history 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20 OFFSET $2;
```

### Connection Pooling

Prisma automatically manages connection pooling:
- Default pool size: 10 connections
- Configurable via connection string parameters

## Security Measures

### Encryption

- **Password Storage**: bcrypt with 12 rounds
- **API Keys**: AES-256-GCM encryption
- **Session Tokens**: SHA256 hashed before storage

### Access Control

- Row-level security through application logic
- User can only access their own data
- Prepared statements prevent SQL injection

## Backup and Recovery

### Backup Strategy

```bash
# Daily backup example
pg_dump -h host -U user -d audiotricks > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -h host -U user -d audiotricks | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Point-in-Time Recovery

Enable WAL archiving for PITR:
```sql
-- In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

## Future Considerations

### Potential Enhancements

1. **Partitioning**: Partition audio_history by date for large datasets
2. **Read Replicas**: Scale read operations
3. **Caching Layer**: Redis for session storage
4. **Full-Text Search**: PostgreSQL FTS for transcript search
5. **Audit Log**: Track all data modifications