// Shared types for WorkspaceUsers components

export interface WorkspaceUser {
  id: string;
  email: string;
  username: string;
  workspaceRole: string;
  joinedAt: string;
  isActive: boolean;
  lastLoginAt?: string;
  _count: {
    audioHistory: number;
  };
}

export interface AvailableUser {
  id: string;
  email: string;
  username: string;
  role: string;
  lastLoginAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceUsersModalProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSessionExpired?: () => void;
}

export interface AddUserFormProps {
  workspace: Workspace;
  token: string;
  onUserAdded: () => void;
  onCancel: () => void;
  onSessionExpired?: () => void;
}

export interface UserListTableProps {
  users: WorkspaceUser[];
  workspace: Workspace;
  token: string;
  onUserRemoved: () => void;
  onSessionExpired?: () => void;
}

export interface InviteUserFormProps {
  workspace: Workspace;
  token: string;
  onUserInvited: () => void;
  onCancel: () => void;
  onSessionExpired?: () => void;
}