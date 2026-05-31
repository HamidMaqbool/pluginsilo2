import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { ajaxRequest, getSupportUrl } from '../helpers/ajaxHelper';
import { useAppStore } from '../store/appStore';

interface LicenseGateProps {
  onValidated: (key: string) => void;
  onClose?: () => void;
}

type ConnectionStep = 'idle' | 'working' | 'error';

export function LicenseGate({ onValidated, onClose }: LicenseGateProps) {
  const [step, setStep] = useState<ConnectionStep>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  
  const handleConnect = async () => {
    setStep('working');
    setStatusMessage('Establishing secure connection with the server...');
    setErrorText('');

    try {
      const response = await ajaxRequest({
        type: 'ps_connection',
        data: {}
      });

      if (response && response.success) {
        // If success in response appears, hide the modal immediately
        useAppStore.setState({ 
          licenseValid: true,
          showLicenseGate: false
        });
        onValidated('connected');
      } else {
        // Else show the response message and allow trying again
        const msg = response?.data?.message || response?.message || 'Disconnection or validation error. Secure validation failed.';
        setErrorText(msg);
        setStep('error');
      }
    } catch (err: any) {
      setErrorText(err?.message || 'A network error occurred. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="nx-license-gate" id="siteConnectionGate">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="nx-license-card"
        style={{ maxWidth: '520px' }}
      >
        <div className="nx-license-header">
          {step === 'idle' && (
            <>
              <div className="nx-license-icon" style={{ backgroundColor: 'var(--nx-indigo-50)', color: 'var(--nx-indigo-500)' }}>
                <Icon name="globe" size={32} />
              </div>
              <h2>Connection Required</h2>
              <p>Your WordPress site needs to be interconnected to the host platform in order to activate the API Marketplace.</p>
            </>
          )}

          {step === 'working' && (
            <>
              <div className="nx-license-icon" style={{ backgroundColor: 'var(--nx-indigo-50)', color: 'var(--nx-indigo-600)' }}>
                <Icon name="loader" size={32} className="nx-animate-spin" />
              </div>
              <h2>Connecting site...</h2>
              <p className="nx-mono" style={{ fontSize: '13px', marginTop: '12px', color: 'var(--nx-slate-500)' }}>
                {statusMessage}
              </p>
            </>
          )}

          {step === 'error' && (
            <>
              <div className="nx-license-icon" style={{ backgroundColor: 'var(--nx-red-50)', color: 'var(--nx-red-500)' }}>
                <Icon name="shield" size={32} />
              </div>
              <h2>Connection Failed</h2>
              <p style={{ color: 'var(--nx-red-600)', marginTop: '8px' }}>{errorText}</p>
            </>
          )}
        </div>

        {step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: 'var(--nx-slate-50)',
              border: '1px solid var(--nx-slate-200)',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '13px',
              color: 'var(--nx-slate-600)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--nx-slate-800)' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--nx-red-500)' }} />
                Status: Unconnected
              </div>
              <div>This plugin silo operates inside a WordPress container. Establish verification to continue.</div>
            </div>

            <button 
              onClick={handleConnect}
              className="nx-btn-license"
            >
              <Icon name="play" size={16} />
              Establish Connection
            </button>
          </div>
        )}

        {step === 'working' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <div style={{
              width: '100%',
              backgroundColor: 'var(--nx-slate-100)',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <motion.div 
                style={{
                  height: '100%',
                  backgroundColor: 'var(--nx-indigo-500)',
                  borderRadius: '4px',
                }}
                animate={{
                  width: ['10%', '65%', '90%'],
                }}
                transition={{
                  duration: 4,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </div>
        )}

        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleConnect}
              className="nx-btn-license"
              style={{ backgroundColor: 'var(--nx-slate-800)' }}
            >
              <Icon name="history" size={16} />
              Retry Connection
            </button>
          </div>
        )}

        <div className="nx-license-footer">
          <p>Require help? <a href={getSupportUrl()} target="_blank" rel="noopener noreferrer">Contact Enterprise Support</a></p>
        </div>
      </motion.div>
    </div>
  );
}
