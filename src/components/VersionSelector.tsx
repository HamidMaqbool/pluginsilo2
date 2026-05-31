import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';

interface VersionSelectorProps {
  version: string;
  availableVersions: string[];
  onChange: (version: string) => void;
}

export function VersionSelector({ version, availableVersions, onChange }: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="nx-version-selector-container" ref={containerRef}>
      <button 
        type="button" 
        className={`nx-version-selector-trigger ${isOpen ? 'nx-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="nx-version-selector-label">v.{version.replace(/^v/, '')}</span>
        <svg 
          className={`nx-version-chevron ${isOpen ? 'nx-rotated' : ''}`} 
          viewBox="0 0 24 24" 
          width="14" 
          height="14" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="nx-version-dropdown-menu"
            role="listbox"
          >
            {availableVersions.map((v) => (
              <button
                key={v}
                type="button"
                role="option"
                aria-selected={v === version}
                className={`nx-version-dropdown-item ${v === version ? 'nx-active' : ''}`}
                onClick={() => {
                  onChange(v);
                  setIsOpen(false);
                }}
              >
                <span className="nx-version-item-text">{v}</span>
                {v === version && (
                  <Icon name="check" size={14} className="nx-version-check-icon" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
