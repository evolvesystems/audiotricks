// User list table component
import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { UserListTableProps } from './types';

export default function UserListTable({ 
  users, 
  workspace,
  token,
  onUserRemoved,
  onSessionExpired 
}: UserListTableProps) {
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) return;

    setRemovingUserId(userId);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        throw new Error('Failed to remove user');
      }

      onUserRemoved();
    } catch (error) {
      alert('Failed to remove user. Please try again.');
    } finally {
      setRemovingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Current Users</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transcriptions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.workspaceRole === 'owner' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.workspaceRole === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.workspaceRole}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.joinedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user._count.audioHistory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.workspaceRole !== 'owner' && (
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removingUserId === user.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {removingUserId === user.id ? (
                        'Removing...'
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}