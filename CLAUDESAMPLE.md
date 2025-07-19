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

**RULE**: The navigation system MUST follow a single, unified, database-driven architecture. ANY deviation from this pattern is STRICTLY PROHIBITED.

**PROHIBITED PATTERNS**:
- ❌ **NEVER** create multiple navigation components (sidebar + hamburger + header nav)
- ❌ **NEVER** implement feature flags for navigation switching or A/B testing
- ❌ **NEVER** fragment navigation data across multiple database tables
- ❌ **NEVER** create separate permission systems per navigation component
- ❌ **NEVER** build component-specific navigation logic or state management
- ❌ **NEVER** implement conditional navigation rendering based on screen size
- ❌ **NEVER** create navigation fallbacks or backup menu systems

**REQUIRED UNIFIED APPROACH**:
- ✅ **SINGLE** navigation data source: `navigation_items` table ONLY
- ✅ **SINGLE** navigation service: `NavigationService` handles ALL navigation logic
- ✅ **SINGLE** permission system: `requires_auth` and `required_role` columns
- ✅ **SINGLE** navigation component: `HamburgerNav` adapts to all screen sizes
- ✅ **SINGLE** state management: React context/hooks, NO component-specific state
- ✅ **SINGLE** icon system: Unified `iconMap` with consistent Lucide icons

**ENFORCEMENT**:
If you encounter multiple navigation systems, you MUST immediately:
1. **CONSOLIDATE** all navigation data into `navigation_items` table
2. **DELETE** redundant navigation components and services
3. **UNIFY** all permission checks through single database queries
4. **REMOVE** all feature flags and conditional navigation logic

**VIOLATION CONSEQUENCES**: Any attempt to create multiple navigation systems or fragment navigation logic across components violates the core architectural principle and MUST be immediately reverted to the unified database-driven approach.

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

**MINIMUM REQUIRED POLICIES** (Multi-tenant isolation):
```sql
-- 1. Enable RLS (NEVER SKIP THIS!)
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 2. Workspace-based isolation (for workspace-scoped tables)
CREATE POLICY "Users can access their workspace data"
    ON your_table FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = your_table.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

-- 3. User-owned data (for user_profiles and similar)
CREATE POLICY "Users can access their own data"
    ON your_table FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- 4. Shared dashboard access
CREATE POLICY "Users can access shared dashboards"
    ON dashboards FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM shared_dashboards
            WHERE shared_dashboards.dashboard_id = dashboards.id
            AND (shared_dashboards.shared_with = auth.uid() OR is_public = true)
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );
```

## Architecture Overview

### Core System: Workspace → Dashboard → Tab → Component

- **Workspaces**: Top-level containers for user data with complete isolation
- **Dashboards**: Customizable analytical views within workspaces
- **Dashboard Tabs**: Organized sections within dashboards for different views
- **Components**: Visualization widgets (charts, tables, metrics, text, images)
- **Data Tables**: User-defined data structures with flexible schemas
- **Templates**: Reusable dashboard configurations

### Database Schema

Key tables: `user_profiles`, `workspaces`, `dashboards`, `dashboard_tabs`, `data_tables`, `table_columns`, `data_records`, `dashboard_components`, `component_data_bindings`, `dashboard_templates`, `shared_dashboards`, `activity_logs`

### Authentication Flow

Login → Supabase Auth → User Profile → Default Workspace → Dashboard → Tab/Component

### URL Structure

```
/login                                              # Public authentication
/dashboard                                          # Protected, redirects to default workspace
/workspaces/:workspaceId                           # Workspace overview
/workspaces/:workspaceId/dashboards/:dashboardId   # Dashboard view
/workspaces/:workspaceId/dashboards/:dashboardId/tabs/:tabId # Tab view
/workspaces/:workspaceId/data-tables/:tableId      # Data table management
/templates                                          # Public template gallery
/templates/:templateId                              # Template preview
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (Auth + Database + RLS)
- **State**: React Context + React Query (TanStack Query)
- **Caching**: React Query with localStorage persistence
- **Routing**: React Router v7
- **Testing**: Jest + React Testing Library + Playwright
- **Notifications**: React Hot Toast

## 🚀 React Query Caching System

### MANDATORY: Use React Query for ALL Data Operations

**RULE**: All database operations, API calls, and state management MUST use React Query. Manual caching, useState for server state, or direct API calls are STRICTLY FORBIDDEN.

### Core Caching Architecture

**Query Client Configuration** (`src/core/query/queryClient.ts`):
- **Stale Time**: 5 minutes (data considered fresh)
- **Garbage Collection**: 10 minutes (memory cleanup)
- **Persistent Cache**: 24 hours in localStorage
- **Automatic Retry**: 3 attempts with exponential backoff
- **Background Refetching**: Enabled on reconnect, disabled on window focus

**Cache Persistence**:
```typescript
// Cache persists across browser sessions
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'evolve-dashboards-cache',
  throttleTime: 1000,
})

// 24-hour cache retention
persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: '1.0.0', // Increment to invalidate cache
})
```

### Required Query Key Structure

**MANDATORY**: All queries MUST use the centralized query key factory:

```typescript
// Query Keys Factory (src/core/query/queryClient.ts)
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
    session: ['auth', 'session'] as const,
  },
  navigation: {
    items: (isAuthenticated: boolean, userRole?: string) => 
      ['navigation', 'items', isAuthenticated, userRole] as const,
    tree: (isAuthenticated: boolean, userRole?: string) => 
      ['navigation', 'tree', isAuthenticated, userRole] as const,
  },
  startup: {
    data: (userId: string) => ['startup', 'data', userId] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    byId: (id: string) => ['workspaces', id] as const,
    byUser: (userId: string) => ['workspaces', 'user', userId] as const,
  },
  // ... more keys
}
```

### Caching Patterns by Feature

#### Authentication System
**Location**: `src/core/auth/authQueries.ts`
**Pattern**: Session-based caching with automatic invalidation

```typescript
// ✅ CORRECT: Using React Query for auth
export const useSession = () => {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: getCurrentSession,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// ✅ CORRECT: Mutation with cache invalidation
export const useSignOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.session, null)
      queryClient.setQueryData(queryKeys.auth.profile, null)
      invalidateQueries.all()
    }
  })
}
```

#### Navigation System
**Location**: `src/core/navigation/navigationQueries.ts`
**Pattern**: Hierarchical caching with role-based keys

```typescript
// ✅ CORRECT: Navigation with user context
export const useNavigationTree = (isAuthenticated: boolean, userRole?: string) => {
  return useQuery({
    queryKey: queryKeys.navigation.tree(isAuthenticated, userRole),
    queryFn: async () => {
      const items = await NavigationService.getFilteredNavigationItems(isAuthenticated, userRole)
      return NavigationService.buildNavigationTree(items)
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
    retry: 2,
  })
}
```

#### Database Operations
**Pattern**: Entity-based caching with relationship invalidation

```typescript
// ✅ CORRECT: Workspace operations
export const useWorkspaces = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.workspaces.byUser(userId),
    queryFn: () => WorkspaceService.getWorkspaces(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ✅ CORRECT: Mutation with related cache invalidation
export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }) => WorkspaceService.updateWorkspace(id, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific workspace
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.byId(variables.id) })
      // Invalidate user's workspace list
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.byUser(variables.userId) })
    }
  })
}
```

### Cache Invalidation Strategy

**Automatic Invalidation**:
- **Auth Changes**: Invalidate all auth-related queries
- **Data Mutations**: Invalidate affected entity queries
- **Navigation Changes**: Invalidate navigation tree
- **User Actions**: Invalidate user-specific data

**Manual Invalidation**:
```typescript
// Helper functions (src/core/query/queryClient.ts)
export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  navigation: () => queryClient.invalidateQueries({ queryKey: ['navigation'] }),
  workspaces: (workspaceId?: string) => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.byId(workspaceId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    }
  },
  all: () => queryClient.invalidateQueries(),
}
```

### PROHIBITED Caching Patterns

❌ **NEVER** use manual caching with useState:
```typescript
// ❌ WRONG: Manual caching
const [cachedData, setCachedData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData().then(setCachedData)
}, [])
```

❌ **NEVER** implement custom cache logic:
```typescript
// ❌ WRONG: Custom cache
const cache = new Map()
if (cache.has(key)) {
  return cache.get(key)
}
```

❌ **NEVER** use service-level caching:
```typescript
// ❌ WRONG: Service caching
class NavigationService {
  static cache = new Map()
  static lastFetch = 0
  
  static async getItems() {
    if (Date.now() - this.lastFetch < 300000) {
      return this.cache.get('items')
    }
    // ... fetch logic
  }
}
```

### Performance Monitoring

**React Query DevTools**: Available in development mode
- **Location**: Bottom-right corner of screen
- **Features**: Query inspection, cache visualization, performance metrics
- **Access**: Click the React Query logo in development

**Cache Metrics**:
- **Hit Rate**: Percentage of requests served from cache
- **Miss Rate**: Percentage of requests requiring network calls
- **Stale Queries**: Queries refreshing in background
- **Memory Usage**: Current cache size in memory

### Testing Caching Implementation

**Required Tests**:
1. **Cache Hit Test**: Verify subsequent requests use cache
2. **Cache Invalidation Test**: Ensure mutations invalidate related queries
3. **Persistence Test**: Verify cache survives page refresh
4. **Error Recovery Test**: Ensure failed queries retry correctly

**Test Pattern**:
```typescript
// ✅ CORRECT: Testing React Query hooks
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkspaces } from './workspaceQueries'

test('useWorkspaces caches data correctly', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  
  const { result, rerender } = renderHook(() => useWorkspaces('user-123'), { wrapper })
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  
  // Verify cache hit on re-render
  rerender()
  expect(result.current.isLoading).toBe(false)
})
```

## Critical File Locations

### Core Business Logic
- `src/core/auth/` - Authentication system with React Query
- `src/core/auth/authQueries.ts` - Auth-related query hooks
- `src/core/navigation/navigationQueries.ts` - Navigation query hooks
- `src/core/startup/startupQueries.ts` - Startup data query hooks
- `src/core/query/queryClient.ts` - React Query configuration and key factory
- `src/core/services/` - API services (for React Query queryFn functions)
- `src/core/types/` - TypeScript type definitions
- `src/core/hooks/` - Custom React hooks
- `src/core/formula/` - Formula engine for calculated columns

### Database Types
- `src/core/types/database.types.ts` - Primary database schema types
- `src/core/supabase/database.types.ts` - Supabase-generated types

### Component System
- `src/components/dashboard/` - Dashboard and tab components
- `src/components/charts/` - Visualization component implementations
- `src/components/data-tables/` - Data table management components
- `src/components/templates/` - Template gallery and management
- `src/components/shared/` - Reusable UI components

### Routing & Navigation
- `src/routes/AppRouter.tsx` - Main routing configuration
- `src/components/routing/` - Route guards and protection
- `src/components/navigation/` - Navigation components

## Development Patterns

### React Query Database Operations
```typescript
// ✅ CORRECT: Using React Query for database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidateQueries } from '@/core/query/queryClient'

// Check workspace access with caching
const useWorkspaceAccess = (userId: string, workspaceId: string) => {
  return useQuery({
    queryKey: queryKeys.workspaces.byId(workspaceId),
    queryFn: async () => {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .eq('id', workspaceId)
        .single();
      return data;
    },
    enabled: !!userId && !!workspaceId,
    staleTime: 5 * 60 * 1000,
  })
}

// Load dashboard with components (cached)
const useDashboardWithComponents = (dashboardId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboards.byId(dashboardId),
    queryFn: async () => {
      const { data } = await supabase
        .from('dashboards')
        .select(`
          *,
          dashboard_tabs(
            *,
            dashboard_components(
              *,
              component_data_bindings(*)
            )
          )
        `)
        .eq('id', dashboardId)
        .single();
      return data;
    },
    enabled: !!dashboardId,
    staleTime: 5 * 60 * 1000,
  })
}

// Update dashboard with cache invalidation
const useUpdateDashboard = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data } = await supabase
        .from('dashboards')
        .update(updates)
        .eq('id', id)
        .single();
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.byId(variables.id) })
      // Invalidate dashboard lists
      invalidateQueries.dashboards()
    }
  })
}

// Navigate using database-driven routes (cached)
const useNavigationRoute = (routeName: string) => {
  return useQuery({
    queryKey: queryKeys.routes.active,
    queryFn: async () => {
      const route = await navigationService.getRouteByName(routeName);
      return route;
    },
    enabled: !!routeName,
    staleTime: 10 * 60 * 1000, // Routes rarely change
  })
}
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

### Component Loading
```typescript
// Components are loaded dynamically based on database configuration
const componentConfig = await supabase
  .from('dashboard_components')
  .select('*')
  .eq('id', componentId)
  .single();

// Dynamic chart component loading
const chartComponents = import.meta.glob('@/components/charts/**/[A-Z]*.tsx');
const ChartComponent = await chartComponents[`@/components/charts/${componentConfig.chart_type}Chart.tsx`]();

// Data table operations with flexible schema
const { data: records } = await supabase
  .from('data_records')
  .select('*')
  .eq('table_id', tableId)
  .order('created_at', { ascending: false });
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
- **Subscription Tiers**: enterprise > pro > free (with storage and API call limits)
- **Route Guards** - Protect pages based on workspace access and sharing permissions
- **JWT Authentication** - Supabase handles token management

## Supabase Access

**Project Details:**
- Project ID: `svxozpkevohcdicqsmmc`
- Project URL: `https://svxozpkevohcdicqsmmc.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2eG96cGtldm9oY2RpY3FzbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjUwOTIsImV4cCI6MjA2NzkwMTA5Mn0.m_ne9MHuDSvqi8g5JFvJ9yZHS-zzdiD4Cw_h7HcFuOE`
- When using Supabase MCP functions, use project_id: `svxozpkevohcdicqsmmc`

## MCP (Model Context Protocol) Integration

**Available MCP Tools:**
Claude Code has direct access to Supabase operations through MCP server integration. For this project:

- **Supabase MCP Server** is configured and available in `mcp-config.json`
- **Database**: This project uses Supabase database with project ID: `svxozpkevohcdicqsmmc`
- Configuration located at: `/home/johnnorth/sources/Evolve-Dashboards/mcp-config.json`

### Available MCP Supabase Tools

**Database Management:**
- `mcp__supabase__list_tables` - List all tables in the database
- `mcp__supabase__execute_sql` - Execute raw SQL queries
- `mcp__supabase__apply_migration` - Apply database migrations (for DDL operations)
- `mcp__supabase__list_migrations` - List all migrations
- `mcp__supabase__list_extensions` - List database extensions

**Project Management:**
- `mcp__supabase__list_projects` - List all Supabase projects
- `mcp__supabase__get_project` - Get project details
- `mcp__supabase__get_project_url` - Get API URL for the project
- `mcp__supabase__get_anon_key` - Get anonymous API key

**Development Tools:**
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types from database schema
- `mcp__supabase__get_logs` - Get logs by service type (api, postgres, auth, etc.)
- `mcp__supabase__get_advisors` - Get security and performance advisories
- `mcp__supabase__search_docs` - Search Supabase documentation using GraphQL

**Edge Functions:**
- `mcp__supabase__list_edge_functions` - List all Edge Functions
- `mcp__supabase__deploy_edge_function` - Deploy Edge Functions

**Branch Management:**
- `mcp__supabase__create_branch` - Create development branches
- `mcp__supabase__list_branches` - List all branches
- `mcp__supabase__merge_branch` - Merge branches to production
- `mcp__supabase__reset_branch` - Reset branch migrations
- `mcp__supabase__rebase_branch` - Rebase branch on production

### How to Use MCP Tools

**IMPORTANT**: When database operations are needed (creating tables, setting up RLS policies, executing SQL scripts), Claude should use the available MCP tools instead of writing scripts that require manual execution.

**Example Usage:**

1. **Execute SQL Query:**
```typescript
// Use mcp__supabase__execute_sql with project_id: svxozpkevohcdicqsmmc
const result = await mcp__supabase__execute_sql({
  project_id: "svxozpkevohcdicqsmmc",
  query: "SELECT * FROM workspaces WHERE user_id = auth.uid()"
});
```

2. **Apply Database Migration:**
```typescript
// Use for DDL operations (CREATE TABLE, ALTER TABLE, etc.)
await mcp__supabase__apply_migration({
  project_id: "svxozpkevohcdicqsmmc",
  name: "create_new_feature_table",
  query: `
    CREATE TABLE new_feature (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can access their own data"
      ON new_feature FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  `
});
```

3. **Generate TypeScript Types:**
```typescript
// After schema changes, regenerate types
const types = await mcp__supabase__generate_typescript_types({
  project_id: "svxozpkevohcdicqsmmc"
});
```

**Best Practices:**
- Always use `project_id: "svxozpkevohcdicqsmmc"` for this project
- Use `apply_migration` for DDL operations (CREATE, ALTER, DROP)
- Use `execute_sql` for DML operations (SELECT, INSERT, UPDATE, DELETE)
- Check advisors regularly after schema changes to catch security issues
- Generate TypeScript types after any schema modifications

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