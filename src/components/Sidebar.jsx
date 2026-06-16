import React, { useState, useEffect } from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout, collapsed, onToggleCollapse, theme, toggleTheme }) => {
  const [paineisOpen, setPaineisOpen] = useState(true);
  const [gerenciarOpen, setGerenciarOpen] = useState(true);

  // Auto-expande as seções se a tab correspondente estiver ativa
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setPaineisOpen(true);
    } else if (['stock', 'assets', 'employees'].includes(activeTab)) {
      setGerenciarOpen(true);
    }
  }, [activeTab]);

  return (
    <>
      {/* Cabeçalho do Mobile (Top Header) */}
      <header className="mobile-top-header">
        <div className="brand-logo-mobile">
          <svg width="140" height="32" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="32" height="32" rx="6" fill="#152243" />
            <rect x="7.5" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
            <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
            <path d="M7.5 10 h4.5 L24.5 30 h-4.5 Z" fill="#3b82f6" />
            <text x="44" y="27" fontFamily="'Outfit', 'Inter', sans-serif" fontSize="20" fontWeight="700" fill="#475569" letterSpacing="1.5">
              TRYNOVA
            </text>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="mobile-theme-btn" onClick={toggleTheme} title="Alternar Tema">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <button className="mobile-logout-btn" onClick={onLogout} title="Sair do Sistema">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Menu Lateral Clássico (Desktop) */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Marca / Logo */}
        <div className="brand">
          {!collapsed ? (
            <svg width="100%" height="32" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '145px' }}>
              {/* Caixa Azul Escura */}
              <rect x="2" y="4" width="32" height="32" rx="6" fill="#152243" />

              {/* Símbolo N Estilizado */}
              <rect x="7.5" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
              <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
              <path d="M7.5 10 h4.5 L24.5 30 h-4.5 Z" fill="#3b82f6" />

              {/* Texto: TRYNOVA */}
              <text x="44" y="27" fontFamily="'Outfit', 'Inter', sans-serif" fontSize="20" fontWeight="700" fill="#475569" letterSpacing="1.5">
                TRYNOVA
              </text>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Caixa Azul Escura */}
              <rect x="2" y="4" width="32" height="32" rx="6" fill="#152243" />

              {/* Símbolo N Estilizado */}
              <rect x="7.5" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
              <rect x="20" y="10" width="4.5" height="20" rx="1" fill="#1e40af" />
              <path d="M7.5 10 h4.5 L24.5 30 h-4.5 Z" fill="#3b82f6" />
            </svg>
          )}

          <button className="hamburger-btn" onClick={onToggleCollapse} title={collapsed ? "Expandir menu" : "Recolher menu"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="brand-divider"></div>

        {/* Menu de Navegação */}
        <nav className="nav-menu">
          {/* Seção 1: Painéis */}
          <div className="nav-category-group">
            <div 
              className="nav-category-header" 
              onClick={() => !collapsed && setPaineisOpen(!paineisOpen)}
              title={collapsed ? undefined : "Expandir/Recolher Painéis"}
            >
              <span>PAINÉIS</span>
              <svg 
                className={`chevron-icon ${paineisOpen ? 'open' : ''}`} 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            
            <div className={`nav-category-content-wrapper ${paineisOpen ? 'expanded' : 'collapsed'}`}>
              <div className="nav-category-content">
                <button
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                  title={collapsed ? "Dashboard" : undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção 2: Gerenciamento */}
          <div className="nav-category-group" style={{ marginTop: '0.75rem' }}>
            <div 
              className="nav-category-header" 
              onClick={() => !collapsed && setGerenciarOpen(!gerenciarOpen)}
              title={collapsed ? undefined : "Expandir/Recolher Gerenciamento"}
            >
              <span>GERENCIAMENTO</span>
              <svg 
                className={`chevron-icon ${gerenciarOpen ? 'open' : ''}`} 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            <div className={`nav-category-content-wrapper ${gerenciarOpen ? 'expanded' : 'collapsed'}`}>
              <div className="nav-category-content">
                <button
                  className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assets')}
                  title={collapsed ? "Patrimônios" : undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Patrimônios</span>
                </button>

                <button
                  className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stock')}
                  title={collapsed ? "Estoque" : undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  <span>Estoque</span>
                </button>

                <button
                  className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
                  onClick={() => setActiveTab('employees')}
                  title={collapsed ? "Funcionários" : undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Funcionários</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Rodapé / Logout */}
        <div className="sidebar-footer">
          <button 
            className="nav-item theme-toggle-btn" 
            onClick={toggleTheme} 
            style={{ width: '100%', marginBottom: '0.25rem' }}
            title={collapsed ? "Alternar Tema" : undefined}
          >
            {theme === 'dark' ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span>Tema Claro</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span>Tema Escuro</span>
              </>
            )}
          </button>

          <button 
            className="nav-item logout-btn" 
            onClick={onLogout} 
            style={{ width: '100%' }}
            title={collapsed ? "Sair" : undefined}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Menu Inferior do Mobile (Bottom Navigation) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Estoque</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Patrimônios</span>
        </button>

        <button
          className={`mobile-nav-item ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Funcionários</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
