import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyAPI, APIStatus } from '../types';
import { Icon } from './Icon';
import { VersionSelector } from './VersionSelector';
import { VersionChangeConfirmationModal } from './VersionChangeConfirmationModal';
import { useCompanyAPIStore } from '../config';
import { useAppStore } from '../store/appStore';
import { getSupportUrl } from '../helpers/ajaxHelper';
import { formatRelativeTime, formatPrice, isFutureDate } from '../helpers/dateHelper';

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

      <div className="nx-list-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="nx-list-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--nx-slate-900)' }}>{api.name}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="nx-category-tag" style={{ margin: 0 }}>{api.category}</span>
            <span className="nx-category-tag" style={{ backgroundColor: 'var(--nx-indigo-50)', color: 'var(--nx-indigo-600)', borderColor: 'var(--nx-indigo-100)', margin: 0 }}>
              {formatPrice(api.price)}
            </span>
            {api.hasFreeTrial && (
              <span className="nx-category-tag" style={{ backgroundColor: 'var(--nx-emerald-50)', color: 'var(--nx-emerald-700)', borderColor: 'var(--nx-emerald-100)', margin: 0 }}>
                Free Trial
              </span>
            )}
            {(api.status === APIStatus.EXPIRED || String(api.status).toUpperCase() === 'EXPIRED') && (
              <span className="nx-category-tag" style={{ backgroundColor: 'var(--nx-red-50)', color: 'var(--nx-red-700)', borderColor: 'var(--nx-red-100)', fontWeight: 'bold', margin: 0 }}>
                Expired
              </span>
            )}
          </div>
        </div>

        <p className="nx-list-description" style={{ 
          margin: '2px 0 6px 0', 
          fontSize: '14px', 
          lineHeight: '1.5',
          color: 'var(--nx-slate-500)',
          whiteSpace: 'normal',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {api.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {api.tags && api.tags.length > 0 && (
            <div className="nx-tags-list" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {api.tags.map(tag => (
                <span key={tag} className="nx-tag-micro" style={{ backgroundColor: 'var(--nx-slate-50)', color: 'var(--nx-slate-500)', border: '1px solid var(--nx-slate-100)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {api.expire_at && (
            <span className="nx-category-tag" style={{ 
              backgroundColor: isFutureDate(api.expire_at) ? 'var(--nx-emerald-50)' : 'var(--nx-red-50)', 
              color: isFutureDate(api.expire_at) ? 'var(--nx-emerald-700)' : 'var(--nx-red-700)', 
              border: isFutureDate(api.expire_at) ? '1px solid var(--nx-emerald-100)' : '1px solid var(--nx-red-100)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              margin: 0
            }}>
              <Icon name="history" size={11} />
              Expires {formatRelativeTime(api.expire_at)}
            </span>
          )}
        </div>
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

        {(api.status === APIStatus.EXPIRED || String(api.status).toUpperCase() === 'EXPIRED') && (
          <button 
            onClick={() => window.open(getSupportUrl(), '_blank', 'noopener,noreferrer')}
            className="nx-btn nx-btn-primary"
            style={{ backgroundColor: 'var(--nx-indigo-600)', color: 'var(--nx-white)', border: 'none' }}
          >
            <Icon name="history" size={16} />
            Contact Support
          </button>
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
