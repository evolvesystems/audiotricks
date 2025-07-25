/**
 * New Project Page - Create new transcription projects
 */

import React, { useState } from 'react';
import { logger } from '../../../utils/logger';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import ProjectForm from './ProjectForm';
import { apiClient } from '../../../services/api';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    settings: {
      autoArchiveAfterDays: 0,
      defaultLanguage: 'en',
      notifyOnCompletion: true
    }
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const project = await apiClient.post('/projects', formData);
      navigate(`/projects/${project.id}`);
    } catch (error) {
      logger.error('Error creating project:', error);
      // For now, just navigate back to projects list
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(newTag.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Projects
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FolderIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600">Organize your transcriptions into projects</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200">
        <ProjectForm
          formData={formData}
          setFormData={setFormData}
          newTag={newTag}
          setNewTag={setNewTag}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3 justify-end">
            <Link
              to="/projects"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}