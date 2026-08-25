import React, { useState } from 'react';
import { exportDecommissionedToCSV } from '../utils/csvHelper';

export default function DecommissionedList({
  assets = [],
  onReactivate,
  onEdit,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [reactivateConfirmAsset, setReactivateConfirmAsset] = useState(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);

  // Filtra apenas patrimônios que foram baixados
  const decommissionedAssets = assets.filter(
    a => a.status === 'Baixado' || a.status === 'decommissioned'
  );

  // Categorias únicas dos itens baixados
  const uniqueCategories = Array.from(
    new Set(decommissionedAssets.map(a => a.equipment).filter(Boolean))
  ).sort();

  // Realce do termo pesquisado
  const highlightText = (text, search) => {
    if (!text) return '-';
    if (!search || !search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  // Filtragem
  const filteredAssets = decommissionedAssets.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.decommission_reason && asset.decommission_reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.notes && asset.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'Todos' || asset.equipment === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Métricas
  const totalBaixados = decommissionedAssets.length;
  const comMotivo = decommissionedAssets.filter(a => a.decommission_reason && a.decommission_reason.trim()).length;
  const tiposUnicos = uniqueCategories.length;

  const handleConfirmReactivate = () => {
    if (!reactivateConfirmAsset) return;
    onReactivate(reactivateConfirmAsset.id);
    setReactivateConfirmAsset(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmAsset) return;
    onDelete(deleteConfirmAsset.id);
    setDeleteConfirmAsset(null);
  };

  return (
    <div className="asset-list-container decommissioned-view">
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Itens Baixados</h1>
          <p className="page-subtitle">
            Histórico completo de patrimônios inativados, descartados, doados ou com perda patrimonial
          </p>
        </div>

        <div className="page-header-actions">
          {decommissionedAssets.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportDecommissionedToCSV(filteredAssets)}
              title="Exportar itens baixados para CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Baixas</span>
            </button>
          )}
        </div>
      </header>

      {/* Grade de KPIs Resumidos */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-light)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Itens Baixados</span>
            <span className="kpi-value">{totalBaixados}</span>
          </div>
          <span className="kpi-sub">Equipamentos arquivados/inativos</span>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-stock">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Com Motivo Registrado</span>
            <span className="kpi-value">{comMotivo}</span>
          </div>
          <span className="kpi-sub">Justificativas documentadas</span>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-use">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Tipos de Equipamento</span>
            <span className="kpi-value">{tiposUnicos}</span>
          </div>
          <span className="kpi-sub">Categorias distintas baixadas</span>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="filter-bar">
        <div className="filter-row-top">
          <div className="search-wrapper" style={{ flexGrow: 1 }}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar itens baixados por tag, nome, motivo da baixa ou número de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Limpar busca">
                &times;
              </button>
            )}
          </div>

          <div className="filter-dropdowns">
            <div className="filter-item">
              <label htmlFor="filter-baixa-category">Categoria</label>
              <select
                id="filter-baixa-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="Todos">Todas as Categorias</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Itens Baixados (Desktop) */}
      {filteredAssets.length > 0 ? (
        <>
          <div className="table-card desktop-only-view">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Nº Patrimônio</th>
                  <th>Nome / Descrição</th>
                  <th>Tipo</th>
                  <th>Nº de Série</th>
                  <th>Motivo da Baixa</th>
                  <th>Status</th>
                  <th className="actions-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="row-decommissioned">
                    {/* Tag */}
                    <td className="asset-tag-cell">
                      <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                    </td>

                    {/* Nome */}
                    <td>
                      <div className="asset-name-group">
                        <span className="asset-name-main">{highlightText(asset.name, searchTerm)}</span>
                        {asset.notes && (
                          <span className="asset-notes-tooltip" title={asset.notes}>
                            {highlightText(asset.notes, searchTerm)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Equipamento */}
                    <td>{highlightText(asset.equipment, searchTerm)}</td>

                    {/* Nº de Série */}
                    <td>
                      {asset.serial_number ? (
                        <span className="asset-sn-badge">{highlightText(asset.serial_number, searchTerm)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>

                    {/* Motivo da Baixa */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-main)', 
                            backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          {highlightText(asset.decommission_reason || 'Baixa operacional / Sem motivo especificado', searchTerm)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className="status-badge baixado">
                        Baixado
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="actions-cell">
                      <div className="table-actions-wrapper">
                        {/* Botão de Reativar */}
                        {onReactivate && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setReactivateConfirmAsset(asset)}
                            title="Reativar e devolver equipamento para o Estoque"
                            style={{ 
                              padding: '0.35rem 0.65rem', 
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="1 4 1 10 7 10" />
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                            <span>Reativar</span>
                          </button>
                        )}

                        {/* Editar */}
                        {onEdit && (
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => onEdit(asset)}
                            title="Editar Dados / Observações"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}

                        {/* Excluir Definitivo */}
                        {onDelete && (
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => setDeleteConfirmAsset(asset)}
                            title="Excluir Definitivamente do Sistema"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              Exibindo <strong>{filteredAssets.length}</strong> de <strong>{totalBaixados}</strong> itens baixados.
            </div>
          </div>

          {/* Cards para Mobile */}
          <div className="mobile-only-view mobile-assets-cards-container">
            <div className="mobile-assets-cards">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="asset-mobile-card">
                  <div className="card-header">
                    <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                    <span className="status-badge baixado">Baixado</span>
                  </div>

                  <h3 className="card-title">{highlightText(asset.name, searchTerm)}</h3>

                  <div className="card-body-details">
                    <div className="detail-item">
                      <span className="detail-label">Equipamento:</span>
                      <span className="detail-val">{highlightText(asset.equipment, searchTerm)}</span>
                    </div>
                    {asset.serial_number && (
                      <div className="detail-item">
                        <span className="detail-label">Nº Série:</span>
                        <span className="detail-val">{highlightText(asset.serial_number, searchTerm)}</span>
                      </div>
                    )}
                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <span className="detail-label">Motivo da Baixa:</span>
                      <span 
                        style={{ 
                          fontSize: '0.82rem', 
                          color: 'var(--color-danger)', 
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        {highlightText(asset.decommission_reason || 'Baixa operacional', searchTerm)}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {onReactivate && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setReactivateConfirmAsset(asset)}
                        style={{ flex: 1 }}
                      >
                        Reativar no Estoque
                      </button>
                    )}
                    <button
                      className="btn-action-mobile delete"
                      onClick={() => setDeleteConfirmAsset(asset)}
                      title="Excluir"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h3>{searchTerm || categoryFilter !== 'Todos' ? 'Nenhum item baixado corresponde à busca' : 'Nenhum patrimônio baixado'}</h3>
          <p>
            {searchTerm || categoryFilter !== 'Todos'
              ? 'Tente alterar os filtros ou o termo pesquisado.'
              : 'Todos os equipamentos que você der baixa (aposentar, inativar ou descartar) aparecerão listados aqui com o histórico do motivo.'}
          </p>
          {(searchTerm || categoryFilter !== 'Todos') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('Todos');
              }}
              style={{ marginTop: '0.75rem' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Modal: Confirmar Reativação */}
      {reactivateConfirmAsset && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog" style={{ maxWidth: '460px' }}>
            <div className="confirm-icon-wrapper" style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <h2>Reativar Patrimônio?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1.25rem' }}>
              Deseja reativar o patrimônio <strong>{reactivateConfirmAsset.name}</strong> (#{reactivateConfirmAsset.tag})? 
              Ele voltará a ter o status <strong>"Em Estoque"</strong> e estará disponível para nova alocação.
            </p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setReactivateConfirmAsset(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmReactivate}>
                Confirmar Reativação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão Definitiva */}
      {deleteConfirmAsset && (
        <div className="modal-overlay danger">
          <div className="modal-content confirm-dialog">
            <div className="confirm-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2>Excluir Definitivamente?</h2>
            <p>
              Tem certeza de que deseja remover definitivamente o registro do patrimônio <strong>{deleteConfirmAsset.name}</strong> (#{deleteConfirmAsset.tag})? 
              Esta ação removerá o histórico permanente.
            </p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmAsset(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
