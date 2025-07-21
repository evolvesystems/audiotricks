// Invite user form component
import React, { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { InviteUserFormProps } from './types';

export default function InviteUserForm({ 
  workspace,
  token,
  onUserInvited,
  onCancel,
  onSessionExpired 
}: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, role })
      });

      if (!response.ok) {
        if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      alert('Invitation sent successfully!');
      onUserInvited();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
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

      <div className="text-sm text-gray-600">
        <p>An invitation email will be sent to the user with instructions to join the workspace.</p>
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
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>
    </form>
  );
}