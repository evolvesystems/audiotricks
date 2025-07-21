// Main modal component - refactored to under 250 lines
import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { WorkspaceUsersModalProps } from './types';
import { useWorkspaceUsers } from './useWorkspaceUsers';
import UserListTable from './UserListTable';
import AddUserForm from './AddUserForm';
import InviteUserForm from './InviteUserForm';

export default function WorkspaceUsersModal({ 
  workspace, 
  isOpen, 
  onClose, 
  token, 
  onSessionExpired 
}: WorkspaceUsersModalProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const {
    users,
    loading,
    fetchUsers
  } = useWorkspaceUsers({ workspace, token, onSessionExpired, isOpen });

  if (!isOpen) return null;

  const handleUserAdded = () => {
    setShowAddUserForm(false);
    fetchUsers();
  };

  const handleUserInvited = () => {
    setShowInviteForm(false);
  };

  const handleUserRemoved = () => {
    fetchUsers();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Users - {workspace.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex space-x-2">
                  <button
                    onClick={() => {
                      setShowAddUserForm(!showAddUserForm);
                      setShowInviteForm(false);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Existing User
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteForm(!showInviteForm);
                      setShowAddUserForm(false);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Invite New User
                  </button>
                </div>

                {showAddUserForm && (
                  <AddUserForm
                    workspace={workspace}
                    token={token}
                    onUserAdded={handleUserAdded}
                    onCancel={() => setShowAddUserForm(false)}
                    onSessionExpired={onSessionExpired}
                  />
                )}

                {showInviteForm && (
                  <InviteUserForm
                    workspace={workspace}
                    token={token}
                    onUserInvited={handleUserInvited}
                    onCancel={() => setShowInviteForm(false)}
                    onSessionExpired={onSessionExpired}
                  />
                )}

                <UserListTable
                  users={users}
                  workspace={workspace}
                  token={token}
                  onUserRemoved={handleUserRemoved}
                  onSessionExpired={onSessionExpired}
                />
              </>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}