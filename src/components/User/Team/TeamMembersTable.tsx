/**
 * Team Members Table - Displays team members in a table format
 */

import React from 'react';
import TeamMemberRow from './TeamMemberRow';

interface TeamMember {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastActiveAt?: string;
  status: 'active' | 'invited' | 'inactive';
}

interface TeamMembersTableProps {
  members: TeamMember[];
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemove: (memberId: string) => void;
}

export default function TeamMembersTable({
  members,
  onRoleChange,
  onRemove
}: TeamMembersTableProps) {
  return (
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
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              onRoleChange={onRoleChange}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}