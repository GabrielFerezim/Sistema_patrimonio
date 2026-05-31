import React, { useState } from 'react';

const EmployeesList = ({ assets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState(null);

  // 1. Agrupa os patrimônios ativos por funcionário
  const employeeGroups = {};

  assets.forEach(asset => {
    // Apenas mapeia se o status for 'Em Uso' e o funcionário estiver preenchido
    if (asset.status === 'Em Uso' && asset.employee && asset.employee.trim() !== '') {
      const name = asset.employee.trim();
      const normalizedKey = name.toLowerCase();

      if (!employeeGroups[normalizedKey]) {
        employeeGroups[normalizedKey] = {
          name: name,
          assets: []
        };
      }
      employeeGroups[normalizedKey].assets.push(asset);
    }
  });

  // 2. Converte os grupos em um array
  const employees = Object.values(employeeGroups).sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR')
  );

  // 3. Filtra pelo termo de busca
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.assets.some(asset => 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const toggleExpand = (key) => {
    setExpandedEmployee(expandedEmployee === key ? null : key);
  };

  // Métricas
  const totalEmployees = employees.length;
  const totalAssignedAssets = assets.filter(a => a.status === 'Em Uso' && a.employee).length;
  const maxAssetsEmployee = employees.reduce((max, current) => {
    return (current.assets.length > (max?.assets?.length || 0)) ? current : max;
  }, null);

  return (
    <div className="employees-list-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Funcionários</h1>
          <p className="page-subtitle">Acompanhe a distribuição e responsabilidade dos equipamentos por colaborador</p>
        </div>
      </header>

      {/* Grade de KPIs Resumidos */}
      {totalEmployees > 0 && (
        <div className="employees-kpi-grid">
          <div className="emp-kpi-card">
            <div className="emp-kpi-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="emp-kpi-info">
              <span className="emp-kpi-label">Colaboradores Responsáveis</span>
              <span className="emp-kpi-value">{totalEmployees}</span>
            </div>
          </div>

          <div className="emp-kpi-card">
            <div className="emp-kpi-icon assets">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <div className="emp-kpi-info">
              <span className="emp-kpi-label">Total de Equipamentos em Uso</span>
              <span className="emp-kpi-value">{totalAssignedAssets}</span>
            </div>
          </div>

          {maxAssetsEmployee && (
            <div className="emp-kpi-card">
              <div className="emp-kpi-icon active-user">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div className="emp-kpi-info">
                <span className="emp-kpi-label">Maior Responsabilidade</span>
                <span className="emp-kpi-value truncate" title={`${maxAssetsEmployee.name} (${maxAssetsEmployee.assets.length} Itens)`}>
                  {maxAssetsEmployee.name}
                </span>
                <span className="emp-kpi-subtext">{maxAssetsEmployee.assets.length} equipamentos</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por funcionário ou equipamento..."
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

      {/* Grade/Lista de Funcionários */}
      {filteredEmployees.length > 0 ? (
        <div className="employees-list">
          {filteredEmployees.map(emp => {
            const key = emp.name.toLowerCase();
            const isExpanded = expandedEmployee === key;

            return (
              <div key={key} className={`employee-accordion-card ${isExpanded ? 'expanded' : ''}`}>
                {/* Cabeçalho do Accordion */}
                <div className="employee-accordion-header" onClick={() => toggleExpand(key)}>
                  <div className="employee-identity">
                    <div className="employee-avatarlarge">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="employee-meta-info">
                      <h3 className="employee-card-name">{emp.name}</h3>
                      <span className="employee-asset-count-badge">
                        {emp.assets.length} {emp.assets.length === 1 ? 'equipamento' : 'equipamentos'} em posse
                      </span>
                    </div>
                  </div>

                  <div className="employee-arrow-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Conteúdo do Accordion (Lista de Patrimônios) */}
                {isExpanded && (
                  <div className="employee-accordion-content">
                    <div className="table-card">
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>Nº Patrimônio</th>
                            <th>Nome / Descrição</th>
                            <th>Tipo</th>
                            <th>Localização</th>
                            <th>Estado</th>
                            <th>Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emp.assets.map(asset => (
                            <tr key={asset.id}>
                              <td className="asset-tag-cell">
                                <span className="tag-badge">#{asset.tag}</span>
                              </td>
                              <td>
                                <span className="asset-name-main">{asset.name}</span>
                              </td>
                              <td>{asset.equipment}</td>
                              <td>{asset.location}</td>
                              <td>
                                <span className={`condition-badge ${asset.condition.toLowerCase()}`}>
                                  {asset.condition}
                                </span>
                              </td>
                              <td>
                                <span className="employee-asset-notes" title={asset.notes || 'Sem observações'}>
                                  {asset.notes || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3>Nenhum colaborador com patrimônio</h3>
          <p>
            {searchTerm 
              ? 'Nenhum resultado corresponde à sua pesquisa.' 
              : 'Não há colaboradores com patrimônios ativos definidos como "Em Uso" no momento.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;
