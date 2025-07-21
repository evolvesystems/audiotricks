// User table component
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserTableProps } from './types';

export default function UserTable({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  onToggleStatus, 
  onUpdateRole 
}: UserTableProps) {
  console.log('🔍 UserTable render - users:', users, 'length:', users?.length);
  console.log('🔍 UserTable - first user:', users?.[0]);
  
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No users found</p>
        <p className="text-xs text-gray-400 mt-2">
          Users array: {JSON.stringify(users)}
        </p>
      </div>
    );
  }
  
  // Simple debug rendering to see if anything shows up
  return (
    <div>
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-bold text-yellow-800">Debug Info:</h4>
        <p>Users count: {users.length}</p>
        <p>First user: {users[0]?.username} ({users[0]?.email})</p>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
              Audio Files
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, index) => {
            console.log(`🔍 Rendering user ${index}:`, user);
            return (
              <tr key={user.id} className="border-b border-gray-200">
                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.username || 'No username'}</div>
                    <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                  <span className="text-sm">{user.role || 'No role'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300">
                  {user._count?.audioHistory ?? 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300">
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded"
                      title="Edit user"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className={`px-2 py-1 border rounded ${
                        user.isActive 
                          ? 'text-orange-600 border-orange-300' 
                          : 'text-green-600 border-green-300'
                      }`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded"
                      title="Delete user"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}