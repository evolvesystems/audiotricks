// Type definitions for WorkspaceDashboard components
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    audioHistory: number;
  };
}

export interface WorkspaceDashboardProps {
  token: string;
  onSessionExpired?: () => void;
}

export interface WorkspaceListProps {
  workspaces: Workspace[];
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onViewUsers: (workspace: Workspace) => void;
}

export interface EmptyStateProps {
  onCreate: () => void;
}