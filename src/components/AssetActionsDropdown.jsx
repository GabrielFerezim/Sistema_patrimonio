import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AssetActionsDropdown({
  asset,
  onEdit,
  onSendToStock,
  onSendToMaintenance,
  onDecommission,
  onReactivate,
  onDelete
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => {
      if (open) setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 210;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 260 && rect.top > 260;

      let top = openUpwards ? rect.top - 8 : rect.bottom + 6;
      let right = window.innerWidth - rect.right;

      if (right + menuWidth > window.innerWidth) {
        right = 16;
      }

      setDropdownStyle({
        position: 'fixed',
        top: openUpwards ? 'auto' : `${top}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 6}px` : 'auto',
        right: `${Math.max(12, right)}px`,
        zIndex: 99999,
      });
    }
    setOpen(prev => !prev);
  };

  const isDecommissioned = asset.status === 'Baixado' || asset.status === 'decommissioned';
  const isInUse = asset.status === 'Em Uso';
  const isInMaintenance = asset.status === 'Manutenção';

  return (
    <div className="asset-actions-dropdown" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`btn-table-actions ${open ? 'active' : ''}`}
        onClick={toggleDropdown}
        title="Opções do Patrimônio"
        aria-expanded={open}
      >
        <span className="btn-table-actions-text">Ações</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && createPortal(
        <div className="asset-dropdown-menu" style={dropdownStyle} ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <div className="asset-dropdown-header">
            <span className="asset-dropdown-tag">#{asset.tag}</span>
            <span className="asset-dropdown-status">{asset.status}</span>
          </div>

          <ul className="asset-dropdown-list">
            {/* 1. Editar */}
            {onEdit && (
              <li
                className="asset-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  onEdit(asset);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Editar Dados</span>
              </li>
            )}

            {/* 3. Devolver ao Estoque (se em uso) */}
            {isInUse && onSendToStock && (
              <li
                className="asset-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  onSendToStock(asset.id);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>Devolver ao Estoque</span>
              </li>
            )}

            {/* 5. Enviar para Manutenção */}
            {!isInMaintenance && !isDecommissioned && onSendToMaintenance && (
              <li
                className="asset-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  onSendToMaintenance(asset);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span>Enviar p/ Reparo</span>
              </li>
            )}

            {/* 6. Reativar patrimônio (caso esteja baixado) */}
            {isDecommissioned && onReactivate && (
              <li
                className="asset-dropdown-item item-reactivate"
                onClick={() => {
                  setOpen(false);
                  onReactivate(asset.id);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Reativar no Estoque</span>
              </li>
            )}

            <div className="asset-dropdown-divider"></div>

            {/* 7. Dar Baixa */}
            {!isDecommissioned && onDecommission && (
              <li
                className="asset-dropdown-item item-decommission"
                onClick={() => {
                  setOpen(false);
                  onDecommission(asset);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Dar Baixa (Inativar)</span>
              </li>
            )}

            {/* 8. Excluir */}
            {onDelete && (
              <li
                className="asset-dropdown-item item-delete"
                onClick={() => {
                  setOpen(false);
                  onDelete(asset);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Excluir Patrimônio</span>
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
