import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from './ToastContainer';

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  theme, 
  toggleTheme,
  user,
  onAddNewAsset,
  toasts = [],
  onDismissToast,
  assetCounts
}) {
  return (
    <div className="layout-root">
      {/* Sistema de Notificações Toast Global */}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />

      <div className="layout-body">
        {/* Barra Lateral / Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          assetCounts={assetCounts}
          user={user}
        />

        {/* Área Principal */}
        <div className="layout-content-wrapper">
          {/* Barra Superior TopBar */}
          <TopBar
            activeTab={activeTab}
            theme={theme}
            toggleTheme={toggleTheme}
            user={user}
            onLogout={onLogout}
            onAddNewAsset={onAddNewAsset}
            totalAssetsCount={assetCounts ? assetCounts.total : 0}
          />

          {/* Conteúdo Dinâmico da Página */}
          <main className="layout-main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
