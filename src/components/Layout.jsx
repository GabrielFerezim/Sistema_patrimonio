import React from 'react';
import Sidebar from './Sidebar';

import '../styles/layout.css';

/**
 * Layout component that provides the overall page structure:
 *   - Persistent left sidebar (collapsible)
 *   - Optional top navigation bar (TopBar)
 *   - Main content area (children)
 *
 * It receives the same props that were previously managed in App.jsx so that
 * navigation state, theme toggling and sidebar collapse behavior stay in one
 * place.
 */
const Layout = ({
  activeTab,
  setActiveTab,
  onLogout,
  collapsed,
  onToggleCollapse,
  theme,
  toggleTheme,
  children,
}) => {
  return (
    <div className="layout-root">

      <div className="layout-body">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <main className="layout-main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
