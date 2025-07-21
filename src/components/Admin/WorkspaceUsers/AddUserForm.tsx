// Add user form component
import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { AddUserFormProps, AvailableUser } from './types';

export default function AddUserForm({ 
  workspace,
  token,
  onUserAdded,
  onCancel,
  onSessionExpired 
}: AddUserFormProps) {
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const fetchAvailableUsers = async (search?: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/workspaces/${workspace.id}/available-users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        throw new Error('Failed to fetch available users');
      }

      const data = await response.json();
      setAvailableUsers(data.users);
    } catch (error) {
      alert('Failed to fetch available users');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAvailableUsers(userSearch);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: selectedUserId, role })
      });

      if (!response.ok) {
        if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        throw new Error('Failed to add user');
      }

      onUserAdded();
    } catch (error) {
      alert('Failed to add user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Users
        </label>
        <input
          type="text"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {searching ? (
        <div className="text-sm text-gray-500">Searching users...</div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}