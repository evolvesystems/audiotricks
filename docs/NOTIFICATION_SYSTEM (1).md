# Evolvepreneur Nexus Suite - Notification System Documentation

## Overview

The Evolvepreneur Nexus Suite features a comprehensive, real-time notification system built on Supabase with React hooks and components. The system supports multiple notification types, real-time updates, filtering, and platform customization.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                      │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (Supabase)                                 │
│  ├── notifications table                                   │
│  ├── RLS policies                                          │
│  └── Real-time subscriptions                               │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├── MockNotificationService                               │
│  └── Real-time event handlers                              │
├─────────────────────────────────────────────────────────────┤
│  Hook Layer                                                 │
│  ├── useNotifications                                       │
│  ├── useRealNotifications                                   │
│  └── useChecklistNotifications                              │
├─────────────────────────────────────────────────────────────┤
│  Component Layer                                            │
│  ├── NotificationDropdown                                   │
│  ├── NotificationIcon                                       │
│  ├── NotificationItem                                       │
│  ├── NotificationsTable                                     │
│  └── NotificationSettings                                   │
├─────────────────────────────────────────────────────────────┤
│  Page Layer                                                 │
│  └── NotificationsPage                                      │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Notifications Table

The notifications are stored in a PostgreSQL table with the following structure:

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'feedback', 'order', 'user', 'admin')),
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_notifications_user_id` - For efficient user-based queries
- `idx_notifications_read_at` - For filtering read/unread notifications

### Row Level Security (RLS)
- Users can only view, insert, update, and delete their own notifications
- Automatic user_id validation through auth.uid()

## Notification Types

The system supports five distinct notification types:

| Type | Description | Use Cases |
|------|-------------|-----------|
| `system` | System-wide notifications | Maintenance, updates, announcements |
| `feedback` | User feedback related | Feedback responses, status changes |
| `order` | Order/transaction related | Purchase confirmations, status updates |
| `user` | User-specific notifications | Profile changes, settings updates |
| `admin` | Administrative notifications | Admin actions, moderation alerts |

## Core Hooks

### useNotifications

Primary hook for notification management with Supabase integration.

```typescript
export const useNotifications = (options?: {
  limit?: number;
  read?: boolean;
  countOnly?: boolean;
}): UseNotificationsReturn
```

**Features:**
- Fetches notifications from Supabase
- Real-time subscriptions
- Mark as read/unread functionality
- Delete notifications
- Unread count tracking
- Error handling with toast notifications

**Return Interface:**
```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

### useRealNotifications

Enhanced hook with React Query integration for better caching and performance.

```typescript
export const useRealNotifications = (options?: { 
  limit?: number; 
  unreadOnly?: boolean;
})
```

**Features:**
- React Query integration for caching
- Optimistic updates
- Enhanced metadata handling
- Feedback integration
- Real-time synchronization

### useChecklistNotifications

Specialized hook for project checklist notifications.

```typescript
export const useChecklistNotifications = (projectId?: string)
```

**Features:**
- Project-specific notifications
- Checklist item change tracking
- Assignment notifications
- Real-time project updates

## Core Components

### NotificationDropdown

Main dropdown component displaying recent notifications with tabs for different types.

**Props:**
```typescript
type NotificationDropdownProps = {
  maxItems?: number;
  onClose?: () => void;
  onViewAll?: () => void;
  showViewAllButton?: boolean;
};
```

**Features:**
- Tabbed interface (Notifications & Feedback)
- Real-time updates
- Click-outside-to-close functionality
- Navigation integration
- Debug logging

### NotificationIcon

Icon component with unread count badge.

**Features:**
- Real-time unread count
- Visual indicators
- Click handling
- Responsive design

### NotificationItem

Individual notification display component.

**Features:**
- Type-specific icons and colors
- Timestamp formatting
- Action URL handling
- Read/unread states
- Metadata display

### NotificationsTable

Full-featured table for notification management.

**Features:**
- Search functionality
- Type filtering
- Bulk operations
- Pagination
- Sorting

### NotificationSettings

Platform customization component for notification preferences.

**Features:**
- Email notification toggle
- Push notification settings
- Slack integration
- Webhook configuration

## Service Layer

### MockNotificationService

Development/testing service with mock implementations.

```typescript
export class MockNotificationService {
  async getNotifications(options?: {
    limit?: number;
    read?: boolean;
    countOnly?: boolean;
  }): Promise<Notification[]>
  
  async markAsRead(id: string): Promise<void>
  async markAllAsRead(): Promise<void>
  async deleteNotification(id: string): Promise<void>
  async getUnreadCount(): Promise<number>
  subscribeToUpdates(callback: (notification: Notification) => void)
}
```

## Real-time Features

### Supabase Subscriptions

The system uses Supabase real-time subscriptions for instant updates:

```typescript
// Example subscription setup
const subscription = supabase
  .channel('notifications-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handleNotificationChange)
  .subscribe();
```

### Event Handling

- **INSERT**: New notifications appear instantly
- **UPDATE**: Read status updates in real-time
- **DELETE**: Notifications removed from UI immediately

## Integration Points

### Feedback System Integration

Notifications are tightly integrated with the feedback system:

- Automatic notifications for feedback status changes
- Admin response notifications
- Feedback priority updates
- Cross-navigation between systems

### Authentication Integration

- User-specific notifications via RLS
- Automatic user_id association
- Auth state synchronization

### Platform Customization

- Configurable notification preferences
- Email/push notification settings
- Integration with external services (Slack, webhooks)

## Usage Examples

### Basic Notification Display

```typescript
import { useRealNotifications } from '@/hooks/useRealNotifications';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

function MyComponent() {
  const { notifications, isLoading, markAsRead } = useRealNotifications({
    limit: 10,
    unreadOnly: false
  });

  return (
    <NotificationDropdown
      maxItems={5}
      onClose={() => setOpen(false)}
      showViewAllButton={true}
    />
  );
}
```

### Custom Notification Creation

```typescript
// Create a new notification
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    title: 'Welcome!',
    message: 'Welcome to the platform',
    type: 'system',
    action_url: '/dashboard'
  });
```

### Filtering Notifications

```typescript
const { notifications } = useRealNotifications({
  limit: 20,
  unreadOnly: true // Only unread notifications
});

// Additional filtering in component
const systemNotifications = notifications.filter(n => n.type === 'system');
```

## Performance Considerations

### Optimization Strategies

1. **React Query Caching**: Reduces redundant API calls
2. **Pagination**: Limits data transfer with configurable limits
3. **Selective Subscriptions**: Only subscribe to relevant changes
4. **Debounced Updates**: Prevents excessive re-renders
5. **Lazy Loading**: Components load notifications on demand

### Database Optimization

1. **Indexes**: Efficient querying on user_id and read_at
2. **RLS Policies**: Security with minimal performance impact
3. **JSONB Metadata**: Flexible storage with query capabilities
4. **Automatic Cleanup**: Triggers for data maintenance

## Error Handling

### Client-Side Error Handling

```typescript
// Hook-level error handling
const { notifications, error } = useRealNotifications();

if (error) {
  toast({
    title: "Error loading notifications",
    description: error.message,
    variant: "destructive"
  });
}
```

### Database-Level Error Handling

- Constraint violations handled gracefully
- RLS policy violations return empty results
- Connection errors trigger retry mechanisms

## Testing Strategy

### Unit Testing

- Hook testing with React Testing Library
- Component testing with mock data
- Service layer testing with Jest

### Integration Testing

- End-to-end notification flows
- Real-time subscription testing
- Database interaction testing

### Mock Data

```typescript
// Example mock notification
const mockNotification: Notification = {
  id: 'test-id',
  title: 'Test Notification',
  message: 'This is a test',
  type: 'system',
  read_at: null,
  created_at: new Date().toISOString(),
  user_id: 'user-id',
  action_url: '/test',
  metadata: { source: 'test' }
};
```

## Security Considerations

### Row Level Security (RLS)

All notification access is secured through RLS policies:

```sql
-- Users can only access their own notifications
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);
```

### Data Validation

- Type constraints at database level
- Client-side validation before API calls
- Sanitization of user inputs

### Privacy Protection

- User data isolation through RLS
- Secure metadata handling
- Audit trails for sensitive operations

## Deployment Considerations

### Environment Configuration

- Supabase connection settings
- Real-time subscription limits
- Notification retention policies

### Monitoring

- Notification delivery tracking
- Performance metrics
- Error rate monitoring

### Scaling

- Database connection pooling
- Real-time subscription management
- Caching strategies

## Future Enhancements

### Planned Features

1. **Push Notifications**: Browser and mobile push support
2. **Email Templates**: Rich HTML email notifications
3. **Notification Scheduling**: Delayed and recurring notifications
4. **Advanced Filtering**: Complex query capabilities
5. **Analytics**: Notification engagement metrics
6. **Bulk Operations**: Mass notification management
7. **External Integrations**: Slack, Discord, Teams
8. **Notification Templates**: Reusable notification formats

### Technical Improvements

1. **GraphQL Integration**: More efficient data fetching
2. **Offline Support**: Queue notifications when offline
3. **Advanced Caching**: Redis integration
4. **Microservice Architecture**: Dedicated notification service
5. **Machine Learning**: Smart notification prioritization

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check RLS policies
   - Verify user authentication
   - Confirm subscription status

2. **Real-time Updates Not Working**
   - Check Supabase connection
   - Verify subscription setup
   - Monitor network connectivity

3. **Performance Issues**
   - Review query limits
   - Check index usage
   - Monitor subscription count

### Debug Tools

- Browser console logging
- Supabase dashboard monitoring
- React DevTools profiling

## API Reference

### Notification Interface

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
  user_id: string;
}

type NotificationType = 'system' | 'feedback' | 'order' | 'user' | 'admin';
```

### Hook Options

```typescript
// useNotifications options
interface NotificationOptions {
  limit?: number;
  read?: boolean;
  countOnly?: boolean;
}

// useRealNotifications options
interface RealNotificationOptions {
  limit?: number;
  unreadOnly?: boolean;
}
```

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Set up Supabase environment variables
3. Run migrations: `supabase db reset`
4. Start development server: `npm run dev`

### Code Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive testing

### Pull Request Process

1. Feature branch from main
2. Comprehensive testing
3. Documentation updates
4. Code review approval
5. Merge to main

---

*This documentation is maintained by the Evolvepreneur development team. For questions or contributions, please refer to the project's GitHub repository.*
