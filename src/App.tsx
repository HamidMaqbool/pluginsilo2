import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIStatus } from './types';
import { useCompanyAPIStore } from './config';
import { useAppStore } from './store/appStore';
import MarketplacePage from './pages/MarketplacePage';
import { Icon } from './components/Icon';
import { SettingsModal } from './components/SettingsModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { LicenseGate } from './components/LicenseGate';
import { getSupportUrl } from './helpers/ajaxHelper';

export default function App() {
  const fetchCompanyAPIs = useCompanyAPIStore(state => state.fetchCompanyAPIs);
  const updateApiStatusAction = useCompanyAPIStore(state => state.updateApiStatusAction);
  const handleSaveSettingsAction = useCompanyAPIStore(state => state.handleSaveSettingsAction);

  const fetchSettings = useAppStore(state => state.fetchSettings);
  const fetchLicenseKey = useAppStore(state => state.fetchLicenseKey);
  const licenseValid = useAppStore(state => state.licenseValid);
  const showLicenseGate = useAppStore(state => state.showLicenseGate);
  const setShowLicenseGate = useAppStore(state => state.setShowLicenseGate);
  const currentPage = useAppStore(state => state.currentPage);
  const setCurrentPage = useAppStore(state => state.setCurrentPage);
  const selectedApiForSettings = useAppStore(state => state.selectedApiForSettings);
  const setSelectedApiForSettings = useAppStore(state => state.setSelectedApiForSettings);
  const selectedApiForLogs = useAppStore(state => state.selectedApiForLogs);
  const setSelectedApiForLogs = useAppStore(state => state.setSelectedApiForLogs);
  const selectedApiForQueue = useAppStore(state => state.selectedApiForQueue);
  const setSelectedApiForQueue = useAppStore(state => state.setSelectedApiForQueue);
  const apiToDelete = useAppStore(state => state.apiToDelete);
  const setApiToDelete = useAppStore(state => state.setApiToDelete);
  const notifications = useAppStore(state => state.notifications) || [];
  const dismissNotification = useAppStore(state => state.dismissNotification);
  const toasts = useAppStore(state => state.toasts);
  const dismissToast = useAppStore(state => state.dismissToast);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const inlineNotifications = safeNotifications.filter(n => n && n.type !== 'alert');
  const alertNotifications = safeNotifications.filter(n => n && n.type === 'alert');
  const currentAlert = alertNotifications[0];

  useEffect(() => {
    fetchCompanyAPIs();
    fetchSettings();
    fetchLicenseKey();
  }, [fetchCompanyAPIs, fetchSettings, fetchLicenseKey]);

  const handleUninstall = (id: string, removeAllData: boolean = false) => {
    const nextStatus = removeAllData ? APIStatus.IDLE : APIStatus.DOWNLOADED;
    return updateApiStatusAction(id, nextStatus, { removeAllData }).then(() => {
      setApiToDelete(null);
    });
  };

  const handleSaveSettings = (id: string, settings: Record<string, any>, version: string) => {
    setSelectedApiForSettings(null);
    handleSaveSettingsAction(id, settings, version);
  };

  return (
    <div className="nx-app-root">
      <AnimatePresence>
        {showLicenseGate && !licenseValid && (
          <LicenseGate
            onValidated={() => {
              setShowLicenseGate(false);
            }}
            onClose={() => setShowLicenseGate(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Global Toast Notifications Container */}
      <div className="nx-toasts-container">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const title = t.title || (t.type === 'warning' ? "Attention" : t.type === 'success' ? 'Success' : 'Message');
            const iconName = t.type === 'warning' ? 'shield' : t.type === 'success' ? 'play' : 'bell';
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.85, x: 60 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 100, transition: { duration: 0.2 } }}
                layout
                className={`nx-toast-card nx-toast-${t.type}`}
              >
                {/* Left side accent indicator */}
                <div className="nx-toast-accent-bar" />
                
                {/* Icon Circle */}
                <div className="nx-toast-icon-wrapper">
                  <Icon name={iconName} size={16} />
                </div>

                {/* Text Content */}
                <div className="nx-toast-text-container">
                  <div className="nx-toast-title">{title}</div>
                  <div className="nx-toast-message">{t.message}</div>
                </div>

                {/* Circle style Close Button */}
                <button
                  onClick={() => dismissToast(t.id)}
                  className="nx-toast-close-button"
                  aria-label="Dismiss notification"
                >
                  <Icon name="x" size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <main className="nx-main-content">
        <AnimatePresence>
          {inlineNotifications.length > 0 && currentPage === 'marketplace' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="nx-notifications-container"
            >
              {inlineNotifications.map(n => {
                const iconName = n.type === 'success' ? 'check' : (n.type === 'error' || n.type === 'warning' ? 'shield' : 'bell');
                const isPermanent = n.id && n.id.toLowerCase().includes('permanent');
                return (
                  <div key={n.id} className={`nx-notification-banner nx-notification-${n.type}`}>
                    <div className="nx-notification-content">
                      <Icon name={iconName} size={16} />
                      <span>{n.message}</span>
                    </div>
                    {!isPermanent && (
                      <button onClick={() => dismissNotification(n.id)} className="nx-notification-close">
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <MarketplacePage />
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedApiForSettings && (
          <SettingsModal
            api={selectedApiForSettings}
            onClose={() => setSelectedApiForSettings(null)}
            onSave={handleSaveSettings}
          />
        )}
        {apiToDelete && (
          <DeleteConfirmationModal
            api={apiToDelete}
            onClose={() => setApiToDelete(null)}
            onConfirm={(removeAllData) => handleUninstall(apiToDelete.id, removeAllData)}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Alert Notification Modal */}
      <AnimatePresence>
        {currentAlert && (
          <div className="nx-modal-overlay" style={{ zIndex: 200 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="nx-alert-modal-container"
            >
              <div className="nx-alert-modal-header">
                <div className="nx-alert-icon-ring" style={{ backgroundColor: 'var(--nx-indigo-50)', color: 'var(--nx-indigo-600)', borderColor: 'var(--nx-indigo-100)' }}>
                  <Icon name="bell" size={28} />
                </div>
                <h3>Action Required</h3>
              </div>
              <div className="nx-alert-modal-body">
                {currentAlert.message}
              </div>
              <div className="nx-alert-modal-footer">
                <button
                  onClick={() => {
                    window.open(getSupportUrl(), '_blank', 'noopener,noreferrer');
                  }}
                  className="nx-btn-alert-support"
                >
                  <Icon name="bell" size={16} />
                  <span>Contact Support</span>
                </button>
                {!(currentAlert.id && currentAlert.id.toLowerCase().includes('permanent')) && (
                  <button
                    onClick={() => {
                      dismissNotification(currentAlert.id);
                    }}
                    className="nx-btn-alert-cancel"
                  >
                    <span>Close</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
