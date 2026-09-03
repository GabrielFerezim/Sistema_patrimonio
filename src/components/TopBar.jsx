import React, { useState, useRef, useEffect } from 'react';

export default function TopBar({ 
  activeTab, 
  theme, 
  toggleTheme, 
  user, 
  onLogout, 
  onAddNewAsset,
  totalAssetsCount = 0
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Visão Geral & Indicadores';
      case 'assets':
        return 'Inventário de Patrimônios';
      case 'spaces':
        return 'Patrimônio Trynova por Espaço';
      case 'stock':
        return 'Estoque de Equipamentos';
      case 'employees':
        return 'Colaboradores & Custódia';
      case 'maintenance':
        return 'Controle de Manutenção';
      case 'licenses':
        return 'Licenças de Software & Acessórios';
      case 'decommissioned':
        return 'Itens Baixados & Inativos';
      case 'audit':
        return 'Histórico & Auditoria';
      default:
        return 'Sistema de Patrimônio';
    }
  };

  return (
    <header className="topbar-container">
      {/* Lado Esquerdo: Título da Página / Breadcrumb */}
      <div className="topbar-left">
        <h2 className="topbar-page-title">{getTabTitle(activeTab)}</h2>
      </div>

      {/* Lado Direito: Ações Rápidas, Tema e Perfil */}
      <div className="topbar-right">
        {/* Botão de Adição Rápida (Oculto para Visualizador e RH) */}
        {(() => {
          const roleStr = String(user?.role || '').trim().toLowerCase();
          const isReadOnly = roleStr.includes('visualizador') || roleStr === 'viewer' || roleStr.includes('recursos humanos') || roleStr === 'rh';
          if (isReadOnly) return null;
          return (
            <button 
              className="topbar-btn-quickadd" 
              onClick={onAddNewAsset}
              title="Cadastrar Novo Patrimônio"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Novo Patrimônio</span>
            </button>
          );
        })()}

        {/* Alternador de Tema */}
        <button 
          className="topbar-btn-icon" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Separador */}
        <div className="topbar-divider"></div>

        {/* Menu do Usuário / Perfil */}
        <div className="topbar-user-wrapper" ref={profileRef}>
          <button 
            className="topbar-user-pill" 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-expanded={profileMenuOpen}
          >
            <div className="topbar-avatar">
              {user && user.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{user ? user.name : 'Gabriel Ferezim'}</span>
              <span className="topbar-user-role">{user ? user.role : 'Administrador'}</span>
            </div>
            <svg className={`topbar-chevron ${profileMenuOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {profileMenuOpen && (
            <div className="topbar-dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{user && user.name ? user.name.charAt(0).toUpperCase() : 'G'}</div>
                <div>
                  <strong>{user ? user.name : 'Gabriel Ferezim'}</strong>
                  <span>{user ? user.role : 'Administrador de TI'}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item logout" 
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
