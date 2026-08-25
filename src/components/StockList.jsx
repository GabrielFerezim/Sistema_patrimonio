import React, { useState } from 'react';

export default function StockList({ 
  assets = [], 
  employees = [], 
  onAssign, 
  onDecommission 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal / Ação de Entrega
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState('');
  const [targetLocation, setTargetLocation] = useState('');

  // Modal de Baixa
  const [decommissionAsset, setDecommissionAsset] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState('');

  // 1. Apenas itens com status "Em Estoque"
  const stockAssets = assets.filter(a => a.status === 'Em Estoque');

  // 2. Filtro por busca e categoria
  const filteredStock = stockAssets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || asset.equipment === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { key: 'Notebook', label: 'Notebooks' },
    { key: 'Desktop', label: 'Desktops' },
    { key: 'Monitor', label: 'Monitores' },
    { key: 'Teclado/Mouse', label: 'Teclado & Mouse' },
    { key: 'Celular/Smartphone', label: 'Celulares' },
    { key: 'Cadeira Ergonômica', label: 'Cadeiras' },
    { key: 'Impressora', label: 'Impressoras' },
    { key: 'Servidor/Rede', label: 'Redes & Servidores' },
    { key: 'Outros', label: 'Outros' }
  ];

  const getStockCountForCategory = (categoryKey) => {
    return stockAssets.filter(a => a.equipment === categoryKey).length;
  };

  const handleStartAssign = (asset) => {
    setAssigningAsset(asset);
    setTargetEmployee('');
    setTargetLocation(asset.location || 'Tecnologia da Informação');
  };

  const handleEmployeeChange = (e) => {
    const name = e.target.value;
    setTargetEmployee(name);
    const empObj = employees.find(emp => emp.name === name);
    if (empObj && empObj.sector) {
      setTargetLocation(empObj.sector);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!targetEmployee) {
      alert('Selecione um colaborador destinatário.');
      return;
    }
    onAssign(assigningAsset.id, targetEmployee, targetLocation);
    setAssigningAsset(null);
    setTargetEmployee('');
    setTargetLocation('');
  };

  const handleDecommissionSubmit = () => {
    if (!decommissionAsset) return;
    onDecommission(decommissionAsset.id, decommissionReason);
    setDecommissionAsset(null);
    setDecommissionReason('');
  };

  return (
    <div className="stock-list-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Estoque de Equipamentos</h1>
          <p className="page-subtitle">Disponibilidade de equipamentos prontos para entrega imediata aos colaboradores</p>
        </div>
      </header>

      {/* Painel de Categorias e Alertas de Estoque */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <section className="stock-summary-section">
          <div className="stock-summary-header">
            <h3 className="stock-summary-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Níveis de Estoque por Categoria ({stockAssets.length} unidades totais)
            </h3>
            {selectedCategory && (
              <button className="btn-link" onClick={() => setSelectedCategory(null)}>
                Mostrar todas as categorias
              </button>
            )}
          </div>

          <div className="stock-categories-summary-grid">
            {categoriesList.map(cat => {
              const count = getStockCountForCategory(cat.key);
              const isLowStock = count < 3;
              const isFiltered = selectedCategory === cat.key;

              return (
                <div 
                  key={cat.key}
                  className={`stock-category-card ${isLowStock ? 'alert-active' : 'stock-ok'} ${isFiltered ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(isFiltered ? null : cat.key)}
                  title={isFiltered ? `Remover filtro` : `Filtrar por ${cat.label}`}
                >
                  {isLowStock && count > 0 && <span className="stock-category-pulse"></span>}
                  
                  <div className="stock-category-header">
                    <span className="stock-category-name" title={cat.label}>{cat.label}</span>
                  </div>
                  
                  <div className="stock-category-body">
                    <span className="stock-category-count">{count}</span>
                    {count === 0 ? (
                      <span className="stock-category-alert-badge danger">Sem Estoque</span>
                    ) : isLowStock ? (
                      <span className="stock-category-alert-badge warning">Estoque Crítico</span>
                    ) : (
                      <span className="stock-category-alert-badge success">Disponível</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Barra de Busca */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flexGrow: 1 }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder={selectedCategory ? `Pesquisar em ${selectedCategory}...` : "Pesquisar equipamentos disponíveis no estoque..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(searchTerm || selectedCategory) && (
            <button className="clear-search-btn" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }} title="Limpar filtros">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Grade de Itens em Estoque */}
      {filteredStock.length > 0 ? (
        <div className="stock-grid">
          {filteredStock.map(asset => (
            <div key={asset.id} className="stock-item-card">
              <div className="stock-card-main">
                <div className="stock-card-header">
                  <span className="tag-badge">#{asset.tag}</span>
                  <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                    {asset.condition || 'Novo'}
                  </span>
                </div>

                <h3 className="stock-card-title">{asset.name}</h3>

                <div className="stock-card-details">
                  <div className="stock-detail">
                    <span className="label">Tipo:</span>
                    <span className="val">{asset.equipment}</span>
                  </div>
                  <div className="stock-detail">
                    <span className="label">Localização:</span>
                    <span className="val">{asset.location}</span>
                  </div>
                  {asset.serial_number && (
                    <div className="stock-detail">
                      <span className="label">S/N:</span>
                      <span className="val">{asset.serial_number}</span>
                    </div>
                  )}
                </div>

                {asset.notes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0', fontStyle: 'italic' }}>
                    {asset.notes}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-primary btn-deliver"
                    onClick={() => handleStartAssign(asset)}
                    style={{ flexGrow: 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                    </svg>
                    Entregar ao Colaborador
                  </button>

                  <button 
                    className="btn btn-secondary"
                    onClick={() => setDecommissionAsset(asset)}
                    title="Dar Baixa no Equipamento"
                    style={{ color: 'var(--color-warning)', padding: '0 0.65rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h3>Nenhum equipamento em estoque</h3>
          <p>
            {searchTerm || selectedCategory
              ? 'Nenhum equipamento disponível corresponde aos filtros selecionados.'
              : 'Não há equipamentos com status "Em Estoque" no momento.'}
          </p>
        </div>
      )}

      {/* Modal: Entregar Equipamento */}
      {assigningAsset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <header className="modal-header">
              <div>
                <h2>Entregar Equipamento</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  #{assigningAsset.tag} - {assigningAsset.name}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setAssigningAsset(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleAssignSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="assign-employee">Colaborador Destinatário *</label>
                  <select
                    id="assign-employee"
                    value={targetEmployee}
                    onChange={handleEmployeeChange}
                    required
                  >
                    <option value="">Selecione o colaborador...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.sector})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="assign-location">Setor de Alocação</label>
                  <input
                    type="text"
                    id="assign-location"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="Ex: Tecnologia da Informação"
                  />
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningAsset(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Entrega
                </button>
              </footer>
            </form>
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
            <h2>Dar Baixa no Equipamento em Estoque?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              Você está prestes a dar baixa no patrimônio <strong>{decommissionAsset.name}</strong> (#{decommissionAsset.tag}). 
              Ele será removido do estoque e arquivado como inativo.
            </p>
            
            <div className="form-group" style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
              <label htmlFor="decommission-reason-stock" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-main)' }}>
                Motivo da Baixa (Opcional):
              </label>
              <textarea
                id="decommission-reason-stock"
                rows="3"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                placeholder="Ex: Defeito irreparável, doação, obsolescência..."
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
                onClick={handleDecommissionSubmit}
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
