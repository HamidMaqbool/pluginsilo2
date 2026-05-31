import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';

interface VersionChangeConfirmationModalProps {
  apiName: string;
  targetVersion: string;
  isHittingApi: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VersionChangeConfirmationModal({
  apiName,
  targetVersion,
  isHittingApi,
  onClose,
  onConfirm
}: VersionChangeConfirmationModalProps) {
  return (
    <div className="nx-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="nx-modal-container nx-version-confirm-modal"
      >
        <div className="nx-delete-content">
          <div className={`nx-version-confirm-icon-wrapper ${isHittingApi ? 'nx-api-loading-pulse' : ''}`}>
            {isHittingApi ? (
              <Icon name="loader" size={32} className="nx-animate-spin nx-loader-active" />
            ) : (
              <Icon name="zap" size={32} className="nx-zap-active" />
            )}
          </div>
          
          <h2>{isHittingApi ? 'Sending API Request...' : 'Change Active Plugin Version?'}</h2>
          
          <p>
            {isHittingApi ? (
              <span>Updating active plugin <strong>{apiName}</strong> to version <strong>{targetVersion}</strong>. Please hold on...</span>
            ) : (
              <span>
                You are about to change the version of active plugin <strong>{apiName}</strong> to <strong>{targetVersion}</strong>. 
                This action requires an automated API update, which may cause active connections to refresh. 
                Do you really want to proceed?
              </span>
            )}
          </p>

          <div className="nx-delete-actions" style={{ marginTop: '16px' }}>
            {isHittingApi ? (
              <div className="nx-api-request-loader-container">
                <div className="nx-custom-pulse-bar" />
                <span className="nx-api-endpoint-text">POST /v1/marketplace/plugins/{apiName.toLowerCase().replace(/\s+/g, '-')}/upgrade</span>
              </div>
            ) : (
              <>
                <button 
                  onClick={onConfirm} 
                  className="nx-btn-upgrade-confirm"
                  disabled={isHittingApi}
                >
                  <Icon name="check" size={16} /> Yes, Change Version
                </button>
                <button 
                  onClick={onClose} 
                  className="nx-btn-upgrade-cancel"
                  disabled={isHittingApi}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
