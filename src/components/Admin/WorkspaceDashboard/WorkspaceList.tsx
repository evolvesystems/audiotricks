// Workspace list component
import React from 'react';
import { WorkspaceListProps } from './types';
import WorkspaceCard from './WorkspaceCard';

export default function WorkspaceList({ 
  workspaces, 
  onEdit, 
  onDelete, 
  onViewUsers 
}: WorkspaceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewUsers={onViewUsers}
        />
      ))}
    </div>
  );
}