// Type definitions for AdminDashboard components
export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  _count: {
    audioHistory: number;
    sessions: number;
  };
}

export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalAudioProcessed: number;
  usersByRole: Record<string, number>;
}

export interface AdminDashboardProps {
  token: string;
  onSessionExpired?: () => void;
}

export interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
}

export interface StatsCardsProps {
  stats: Stats;
}

export interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateUser: () => void;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}