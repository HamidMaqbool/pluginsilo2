import { APIStatus, CompanyAPI } from './types';
import { useCompanyAPIStore, parseApis } from './config';
import { ajaxRequest } from './helpers/ajaxHelper';

export const setApiStatus = (id: string, status: APIStatus, data = {}) => {
  useCompanyAPIStore.setState(state => ({
    apis: state.apis.map(api =>
      api.id === id ? { ...api, status } : api
    )
  }));
  if (data) {
    return ajaxRequest({
      type: 'ps_update_api_status',
      data: { api_id: id, status, ...data }
    });
  }
};

export const handleDownload = (id: string, licenseValid: boolean, setShowLicenseGate: (b: boolean) => void) => {
  if (!licenseValid) {
    setShowLicenseGate(true);
  } else {
    setApiStatus(id, APIStatus.DOWNLOADING).then((res) => {
      if (res && res.success) {
        setApiStatus(id, APIStatus.DOWNLOADED, false);
      } else {
        setApiStatus(id, APIStatus.IDLE, false);
      }
    });
  }
};

export const handleActivate = (id: string, licenseValid: boolean, setShowLicenseGate: (b: boolean) => void) => {
  if (!licenseValid) {
    setShowLicenseGate(true);
  } else {
    setApiStatus(id, APIStatus.ACTIVE);
  }
};

export const handleDeactivate = (id: string) => {
  setApiStatus(id, APIStatus.DOWNLOADED);
};

export const handleUninstall = (id: string, licenseValid: boolean, setShowLicenseGate: (b: boolean) => void, setApiToDelete: (api: CompanyAPI | null) => void, removeAllData: boolean = false) => {
  if (!licenseValid) {
    setShowLicenseGate(true);
    return;
  }
  setApiStatus(id, APIStatus.IDLE, { removeAllData }).then(() => {
    setApiToDelete(null);
  });
};

export const handleSaveSettings = (id: string, settings: Record<string, any>, version: string, setSelectedApiForSettings: (api: CompanyAPI | null) => void) => {
  setSelectedApiForSettings(null);
  
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

  ajaxRequest({
    type: 'ps_update_api_settings',
    data: { api_id: id, settings: JSON.stringify(filteredSettings), version }
  }).then((res) => {
    if (res && res.success && res.data && res.data.apis) {
      useCompanyAPIStore.setState({ apis: parseApis(res.data.apis) });
    }
  });
};

export const handleVersionChange = (id: string, version: string, apis: CompanyAPI[], setPendingVersionChange: (v: { id: string, version: string, name: string } | null) => void) => {
  const api = apis.find(a => a.id === id);
  if (api && api.status === APIStatus.ACTIVE) {
    setPendingVersionChange({ id, version, name: api.name });
  } else {
    // executeVersionChange(id, version);
  }
};
