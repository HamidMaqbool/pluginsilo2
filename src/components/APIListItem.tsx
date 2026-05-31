import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyAPI, APIStatus } from '../types';
import { Icon } from './Icon';
import { VersionSelector } from './VersionSelector';
import { VersionChangeConfirmationModal } from './VersionChangeConfirmationModal';
import { useCompanyAPIStore } from '../config';
import { useAppStore } from '../store/appStore';

interface APIListItemProps {
  api: CompanyAPI;
  key?: string | number;
}

export function APIListItem({ api }: APIListItemProps) {
  const [selectedVersion, setSelectedVersion] = useState(api.version);
  const [pendingVersionChange, setPendingVersionChange] = useState<string | null>(null);
  const [isHittingApi, setIsHittingApi] = useState(false);

  const updateApiStatusAction = useCompanyAPIStore(state => state.updateApiStatusAction);
  const changeActiveApiVersionAction = useCompanyAPIStore(state => state.changeActiveApiVersionAction);
  
  const licenseValid = useAppStore(state => state.licenseValid);
  const setShowLicenseGate = useAppStore(state => state.setShowLicenseGate);
  const setSelectedApiForSettings = useAppStore(state => state.setSelectedApiForSettings);
  const setApiToDelete = useAppStore(state => state.setApiToDelete);

  const [statusLoading, setStatusLoading] = useState<APIStatus | null>(null);

  useEffect(() => {
    setSelectedVersion(api.version);
  }, [api.version]);

  const handleStatusChange = async (status: APIStatus) => {
    setStatusLoading(status);
    await updateApiStatusAction(api.id, status, { version: selectedVersion });
    setStatusLoading(null);
  };

  const handleOpenSettings = () => {
    if (!licenseValid) {
      setShowLicenseGate(true);
    } else {
      setSelectedApiForSettings(api);
    }
  };

  const handleUninstall = () => {
    setApiToDelete(api);
  };

  const handleVersionChangeSelect = (newVersion: string) => {
    if (api.status === APIStatus.ACTIVE) {
      setPendingVersionChange(newVersion);
    } else {
      setSelectedVersion(newVersion);
    }
  };

  const handleConfirmVersionChange = async () => {
    if (!pendingVersionChange) return;
    setIsHittingApi(true);
    const res = await changeActiveApiVersionAction(api.id, pendingVersionChange, api.version);
    setIsHittingApi(false);
    if (res && res.success) {
      setSelectedVersion(pendingVersionChange);
    }
    setPendingVersionChange(null);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="nx-api-list-item"
    >
      <div className="nx-list-logo-wrapper">
        <img 
          src={api.logo} 
          alt={api.name} 
          className="nx-list-api-logo"
          referrerPolicy="no-referrer"
        />
        {api.status === APIStatus.ACTIVE && (
          <div className="nx-list-status-badge">
            <Icon name="check" size={10} />
          </div>
        )}
      </div>

      <div className="nx-list-content">
        <div className="nx-list-title-row">
          <h3>{api.name}</h3>
          <div className="nx-tags-list">
            {api.tags?.map(tag => (
              <span key={tag} className="nx-tag-micro">{tag}</span>
            ))}
          </div>
          <span className="nx-category-tag">{api.category}</span>
          <span className="nx-category-tag" style={{ backgroundColor: 'var(--nx-indigo-50)', color: 'var(--nx-indigo-600)' }}>{api.price}</span>
          {api.hasFreeTrial && (
            <span className="nx-category-tag" style={{ backgroundColor: 'var(--nx-emerald-50)', color: 'var(--nx-emerald-700)' }}>Free Trial</span>
          )}
        </div>
        <p className="nx-list-description">{api.description}</p>
      </div>

      <div className="nx-list-version" style={{ marginRight: '16px' }}>
        <span className="nx-version-label" style={{ marginBottom: '4px', display: 'block' }}>Version</span>
        <VersionSelector
          version={selectedVersion}
          availableVersions={api.availableVersions || []}
          onChange={handleVersionChangeSelect}
        />
      </div>

      <div className="nx-list-actions">
        {api.status === APIStatus.IDLE && (
          <button 
            onClick={() => handleStatusChange(APIStatus.DOWNLOADING)} 
            disabled={!!statusLoading}
            className={`nx-btn ${statusLoading === APIStatus.DOWNLOADING ? 'nx-btn-loading' : 'nx-btn-dark'}`}
          >
            {statusLoading === APIStatus.DOWNLOADING ? (
              <>
                <Icon name="loader" size={16} className="nx-animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Icon name="download" size={16} />
                Download
              </>
            )}
          </button>
        )}

        {api.status === APIStatus.DOWNLOADING && (
          <button disabled className="nx-btn nx-btn-loading">
            <Icon name="loader" size={16} className="nx-animate-spin" />
            Downloading...
          </button>
        )}

        {(api.status === APIStatus.DOWNLOADED || api.status === APIStatus.ACTIVE) && (
          <>
            {api.status === APIStatus.DOWNLOADED ? (
              <button 
                onClick={() => handleStatusChange(APIStatus.ACTIVE)} 
                disabled={!!statusLoading}
                className="nx-btn nx-btn-primary"
              >
                {statusLoading === APIStatus.ACTIVE ? (
                  <>
                    <Icon name="loader" size={16} className="nx-animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Icon name="play" size={16} />
                    Activate
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setApiToDelete(api)} 
                disabled={!!statusLoading}
                className="nx-btn nx-deactivate-btn"
              >
                {statusLoading === APIStatus.DOWNLOADED ? (
                  <>
                    <Icon name="loader" size={16} className="nx-animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Icon name="x" size={16} />
                    Deactivate
                  </>
                )}
              </button>
            )}
          </>
        )}

        {api.settingsUrl && (
          <button 
            onClick={() => window.open(api.settingsUrl, '_blank')} 
            className="nx-more-button" 
            title="Settings"
          >
            <Icon name="settings" size={18} />
          </button>
        )}

        {api.documentationUrl && (
          <button 
            onClick={() => window.open(api.documentationUrl, '_blank')} 
            className="nx-more-button" 
            title="Documentation"
          >
            <Icon name="book" size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {pendingVersionChange && (
          <VersionChangeConfirmationModal
            apiName={api.name}
            targetVersion={pendingVersionChange}
            isHittingApi={isHittingApi}
            onClose={() => setPendingVersionChange(null)}
            onConfirm={handleConfirmVersionChange}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
