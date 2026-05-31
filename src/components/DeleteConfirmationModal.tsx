import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CompanyAPI } from '../types';
import { Icon } from './Icon';

interface DeleteConfirmationModalProps {
  api: CompanyAPI;
  onClose: () => void;
  onConfirm: (removeAllData: boolean) => Promise<any> | void;
}

export function DeleteConfirmationModal({ api, onClose, onConfirm }: DeleteConfirmationModalProps) {
  const [loadingType, setLoadingType] = useState<'just' | 'all' | null>(null);

  const handleConfirm = async (removeAllData: boolean) => {
    setLoadingType(removeAllData ? 'all' : 'just');
    try {
      await onConfirm(removeAllData);
    } catch (err) {
      console.error(err);
      setLoadingType(null);
    }
  };

  const isPending = loadingType !== null;

  return (
    <div className="nx-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="nx-modal-container nx-delete-modal"
      >
        <div className="nx-delete-content">
          <div className="nx-delete-icon-wrapper" style={{ backgroundColor: 'rgb(254, 242, 242)', color: 'rgb(220, 38, 38)' }}>
            <Icon name="x" size={32} />
          </div>
          <h2>Deactivate API?</h2>
          <p>
            You are about to deactivate <strong>{api.name}</strong>. Would you like to just deactivate the active integration, or also completely remove all of its settings and configuration data?
          </p>

          <div className="nx-delete-actions" style={{ flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => handleConfirm(false)} 
              disabled={isPending}
              className="nx-btn-delete-simple" 
              style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loadingType === 'just' && <Icon name="loader" size={16} className="nx-animate-spin" />}
              {loadingType === 'just' ? 'Deactivating...' : 'Just Deactivate'}
            </button>
            <button 
              onClick={() => handleConfirm(true)} 
              disabled={isPending}
              className="nx-btn-delete-full" 
              style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loadingType === 'all' && <Icon name="loader" size={16} className="nx-animate-spin" />}
              {loadingType === 'all' ? 'Removing Settings...' : 'Deactivate & Remove Settings'}
            </button>
            <button 
              onClick={onClose} 
              disabled={isPending}
              className="nx-btn-cancel" 
              style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
