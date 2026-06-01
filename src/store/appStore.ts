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
  notifications: { id: string; message: string; type: string }[];
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
  notifications: [],
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
        const fetchedKey = response.data.licenseKey || response.data.license_key || response.data.settings?.licenseKey || response.data.settings?.license_key || '';
        let fetchedNotifications = response.data.notifications || response.data.settings?.notifications;
        let normalizedNotifications = [];
        if (Array.isArray(fetchedNotifications)) {
          normalizedNotifications = fetchedNotifications;
        } else if (fetchedNotifications && typeof fetchedNotifications === 'object') {
          // Check if it is a dictionary/object and convert it to array
          normalizedNotifications = Object.values(fetchedNotifications);
        }
        set({ 
          settings: response.data.settings || {}, 
          licenseValid, 
          licenseKey: fetchedKey || (licenseValid ? 'PLST-CONN-ACTIVE-2026' : ''),
          notifications: normalizedNotifications,
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
      if (res?.success) {
        const key = res.data?.licenseKey || res.data?.license_key || res.data?.key || (typeof res.data === 'string' ? res.data : '');
        if (key) {
          set({ licenseKey: key });
        } else if (get().licenseValid) {
          set({ licenseKey: 'PLST-CONN-ACTIVE-2026' });
        }
      } else if (get().licenseValid) {
        set({ licenseKey: 'PLST-CONN-ACTIVE-2026' });
      }
    } catch (err) {
      console.error('Error fetching license key:', err);
      if (get().licenseValid) {
        set({ licenseKey: 'PLST-CONN-ACTIVE-2026' });
      }
    }
  },

  setShowLicenseGate: (show) => set({ showLicenseGate: show }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedApiForSettings: (api) => set({ selectedApiForSettings: api }),
  setSelectedApiForLogs: (api) => set({ selectedApiForLogs: api }),
  setSelectedApiForQueue: (api) => set({ selectedApiForQueue: api }),
  setApiToDelete: (api) => set({ apiToDelete: api }),
  setShowGeneralSettings: (show) => set({ showGeneralSettings: show }),
  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
    ajaxRequest({
      type: 'ps_dismiss_notification',
      data: { notification_id: id }
    }).catch(err => {
      console.error('Failed to dismiss notification:', err);
    });
  },
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
