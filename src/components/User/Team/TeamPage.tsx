/**
 * Team Management Page
 * Allows users to manage their team members within their workspace
 */

import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import InviteTeamMemberModal from './InviteTeamMemberModal';

interface TeamMember {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastActiveAt?: string;
  status: 'active' | 'invited' | 'inactive';
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/team/members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || mockTeamMembers);
      } else {
        // Use mock data for now
        setTeamMembers(mockTeamMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers(mockTeamMembers);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/team/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setTeamMembers(members => 
          members.map(m => m.id === memberId ? { ...m, role: newRole as any } : m)
        );
      }
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTeamMembers(members => members.filter(m => m.id !== memberId));
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, role })
      });

      if (response.ok) {
        const newMember = await response.json();
        setTeamMembers([...teamMembers, newMember]);
        setShowInviteModal(false);
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'invited': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading team members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your workspace team members and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlusIcon className="h-5 w-5" />
          Invite Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team members..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.username}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.role === 'owner' ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(member.status)}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteTeamMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}
    </div>
  );
}

// Mock data for development
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    username: 'john_user',
    email: 'john@example.com',
    role: 'owner',
    joinedAt: '2024-01-01',
    lastActiveAt: '2024-01-20',
    status: 'active'
  },
  {
    id: '2',
    username: 'sarah_doe',
    email: 'sarah@example.com',
    role: 'admin',
    joinedAt: '2024-01-05',
    lastActiveAt: '2024-01-19',
    status: 'active'
  },
  {
    id: '3',
    username: 'mike_jones',
    email: 'mike@example.com',
    role: 'member',
    joinedAt: '2024-01-10',
    lastActiveAt: '2024-01-18',
    status: 'active'
  },
  {
    id: '4',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'member',
    joinedAt: '2024-01-15',
    status: 'invited'
  }
];