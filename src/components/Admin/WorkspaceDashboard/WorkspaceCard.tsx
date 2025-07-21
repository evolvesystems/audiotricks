// Individual workspace card component
import React from 'react';
import { UsersIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Workspace } from './types';

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onViewUsers: (workspace: Workspace) => void;
}

export default function WorkspaceCard({ 
  workspace, 
  onEdit, 
  onDelete, 
  onViewUsers 
}: WorkspaceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
          <p className="text-sm text-gray-500">/{workspace.slug}</p>
          {workspace.description && (
            <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          workspace.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {workspace.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <UsersIcon className="w-4 h-4" />
          <span>{workspace._count.users} users</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{workspace._count.audioHistory} files</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Created {new Date(workspace.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewUsers(workspace)}
            className="text-blue-600 hover:text-blue-800"
            title="View users"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(workspace)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit workspace"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(workspace.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete workspace"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}