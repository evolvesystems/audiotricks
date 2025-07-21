export interface AdminPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  maintenanceUpdates: boolean;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: 'US' | 'EU' | 'ISO';
  defaultPageSize: number;
  autoRefreshDashboard: boolean;
  refreshInterval: number;
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

export interface ApiKeySettings {
  openaiApiKey: string;
  elevenlabsApiKey: string;
  sendgridApiKey: string;
  digitaloceanSpacesKey: string;
  digitaloceanSpacesSecret: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  ewayApiKey: string;
  ewayApiPassword: string;
}

export interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  avatarUrl?: string;
}

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}