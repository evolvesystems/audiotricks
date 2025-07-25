/**
 * Project Form - Form fields for creating/editing projects
 */

import React from 'react';
import TagInput from './TagInput';

interface ProjectFormData {
  name: string;
  description: string;
  tags: string[];
  settings: {
    autoArchiveAfterDays: number;
    defaultLanguage: string;
    notifyOnCompletion: boolean;
  };
}

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: (e: React.KeyboardEvent) => void;
  onRemoveTag: (tag: string) => void;
}

export default function ProjectForm({
  formData,
  setFormData,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag
}: ProjectFormProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Weekly Podcast Episodes"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this project is for..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tags */}
      <TagInput
        tags={formData.tags}
        newTag={newTag}
        setNewTag={setNewTag}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />

      {/* Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Project Settings</h3>
        <div className="space-y-4">
          {/* Auto-archive */}
          <div>
            <label htmlFor="autoArchive" className="block text-sm text-gray-600 mb-1">
              Auto-archive after (days)
            </label>
            <input
              type="number"
              id="autoArchive"
              value={formData.settings.autoArchiveAfterDays}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  autoArchiveAfterDays: parseInt(e.target.value) || 0
                }
              })}
              min="0"
              placeholder="0 (never)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 to disable auto-archiving
            </p>
          </div>

          {/* Default Language */}
          <div>
            <label htmlFor="language" className="block text-sm text-gray-600 mb-1">
              Default Language
            </label>
            <select
              id="language"
              value={formData.settings.defaultLanguage}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  defaultLanguage: e.target.value
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>

          {/* Notification */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notify"
              checked={formData.settings.notifyOnCompletion}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  notifyOnCompletion: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="notify" className="text-sm text-gray-700">
              Notify me when jobs in this project are completed
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}