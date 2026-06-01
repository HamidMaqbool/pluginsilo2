import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIStatus, CompanyAPI } from '../types';
import { useCompanyAPIStore } from '../config';
import { APICard } from '../components/APICard';
import { APIListItem } from '../components/APIListItem';
import { GeneralSettings } from '../components/GeneralSettings';
import { Icon } from '../components/Icon';
import ApiCardLoader from '../components/ApiCardLoader';
import { useAppStore } from '../store/appStore';
import { getSupportUrl } from '../helpers/ajaxHelper';

export default function MarketplacePage() {
  const apis = useCompanyAPIStore(state => state.apis);

  const licenseKey = useAppStore(state => state.licenseKey);
  const showGeneralSettings = useAppStore(state => state.showGeneralSettings);
  const setShowGeneralSettings = useAppStore(state => state.setShowGeneralSettings);
  const setCurrentPage = useAppStore(state => state.setCurrentPage);

  const [searchQuery, setSearchQuery] = useState('');
  const [ApiLoading, setApiLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('silo_marketplace_view_mode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('silo_marketplace_view_mode', viewMode);
  }, [viewMode]);
  const [selectedPricingType, setSelectedPricingType] = useState<'All' | 'Free' | 'Paid'>('All');

  const allTags = Array.from(new Set(apis.flatMap(api => api.tags || [])));
  const filteredApis = apis.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (api.tags && api.tags.includes(selectedTag));
    const matchesPricing = selectedPricingType === 'All' || 
      (api.pricingType && String(api.pricingType).toLowerCase() === selectedPricingType.toLowerCase());
    return matchesSearch && matchesTag && matchesPricing;
  });

  useEffect(() => {
    if (filteredApis.length > 0) {
      setApiLoading(false);
    }
  }, [filteredApis]);

  const handleRequestCustom = () => {
    window.open(getSupportUrl(), '_blank', 'noopener,noreferrer');
  };

  const handleOpenSupport = () => {
    window.open(getSupportUrl(), '_blank', 'noopener,noreferrer');
  };

  const Loading = () => (
    <div key="loaders-wrapper" style={{ display: 'contents' }}>
      <ApiCardLoader />
      <ApiCardLoader />
    </div>
  );

  return (
    <div className="nx-content-wrapper">
      <div className="nx-page-header">
        <div className="nx-page-title">
          <div className="nx-brand-row">
            <div className="nx-brand-left">
              <h1>PluginSilo Marketplace</h1>
            </div>
            <div className="nx-brand-actions">
              <button
                onClick={handleOpenSupport}
                className="nx-action-btn-top nx-support-btn nx-prominent"
                title="Support Center"
              >
                <Icon name="bell" size={18} />
                <span>Support</span>
              </button>
            </div>
          </div>
          <p>Discover, install, and manage your premium WordPress plugins and enterprise extensions with ease.</p>
        </div>

        <div className="nx-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: '1 1 auto' }}>
            <div className="nx-search-container" style={{ width: '300px', margin: 0 }}>
              <Icon name="search" size={18} className="nx-search-icon" />
              <input
                type="text"
                placeholder="Search plugins & addons..."
                className="nx-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="nx-secondary-filters" style={{ margin: 0 }}>
              {(['All', 'Free', 'Paid'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedPricingType(type)}
                  className={`nx-filter-btn ${selectedPricingType === type ? 'nx-active' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="nx-view-controls" style={{ margin: 0 }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`nx-view-button ${viewMode === 'grid' ? 'nx-active' : ''}`}
            >
              <Icon name="grid" size={18} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`nx-view-button ${viewMode === 'list' ? 'nx-active' : ''}`}
            >
              <Icon name="list" size={18} />
              List
            </button>
          </div>
        </div>

        <div className="nx-tags-filter" style={{ marginTop: '4px', width: '100%' }}>
          <button
            onClick={() => setSelectedTag(null)}
            className={`nx-tag-pill ${selectedTag === null ? 'nx-active' : ''}`}
          >
            All Plugins
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`nx-tag-pill ${selectedTag === tag ? 'nx-active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="nx-marketplace-body">
        <div className={viewMode === 'grid' ? "nx-grid-layout" : "nx-list-layout"}>
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={viewMode === 'grid' ? "nx-api-card nx-request-card" : "nx-api-list-item nx-request-card"}
              onClick={handleRequestCustom}
              key="custom-request-card"
            >
              <div className="nx-request-content">
                <div className="nx-request-icon">
                  <Icon name="plus" size={32} />
                </div>
                <h3>Need something else?</h3>
                <p>Request a custom plugin or API integration specifically for your needs.</p>
                <button className="nx-btn nx-btn-primary">
                  Request Custom
                </button>
              </div>
            </motion.div>
            {ApiLoading && Loading()}
            {filteredApis.map((api) => (
              viewMode === 'grid' ? (
                <APICard
                  key={api.id}
                  api={api}
                />
              ) : (
                <APIListItem
                  key={api.id}
                  api={api}
                />
              )
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showGeneralSettings && (
            <GeneralSettings
              isOpen={showGeneralSettings}
              licenseKey={licenseKey}
              onClose={() => setShowGeneralSettings(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '48px', paddingBottom: '24px' }}>
        <div className="nx-license-key-badge" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--nx-slate-50)',
          border: '1px solid var(--nx-slate-200)',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--nx-slate-600)',
          fontFamily: 'var(--font-mono)',
          boxShadow: 'var(--nx-shadow-sm)',
        }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            backgroundColor: 'var(--nx-emerald-500)',
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--nx-emerald-100)'
          }}></span>
          <span style={{ color: 'var(--nx-slate-400)', marginRight: '4px' }}>LICENSE KEY:</span>
          <span id="licenseKey">{licenseKey || 'PLST-CONN-ACTIVE-2026'}</span>
        </div>
      </div>
    </div>
  );
}
