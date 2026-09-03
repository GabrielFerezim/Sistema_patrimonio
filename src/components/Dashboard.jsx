import React from 'react';

export default function Dashboard({ 
  assets = [], 
  employees = [], 
  maintenances = [],
  spaces = [],
  onNavigateToAssets, 
  onNavigateToTab,
  onAddNewAsset,
  currentUser = null
}) {
  const roleStr = String(currentUser?.role || '').trim().toLowerCase();
  const isReadOnly = roleStr.includes('visualizador') || roleStr === 'viewer' || roleStr.includes('recursos humanos') || roleStr === 'rh';

  const isSpaceLocation = (loc) => {
    if (!loc) return false;
    const cleanLoc = loc.trim().toLowerCase();
    return cleanLoc !== 'estoque' && cleanLoc !== 'estoque central' &&
      spaces.some(s => s.name && s.name.trim().toLowerCase() === cleanLoc);
  };

  const totalAssets = assets.length;
  
  const inUseAssets = assets.filter(a => a.status === 'Em Uso' || isSpaceLocation(a.location));
  const inStockAssets = assets.filter(a => a.status === 'Em Estoque' && !isSpaceLocation(a.location));
  const maintenanceAssets = assets.filter(a => a.status === 'Manutenção');
  const decommissionedAssets = assets.filter(a => a.status === 'Baixado' || a.status === 'decommissioned');

  const inUseCount = inUseAssets.length;
  const inStockCount = inStockAssets.length;
  const maintenanceCount = maintenanceAssets.length;
  const decommissionedCount = decommissionedAssets.length;

  const novoCount = assets.filter(a => a.condition === 'Novo').length;
  const usadoCount = assets.filter(a => a.condition === 'Usado').length;

  // Cálculos de porcentagem
  const inUsePercent = totalAssets ? Math.round((inUseCount / totalAssets) * 100) : 0;
  const inStockPercent = totalAssets ? Math.round((inStockCount / totalAssets) * 100) : 0;
  const maintenancePercent = totalAssets ? Math.round((maintenanceCount / totalAssets) * 100) : 0;

  // Categorias críticas de estoque (< 3 unidades)
  const categoryTypes = [
    'Notebook', 'Desktop', 'Monitor', 'Teclado/Mouse', 
    'Celular/Smartphone', 'Cadeira Ergonômica', 'Impressora', 'Servidor/Rede'
  ];

  const lowStockCategories = categoryTypes
    .map(cat => ({
      category: cat,
      count: inStockAssets.filter(a => a.equipment === cat).length
    }))
    .filter(item => item.count < 3);

  // Distribuição por Localização
  const locationsMap = assets.reduce((acc, curr) => {
    const loc = curr.location || 'Sem Setor';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const locationsSorted = Object.entries(locationsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Distribuição por Tipo de Equipamento
  const equipmentMap = assets.reduce((acc, curr) => {
    const eq = curr.equipment || 'Outros';
    acc[eq] = (acc[eq] || 0) + 1;
    return acc;
  }, {});

  const equipmentSorted = Object.entries(equipmentMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Patrimônios Recentes
  const recentAssets = [...assets].slice(0, 5);

  // Auxiliares do Gráfico SVG Circular
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const getStrokeOffset = (percent) => circumference - (percent / 100) * circumference;

  return (
    <div className="dashboard-container">
      {/* Header do Dashboard com Atalho de Ação Rápida */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text">
          <h1>Painel de Controle Patrimonial</h1>
          <p>Visão geral em tempo real de equipamentos, alocações e disponibilidade em estoque</p>
        </div>
        {!isReadOnly && (
          <div className="welcome-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddNewAsset}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Novo Patrimônio</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Estoque Crítico (< 3 itens) */}
      {lowStockCategories.length > 0 && inStockCount > 0 && (
        <div className="dashboard-alert-banner">
          <div className="alert-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="alert-banner-content">
            <strong>Atenção ao Nível de Estoque:</strong> Há categorias com estoque abaixo de 3 unidades:
            <div className="alert-chips-list">
              {lowStockCategories.slice(0, 4).map(item => (
                <span key={item.category} className="alert-chip-item">
                  {item.category}: <strong>{item.count} {item.count === 1 ? 'unidade' : 'unidades'}</strong>
                </span>
              ))}
            </div>
          </div>
          <button className="btn-link alert-link" onClick={() => onNavigateToTab('stock')}>
            Ver Estoque &rarr;
          </button>
        </div>
      )}

      {/* Grade de Cartões de KPI */}
      <div className="kpi-grid">
        {/* Total */}
        <div className="kpi-card total" onClick={() => onNavigateToAssets('status', 'Todos')} title="Ver todos os patrimônios">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Patrimônios</span>
            <span className="kpi-value">{totalAssets}</span>
          </div>
          <span className="kpi-sub">Todos os itens cadastrados</span>
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Uso */}
        <div className="kpi-card in-use" onClick={() => onNavigateToAssets('status', 'Em Uso')} title="Filtrar patrimônios Em Uso">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Uso com Colaboradores</span>
            <span className="kpi-value">{inUseCount}</span>
          </div>
          <span className="kpi-badge success">{inUsePercent}% do acervo</span>
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Estoque */}
        <div className="kpi-card in-stock" onClick={() => onNavigateToAssets('status', 'Em Estoque')} title="Filtrar patrimônios em Estoque">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Disponível em Estoque</span>
            <span className="kpi-value">{inStockCount}</span>
          </div>
          <span className="kpi-badge warning">{inStockPercent}% pronto para entrega</span>
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Manutenção */}
        <div className="kpi-card maintenance" onClick={() => onNavigateToTab('maintenance')} title="Ver manutenções">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Manutenção</span>
            <span className="kpi-value">{maintenanceCount}</span>
          </div>
          <span className="kpi-badge danger">{maintenancePercent}% em reparo</span>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

      {/* Gráficos de Distribuição */}
      <div className="charts-grid">
        {/* Gráficos de Rosca / Status */}
        <div className="chart-card">
          <h3 className="chart-title">Distribuição de Status dos Equipamentos</h3>
          
          <div className="gauges-container">
            {/* Em Uso */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="84" height="84" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={radius} className="gauge-bg" />
                  <circle 
                    cx="45" 
                    cy="45" 
                    r={radius} 
                    className="gauge-progress success" 
                    strokeDasharray={circumference}
                    strokeDashoffset={getStrokeOffset(inUsePercent)}
                    transform="rotate(-90 45 45)"
                  />
                </svg>
                <span className="gauge-number">{inUsePercent}%</span>
              </div>
              <span className="gauge-label">Em Uso</span>
            </div>

            {/* Em Estoque */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="84" height="84" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={radius} className="gauge-bg" />
                  <circle 
                    cx="45" 
                    cy="45" 
                    r={radius} 
                    className="gauge-progress warning" 
                    strokeDasharray={circumference}
                    strokeDashoffset={getStrokeOffset(inStockPercent)}
                    transform="rotate(-90 45 45)"
                  />
                </svg>
                <span className="gauge-number">{inStockPercent}%</span>
              </div>
              <span className="gauge-label">Estoque</span>
            </div>

            {/* Manutenção */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="84" height="84" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={radius} className="gauge-bg" />
                  <circle 
                    cx="45" 
                    cy="45" 
                    r={radius} 
                    className="gauge-progress danger" 
                    strokeDasharray={circumference}
                    strokeDashoffset={getStrokeOffset(maintenancePercent)}
                    transform="rotate(-90 45 45)"
                  />
                </svg>
                <span className="gauge-number">{maintenancePercent}%</span>
              </div>
              <span className="gauge-label">Reparo</span>
            </div>
          </div>

          <div className="condition-stats">
            <div className="condition-item">
              <span className="cond-dot novo"></span>
              <span className="cond-text">Equipamentos Novos: <strong>{novoCount}</strong></span>
            </div>
            <div className="condition-item">
              <span className="cond-dot usado"></span>
              <span className="cond-text">Equipamentos Usados: <strong>{usadoCount}</strong></span>
            </div>
            {decommissionedCount > 0 && (
              <div 
                className="condition-item" 
                onClick={() => onNavigateToTab && onNavigateToTab('decommissioned')} 
                style={{ cursor: 'pointer' }}
                title="Ver aba de Itens Baixados"
              >
                <span className="cond-dot baixado"></span>
                <span className="cond-text">Itens Baixados: <strong>{decommissionedCount}</strong> &rarr;</span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras: Setores */}
        <div className="chart-card">
          <h3 className="chart-title">Principais Setores com Patrimônio</h3>
          {locationsSorted.length > 0 ? (
            <div className="bar-chart-container">
              {locationsSorted.map(([location, count]) => {
                const maxCount = Math.max(...Object.values(locationsMap));
                const widthPercent = maxCount ? (count / maxCount) * 100 : 0;
                return (
                  <div key={location} className="bar-item" onClick={() => onNavigateToAssets('location', location)} style={{ cursor: 'pointer' }}>
                    <div className="bar-label" title={location}>{location}</div>
                    <div className="bar-track-wrapper">
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                      <span className="bar-value">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data-msg">Nenhum dado de setor cadastrado.</div>
          )}
        </div>
      </div>

      {/* Patrimônios Recentes */}
      <div className="recent-assets-section">
        <div className="section-header">
          <h3 className="section-title">Últimos Patrimônios Cadastrados</h3>
          <button className="btn-link" onClick={() => onNavigateToAssets('status', 'Todos')}>
            Ver inventário completo &rarr;
          </button>
        </div>
        
        {recentAssets.length > 0 ? (
          <div className="table-card">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Nº Patrimônio</th>
                  <th>Equipamento</th>
                  <th>Responsável</th>
                  <th>Localização</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="asset-tag-cell">
                      <span className="tag-badge">#{asset.tag}</span>
                    </td>
                    <td>
                      <div className="asset-name-group">
                        <span className="asset-name-main">{asset.name}</span>
                        <span className="asset-detail">{asset.equipment}</span>
                      </div>
                    </td>
                    <td>
                      {asset.employee ? (
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {asset.employee.charAt(0).toUpperCase()}
                          </div>
                          <span>{asset.employee}</span>
                        </div>
                      ) : (
                        <span className="unassigned-badge">Disponível em Estoque</span>
                      )}
                    </td>
                    <td>{asset.location}</td>
                    <td>
                      <span className={`status-badge ${asset.status.toLowerCase().replace(' ', '-')}`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-list">
            <p>Nenhum equipamento cadastrado ainda.</p>
            <button className="btn btn-primary" onClick={onAddNewAsset}>Cadastrar Primeiro Patrimônio</button>
          </div>
        )}
      </div>
    </div>
  );
}
