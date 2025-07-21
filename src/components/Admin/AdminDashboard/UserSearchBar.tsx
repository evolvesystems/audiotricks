// User search bar component
import React from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { UserSearchBarProps } from './types';

export default function UserSearchBar({ 
  searchTerm, 
  onSearchChange, 
  onCreateUser 
}: UserSearchBarProps) {
  return (
    <div className="mb-6 flex gap-4">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by email or username..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button
        onClick={onCreateUser}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <PlusIcon className="w-5 h-5" />
        Add User
      </button>
    </div>
  );
}