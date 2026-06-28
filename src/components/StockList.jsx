import React, { useState } from 'react';

const StockList = ({ assets, employees = [], onAssign, onDecommission }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [employeeInput, setEmployeeInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [decommissionAsset, setDecommissionAsset] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState('');

  // 1. Filtra itens em estoque
  const stockAssets = assets.filter(a => a.status === 'Em Estoque');

  // 2. Filtra itens em estoque pelo termo de pesquisa e categoria selecionada
  const filteredStock = stockAssets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || asset.equipment === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { key: 'Notebook', label: 'Notebooks' },
    { key: 'Desktop', label: 'Desktops' },
    { key: 'Monitor', label: 'Monitores' },
    { key: 'Teclado/Mouse', label: 'Teclado / Mouse' },
    { key: 'Celular/Smartphone', label: 'Celulares' },
    { key: 'Cadeira Ergonômica', label: 'Cadeiras Ergonômicas' },
    { key: 'Impressora', label: 'Impressoras' },
    { key: 'Servidor/Rede', label: 'Equip. Rede / Servidores' },
    { key: 'Outros', label: 'Outros' }
  ];

  const getStockCountForCategory = (categoryKey) => {
    return stockAssets.filter(a => a.equipment === categoryKey).length;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Notebook':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="20" x2="22" y2="20" />
            <line x1="12" y1="18" x2="12" y2="20" />
          </svg>
        );
      case 'Desktop':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3" width="16" height="12" rx="2" />
            <rect x="9" y="15" width="6" height="4" />
            <line x1="12" y1="19" x2="12" y2="21" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
        );
      case 'Monitor':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="13" rx="2" />
            <line x1="12" y1="16" x2="12" y2="21" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
        );
      case 'Teclado/Mouse':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M6 14h8" />
            <rect x="18" y="8" width="4" height="8" rx="2" />
          </svg>
        );
      case 'Celular/Smartphone':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        );
      case 'Cadeira Ergonômica':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 18v3M17 18v3M5 10v4h14v-4M8 5h8v5H8z" />
            <circle cx="12" cy="14" r="2" />
          </svg>
        );
      case 'Impressora':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        );
      case 'Servidor/Rede':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="6" rx="2" />
            <rect x="2" y="9" width="20" height="6" rx="2" />
            <rect x="2" y="16" width="20" height="6" rx="2" />
            <path d="M6 5h.01M6 12h.01M6 19h.01M18 5h.01M18 12h.01M18 19h.01" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        );
    }
  };

  const handleStartAssign = (asset) => {
    setAssigningId(asset.id);
    setEmployeeInput('');
    // Sugere a localização atual do item
    setLocationInput(asset.location || '');
  };

  const handleCancelAssign = () => {
    setAssigningId(null);
    setEmployeeInput('');
    setLocationInput('');
  };

  const handleSubmitAssign = (e, id) => {
    e.preventDefault();
    if (!employeeInput.trim()) {
      alert('Por favor, informe o funcionário responsável.');
      return;
    }
    onAssign(id, employeeInput.trim(), locationInput.trim());
    setAssigningId(null);
    setEmployeeInput('');
    setLocationInput('');
  };

  const handleEmployeeChange = (e) => {
    const val = e.target.value;
    setEmployeeInput(val);
    const selectedEmp = employees.find(emp => emp.name === val);
    if (selectedEmp && selectedEmp.sector) {
      setLocationInput(selectedEmp.sector);
    }
  };

  return (
    <div className="stock-list-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Estoque de Equipamentos</h1>
          <p className="page-subtitle">Visualize equipamentos disponíveis e entregue-os rapidamente para colaboradores</p>
        </div>
      </header>

      {/* Estatísticas Rápidas de Estoque & Categorias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="stock-kpi-card" style={{ marginBottom: 0 }}>
          <div className="stock-kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="stock-kpi-info">
            <span className="stock-kpi-label">Disponíveis em Estoque</span>
            <span className="stock-kpi-value">{stockAssets.length}</span>
          </div>
        </div>

        {/* Resumo de Estoque por Categoria com Alerta abaixo de 3 */}
        <section className="stock-summary-section">
          <h3 className="stock-summary-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Níveis de Estoque & Alertas por Categoria
          </h3>
          
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
                  title={isFiltered ? `Remover filtro de ${cat.label}` : `Filtrar estoque por ${cat.label}`}
                >
                  {/* Indicador visual piscante se estoque estiver abaixo de 3 */}
                  {isLowStock && <span className="stock-category-pulse"></span>}
                  
                  <div className="stock-category-header">
                    <span className="stock-category-icon">
                      {getCategoryIcon(cat.key)}
                    </span>
                    <span className="stock-category-name" title={cat.label}>{cat.label}</span>
                  </div>
                  
                  <div className="stock-category-body">
                    <span className="stock-category-count">{count}</span>
                    {count === 0 ? (
                      <span className="stock-category-alert-badge danger">Sem Estoque</span>
                    ) : isLowStock ? (
                      <span className="stock-category-alert-badge warning" title="Estoque abaixo do mínimo de 3 unidades">Estoque Crítico</span>
                    ) : (
                      <span className="stock-category-alert-badge success">Saudável</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Barra de Pesquisa */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ maxWidth: 'none' }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder={selectedCategory ? `Pesquisar apenas em ${selectedCategory} por nome, tag...` : "Pesquisar itens em estoque por nome, tag, equipamento..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(searchTerm || selectedCategory) && (
            <button className="clear-search-btn" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }} title="Limpar filtros">
              &times;
            </button>
          )}
        </div>
        {selectedCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span>Filtrado pela categoria: <strong>{selectedCategory}</strong></span>
            <button className="btn-link" style={{ padding: 0 }} onClick={() => setSelectedCategory(null)}>Remover filtro</button>
          </div>
        )}
      </div>

      {/* Grade de Itens */}
      {filteredStock.length > 0 ? (
        <div className="stock-grid">
          {filteredStock.map(asset => {
            const isAssigning = assigningId === asset.id;
            return (
              <div key={asset.id} className={`stock-item-card ${isAssigning ? 'assigning-mode' : ''}`}>
                <div className="stock-card-main">
                  <div className="stock-card-header">
                    <span className="tag-badge">#{asset.tag}</span>
                    <span className={`condition-badge ${asset.condition.toLowerCase()}`}>
                      {asset.condition}
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
                  </div>

                  {!isAssigning && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-primary btn-deliver"
                        onClick={() => handleStartAssign(asset)}
                        style={{ flexGrow: 1 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                        </svg>
                        Entregar
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setDecommissionAsset(asset)}
                        title="Dar Baixa (Aposentar item)"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem', borderColor: 'var(--color-warning-glow)', color: 'var(--color-warning)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Painel de Vinculação Rápida (Exibido de forma expansiva) */}
                {isAssigning && (
                  <form 
                    className="stock-assign-form"
                    onSubmit={(e) => handleSubmitAssign(e, asset.id)}
                  >
                    <h4 className="form-title">Entregar Equipamento</h4>
                    
                    <div className="form-group">
                      <label htmlFor="employee-input">Funcionário Responsável *</label>
                      <select
                        id="employee-input"
                        value={employeeInput}
                        onChange={handleEmployeeChange}
                        required
                      >
                        <option value="">{employees.length === 0 ? 'Nenhum funcionário cadastrado' : 'Selecione um funcionário...'}</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} ({emp.sector})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="location-input">Nova Localização (Setor/Sala)</label>
                      <input
                        id="location-input"
                        type="text"
                        placeholder="Ex: TI, Vendas, Diretoria..."
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                      />
                    </div>

                    <div className="form-actions-row">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelAssign}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-sm"
                      >
                        Vincular
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h3>Nenhum equipamento em estoque</h3>
          <p>
            {searchTerm || selectedCategory
              ? 'Nenhum resultado corresponde aos filtros de pesquisa ativos.' 
              : 'Não há equipamentos definidos como "Em Estoque" no momento.'}
          </p>
          {(searchTerm || selectedCategory) && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              style={{ marginTop: '1rem' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Modal Overlay de Confirmação de Baixa (para o Estoque) */}
      {decommissionAsset !== null && (
        <div className="modal-overlay warning warning-decommission">
          <div className="modal-content confirm-dialog" style={{ maxWidth: '480px' }}>
            <div className="confirm-icon-wrapper" style={{ color: 'var(--color-warning)', backgroundColor: 'var(--color-warning-glow)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h2>Dar Baixa no Equipamento?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              Você está prestes a dar baixa no patrimônio em estoque <strong>{decommissionAsset.name}</strong> (#{decommissionAsset.tag}). 
              Ele será removido do estoque e marcado permanentemente como inativo.
            </p>
            
            <div className="form-group" style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
              <label htmlFor="decommission-reason-stock" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-main)' }}>
                Motivo da Baixa (Opcional):
              </label>
              <textarea
                id="decommission-reason-stock"
                rows="3"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                placeholder="Ex: Defeito sem conserto, obsolescência, doação, perda..."
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
                onClick={() => {
                  onDecommission(decommissionAsset.id, decommissionReason);
                  setDecommissionAsset(null);
                  setDecommissionReason('');
                }}
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
