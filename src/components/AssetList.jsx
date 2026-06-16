import React, { useState } from 'react';

const AssetList = ({ 
  assets, 
  onEdit, 
  onDelete, 
  onAddNew,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  equipmentFilter,
  setEquipmentFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Função para realçar o termo pesquisado na busca
  const highlightText = (text, search) => {
    if (!text) return '-';
    if (!search || !search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  // Exportador de Relatório CSV
  const exportToCSV = () => {
    const headers = ['Nº Patrimônio', 'Nome', 'Tipo', 'Colaborador', 'Localização', 'Status', 'Estado', 'Última Verificação', 'Observações'];
    const rows = filteredAssets.map(asset => [
      asset.tag,
      asset.name,
      asset.equipment,
      asset.employee || 'Disponível',
      asset.location,
      asset.status,
      asset.condition,
      asset.last_verified ? new Date(asset.last_verified).toLocaleDateString('pt-BR') : 'Nunca',
      asset.notes || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_patrimonio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtém localizações e equipamentos exclusivos para a lista de filtros
  const uniqueLocations = Array.from(
    new Set(assets.map(a => a.location).filter(Boolean))
  ).sort();

  const uniqueEquipments = Array.from(
    new Set(assets.map(a => a.equipment).filter(Boolean))
  ).sort();

  // Lógica de busca e filtragem
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.employee && asset.employee.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' || asset.status === statusFilter;
    const matchesLocation = locationFilter === 'Todos' || asset.location === locationFilter;
    const matchesEquipment = equipmentFilter === 'Todos' || asset.equipment === equipmentFilter;

    return matchesSearch && matchesStatus && matchesLocation && matchesEquipment;
  });

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    onDelete(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="asset-list-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Patrimônios</h1>
          <p className="page-subtitle">Gerencie o estoque, distribuição e cadastro dos bens da empresa</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-export" onClick={exportToCSV} title="Exportar dados filtrados para planilha CSV">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
          <button className="btn btn-primary btn-add-asset" onClick={onAddNew}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Cadastrar Patrimônio
          </button>
        </div>
      </header>

      {/* Barra de Busca e Filtros Redesenhada (Sleek & Premium) */}
      <div className="filter-bar">
        <div className="filter-row-top">
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por nome, patrimônio, funcionário..."
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
            {/* Filtro de Localização */}
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

            {/* Filtro de Equipamento */}
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
          </div>
        </div>

        {/* Filtro de Status por Chips Interativos */}
        <div className="status-chips-container">
          <span className="filter-label">Filtrar por Status:</span>
          <div className="status-chips">
            {[
              { label: 'Todos', value: 'Todos', count: assets.length, classType: 'todos' },
              { label: 'Em Uso', value: 'Em Uso', count: assets.filter(a => a.status === 'Em Uso').length, classType: 'em-uso' },
              { label: 'Em Estoque', value: 'Em Estoque', count: assets.filter(a => a.status === 'Em Estoque').length, classType: 'em-estoque' },
              { label: 'Manutenção', value: 'Manutenção', count: assets.filter(a => a.status === 'Manutenção').length, classType: 'manutencao' }
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

      {/* Visualização 1: Tabela de Inventário (Desktop-only) */}
      {filteredAssets.length > 0 ? (
        <>
          <div className="table-card desktop-only-view">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Nº Patrimônio</th>
                  <th>Nome / Descrição</th>
                  <th>Tipo</th>
                  <th>Funcionário</th>
                  <th>Localização</th>
                  <th>Estado</th>
                  <th>Status</th>
                  <th className="actions-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  return (
                    <tr key={asset.id}>
                      {/* Tag/Código */}
                      <td className="asset-tag-cell">
                        <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                      </td>
                      
                      {/* Nome/Descrição */}
                      <td>
                        <div className="asset-name-group">
                          <span className="asset-name-main">{highlightText(asset.name, searchTerm)}</span>
                          {asset.notes && <span className="asset-notes-tooltip" title={asset.notes}>{highlightText(asset.notes, searchTerm)}</span>}
                        </div>
                      </td>
                      
                      {/* Tipo de Equipamento */}
                      <td>{highlightText(asset.equipment, searchTerm)}</td>
                      
                      {/* Funcionário */}
                      <td className="employee-cell">
                        {asset.employee ? (
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {asset.employee.charAt(0).toUpperCase()}
                            </div>
                            <span>{highlightText(asset.employee, searchTerm)}</span>
                          </div>
                        ) : (
                          <span className="unassigned-badge">Disponível</span>
                        )}
                      </td>
                      
                      {/* Localização */}
                      <td>{highlightText(asset.location, searchTerm)}</td>
                      
                      {/* Estado */}
                      <td>
                        <span className={`condition-badge ${asset.condition.toLowerCase()}`}>
                          {asset.condition}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td>
                        <span className={`status-badge ${asset.status.toLowerCase().replace(' ', '-')}`}>
                          {asset.status}
                        </span>
                      </td>
                      
                      {/* Ações */}
                      <td className="actions-cell">
                        <button 
                          className="btn-action edit" 
                          onClick={() => onEdit(asset)} 
                          title="Editar Patrimônio"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        
                        <button 
                          className="btn-action delete" 
                          onClick={() => handleDeleteClick(asset.id)} 
                          title="Excluir Patrimônio"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="table-footer">
              Mostrando {filteredAssets.length} de {assets.length} patrimônios cadastrados.
            </div>
          </div>

          {/* Visualização 2: Cards de Patrimônio (Mobile-only-view) */}
          <div className="mobile-only-view mobile-assets-cards-container">
            <div className="mobile-assets-cards">
              {filteredAssets.map(asset => {
                return (
                  <div key={asset.id} className="asset-mobile-card">
                    <div className="card-header">
                      <span className="tag-badge">#{highlightText(asset.tag, searchTerm)}</span>
                      <div className="card-badges">
                        <span className={`condition-badge ${asset.condition.toLowerCase()}`}>
                          {asset.condition}
                        </span>
                        <span className={`status-badge ${asset.status.toLowerCase().replace(' ', '-')}`}>
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
                      <div className="detail-item">
                        <span className="detail-label">Responsável:</span>
                        <span className="detail-val">
                          {asset.employee ? (
                            <span className="card-employee-tag">
                              <span className="card-avatar">{asset.employee.charAt(0).toUpperCase()}</span>
                              {highlightText(asset.employee, searchTerm)}
                            </span>
                          ) : (
                            <span className="unassigned-badge">Disponível</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {asset.notes && (
                      <div className="card-notes">
                        <strong>Obs:</strong> {highlightText(asset.notes, searchTerm)}
                      </div>
                    )}

                    <div className="card-actions">
                      <div className="card-actions-secondary" style={{ width: '100%' }}>
                        <button 
                          className="btn-action-mobile edit" 
                          onClick={() => onEdit(asset)} 
                          title="Editar"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                        <button 
                          className="btn-action-mobile delete" 
                          onClick={() => handleDeleteClick(asset.id)} 
                          title="Excluir"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mobile-list-footer">
              Mostrando {filteredAssets.length} de {assets.length} patrimônios.
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            </svg>
          </div>
          <h3>Nenhum patrimônio encontrado</h3>
          <p>Tente alterar os termos da sua busca ou filtros selecionados.</p>
          {(searchTerm || statusFilter !== 'Todos' || locationFilter !== 'Todos' || equipmentFilter !== 'Todos') && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('Todos');
                setLocationFilter('Todos');
                setEquipmentFilter('Todos');
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Modal Overlay de Confirmação de Exclusão */}
      {deleteConfirmId !== null && (
        <div className="modal-overlay danger">
          <div className="modal-content confirm-dialog">
            <div className="confirm-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2>Confirmar Exclusão?</h2>
            <p>Você tem certeza que deseja excluir este patrimônio? Esta ação não poderá ser desfeita.</p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Excluir de vez
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
