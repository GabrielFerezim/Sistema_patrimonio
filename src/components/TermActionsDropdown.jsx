import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EmployeeActionsDropdown({ 
  employee, 
  termInfo, 
  onDownload, 
  onUploadClick, 
  onRemove,
  onDownloadSigned,
  onEdit,
  onDelete,
  onViewAssets 
}) {
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
    // Close on scroll to prevent the fixed dropdown from staying in place
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, []);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      });
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
          aria-label="Ações do Funcionário"
          title="Opções e Ações"
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
          {/* General Actions */}
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
            Editar Funcionário
          </li>
          <li
            className="term-dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              onViewAssets(employee.id);
              setOpen(false);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Ver Patrimônios
          </li>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

          {/* Term Actions */}
          {termInfo && (
            <li
              className="term-dropdown-item"
              style={{ color: '#10b981', fontWeight: 600 }}
              onClick={(e) => {
                e.stopPropagation();
                onDownloadSigned(employee.id);
                setOpen(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Ver Termo Assinado
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
            Baixar Termo em Branco
          </li>
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
            Anexar Assinado
          </li>
          {termInfo && (
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
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2" />
              </svg>
              Remover Termo
            </li>
          )}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

          {/* Delete Action */}
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
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2" />
            </svg>
            Excluir Funcionário
          </li>
        </ul>,
        document.body
      )}
    </div>
  );
}
