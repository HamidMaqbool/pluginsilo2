declare global {
  interface Window {
    ps_plugin_url?: string;
    ps_ajax_url?: string;
  }
}

export enum APIStatus {
  IDLE = 'IDLE',
  DOWNLOADING = 'DOWNLOADING',
  DOWNLOADED = 'DOWNLOADED',
  ACTIVE = 'ACTIVE',
}

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'toggle';
  defaultValue: any;
  helpText?: string;
  instruction?: string;
  icon?: string;
  options?: string[]; // For select type
}

export interface SettingTab {
  id: string;
  label: string;
  icon: string;
  fields: SettingField[];
}

export interface DropdownMenuItem {
  label: string;
  icon: string;
  type: 'settings' | 'analytics' | 'logs' | 'queue' | 'documentation' | 'uninstall' | 'custom' | string;
  url?: string;
  className?: string;
  dividerBefore?: boolean;
}

export interface CompanyAPI {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  tags: string[];
  compatibility: string;
  version: string;
  availableVersions: string[];
  status: APIStatus;
  price: string;
  pricingType: 'Free' | 'Paid';
  hasFreeTrial?: boolean;
  settingsConfig: SettingTab[];
  settings?: Record<string, any>;
  menuItems?: DropdownMenuItem[];
  settingsUrl?: string;
  documentationUrl?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: number;
  duration: number;
  message: string;
  payload?: any;
}

export interface QueueItem {
  id: string;
  timestamp: string;
  taskName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Processing' | 'Failed' | 'Retrying';
  attempts: number;
  payload?: any;
}

export interface SupportAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  attachments?: SupportAttachment[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  apiId?: string;
  createdAt?: string;
  created_at: string;
  updatedAt?: string;
  updated_at?: string;
  messages: SupportMessage[];
}
