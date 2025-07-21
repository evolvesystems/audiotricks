interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  // Handle token expiration
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    
    // Redirect to admin login if on admin page
    if (window.location.pathname.includes('/admin')) {
      window.location.reload();
    }
    
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    // Handle validation errors (400)
    if (response.status === 400 && errorData.errors) {
      const validationMessages = errorData.errors.map((err: any) => err.msg || err.message).join(', ');
      throw new ApiError(response.status, validationMessages);
    }
    
    throw new ApiError(response.status, errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}