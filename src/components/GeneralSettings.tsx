import React from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { getSupportUrl } from '../helpers/ajaxHelper';

interface GeneralSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  licenseKey?: string;
  
}

export function GeneralSettings({ isOpen, onClose, licenseKey }: GeneralSettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="nx-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="nx-general-settings-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="nx-panel-header">
          <h3>General Settings</h3>
          <button onClick={onClose} className="nx-close-btn">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="nx-panel-body">
          <div className="nx-settings-section">
            <label className="nx-section-label">Master API Key</label>
            <div className="nx-key-display">
              <code className="nx-key-unmasked">{licenseKey}</code>
              <button className="nx-btn-icon" title="Copy Key">
                <Icon name="save" size={14} />
              </button>
            </div>
            <div className="nx-key-status">
              <span className="nx-status-dot nx-status-success"></span>
              <span className="nx-status-text">Applied & Active</span>
            </div>
          </div>

          <div className="nx-settings-section">
            <label className="nx-section-label">Key Expiry</label>
            <div className="nx-expiry-info">
              <Icon name="history" size={16} />
              <span>Expires on Dec 31, 2026</span>
            </div>
          </div>

          <div className="nx-settings-section">
            <label className="nx-section-label">Quick Links</label>
            <a href="https://crm.example.com/keys" target="_blank" rel="noreferrer" className="nx-crm-link">
              <Icon name="external" size={16} />
              Generate New Key in CRM
            </a>
          </div>

          <div className="nx-settings-divider" />

          <div className="nx-settings-section">
            <label className="nx-section-label">Preferences</label>
            <div className="nx-preference-item">
              <span>Auto-refresh Analytics</span>
              <div className="nx-toggle-switch nx-active"></div>
            </div>
            <div className="nx-preference-item">
              <span>Desktop Notifications</span>
              <div className="nx-toggle-switch"></div>
            </div>
          </div>
        </div>

        <div className="nx-panel-footer">
          <p>Need more help? Visit our <a href={getSupportUrl()} target="_blank" rel="noopener noreferrer" onClick={() => onClose()}>Support Center</a></p>
        </div>
      </motion.div>
    </div>
  );
}
