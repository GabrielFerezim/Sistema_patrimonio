import React, { useState } from 'react';

const AssetList = ({ assets, onEdit, onDelete, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [locationFilter, setLocationFilter] = useState('Todos');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Obtém localizações exclusivas para a lista de filtros
  const uniqueLocations = Array.from(
    new Set(assets.map(a => a.location).filter(Boolean))
  ).sort();

  // Lógica de busca e filtragem
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' || asset.status === statusFilter;
    const matchesLocation = locationFilter === 'Todos' || asset.location === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
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
          <p className="page-subtitle">Gerencie o estoque e distribuição dos equipamentos da empresa</p>
        </div>
        <button className="btn btn-primary" onClick={onAddNew}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Cadastrar Patrimônio
        </button>
      </header>

      {/* Barra de Busca e Filtros */}
      <div className="filter-bar">
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

        <div className="filter-group">
          {/* Filtro de Status */}
          <div className="filter-item">
            <label htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Em Uso">Em Uso</option>
              <option value="Em Estoque">Em Estoque</option>
              <option value="Manutenção">Em Manutenção</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Tabela de Inventário */}
      {filteredAssets.length > 0 ? (
        <div className="table-card">
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
              {filteredAssets.map(asset => (
                <tr key={asset.id}>
                  {/* Tag/Código */}
                  <td className="asset-tag-cell">
                    <span className="tag-badge">#{asset.tag}</span>
                  </td>
                  
                  {/* Nome/Descrição */}
                  <td>
                    <div className="asset-name-group">
                      <span className="asset-name-main">{asset.name}</span>
                      {asset.notes && <span className="asset-notes-tooltip" title={asset.notes}>{asset.notes}</span>}
                    </div>
                  </td>
                  
                  {/* Tipo de Equipamento */}
                  <td>{asset.equipment}</td>
                  
                  {/* Funcionário */}
                  <td className="employee-cell">
                    {asset.employee ? (
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {asset.employee.charAt(0).toUpperCase()}
                        </div>
                        <span>{asset.employee}</span>
                      </div>
                    ) : (
                      <span className="unassigned-badge">Disponível</span>
                    )}
                  </td>
                  
                  {/* Localização */}
                  <td>{asset.location}</td>
                  
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
              ))}
            </tbody>
          </table>
          
          <div className="table-footer">
            Mostrando {filteredAssets.length} de {assets.length} patrimônios cadastrados.
          </div>
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            </svg>
          </div>
          <h3>Nenhum patrimônio encontrado</h3>
          <p>Tente alterar os termos da sua busca ou cadastrar um novo equipamento no sistema.</p>
          {(searchTerm || statusFilter !== 'Todos' || locationFilter !== 'Todos') && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('Todos');
                setLocationFilter('Todos');
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
