import { ajaxRequest } from './helpers/ajaxHelper';
import { create } from 'zustand';
import { CompanyAPI, APIStatus } from './types';
import { useAppStore } from './store/appStore';

export function parseApis(rawApis: any): CompanyAPI[] {
  if (!rawApis) return [];
  const apisObj: Record<string, any> = typeof rawApis === 'string' ? JSON.parse(rawApis) : rawApis;
  const list: CompanyAPI[] = [];
  const entries = Object.entries(apisObj);

  // Find full API definitions
  const apiDefinitions = entries.filter(([key, val]) => {
    return val && typeof val === 'object' && val.id && val.name;
  }).map(([key, val]) => val);

  // Find other config objects (status, version, etc.) indexed by ID
  const apiStatuses = entries.reduce((acc, [key, val]) => {
    if (val && typeof val === 'object' && !val.name) {
      acc[key] = val;
    }
    return acc;
  }, {} as Record<string, any>);

  apiDefinitions.forEach((apiDef: any) => {
    const savedState = apiStatuses[apiDef.id] || apisObj[apiDef.id] || {};
    let settings = savedState.settings || apiDef.settings || {};

    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        // Fallback
      }
    }

    let menuItems = apiDef.menuItems || apiDef.menu_items || savedState.menuItems || savedState.menu_items;
    if (typeof menuItems === 'string') {
      try {
        menuItems = JSON.parse(menuItems);
      } catch (e) {
        // Fallback
      }
    }

    const settingsUrl = apiDef.settingsUrl || apiDef.settings_url || savedState.settingsUrl || savedState.settings_url;
    const documentationUrl = apiDef.documentationUrl || apiDef.documentation_url || savedState.documentationUrl || savedState.documentation_url;

    let updatedSettingsConfig = apiDef.settingsConfig || [];
    if (settings && Object.keys(settings).length > 0) {
      updatedSettingsConfig = (apiDef.settingsConfig || []).map((tab: any) => {
        const fields = (tab.fields || []).map((field: any) => {
          if (Object.prototype.hasOwnProperty.call(settings, field.key)) {
            return {
              ...field,
              defaultValue: settings[field.key]
            };
          }
          return field;
        });
        return {
          ...tab,
          fields
        };
      });
    }

    list.push({
      ...apiDef,
      settingsConfig: updatedSettingsConfig,
      status: savedState.status || apiDef.status || 'IDLE',
      version: savedState.version || apiDef.version || 'v1.0',
      settings: settings,
      menuItems: Array.isArray(menuItems) ? menuItems : undefined,
      settingsUrl: settingsUrl,
      documentationUrl: documentationUrl,
      ...savedState
    });
  });

  return list;
}

interface CompanyAPIStoreState {
  apis: CompanyAPI[];
  loading: boolean;
  error: string;
  fetchCompanyAPIs: () => Promise<void>;
  updateApiStatusAction: (id: string, status: APIStatus, data?: any) => Promise<any>;
  handleSaveSettingsAction: (id: string, settings: Record<string, any>, version: string) => Promise<any>;
  changeActiveApiVersionAction: (id: string, newVersion: string, currentVersion: string) => Promise<any>;
}

export const useCompanyAPIStore = create<CompanyAPIStoreState>((set) => ({
  apis: [],
  loading: false,
  error: '',
  fetchCompanyAPIs: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await ajaxRequest({
        type: 'ps_get_company_apis',
        data: {}
      });
      if (response && response.success) {
        set({ apis: parseApis(response.data.apis), loading: false });
      } else {
        set({ error: response?.data?.message || 'Failed to load APIs', loading: false });
      }
    } catch (err) {
      set({ error: 'Error loading APIs', loading: false });
    }
  },
  updateApiStatusAction: async (id, status, data = {}) => {
    const isLicenseValid = useAppStore.getState().licenseValid;
    if (!isLicenseValid && status !== APIStatus.DOWNLOADED) {
      useAppStore.getState().setShowLicenseGate(true);
      return { success: false, message: 'License required' };
    }

    const previousApis = useCompanyAPIStore.getState().apis;
    const currentApi = previousApis.find(api => api.id === id);
    const previousStatus = currentApi ? currentApi.status : APIStatus.IDLE;
    const previousVersion = currentApi ? currentApi.version : '';

    try {
      const response = await ajaxRequest({
        type: 'ps_update_api_status',
        data: { api_id: id, status, ...data }
      });

      if (response && response.success) {
        // Decide what final status we transition to
        let finalStatus = status;
        if (status === APIStatus.DOWNLOADING) {
          finalStatus = APIStatus.DOWNLOADED;
        }

        // Check if server specified the status inside the response data
        if (response.data?.apis?.[id]?.status) {
          finalStatus = response.data.apis[id].status as APIStatus;
        }

        const updatedApis = parseApis(response.data?.apis || previousApis);
        set({ apis: updatedApis });
      } else {
        // If server failed, let's look if it returned the correct current status in payload
        let targetRevertStatus = previousStatus;
        if (response?.data?.apis?.[id]?.status) {
          targetRevertStatus = response.data.apis[id].status as APIStatus;
        }

        set(state => ({
          apis: state.apis.map(api =>
            api.id === id ? { ...api, status: targetRevertStatus, version: previousVersion } : api
          )
        }));

        // Show error message
        const errorMsg = response?.data?.message || response?.message || 'Failed to update API status.';
        useAppStore.getState().addToast(errorMsg, 'warning', 'Error');
      }
      return response;
    } catch (err) {
      console.error(err);
      useAppStore.getState().addToast('Network error occurred. Please try again.', 'warning', 'Connection Error');
      return { success: false };
    }
  },
  handleSaveSettingsAction: async (id, settings, version) => {
    try {
      const api = useCompanyAPIStore.getState().apis.find(a => a.id === id);
      let filteredSettings = settings;
      if (api && api.settingsConfig) {
        const allowedKeys = new Set<string>();
        (api.settingsConfig || []).forEach(tab => {
          (tab.fields || []).forEach(field => {
            allowedKeys.add(field.key);
          });
        });
        filteredSettings = {};
        Object.keys(settings).forEach(key => {
          if (allowedKeys.has(key)) {
            filteredSettings[key] = settings[key];
          }
        });
      }

      const response = await ajaxRequest({
        type: 'ps_update_api_settings',
        data: { api_id: id, settings: JSON.stringify(filteredSettings), version }
      });
      if (response && response.success) {
        // Immediately persist the modified settings/version in local store state
        set(state => ({
          apis: state.apis.map(a => {
            if (a.id === id) {
              const updatedSettings = {
                ...(a.settings || {}),
                ...filteredSettings
              };
              const updatedSettingsConfig = (a.settingsConfig || []).map((tab: any) => {
                const fields = (tab.fields || []).map((field: any) => {
                  if (Object.prototype.hasOwnProperty.call(updatedSettings, field.key)) {
                    return {
                      ...field,
                      defaultValue: updatedSettings[field.key]
                    };
                  }
                  return field;
                });
                return {
                  ...tab,
                  fields
                };
              });

              return {
                ...a,
                version: version || a.version,
                settings: updatedSettings,
                settingsConfig: updatedSettingsConfig
              };
            }
            return a;
          })
        }));

        if (response.data && response.data.apis) {
          set({ apis: parseApis(response.data.apis) });
        }
      }
      return response;
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  },
  changeActiveApiVersionAction: async (id, newVersion, currentVersion) => {
    // Optimistically update the version in state
    set(state => ({
      apis: state.apis.map(api =>
        api.id === id ? { ...api, version: newVersion } : api
      )
    }));

    try {
      const response = await ajaxRequest({
        type: 'ps_update_api_status',
        data: {
          api_id: id,
          status: APIStatus.ACTIVE,
          current_version: currentVersion,
          version: newVersion,
          version_changed: true
        }
      });
      if (response && response.success) {
        return response;
      } else {
        // Revert in case of failure
        set(state => ({
          apis: state.apis.map(api =>
            api.id === id ? { ...api, version: currentVersion } : api
          )
        }));
        const errorMsg = response?.data?.message || response?.message || 'Failed to change version.';
        useAppStore.getState().addToast(errorMsg, 'warning', 'Error');
        return response || { success: false };
      }
    } catch (err) {
      console.error(err);
      // Revert in case of failure
      set(state => ({
        apis: state.apis.map(api =>
          api.id === id ? { ...api, version: currentVersion } : api
        )
      }));
      useAppStore.getState().addToast('Network error occurred during version change.', 'warning', 'Connection Error');
      return { success: false };
    }
  }
}));


