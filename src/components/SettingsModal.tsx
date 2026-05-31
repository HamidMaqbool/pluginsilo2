import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyAPI, SettingTab, SettingField } from '../types';
import { Icon } from './Icon';

interface SettingsModalProps {
  api: CompanyAPI;
  onClose: () => void;
  onSave: (id: string, settings: Record<string, any>, version: string) => void;
}

export function SettingsModal({ api, onClose, onSave }: SettingsModalProps) {
  const [activeTabId, setActiveTabId] = useState(api.settingsConfig?.[0]?.id || '');
  const [version, setVersion] = useState(api.version || '');
  
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    (api.settingsConfig || []).forEach(tab => {
      tab.fields?.forEach(field => {
        defaults[field.key] = field.defaultValue !== undefined ? field.defaultValue : '';
      });
    });
    
    if (api.settings) {
      return { ...defaults, ...api.settings };
    }
    return defaults;
  });

  const activeTab = (api.settingsConfig || []).find(tab => tab.id === activeTabId);

  return (
    <div className="nx-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="nx-modal-container"
      >
        <div className="nx-modal-header">
          <div className="nx-modal-header-info">
            <img src={api.logo} alt={api.name} className="nx-modal-logo" referrerPolicy="no-referrer" />
            <div className="nx-modal-header-text">
              <h2>{api.name} Configuration</h2>
              <p>Manage integration parameters and security</p>
            </div>
          </div>
          <button onClick={onClose} className="nx-icon-button">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="nx-modal-tabs">
          {(api.settingsConfig || []).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`nx-tab-button ${activeTabId === tab.id ? 'nx-active' : ''}`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="nx-modal-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTabId === 'general' && (
                <div className="nx-form-group">
                  <label className="nx-form-label">
                    <Icon name="history" size={14} />
                    API Version
                  </label>
                  <select 
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="nx-form-select"
                  >
                    {api.availableVersions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <p className="nx-form-help">Select the version of the API to use for this integration.</p>
                </div>
              )}

              {activeTab?.fields.map(field => (
                <div key={field.key} className="nx-form-group">
                  <label className="nx-form-label">
                    {field.icon && <Icon name={field.icon} size={14} />}
                    {field.label}
                  </label>
                  
                  {field.type === 'text' || field.type === 'password' || field.type === 'number' ? (
                    <input 
                      type={field.type}
                      value={settings[field.key] ?? ''}
                      onChange={(e) => setSettings({ ...settings, [field.key]: field.type === 'number' ? (e.target.value === '' ? '' : parseInt(e.target.value, 10)) : e.target.value })}
                      className="nx-form-input"
                      placeholder={field.label}
                      style={field.type === 'password' || field.key.toLowerCase().includes('key') ? { fontFamily: 'monospace' } : {}}
                    />
                  ) : field.type === 'select' ? (
                    <div className="nx-env-toggle">
                      {field.options?.map(opt => (
                        <button 
                          key={opt}
                          onClick={() => setSettings({ ...settings, [field.key]: opt })}
                          className={`nx-env-button ${settings[field.key] === opt ? 'nx-active' : ''}`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'toggle' ? (
                    <div className="nx-toggle-card">
                      <div className="nx-toggle-info">
                        {field.icon && (
                          <div className="nx-toggle-icon">
                            <Icon name={field.icon} size={18} />
                          </div>
                        )}
                        <div className="nx-toggle-text">
                          <p>{field.label}</p>
                          {field.helpText && <p>{field.helpText}</p>}
                        </div>
                      </div>
                      <button 
                        onClick={() => setSettings({ ...settings, [field.key]: !settings[field.key] })}
                        className={`nx-switch ${settings[field.key] ? 'nx-active' : ''}`}
                      >
                        <div className="nx-switch-handle" />
                      </button>
                    </div>
                  ) : null}
                  
                  {field.helpText && field.type !== 'toggle' && (
                    <p className="nx-form-help">{field.helpText}</p>
                  )}

                  {field.instruction && (
                    <div className="nx-field-instruction">
                      <Icon name="info" size={14} />
                      <p>{field.instruction}</p>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="nx-modal-footer">
          <button onClick={onClose} className="nx-btn-cancel">
            Cancel
          </button>
          <button 
            onClick={() => {
              const allowedKeys = new Set<string>();
              (api.settingsConfig || []).forEach(tab => {
                tab.fields?.forEach(field => {
                  allowedKeys.add(field.key);
                });
              });
              
              const filteredSettings: Record<string, any> = {};
              Object.keys(settings).forEach(key => {
                if (allowedKeys.has(key)) {
                  filteredSettings[key] = settings[key];
                }
              });
              onSave(api.id, filteredSettings, version);
            }}
            className="nx-btn nx-btn-primary"
            style={{ padding: '10px 32px' }}
          >
            <Icon name="save" size={18} />
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
}
