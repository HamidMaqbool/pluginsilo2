import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { ajaxRequest } from '../helpers/ajaxHelper';

interface LicenseGateProps {
  onValidated: (key: string) => void;
  onClose?: () => void;
}

export function LicenseGate({ onValidated, onClose }: LicenseGateProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter a valid license key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await ajaxRequest({
        type: 'validate_license_key',
        data: { license_key: key }
      });
      if (!response.success) {
        setError(response.data?.message || response.message || 'Invalid license key.');
        setIsLoading(false);
      } else {
        onValidated(key);
      }
    } catch (err) {
      setError('An error occurred while validating.');
      setIsLoading(false);
    }
  };

  return (
    <div className="nx-license-gate">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="nx-license-card"
      >
        <div className="nx-license-header">
          {onClose && (
            <button onClick={onClose} className="nx-license-close">
              <Icon name="x" size={20} />
            </button>
          )}
          <div className="nx-license-icon">
            <Icon name="shield" size={32} />
          </div>
          <h2>License Required</h2>
          <p>Please enter your enterprise license key to access the API Marketplace.</p>
        </div>

        <form onSubmit={handleSubmit} className="nx-license-form">
          <div className="nx-form-group">
            <label className="nx-form-label">Enterprise License Key</label>
            <div className="nx-input-wrapper">
              <Icon name="key" size={18} className="nx-input-icon" />
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className={`nx-form-input ${error ? 'nx-error' : ''}`}
                disabled={isLoading}
              />
            </div>
            {error && <p className="nx-error-text">{error}</p>}
          </div>

          <button 
            type="submit" 
            className={`nx-btn-license ${isLoading ? 'nx-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icon name="loader" size={18} className="nx-animate-spin" />
                Validating...
              </>
            ) : (
              'Activate License'
            )}
          </button>
        </form>

        <div className="nx-license-footer">
          <p>Don't have a key? <a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a></p>
        </div>
      </motion.div>
    </div>
  );
}
