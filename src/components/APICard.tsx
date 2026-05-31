import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyAPI, APIStatus } from '../types';
import { Icon } from './Icon';
import { VersionSelector } from './VersionSelector';
import { VersionChangeConfirmationModal } from './VersionChangeConfirmationModal';
import { useCompanyAPIStore } from '../config';
import { useAppStore } from '../store/appStore';

interface APICardProps {
  api: CompanyAPI;
  key?: string | number;
}

export function APICard({ api }: APICardProps) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="nx-api-card"
    >
      <div className="nx-card-image-container">
        <img
          src={api.logo}
          alt={api.name}
          className="nx-api-logo-full"
          referrerPolicy="no-referrer"
        />
        <div className="nx-image-overlay">
          <div className="nx-tags-list">
            {api.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="nx-tag-micro">{tag}</span>
            ))}
          </div>
          {(api.settingsUrl || api.documentationUrl) && (
            <div className="nx-overlay-actions">
              {api.settingsUrl && (
                <button 
                  onClick={() => window.open(api.settingsUrl, '_blank')} 
                  className="nx-more-button-overlay"
                  title="Settings"
                >
                  <Icon name="settings" size={16} />
                </button>
              )}
              {api.documentationUrl && (
                <button 
                  onClick={() => window.open(api.documentationUrl, '_blank')} 
                  className="nx-more-button-overlay"
                  title="Documentation"
                >
                  <Icon name="book" size={16} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="nx-pricing-badge">
          {api.price}
        </div>
        {api.hasFreeTrial && (
          <div className="nx-trial-badge">
            Free Trial
          </div>
        )}
        {api.status === APIStatus.ACTIVE && (
          <div className="nx-status-badge-overlay">
            <Icon name="check" size={12} />
          </div>
        )}
      </div>

      <div className="nx-card-body">
        <div className="nx-body-header">
          <h3>{api.name}</h3>
          <span className="nx-category-tag">{api.category}</span>
        </div>
        <p>{api.description}</p>
      </div>

      <div className="nx-card-footer">
        <div className="nx-version-info">
          <span className="nx-version-label">Version</span>
          <VersionSelector
            version={selectedVersion}
            availableVersions={api.availableVersions || []}
            onChange={handleVersionChangeSelect}
          />
        </div>

        <div className="nx-action-buttons">
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
        </div>
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
