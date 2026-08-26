import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function TermActionsDropdown({ 
  employee, 
  termInfo, 
  onDownload, 
  onDownloadDevolucao,
  onUploadClick, 
  onRemove,
  onDownloadSigned,
  onEdit,
  onDelete,
  onViewAssets,
  onOffboard,
  userRole = 'Administrador'
}) {
  const isAdmin = userRole === 'Administrador';
  const isReadOnly = userRole === 'Visualizador';
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Se o espaço abaixo for menor que 280px e o espaço acima for maior, abre para cima
    const openUpwards = spaceBelow < 280 && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      right: Math.max(12, window.innerWidth - rect.right),
      top: openUpwards ? 'auto' : `${rect.bottom + 4}px`,
      bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
      zIndex: 99999,
      maxHeight: openUpwards 
        ? `${Math.min(380, spaceAbove - 16)}px` 
        : `${Math.min(380, spaceBelow - 16)}px`,
      overflowY: 'auto'
    });
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      updatePosition();
    }
    setOpen((o) => !o);
  };

  return (
    <div className="term-dropdown" ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          ref={buttonRef}
          className="term-dropdown-trigger"
          onClick={toggleOpen}
          aria-label="Ações do Colaborador"
          title="Opções, Termo e Ações"
        >
          {termInfo && (
            <span style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%', 
              display: 'inline-block',
              boxShadow: '0 0 0 2px var(--bg-card)'
            }} title={`Documento assinado: ${termInfo.signed_term_name}`}></span>
          )}
          Ações
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {open && createPortal(
        <ul className="term-dropdown-menu" style={dropdownStyle} ref={menuRef}>
          {/* Ações Gerais */}
          {/* Ações Gerais */}
          {!isReadOnly && onEdit && (
            <li
              className="term-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(employee);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar Colaborador
            </li>
          )}
          
          <li
            className="term-dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              onViewAssets(employee);
              setOpen(false);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Ver Patrimônios em Posse
          </li>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

          {/* Ações do Termo de Responsabilidade */}
          {termInfo && (
            <li
              className="term-dropdown-item"
              style={{ color: 'var(--color-success)', fontWeight: 600 }}
              onClick={(e) => {
                e.stopPropagation();
                onDownloadSigned(employee.id);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Baixar Termo Assinado
            </li>
          )}
          
          <li
            className="term-dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(employee);
              setOpen(false);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Gerar Termo de Responsabilidade
          </li>

          {onDownloadDevolucao && (
            <li
              className="term-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadDevolucao(employee);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <polyline points="10 12 14 16 18 12" />
              </svg>
              Gerar Termo de Devolução PDF
            </li>
          )}

          {!isReadOnly && (
            <li
              className="term-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick(employee.id);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Anexar Termo Assinado
            </li>
          )}

          {!isReadOnly && termInfo && (
            <li
              className="term-dropdown-item remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(employee.id);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remover Anexo
            </li>
          )}

          {/* Realizar Offboarding */}
          {!isReadOnly && onOffboard && (
            <li
              className="term-dropdown-item"
              style={{ color: 'var(--color-warning)', fontWeight: 600 }}
              onClick={(e) => {
                e.stopPropagation();
                onOffboard(employee);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
              Realizar Offboarding
            </li>
          )}

          {/* Excluir Colaborador (Apenas Administrador) */}
          {isAdmin && onDelete && (
            <>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
              <li
                className="term-dropdown-item remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(employee);
                  setOpen(false);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Excluir Colaborador
              </li>
            </>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}
