import { create } from 'zustand';
import { ajaxRequest } from '../helpers/ajaxHelper';
import { CompanyAPI } from '../types';

interface AppState {
  settings: Record<string, any>;
  licenseValid: boolean;
  licenseKey: string;
  loading: boolean;
  error: string;
  showLicenseGate: boolean;
  currentPage: 'marketplace' | 'analytics' | 'logs' | 'queue' | 'support';
  selectedApiForSettings: CompanyAPI | null;
  selectedApiForLogs: CompanyAPI | null;
  selectedApiForQueue: CompanyAPI | null;
  apiToDelete: CompanyAPI | null;
  showGeneralSettings: boolean;
  notifications: { id: string; message: string; type: 'warning' | 'info' }[];
  toasts: { id: string; message: string; type: 'warning' | 'info' | 'success'; title?: string }[];
  
  fetchSettings: () => Promise<void>;
  fetchLicenseKey: () => Promise<void>;
  setShowLicenseGate: (show: boolean) => void;
  setCurrentPage: (page: 'marketplace' | 'analytics' | 'logs' | 'queue' | 'support') => void;
  setSelectedApiForSettings: (api: CompanyAPI | null) => void;
  setSelectedApiForLogs: (api: CompanyAPI | null) => void;
  setSelectedApiForQueue: (api: CompanyAPI | null) => void;
  setApiToDelete: (api: CompanyAPI | null) => void;
  setShowGeneralSettings: (show: boolean) => void;
  dismissNotification: (id: string) => void;
  addNotification: (message: string, type?: 'warning' | 'info') => void;
  addToast: (message: string, type?: 'warning' | 'info' | 'success', title?: string) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: {},
  licenseValid: false,
  licenseKey: '',
  loading: true,
  error: '',
  showLicenseGate: false,
  currentPage: 'marketplace',
  selectedApiForSettings: null,
  selectedApiForLogs: null,
  selectedApiForQueue: null,
  apiToDelete: null,
  showGeneralSettings: false,
  notifications: [
    { id: '1', message: 'System maintenance scheduled for Sunday at 02:00 AM UTC.', type: 'info' },
    { id: '2', message: 'Your Stripe Connect API key is expiring in 3 days.', type: 'warning' }
  ],
  toasts: [],

  fetchSettings: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await ajaxRequest({
        type: 'ps_get_settings',
        data: {}
      });
      if (response && response.success) {
        const licenseValid = !!response.data.licenseValid;
        set({ 
          settings: response.data.settings || {}, 
          licenseValid, 
          loading: false,
          showLicenseGate: !licenseValid
        });
      } else {
        set({ error: response?.data?.message || 'Failed to load settings', loading: false });
      }
    } catch (err) {
      set({ error: 'Error loading settings', loading: false });
    }
  },

  fetchLicenseKey: async () => {
    try {
      const res = await ajaxRequest({
        type: 'ps_license_key',
        data: {},
      });
      if (res?.success && res?.data?.licenseKey) {
        set({ licenseKey: res.data.licenseKey });
      }
    } catch (err) {
      console.error('Error fetching license key:', err);
    }
  },

  setShowLicenseGate: (show) => set({ showLicenseGate: show }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedApiForSettings: (api) => set({ selectedApiForSettings: api }),
  setSelectedApiForLogs: (api) => set({ selectedApiForLogs: api }),
  setSelectedApiForQueue: (api) => set({ selectedApiForQueue: api }),
  setApiToDelete: (api) => set({ apiToDelete: api }),
  setShowGeneralSettings: (show) => set({ showGeneralSettings: show }),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  addNotification: (message, type = 'warning') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      notifications: [{ id, message, type }, ...state.notifications]
    }));
  },
  addToast: (message, type = 'warning', title) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      toasts: [{ id, message, type, title }, ...state.toasts]
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 5000);
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
