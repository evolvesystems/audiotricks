/**
 * WorkspaceModal Component
 * Handles both create and edit workspace modals
 */

import React from 'react';

interface WorkspaceModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: { name: string; description: string };
  onFormDataChange: (data: { name: string; description: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function WorkspaceModal({ 
  isOpen, 
  isEditing, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onClose 
}: WorkspaceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditing ? 'Edit Workspace' : 'Create New Workspace'}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update Workspace' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}