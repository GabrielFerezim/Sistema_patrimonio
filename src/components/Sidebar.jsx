import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="brand">
        <svg width="180" height="40" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Navy Blue Box */}
          <rect x="2" y="4" width="32" height="32" rx="6" fill="#152243" />

          {/* Stylized N Symbol */}
          <rect x="7.5" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
          <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
          <path d="M7.5 10 h4.5 L24.5 30 h-4.5 Z" fill="#3b82f6" />

          {/* Text: TRYNOVA */}
          <text x="44" y="27" fontFamily="'Outfit', 'Inter', sans-serif" fontSize="20" fontWeight="700" fill="#475569" letterSpacing="1.5">
            TRYNOVA
          </text>
        </svg>
      </div>

      <div className="brand-divider"></div>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {/* Dashboard Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          {/* Assets Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Patrimônios</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
