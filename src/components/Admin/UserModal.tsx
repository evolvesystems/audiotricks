import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { logger } from '../../utils/logger';
import UserFormFields from './UserFormFields';
import { validateUserForm, parseErrorMessage } from './UserValidation';

interface User {
  id?: string;
  email: string;
  username: string;
  password?: string;
  role: string;
  businessName?: string;
  mobile?: string;
  country?: string;
  currency?: string;
  isActive?: boolean;
}

interface UserModalProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
  mode: 'create' | 'edit';
}

export default function UserModal({ user, isOpen, onClose, onSave, mode }: UserModalProps) {
  const [formData, setFormData] = useState<User>({
    email: '',
    username: '',
    password: '',
    role: 'user',
    businessName: '',
    mobile: '',
    country: 'US',
    currency: 'USD',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        ...user,
        password: '' // Don't show existing password
      });
    } else {
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'user',
        businessName: '',
        mobile: '',
        country: 'US',
        currency: 'USD',
        isActive: true
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors = validateUserForm(formData, mode);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      logger.error('Failed to save user:', error);
      const errorMessage = parseErrorMessage(error);
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <UserFormFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            mode={mode}
          />

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}