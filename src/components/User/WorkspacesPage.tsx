/**
 * Workspaces Page - Manage user workspaces
 */

import React, { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { logger } from '../../utils/logger';
import WorkspaceGrid from './Workspaces/WorkspaceGrid';
import WorkspaceModal from './Workspaces/WorkspaceModal';
import { apiClient } from '../../services/api';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const data = await apiClient.get('/user-workspaces');
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      logger.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newWorkspace = await apiClient.post('/user-workspaces', formData);
      setWorkspaces([newWorkspace, ...workspaces]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      logger.error('Error creating workspace:', error);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    try {
      const updatedWorkspace = await apiClient.put(`/user-workspaces/${editingWorkspace.id}`, formData);
      setWorkspaces(workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
      setEditingWorkspace(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      logger.error('Error updating workspace:', error);
    }
  };

  const handleLeaveWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to leave this workspace?')) return;

    try {
      await apiClient.delete(`/user-workspaces/${workspaceId}/leave`);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    } catch (error) {
      logger.error('Error leaving workspace:', error);
    }
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({ name: workspace.name, description: workspace.description || '' });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingWorkspace(null);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading workspaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
            </div>
            Workspaces
          </h1>
          <p className="text-gray-600 mt-2">Manage your team workspaces and collaboration</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      <WorkspaceGrid 
        workspaces={workspaces}
        onCreateClick={() => setShowCreateModal(true)}
        onEditWorkspace={handleEditWorkspace}
        onLeaveWorkspace={handleLeaveWorkspace}
      />

      {/* Workspace Modals */}
      <WorkspaceModal
        isOpen={showCreateModal}
        isEditing={false}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreateWorkspace}
        onClose={handleCloseModal}
      />

      <WorkspaceModal
        isOpen={!!editingWorkspace}
        isEditing={true}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdateWorkspace}
        onClose={handleCloseModal}
      />
    </div>
  );
}