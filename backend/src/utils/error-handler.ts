/**
 * Utility function to safely get error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Type guard to check if error has a code property
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

/**
 * Type guard to check if error has a name property
 */
export function hasErrorName(error: unknown): error is { name: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    typeof (error as any).name === 'string'
  );
}