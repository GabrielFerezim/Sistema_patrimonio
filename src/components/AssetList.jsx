import React, { useState, useRef } from 'react';
import { exportAssetsToCSV, parseAssetsCSV } from '../utils/csvHelper';
import AssetActionsDropdown from './AssetActionsDropdown';

export default function AssetList({
  assets = [],
  employees = [],
  spaces = [],
  onEdit,
  onDelete,
  onDecommission,
  onReactivate,
  onAddNew,
  onSendToStock,
  onSendToMaintenance,
  onImportAssets,
  onBatchMoveToSpace,
  onBatchReturnToStock,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  equipmentFilter,
  setEquipmentFilter,
  currentUser = null
}) {
  const userRole = currentUser?.role || 'Operador';
  const roleStr = String(userRole).trim().toLowerCase();
  const isReadOnly = roleStr.includes('visualizador') || roleStr === 'viewer';
  const isAdmin = roleStr.includes('administrador') || roleStr === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('tag-asc');
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);
  const [decommissionAsset, setDecommissionAsset] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState('');

  // Seleção e Ações em Lote
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [batchTargetLocation, setBatchTargetLocation] = useState('');

  const fileInputRef = useRef(null);

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

  // Importação CSV
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseAssetsCSV(text);
        if (onImportAssets) {
          onImportAssets(parsed);
        }
      } catch (err) {
        alert('Erro ao importar arquivo CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Localizações e tipos únicos
  const uniqueLocations = Array.from(new Set(assets.map(a => a.location).filter(Boolean))).sort();
  const uniqueEquipments = Array.from(new Set(assets.map(a => a.equipment).filter(Boolean))).sort();

  // Filtragem
  const filteredAssets = assets.filter(asset => {
    const assignedEmp = employees.find(e => e.name?.toLowerCase() === asset.employee?.toLowerCase());
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.employee && asset.employee.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignedEmp?.team && assignedEmp.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'Todos' || asset.status === statusFilter;
    const matchesLocation = locationFilter === 'Todos' || asset.location === locationFilter;
    const matchesEquipment = equipmentFilter === 'Todos' || asset.equipment === equipmentFilter;

    return matchesSearch && matchesStatus && matchesLocation && matchesEquipment;
  });

  // Ordenação
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'pt-BR');
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'pt-BR');
    if (sortBy === 'tag-asc') return a.tag.localeCompare(b.tag, undefined, { numeric: true, sensitivity: 'base' });
    if (sortBy === 'tag-desc') return b.tag.localeCompare(a.tag, undefined, { numeric: true, sensitivity: 'base' });
    return 0;
  });

  const confirmDecommissionSubmit = () => {
    if (!decommissionAsset) return;
    onDecommission(decommissionAsset.id, decommissionReason);
    setDecommissionAsset(null);
    setDecommissionReason('');
  };

  const confirmDeleteSubmit = () => {
    if (!deleteConfirmAsset) return;
    onDelete(deleteConfirmAsset.id);
    setDeleteConfirmAsset(null);
  };

  return (
    <div className="asset-list-container">
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Inventário de Patrimônios</h1>
          <p className="page-subtitle">Cadastro completo, controle de localização e status de todos os bens</p>
        </div>
        
        <div className="page-header-actions">
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={() => exportAssetsToCSV(filteredAssets)} 
            title="Exportar inventário filtrado para CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          {!isReadOnly && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={handleImportClick}
              title="Importar patrimônios via CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Importar CSV</span>
            </button>
          )}

          {!isReadOnly && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddNew}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Novo Patrimônio</span>
            </button>
          )}
        </div>
      </header>

      {/* Input oculto para importação CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Barra de Filtros e Busca */}
      <div className="filter-bar">
        <div className="filter-row-top">
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por nome, tag, colaborador, número de série..."
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
            {/* Setor / Localização */}
            <div className="filter-item">
              <label htmlFor="filter-location">Localização</label>
              <select
                id="filter-location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="Todos">Todas as Localizações</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Equipamento */}
            <div className="filter-item">
              <label htmlFor="filter-equipment">Equipamento</label>
              <select
                id="filter-equipment"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              >
                <option value="Todos">Todos os Tipos</option>
                {uniqueEquipments.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>

            {/* Ordenação */}
            <div className="filter-item">
              <label htmlFor="filter-sort">Ordenar por</label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="tag-asc">Nº Patrimônio (Crescente)</option>
                <option value="tag-desc">Nº Patrimônio (Decrescente)</option>
                <option value="name-asc">Nome (A - Z)</option>
                <option value="name-desc">Nome (Z - A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chips de Status */}
        <div className="status-chips-container">
          <span className="filter-label">Filtrar por Status:</span>
          <div className="status-chips">
            {[
              { label: 'Todos', value: 'Todos', count: assets.length, classType: 'todos' },
              { label: 'Em Uso', value: 'Em Uso', count: assets.filter(a => a.status === 'Em Uso').length, classType: 'em-uso' },
              { label: 'Em Estoque', value: 'Em Estoque', count: assets.filter(a => a.status === 'Em Estoque').length, classType: 'em-estoque' },
              { label: 'Manutenção', value: 'Manutenção', count: assets.filter(a => a.status === 'Manutenção').length, classType: 'manutencao' },
              { label: 'Baixados', value: 'Baixado', count: assets.filter(a => a.status === 'Baixado' || a.status === 'decommissioned').length, classType: 'baixado' }
            ].map(chip => (
              <button
                key={chip.value}
                type="button"
                className={`status-chip ${chip.classType} ${statusFilter === chip.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(chip.value)}
              >
                <span className="status-chip-dot"></span>
                <span className="status-chip-label">{chip.label}</span>
                <span className="status-chip-count">{chip.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visualização em Tabela (Desktop) */}
      {sortedAssets.length > 0 ? (
        <>
          <div className="table-card desktop-only-view">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={sortedAssets.length > 0 && selectedAssetIds.length === sortedAssets.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssetIds(sortedAssets.map(a => a.id));
                        } else {
                          setSelectedAssetIds([]);
                        }
                      }}
                      aria-label="Selecionar todos os itens da tabela"
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Nº Patrimônio</th>
                  <th>Nome / Descrição</th>
                  <th>Tipo</th>
                  <th>Responsável</th>
                  <th>Localização</th>
                  <th>Estado</th>
                  <th>Status</th>
                  <th className="actions-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.map(asset => {
                  const isDecommissioned = asset.status === 'Baixado' || asset.status === 'decommissioned';
                  const isSelected = selectedAssetIds.includes(asset.id);

                  return (
                    <tr key={asset.id} className={`${isDecommissioned ? 'row-decommissioned' : ''} ${isSelected ? 'row-selected' : ''}`}>
                      {/* Checkbox de Linha */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedAssetIds(prev =>
                              prev.includes(asset.id) ? prev.filter(id => id !== asset.id) : [...prev, asset.id]
                            );
                          }}
                          aria-label={`Selecionar ${asset.tag}`}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>

                      {/* Tag */}
                      <td className="asset-tag-cell">
                        <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                      </td>

                      {/* Nome */}
                      <td>
                        <div className="asset-name-group">
                          <span className="asset-name-main">{highlightText(asset.name, searchTerm)}</span>
                          {asset.serial_number && (
                            <span className="asset-sn-badge">S/N: {highlightText(asset.serial_number, searchTerm)}</span>
                          )}
                          {asset.notes && (
                            <span className="asset-notes-tooltip" title={asset.notes}>
                              {highlightText(asset.notes, searchTerm)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Equipamento */}
                      <td>{highlightText(asset.equipment, searchTerm)}</td>

                      {/* Funcionário & Equipe */}
                      <td className="employee-cell">
                        {asset.employee ? (
                          (() => {
                            const empObj = employees.find(e => e.name?.toLowerCase() === asset.employee.toLowerCase());
                            return (
                              <div className="employee-info">
                                <div className="employee-avatar">
                                  {asset.employee.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                  <span>{highlightText(asset.employee, searchTerm)}</span>
                                  {empObj?.team && empObj.team !== 'Nenhuma' && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                                      {highlightText(empObj.team, searchTerm)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="unassigned-badge">Disponível em Estoque</span>
                        )}
                      </td>

                      {/* Localização */}
                      <td>{highlightText(asset.location, searchTerm)}</td>

                      {/* Estado */}
                      <td>
                        <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                          {asset.condition || 'Novo'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge ${(asset.status || '').toLowerCase().replace(' ', '-')}`}>
                          {asset.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="actions-cell">
                        <div className="table-actions-wrapper">
                          {!isReadOnly && (
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              onClick={() => onEdit(asset)}
                              title="Editar Patrimônio"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          
                          <AssetActionsDropdown
                            asset={asset}
                            onEdit={onEdit}
                            onSendToStock={onSendToStock}
                            onSendToMaintenance={onSendToMaintenance}
                            onDecommission={setDecommissionAsset}
                            onReactivate={onReactivate}
                            onDelete={setDeleteConfirmAsset}
                            userRole={userRole}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="table-footer">
              Exibindo <strong>{sortedAssets.length}</strong> de <strong>{assets.length}</strong> itens cadastrados.
            </div>
          </div>

          {/* Barra Flutuante de Ações em Lote */}
          {selectedAssetIds.length > 0 && (
            <div style={{
              position: 'sticky',
              bottom: '1.25rem',
              zIndex: 100,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--primary)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.82rem'
                }}>
                  {selectedAssetIds.length}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedAssetIds.length === 1 ? 'patrimônio selecionado' : 'patrimônios selecionados'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setBatchTargetLocation('');
                    setIsBatchMoveModalOpen(true);
                  }}
                  title="Mover todos os selecionados para uma sala ou espaço"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Mover para Espaço</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (window.confirm(`Deseja devolver os ${selectedAssetIds.length} itens selecionados ao Estoque Central?`)) {
                      if (onBatchReturnToStock) onBatchReturnToStock(selectedAssetIds);
                      setSelectedAssetIds([]);
                    }
                  }}
                  title="Devolver todos os itens selecionados para o Estoque Central"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  <span>Devolver ao Estoque</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const selectedAssetsList = assets.filter(a => selectedAssetIds.includes(a.id));
                    exportAssetsToCSV(selectedAssetsList);
                  }}
                  title="Exportar apenas os itens selecionados para CSV"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setSelectedAssetIds([])}
                >
                  Desmarcar
                </button>
              </div>
            </div>
          )}

          {/* Visualização em Cards (Mobile) */}
          <div className="mobile-only-view mobile-assets-cards-container">
            <div className="mobile-assets-cards">
              {sortedAssets.map(asset => (
                <div key={asset.id} className="asset-mobile-card">
                  <div className="card-header">
                    <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                    <div className="card-badges">
                      <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                        {asset.condition || 'Novo'}
                      </span>
                      <span className={`status-badge ${(asset.status || '').toLowerCase().replace(' ', '-')}`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="card-title">{highlightText(asset.name, searchTerm)}</h3>

                  <div className="card-body-details">
                    <div className="detail-item">
                      <span className="detail-label">Equipamento:</span>
                      <span className="detail-val">{highlightText(asset.equipment, searchTerm)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Localização:</span>
                      <span className="detail-val">{highlightText(asset.location, searchTerm)}</span>
                    </div>
                    {asset.employee && (
                      <div className="detail-item">
                        <span className="detail-label">Responsável:</span>
                        <span className="detail-val">
                          <span className="card-employee-tag">
                            <span className="card-avatar">{asset.employee.charAt(0).toUpperCase()}</span>
                            {highlightText(asset.employee, searchTerm)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {asset.notes && (
                    <div className="card-notes">
                      <strong>Obs:</strong> {highlightText(asset.notes, searchTerm)}
                    </div>
                  )}

                  <div className="card-actions">
                    <div className="card-actions-secondary" style={{ width: '100%' }}>
                      <button className="btn-action-mobile edit" onClick={() => onEdit(asset)}>
                        Editar
                      </button>
                      <button className="btn-action-mobile delete" onClick={() => setDeleteConfirmAsset(asset)}>
                        Excluir
                      </button>
                    </div>
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
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h3>Nenhum patrimônio encontrado</h3>
          <p>Tente alterar os termos da busca ou os filtros selecionados.</p>
          {(searchTerm || statusFilter !== 'Todos' || locationFilter !== 'Todos' || equipmentFilter !== 'Todos') && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('Todos');
                setLocationFilter('Todos');
                setEquipmentFilter('Todos');
              }}
              style={{ marginTop: '0.75rem' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
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
            <h2>Excluir Patrimônio?</h2>
            <p>
              Tem certeza de que deseja excluir permanentemente o patrimônio <strong>{deleteConfirmAsset.name}</strong> (#{deleteConfirmAsset.tag})? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmAsset(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteSubmit}>
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Baixa */}
      {decommissionAsset && (
        <div className="modal-overlay warning warning-decommission">
          <div className="modal-content confirm-dialog" style={{ maxWidth: '480px' }}>
            <div className="confirm-icon-wrapper" style={{ color: 'var(--color-warning)', backgroundColor: 'var(--color-warning-glow)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h2>Dar Baixa no Patrimônio?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              Você está prestes a dar baixa no patrimônio <strong>{decommissionAsset.name}</strong> (#{decommissionAsset.tag}). 
              Ele será desvinculado de qualquer colaborador e marcado permanentemente como inativo.
            </p>
            
            <div className="form-group" style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
              <label htmlFor="decommission-reason" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-main)' }}>
                Motivo da Baixa (Opcional):
              </label>
              <textarea
                id="decommission-reason"
                rows="3"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                placeholder="Ex: Defeito irreparável, obsolescência técnica, doação, perda..."
                value={decommissionReason}
                onChange={(e) => setDecommissionReason(e.target.value)}
              />
            </div>
            
            <div className="confirm-buttons">
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => {
                  setDecommissionAsset(null);
                  setDecommissionReason('');
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                onClick={confirmDecommissionSubmit}
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mover em Lote para Espaço / Sala */}
      {isBatchMoveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '92%' }}>
            <header className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Mover Patrimônios em Lote</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Transferir <strong>{selectedAssetIds.length}</strong> patrimônios selecionados para um novo espaço
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsBatchMoveModalOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="modal-body" style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Selecione o Espaço / Sala de Destino *:
                </label>
                <select
                  value={batchTargetLocation}
                  onChange={(e) => setBatchTargetLocation(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                >
                  <option value="" disabled>Selecione um espaço Trynova...</option>
                  {spaces.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.floor || 'Geral'})
                    </option>
                  ))}
                  <option value="Estoque Central">Estoque Central</option>
                  <option value="Laboratório de TI / Bancada">Laboratório de TI / Bancada</option>
                  <option value="Recepção Principal">Recepção Principal</option>
                </select>
              </div>
            </div>

            <footer className="form-footer" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsBatchMoveModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!batchTargetLocation}
                onClick={() => {
                  if (onBatchMoveToSpace && batchTargetLocation) {
                    onBatchMoveToSpace(selectedAssetIds, batchTargetLocation);
                  }
                  setIsBatchMoveModalOpen(false);
                  setSelectedAssetIds([]);
                }}
              >
                Mover {selectedAssetIds.length} Itens
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
