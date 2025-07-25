/**
 * User Validation - Form validation logic utilities
 */

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

export const validateUserForm = (
  formData: User,
  mode: 'create' | 'edit'
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }

  if (!formData.username) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (mode === 'create' && !formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password && formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
};

export const parseErrorMessage = (error: unknown): string => {
  let errorMessage = 'Failed to save user';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Parse validation errors if they exist
    if (error.message.includes('validation') || error.message.includes('required')) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err: any) => err.msg).join(', ');
        }
      } catch {
        // If parsing fails, use the original message
      }
    }
  }
  
  return errorMessage;
};