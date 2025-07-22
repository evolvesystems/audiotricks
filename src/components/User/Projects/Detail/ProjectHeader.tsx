/**
 * Project Header Component
 * Displays project title, description, and metadata
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderIcon,
  ArrowLeftIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface ProjectHeaderProps {
  project: ProjectDetail;
  onArchive: () => void;
  onDelete: () => void;
  onUpdateName: (newName: string) => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  project, 
  onArchive, 
  onDelete, 
  onUpdateName 
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleUpdateName = () => {
    if (newName.trim() && newName !== project.name) {
      onUpdateName(newName);
    }
    setEditingName(false);
  };

  return (
    <div>
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Projects
      </Link>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FolderIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleUpdateName}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              <p className="text-gray-600 mt-1">{project.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {project.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onArchive}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArchiveBoxIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};