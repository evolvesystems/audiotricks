/**
 * WorkspaceGrid Component
 * Displays workspaces in grid format with cards
 */

import React from 'react';
import { 
  BuildingOfficeIcon,
  PlusIcon,
  UsersIcon,
  FolderIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

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

interface WorkspaceGridProps {
  workspaces: Workspace[];
  onCreateClick: () => void;
  onEditWorkspace: (workspace: Workspace) => void;
  onLeaveWorkspace: (workspaceId: string) => void;
}

export default function WorkspaceGrid({ 
  workspaces, 
  onCreateClick, 
  onEditWorkspace, 
  onLeaveWorkspace 
}: WorkspaceGridProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-20">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
        <p className="text-gray-500 mb-6">
          Create your first workspace to start collaborating with your team
        </p>
        <button 
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{workspace.name}</h3>
                {workspace.description && (
                  <p className="text-sm text-gray-600 mb-3">{workspace.description}</p>
                )}
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(workspace.role)}`}>
                  {workspace.role}
                </span>
              </div>
              <div className="flex space-x-1">
                {workspace.role !== 'member' && (
                  <button
                    onClick={() => onEditWorkspace(workspace)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {workspace.role !== 'owner' && (
                  <button
                    onClick={() => onLeaveWorkspace(workspace.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <UsersIcon className="h-4 w-4" />
                  <span>{workspace.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FolderIcon className="h-4 w-4" />
                  <span>{workspace.projectCount} projects</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Joined {new Date(workspace.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}