/**
 * Team Management Page
 * Allows users to manage their team members within their workspace
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import TeamMembersTable from './TeamMembersTable';
import { apiClient } from '../../../services/api';

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
      const data = await apiClient.get('/team/members');
      setTeamMembers(data.members || []);
    } catch (error) {
      logger.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await apiClient.put(`/team/members/${memberId}/role`, { role: newRole });
      setTeamMembers(members => 
        members.map(m => m.id === memberId ? { ...m, role: newRole as any } : m)
      );
    } catch (error) {
      logger.error('Error updating member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await apiClient.delete(`/team/members/${memberId}`);
      setTeamMembers(members => members.filter(m => m.id !== memberId));
    } catch (error) {
      logger.error('Error removing team member:', error);
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    try {
      const newMember = await apiClient.post('/team/invite', { email, role });
      setTeamMembers([...teamMembers, newMember]);
      setShowInviteModal(false);
    } catch (error) {
      logger.error('Error inviting team member:', error);
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

      <TeamMembersTable
        members={filteredMembers}
        onRoleChange={handleRoleChange}
        onRemove={handleRemoveMember}
      />

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