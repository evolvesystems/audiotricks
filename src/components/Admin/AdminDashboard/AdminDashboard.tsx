// Main admin dashboard component - refactored to under 250 lines
import React, { useState } from 'react';
import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import UserModal from '../UserModal';
import { User, AdminDashboardProps } from './types';
import { useAdminDashboard } from './useAdminDashboard';
import { apiRequest } from '../../../utils/api';
import StatsCards from './StatsCards';
import UserSearchBar from './UserSearchBar';
import UserTable from './UserTable';
import Pagination from './Pagination';

export default function AdminDashboard({ token, onSessionExpired }: AdminDashboardProps) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const {
    users,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    toggleUserStatus,
    updateUserRole,
    handleDeleteUser,
    fetchUsers,
    fetchStats
  } = useAdminDashboard({ token, onSessionExpired });

  console.log('🔍 AdminDashboard render - users from hook:', users, 'length:', users?.length);

  const handleCreateUser = () => {
    setEditingUser(null);
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalMode('edit');
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      const url = modalMode === 'create' 
        ? '/api/admin/users'
        : `/api/admin/users/${editingUser?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      await apiRequest(url, {
        method,
        body: userData
      });

      await fetchUsers();
      await fetchStats();
      setShowUserModal(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        if (onSessionExpired) {
          onSessionExpired();
          return;
        }
      }
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
          Admin Dashboard
        </h1>
      </div>

      {stats && <StatsCards stats={stats} />}

      <UserSearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateUser={handleCreateUser}
      />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <UserTable
          users={users}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={toggleUserStatus}
          onUpdateRole={updateUserRole}
        />
        
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <UserModal
        user={editingUser}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={handleSaveUser}
        mode={modalMode}
      />
    </div>
  );
}