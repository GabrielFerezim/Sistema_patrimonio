import React, { useState } from 'react';

const StockList = ({ assets, onAssign }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [employeeInput, setEmployeeInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. Filtra itens em estoque
  const stockAssets = assets.filter(a => a.status === 'Em Estoque');

  // 2. Filtra itens em estoque pelo termo de pesquisa
  const filteredStock = stockAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Extrai lista de funcionários existentes para o Autocomplete
  const existingEmployees = Array.from(
    new Set(assets.map(a => a.employee).filter(e => e && e.trim() !== ''))
  ).sort();

  // 4. Filtra sugestões baseadas no que o usuário digitou
  const filteredSuggestions = existingEmployees.filter(emp =>
    emp.toLowerCase().includes(employeeInput.toLowerCase()) &&
    emp.toLowerCase() !== employeeInput.toLowerCase()
  );

  const handleStartAssign = (asset) => {
    setAssigningId(asset.id);
    setEmployeeInput('');
    // Sugere a localização atual do item
    setLocationInput(asset.location || '');
    setShowSuggestions(false);
  };

  const handleCancelAssign = () => {
    setAssigningId(null);
    setEmployeeInput('');
    setLocationInput('');
    setShowSuggestions(false);
  };

  const handleSubmitAssign = (e, id) => {
    e.preventDefault();
    if (!employeeInput.trim()) {
      alert('Por favor, informe o nome do funcionário responsável.');
      return;
    }
    onAssign(id, employeeInput.trim(), locationInput.trim());
    setAssigningId(null);
    setEmployeeInput('');
    setLocationInput('');
  };

  const handleSelectSuggestion = (name) => {
    setEmployeeInput(name);
    setShowSuggestions(false);
  };

  return (
    <div className="stock-list-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Estoque de Equipamentos</h1>
          <p className="page-subtitle">Visualize equipamentos disponíveis e entregue-os rapidamente para colaboradores</p>
        </div>
      </header>

      {/* Estatísticas Rápidas de Estoque */}
      <div className="stock-kpi-card">
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

      {/* Barra de Pesquisa */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ maxWidth: 'none' }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar itens em estoque por nome, tag, equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Limpar busca">
              &times;
            </button>
          )}
        </div>
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
                    <button 
                      className="btn btn-primary btn-deliver"
                      onClick={() => handleStartAssign(asset)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      Entregar Equipamento
                    </button>
                  )}
                </div>

                {/* Painel de Vinculação Rápida (Exibido de forma expansiva) */}
                {isAssigning && (
                  <form 
                    className="stock-assign-form"
                    onSubmit={(e) => handleSubmitAssign(e, asset.id)}
                  >
                    <h4 className="form-title">Entregar Equipamento</h4>
                    
                    <div className="form-group-autocomplete">
                      <label htmlFor="employee-input">Funcionário Responsável *</label>
                      <div className="autocomplete-wrapper">
                        <input
                          id="employee-input"
                          type="text"
                          placeholder="Digite o nome do funcionário..."
                          value={employeeInput}
                          onChange={(e) => {
                            setEmployeeInput(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          autoComplete="off"
                          required
                        />
                        {/* Lista de sugestões autocompletar */}
                        {showSuggestions && employeeInput.trim().length > 0 && filteredSuggestions.length > 0 && (
                          <ul className="autocomplete-suggestions">
                            {filteredSuggestions.map(name => (
                              <li 
                                key={name}
                                onClick={() => handleSelectSuggestion(name)}
                              >
                                {name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
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
            {searchTerm 
              ? 'Nenhum resultado corresponde à sua pesquisa.' 
              : 'Não há equipamentos definidos como "Em Estoque" no momento.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StockList;
