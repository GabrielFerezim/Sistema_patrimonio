import React, { useState, useEffect } from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  toggleTheme,
  assetCounts = { total: 0, stock: 0, maintenance: 0, employees: 0, decommissioned: 0, spaces: 0, licenses: 0, users: 0 },
  user = null
}) {
  const roleStr = String(user?.role || '').trim().toLowerCase();
  const isAdmin = 
    roleStr === 'administrador' || 
    roleStr === 'admin' || 
    user?.username?.toLowerCase() === 'admin' || 
    user?.email?.toLowerCase() === 'gabriel.ferezim@trynova.com.br' || 
    !user;
  const isRH = roleStr === 'recursos humanos' || roleStr === 'rh' || roleStr === 'dp';
  const isReadOnly = roleStr === 'visualizador' || roleStr === 'viewer';
  
  const [paineisOpen, setPaineisOpen] = useState(true);
  const [gerenciarOpen, setGerenciarOpen] = useState(true);
  const [servicosOpen, setServicosOpen] = useState(true);
  const [sistemaOpen, setSistemaOpen] = useState(true);

  // Auto-expande seções ativas
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'audit') {
      setPaineisOpen(true);
    } else if (['assets', 'spaces', 'stock', 'employees'].includes(activeTab)) {
      setGerenciarOpen(true);
    } else if (['maintenance', 'licenses', 'decommissioned'].includes(activeTab)) {
      setServicosOpen(true);
    } else if (activeTab === 'users') {
      setSistemaOpen(true);
    }
  }, [activeTab]);

  return (
    <>
      {/* Cabeçalho do Mobile (Top Header) */}
      <header className="mobile-top-header">
        <div className="brand-logo-mobile">
          <img src="/trynova_logo.png" alt="Trynova" style={{ height: '28px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="brand-text-mobile">TRYNOVA</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="mobile-theme-btn" onClick={toggleTheme} title="Alternar Tema">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button className="mobile-logout-btn" onClick={onLogout} title="Sair do Sistema">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Barra Lateral Principal Desktop (Estática) */}
      <aside className="sidebar">
        {/* Marca / Logotipo */}
        <div className="brand">
          <div className="brand-container-full">
            <img
              src="/trynova_logo.png"
              alt="Trynova"
              className="brand-logo-full"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        <div className="brand-divider" />

        {/* Menu de Navegação */}
        <nav className="nav-menu">
          {/* Seção 1: PAINÉIS */}
          <div className="nav-category-group">
            <div
              className="nav-category-header"
              onClick={() => setPaineisOpen(!paineisOpen)}
              title="Recolher / Expandir Painéis"
            >
              <span>PAINÉIS</span>
              <svg
                className={`chevron-icon ${paineisOpen ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className={`nav-category-content-wrapper ${paineisOpen ? 'expanded' : 'collapsed'}`}>
              <div className="nav-category-content">
                {/* Dashboard */}
                <button
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  <span>Dashboard</span>
                </button>

                {/* Auditoria / Histórico (Oculto para RH) */}
                {!isRH && (
                  <button
                    className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                    <span>Auditoria</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: GERENCIAMENTO DE ATIVOS */}
          <div className="nav-category-group" style={{ marginTop: '0.75rem' }}>
            <div
              className="nav-category-header"
              onClick={() => setGerenciarOpen(!gerenciarOpen)}
              title="Recolher / Expandir Gerenciamento"
            >
              <span>{isRH ? 'PESSOAS & TERMOS' : 'GERENCIAMENTO'}</span>
              <svg
                className={`chevron-icon ${gerenciarOpen ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className={`nav-category-content-wrapper ${gerenciarOpen ? 'expanded' : 'collapsed'}`}>
              <div className="nav-category-content">
                {/* Patrimônios (Oculto para RH) */}
                {!isRH && (
                  <button
                    className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span>Patrimônios</span>
                    {assetCounts.total > 0 && (
                      <span className="nav-badge">{assetCounts.total}</span>
                    )}
                  </button>
                )}

                {/* Patrimônio Trynova por Espaço (Oculto para RH) */}
                {!isRH && (
                  <button
                    className={`nav-item ${activeTab === 'spaces' ? 'active' : ''}`}
                    onClick={() => setActiveTab('spaces')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span>Patrimônio Trynova</span>
                    {assetCounts.spaces > 0 && (
                      <span className="nav-badge badge-primary">{assetCounts.spaces}</span>
                    )}
                  </button>
                )}

                {/* Estoque (Oculto para RH) */}
                {!isRH && (
                  <button
                    className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stock')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span>Estoque</span>
                    {assetCounts.stock > 0 && (
                      <span className="nav-badge badge-warning">{assetCounts.stock}</span>
                    )}
                  </button>
                )}

                {/* Funcionários / Colaboradores (Visível para todos) */}
                <button
                  className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
                  onClick={() => setActiveTab('employees')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Colaboradores</span>
                  {assetCounts.employees > 0 && (
                    <span className="nav-badge">{assetCounts.employees}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Seção 3: SERVIÇOS & SUPORTE (Manutenção, Licenças e Baixados) */}
          {!isRH && (
            <div className="nav-category-group" style={{ marginTop: '0.75rem' }}>
              <div
                className="nav-category-header"
                onClick={() => setServicosOpen(!servicosOpen)}
                title="Recolher / Expandir Serviços & Suporte"
              >
                <span>SERVIÇOS & SUPORTE</span>
                <svg
                  className={`chevron-icon ${servicosOpen ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <div className={`nav-category-content-wrapper ${servicosOpen ? 'expanded' : 'collapsed'}`}>
                <div className="nav-category-content">
                  {/* Manutenção */}
                  <button
                    className={`nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maintenance')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span>Manutenção</span>
                    {assetCounts.maintenance > 0 && (
                      <span className="nav-badge badge-danger">{assetCounts.maintenance}</span>
                    )}
                  </button>

                  {/* Licenças de Software */}
                  <button
                    className={`nav-item ${activeTab === 'licenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('licenses')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>Licenças de Software</span>
                    {assetCounts.licenses > 0 && (
                      <span className="nav-badge badge-primary">{assetCounts.licenses}</span>
                    )}
                  </button>

                  {/* Itens Baixados */}
                  <button
                    className={`nav-item ${activeTab === 'decommissioned' ? 'active' : ''}`}
                    onClick={() => setActiveTab('decommissioned')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span>Itens Baixados</span>
                    {assetCounts.decommissioned > 0 && (
                      <span className="nav-badge badge-muted">{assetCounts.decommissioned}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seção 4: SISTEMA & ACESSOS (Apenas Administrador) */}
          {isAdmin && (
            <div className="nav-category-group" style={{ marginTop: '0.75rem' }}>
              <div
                className="nav-category-header"
                onClick={() => setSistemaOpen(!sistemaOpen)}
                title="Recolher / Expandir Sistema"
              >
                <span>SISTEMA</span>
                <svg
                  className={`chevron-icon ${sistemaOpen ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <div className={`nav-category-content-wrapper ${sistemaOpen ? 'expanded' : 'collapsed'}`}>
                <div className="nav-category-content">
                  {/* Usuários & Acessos */}
                  <button
                    className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Usuários & Acessos</span>
                    {assetCounts.users > 0 && (
                      <span className="nav-badge badge-primary">{assetCounts.users}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Menu Inferior do Mobile (Bottom Navigation) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <span>Dashboard</span>
        </button>

        {!isRH && (
          <button
            className={`mobile-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Patrimônios</span>
          </button>
        )}

        {!isRH && (
          <button
            className={`mobile-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>Estoque</span>
          </button>
        )}

        <button
          className={`mobile-nav-item ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Colaboradores</span>
        </button>

        {!isRH && (
          <button
            className={`mobile-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span>Reparos</span>
          </button>
        )}
      </nav>
    </>
  );
}
