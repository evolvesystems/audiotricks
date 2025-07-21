// Main workspace dashboard component - refactored to under 250 lines
import React, { useState } from 'react';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';
import WorkspaceModal from '../WorkspaceModal';
import WorkspaceUsersModal from '../WorkspaceUsers';
import { WorkspaceDashboardProps, Workspace } from './types';
import { useWorkspaceDashboard } from './useWorkspaceDashboard';
import WorkspaceList from './WorkspaceList';
import EmptyState from './EmptyState';

export default function WorkspaceDashboard({ token, onSessionExpired }: WorkspaceDashboardProps) {
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const {
    workspaces,
    loading,
    fetchWorkspaces,
    handleDeleteWorkspace
  } = useWorkspaceDashboard({ token, onSessionExpired });

  const handleCreateWorkspace = () => {
    setEditingWorkspace(null);
    setModalMode('create');
    setShowWorkspaceModal(true);
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setModalMode('edit');
    setShowWorkspaceModal(true);
  };

  const handleViewUsers = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowUsersModal(true);
  };

  const handleSaveWorkspace = async (workspaceData: any) => {
    const url = modalMode === 'create' 
      ? '/api/workspaces'
      : `/api/workspaces/${editingWorkspace?.id}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workspaceData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
          return;
        }
        throw new Error('Your session has expired. Please log in again.');
      }
      
      throw new Error(error.error || error.message || 'Failed to save workspace');
    }

    await fetchWorkspaces();
    setShowWorkspaceModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            Workspace Management
          </h1>
          <button
            onClick={handleCreateWorkspace}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Workspace
          </button>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState onCreate={handleCreateWorkspace} />
      ) : (
        <WorkspaceList
          workspaces={workspaces}
          onEdit={handleEditWorkspace}
          onDelete={handleDeleteWorkspace}
          onViewUsers={handleViewUsers}
        />
      )}

      <WorkspaceModal
        workspace={editingWorkspace}
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        onSave={handleSaveWorkspace}
        mode={modalMode}
      />

      {selectedWorkspace && (
        <WorkspaceUsersModal
          workspace={selectedWorkspace}
          isOpen={showUsersModal}
          onClose={() => setShowUsersModal(false)}
          token={token}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  );
}