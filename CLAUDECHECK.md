# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🐕 CLAUDE.md Confirmation Protocol

When Claude is told to read CLAUDE.md, Claude will say "woof" to indicate that CLAUDE.md has been read before Claude starts.

## ⚠️ CRITICAL ARCHITECTURAL RULES - NEVER VIOLATE

### 🚫 ABSOLUTE PROHIBITION: NO HARDCODING ALLOWED

**RULE**: This codebase is 100% DATABASE-DRIVEN. Any attempt to hardcode routes, navigation, components, or business logic is STRICTLY FORBIDDEN.

**ENFORCEMENT**:
- ❌ **NEVER** create hardcoded routes in React Router
- ❌ **NEVER** create hardcoded navigation menus or sidebar items
- ❌ **NEVER** hardcode component mappings or imports
- ❌ **NEVER** hardcode business rules, permissions, or access controls
- ❌ **NEVER** create static configuration files for routes/navigation
- ❌ **NEVER** hardcode test credentials in test files or scripts

**REQUIRED APPROACH**:
- ✅ **ALL** routes MUST come from `routes` table
- ✅ **ALL** navigation MUST be loaded from database (zones/hubs structure or routes table)
- ✅ **ALL** components MUST be dynamically loaded via `import.meta.glob`
- ✅ **ALL** permissions MUST be stored in database tables
- ✅ **ALL** configuration MUST be database-driven
- ✅ **ALL** test credentials MUST come from `test_credentials` table

**VIOLATION CONSEQUENCES**: If you attempt to hardcode anything, you MUST immediately stop, remove the hardcoded elements, and implement the database-driven approach instead.

**MINIMAL BOOTSTRAP EXCEPTIONS**:
The following are the ONLY acceptable exceptions for essential system operation:
- Supabase client initialization (connection to database)
- Root component mounting (App.tsx, main.tsx)
- Essential error boundaries for database connection failures
- Import.meta.glob patterns for dynamic component loading

### 🔧 IMPLEMENTATION STANDARDS - NO EXCEPTIONS

**When implementing database-driven features:**
1. **NO WORKAROUNDS** - No feature flags, no conditional database loading, no "fallbacks"
2. **NO QUICKFIXES** - Do it right or don't do it at all  
3. **KEEP IT SIMPLE** - Database query → Component. That's it.

**MANDATORY APPROACH:**
- The app ONLY works with database data
- Database connection errors must show clear error messages
- Loading states must be informative
- Delete ALL existing hardcoded elements before implementing database version

### 🚫 NAVIGATION SYSTEM ANTI-PATTERNS - STRICTLY FORBIDDEN

**CRITICAL RULE**: There must be EXACTLY ONE navigation system. Multiple navigation implementations are ABSOLUTELY PROHIBITED.

**FORBIDDEN NAVIGATION PATTERNS**:
- ❌ **NEVER** create multiple navigation components (AdminSidebar + DatabaseNavBar + DynamicSidebar)
- ❌ **NEVER** use feature flags to switch between navigation systems
- ❌ **NEVER** create NavigationWrapper components with conditional logic
- ❌ **NEVER** fragment navigation data across multiple tables (`navigation_items` + `routes` + `zones`)
- ❌ **NEVER** implement separate permission systems per navigation component
- ❌ **NEVER** create fallback navigation systems or hardcoded navigation as "backup"

**REQUIRED NAVIGATION ARCHITECTURE**:
- ✅ **ONE** navigation table with hierarchical structure
- ✅ **ONE** navigation service that loads all data once
- ✅ **ONE** navigation component that renders the entire menu
- ✅ **ONE** permission system integrated with navigation service
- ✅ **ALL** navigation items MUST come from the same database source

**NAVIGATION TABLE STRUCTURE** (Single Source of Truth):
```sql
CREATE TABLE navigation (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES navigation(id),
  title TEXT NOT NULL,
  path TEXT,
  icon TEXT,
  order_index INTEGER,
  required_role TEXT,
  zone_id UUID REFERENCES zones(id),
  is_active BOOLEAN DEFAULT true
);
```

**VIOLATION CONSEQUENCES**: If you find multiple navigation systems, you MUST:
1. **STOP immediately** - Do not add to the complexity
2. **CONSOLIDATE** - Choose one approach and delete all others
3. **SIMPLIFY** - Implement the single-table, single-service approach above

### 🛡️ NAVIGATION SYSTEM ENFORCEMENT

**AUTOMATED ENFORCEMENT**: The codebase includes automatic prevention of multiple navigation systems:

1. **NavigationSystemEnforcer** (`/src/core/navigation/NavigationSystemEnforcer.ts`)
   - Prevents registration of multiple navigation components at runtime
   - Only allows `DatabaseNavigation` component
   - Throws errors if you try to create new navigation components

2. **NavigationRegistry** (`/src/core/navigation/NavigationRegistry.ts`)
   - Tracks all navigation components
   - Marks deprecated components that must be removed
   - Validates component usage at build time

3. **THE ONLY ALLOWED NAVIGATION COMPONENT**:
   ```typescript
   import { DatabaseNavigation } from '@/components/navigation/DatabaseNavigation';
   ```

**FORBIDDEN COMPONENT NAMES** (Will be blocked automatically):
- ❌ Sidebar, SideBar, AdminSidebar, UserSidebar
- ❌ NavBar, Navbar, NavigationBar, NavigationMenu  
- ❌ MainNav, PrimaryNav, SecondaryNav, MobileNav
- ❌ Any variation of the above

**IF YOU SEE NAVIGATION ERRORS**: 
1. You're trying to create a forbidden navigation component
2. Use `DatabaseNavigation` instead
3. All navigation data must come from the `navigation` table

### 🚫 ABSOLUTE PROHIBITION FOR CLAUDE

**CLAUDE: YOU ARE FORBIDDEN FROM:**
- ❌ Creating ANY new navigation components (SimpleNavigation, TempNavigation, etc.)
- ❌ Modifying existing navigation components unless explicitly asked
- ❌ Creating "temporary" or "fallback" navigation solutions
- ❌ Renaming or moving navigation components
- ❌ Adding "fixes" to navigation without user approval

**CLAUDE: IF NAVIGATION IS BROKEN:**
1. **STOP** - Do not create workarounds
2. **REPORT** - Tell user exactly what's broken and why
3. **SUGGEST** - Recommend database migration or specific fix
4. **WAIT** - Do not proceed without explicit user approval

**VIOLATION = IMMEDIATE STOP**: If you catch yourself about to create/modify navigation, STOP and ask user for permission first.

### 🛡️ AUTOMATED PREVENTION SYSTEM

**Prevention Rules**: The codebase includes automated prevention rules in `/src/core/prevention-rules.json` that enforce CLAUDE.md compliance:

1. **PreventionChecker** (`/src/core/prevention/PreventionChecker.ts`)
   - Validates code against prevention rules
   - Blocks navigation component creation
   - Prevents hardcoded routes and credentials
   - Enforces database-driven architecture

2. **Rules Include**:
   - `no-navigation-components`: Prevents creating new navigation components
   - `no-hardcoded-routes`: Blocks hardcoded paths
   - `no-navigation-workarounds`: Stops temporary navigation fixes
   - `no-multiple-navigation-systems`: Ensures single navigation system
   - `no-test-credentials-hardcoding`: Enforces database-driven test credentials
   - `require-rls-policies`: Warns about missing RLS on tables

**CLAUDE: Run PreventionChecker before modifying any files to ensure compliance**

## 🔐 Database Table Creation Standards (CRITICAL)

### MANDATORY: Schema-Component Alignment

**RULE**: When creating ANY new database table, you MUST ensure perfect alignment between:
1. Database table columns
2. TypeScript interfaces in components
3. Supabase types (if generated)

**REQUIRED PROCESS**:
1. **Define the interface FIRST** in the component
2. **Create the table to EXACTLY match** the interface
3. **Test CRUD operations** before considering complete
4. **Document any column mappings** if legacy columns exist

### MANDATORY: RLS Policies for EVERY Table

**RULE**: Every table MUST have Row Level Security (RLS) enabled and proper policies.

**MINIMUM REQUIRED POLICIES**:
```sql
-- 1. Enable RLS (NEVER SKIP THIS!)
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 2. Read Policy (at minimum for authenticated users)
CREATE POLICY "Authenticated users can view"
    ON your_table FOR SELECT
    TO authenticated
    USING (true);  -- Adjust based on your needs

-- 3. Admin Override Policy (for admin-only tables)
CREATE POLICY "Admins can do everything"
    ON your_table FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'super_admin')
        )
    );
```

## 🔧 Build Information System (MANDATORY)

### ABSOLUTE REQUIREMENT: Database-Driven Build Metadata

**RULE**: ALL build information MUST be stored in the `system_info` table. NO hardcoded version strings or build data.

**REQUIRED IMPLEMENTATION**:
1. **system_info table** stores all build metadata
2. **systemInfoService** provides database access
3. **useAppVersion hook** loads version info for components
4. **useSystemStatus hook** loads system health data
5. **Footer component** displays build info from database
6. **Build script** automatically updates build info during builds

**MANDATORY BUILD SCRIPT USAGE**:
```bash
# REQUIRED: Run before every build
npm run build:info

# AUTOMATIC: Build script runs during normal build
npm run build
```

**REQUIRED SYSTEM_INFO TABLE STRUCTURE**:
```sql
CREATE TABLE system_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REQUIRED BUILD INFO KEYS:
-- app_version: Application version from package.json
-- build_number: Unique build identifier
-- build_time: Build timestamp
-- build_branch: Git branch used for build
-- build_commit: Git commit hash
-- system_status: Overall system health
-- last_health_check: Last system health check
```

**FORBIDDEN BUILD PRACTICES**:
- ❌ **NEVER** hardcode version numbers in components
- ❌ **NEVER** use environment variables for build info
- ❌ **NEVER** create static build files or configs
- ❌ **NEVER** skip the build script during deployment
- ❌ **NEVER** rely on client-side build time generation

**CLAUDE: BUILD INFO ENFORCEMENT**:
- ✅ **ALWAYS** use `systemInfoService` for build data
- ✅ **ALWAYS** check `system_info` table for version info
- ✅ **ALWAYS** run build script when updating build info
- ❌ **NEVER** create hardcoded version displays

## Architecture Overview

### Core System: Zone → Hub → Dashboard → Module

- **Zones**: Top-level workspaces with complete isolation (Admin, User, Public)
- **Hubs**: Feature groups within zones (Dashboard Hub, Settings Hub)
- **Dashboards**: Customizable views with widget layouts
- **Modules**: Reusable, lazy-loaded components
- **Widgets**: Dashboard building blocks

### Database Schema

Key tables: `zones`, `hubs`, `modules`, `dashboards`, `zone_members`, `user_hub_access`, `hub_modules`, `dashboard_widgets`, `test_credentials`

### Authentication Flow

Login → Supabase Auth → User Profile → Zone Access → Default Hub → Dashboard/Module

### URL Structure

```
/login                                              # Public
/dashboard                                          # Protected, redirects to default zone
/zones/:zoneId                                     # Zone root
/zones/:zoneId/hubs/:hubId                        # Hub view
/zones/:zoneId/hubs/:hubId/modules/:moduleId      # Module view
/zones/:zoneId/hubs/:hubId/dashboards/:dashboardId # Dashboard view
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (Auth + Database + RLS)
- **State**: React Context + React Query
- **Routing**: React Router v7
- **Testing**: Jest + React Testing Library + Playwright

## Critical File Locations

### Core Business Logic
- `src/core/auth/` - Authentication system
- `src/core/services/` - API services (zoneService, hubService, moduleService)
- `src/core/types/` - TypeScript type definitions
- `src/core/hooks/` - Custom React hooks

### Database Types
- `src/core/types/database.types.ts` - Primary database schema types
- `src/core/supabase/database.types.ts` - Supabase-generated types

### Module System
- `src/modules/` - Feature module implementations
- `src/modules/registerModules.ts` - Module registration
- `src/components/modules/ModuleLoader.tsx` - Dynamic module loading

### Routing & Navigation
- `src/routes/AppRouter.tsx` - Main routing configuration
- `src/components/routing/` - Route guards and protection
- `src/components/navigation/` - Navigation components

## Development Patterns

### Database Operations
```typescript
// Check zone access
const { data } = await supabase
  .from('zone_members')
  .select('*')
  .eq('user_id', userId)
  .eq('zone_id', zoneId);

// Navigate using database-driven routes
const route = await navigationService.getRouteByName('hub_view');
navigate(route.path.replace(':zoneId', zoneId).replace(':hubId', defaultHubId));
```

### Test Credentials (DATABASE-DRIVEN ONLY)
```typescript
import { TestCredentialsService } from '@/core/services/testCredentials';

// Get admin credentials for current environment
const adminCreds = await TestCredentialsService.getAdminCredentials();

// Use in tests
await page.type('input[type="email"]', adminCreds.email);
await page.type('input[type="password"]', adminCreds.password);
```

### Module Loading
```typescript
// Modules are loaded dynamically based on database configuration
const moduleConfig = await supabase
  .from('modules')
  .select('*')
  .eq('name', moduleName)
  .single();

// Dynamic import using glob pattern
const modules = import.meta.glob('@/modules/**/[A-Z]*.tsx');
const Component = await modules[moduleConfig.component_path]();
```

## 🛡️ CRITICAL ROUTE REQUIREMENTS

### Database Route Configuration

**MANDATORY**: When adding ANY new route to the database, ALL of these fields MUST be populated:

```sql
-- CORRECT route configuration for regular routes
INSERT INTO routes (path, name, component_name, component_path, layout, is_public, is_active) 
VALUES (
  '/settings',                    -- path: The URL path
  'settings',                     -- name: Route identifier for navigation service
  'Settings',                     -- component_name: Name for dynamic imports
  './pages/Settings',             -- component_path: REQUIRED! Path for import.meta.glob
  'AuthenticatedLayout',          -- layout: Must match existing layout component
  false,                          -- is_public: false for protected routes
  true                            -- is_active: true to enable the route
);

-- CORRECT route configuration for ADMIN routes (requires metadata)
INSERT INTO routes (path, name, component_name, component_path, layout, is_public, is_active, metadata) 
VALUES (
  '/admin/theme-editor',          -- path: The URL path (starts with /admin/)
  'theme_editor',                 -- name: Route identifier for navigation service
  'ThemeEditor',                  -- component_name: Name for dynamic imports
  './pages/admin/ThemeEditor',    -- component_path: REQUIRED! Path for import.meta.glob
  'AuthenticatedLayout',          -- layout: Must match existing layout component
  false,                          -- is_public: false for protected routes
  true,                           -- is_active: true to enable the route
  '{"guard_type": "admin"}'       -- metadata: REQUIRED for /admin/* routes!
);
```

**CRITICAL FIELDS**:
- `component_path`: **NEVER NULL** - Required by AppRouter's dynamic component loader
- `layout`: Must reference an actual layout component (e.g., 'AuthenticatedLayout', not 'admin')
- `component_name`: Must match the actual component export name
- `metadata`: **REQUIRED for /admin/* routes** - Must include `{"guard_type": "admin"}`

## Security Considerations

- **Row Level Security (RLS)** - Database-level isolation enabled
- **Role Hierarchy**: ADMIN > PLATFORM_OWNER > MANAGER > EDITOR > USER > GUEST
- **Route Guards** - Protect pages based on user roles and zone access
- **JWT Authentication** - Supabase handles token management

## Supabase Access

**IMPORTANT: Use the correct project ID**
- Project ID: `plnbwqssogiydsljrrfg`
- Project Name: evolvepreneur-iq
- When using Supabase MCP functions, always use project_id: `plnbwqssogiydsljrrfg`

## Investigation Requirements

When investigating issues, follow these **ABSOLUTE NON-NEGOTIABLES**:

1. **Deep Analysis Required**
   - Examine the entire flow and all dependencies meticulously
   - Trace every function call, state change, and side effect
   - Map out the complete data flow from user action to final result

2. **Evidence-Based Approach**
   - No changes, no patches, no guesses
   - No forward progress until the exact failure point is identified with irrefutable evidence
   - Provide concrete logs, stack traces, or database query results

3. **Data Integrity**
   - Do not hard code data
   - Don't create fake data
   - All data must come from the database
   - Use actual Supabase queries for all operations

## 🔄 Project Awareness & Context

- **Always read `CLAUDE.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in this file.
- **Follow established import conventions** using `@/` aliases and proper grouping.

## 🧱 Code Structure & Modularity

- **Never create a file longer than 250 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility following the existing patterns in `src/modules/`.
- **Follow the established Zone → Hub → Dashboard → Module architecture**.

## 🧪 Testing & Reliability

- **Always create unit tests for new features** (components, hooks, services, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live alongside components** in the `src/` directory following existing patterns.
- Include at least: 1 test for expected use, 1 edge case, 1 failure case

**MANDATORY: All code changes MUST be tested in the browser before delivery.**

**RULE: When asked to run tests, ALWAYS use the Test Center infrastructure**

When the user asks you to run tests:
1. **Create or update test suites** in the `test_suites` table
2. **Create test cases** in the `test_cases` table linked to the suite
3. **Save all test results** to the `test_results` table with proper run tracking
4. **Use the Test Center UI** to execute and monitor tests when possible

## ✅ Task Completion

- **Document new tasks discovered during development** in comments or issues.
- **Run code quality checks** (`npm run lint`, `npm run format`, `npm run test:types`) after making changes.
- **Verify tests pass** before considering a task complete.

## 🔒 Security Review

- **Always perform a security review** after writing code: Check for sensitive information exposure, validate input handling, verify authentication/authorization, and scan for potential vulnerabilities.
- **Never expose sensitive data** in frontend code (API keys, secrets, internal URLs, user data).
- **Follow secure coding practices** including proper input validation, sanitization, and adherence to the principle of least privilege.
- **Verify RLS policies** are correctly implemented for database operations.

## 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified packages from package.json.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a specific task.

## 🚫 No Placeholders or Mockups

**NEVER create placeholder components, mockup data, or "coming soon" messages.** When implementing features:

- **Build real, functional components** even if minimal
- **Connect to actual data sources and services** (use Supabase, not mock data)
- **Implement proper error states** instead of placeholder text
- **If a feature cannot be fully implemented**, explain why and suggest alternatives
- **Always strive for production-ready code**, not demonstrations
- **Use actual database queries** with proper error handling
- **Implement real UI interactions**, not static displays