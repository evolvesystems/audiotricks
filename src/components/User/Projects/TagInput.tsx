/**
 * Tag Input - Tag input and display component
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagInputProps {
  tags: string[];
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: (e: React.KeyboardEvent) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagInput({
  tags,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag
}: TagInputProps) {
  return (
    <div>
      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
        Tags
      </label>
      <div className="space-y-2">
        <input
          type="text"
          id="tags"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={onAddTag}
          placeholder="Add tags (press Enter to add)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}