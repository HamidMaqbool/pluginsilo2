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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPricingType, setSelectedPricingType] = useState<'All' | 'Free' | 'Paid'>('All');

  const allTags = Array.from(new Set(apis.flatMap(api => api.tags || [])));
  const filteredApis = apis.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (api.tags && api.tags.includes(selectedTag));
    const matchesPricing = selectedPricingType === 'All' || api.pricingType === selectedPricingType;
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
    <>
      <ApiCardLoader />
      <ApiCardLoader />
    </>
  );

  return (
    <div className="nx-content-wrapper">
      <div className="nx-page-header">
        <div className="nx-page-title">
          <div className="nx-brand-row">
            <div className="nx-brand-left">
              <Icon name="zap" size={28} className="nx-brand-logo" />
              <h1>API Marketplace</h1>
            </div>
            <div className="nx-brand-actions">
              <button
                onClick={handleRequestCustom}
                className="nx-action-btn-top nx-custom-request-btn"
                title="Request Custom Integration"
              >
                <Icon name="plus" size={18} />
                <span>Request Custom</span>
              </button>
              <button
                onClick={handleOpenSupport}
                className="nx-action-btn-top nx-support-btn nx-prominent"
                title="Support Center"
              >
                <Icon name="bell" size={18} />
                <span>Support</span>
              </button>
              <button
                onClick={() => setShowGeneralSettings(!showGeneralSettings)}
                className={`nx-action-btn-top ${showGeneralSettings ? 'nx-active' : ''}`}
                title="General Settings"
              >
                <Icon name="settings" size={18} />
                <span>Settings</span>
              </button>
            </div>
          </div>
          <p>Discover and manage your enterprise integrations with ease.</p>
        </div>

        <div className="nx-controls-row">
          <div className="nx-search-container">
            <Icon name="search" size={18} className="nx-search-icon" />
            <input
              type="text"
              placeholder="Search APIs..."
              className="nx-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="nx-view-controls">
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

        <div className="nx-tags-filter">
          <button
            onClick={() => setSelectedTag(null)}
            className={`nx-tag-pill ${selectedTag === null ? 'nx-active' : ''}`}
          >
            All
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

        <div className="nx-secondary-filters">
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

      <div className="nx-marketplace-body">
        <div className={viewMode === 'grid' ? "nx-grid-layout" : "nx-list-layout"}>
          {ApiLoading && Loading()}
          <AnimatePresence mode="popLayout">
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
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={viewMode === 'grid' ? "nx-api-card nx-request-card" : "nx-api-list-item nx-request-card"}
              onClick={handleRequestCustom}
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
    </div>
  );
}
