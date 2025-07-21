/**
 * Workspaces Page - Manage user workspaces
 */

import React from 'react';
import { 
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function WorkspacesPage() {
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
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5" />
          New Workspace
        </button>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-20">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Workspaces Coming Soon</h3>
        <p className="text-gray-500">
          Collaborate with your team across multiple workspaces. This feature is under development.
        </p>
      </div>
    </div>
  );
}