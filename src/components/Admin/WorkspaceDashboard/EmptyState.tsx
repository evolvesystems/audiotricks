// Empty state component for workspace dashboard
import React from 'react';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { EmptyStateProps } from './types';

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by creating your first workspace.</p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Workspace
        </button>
      </div>
    </div>
  );
}