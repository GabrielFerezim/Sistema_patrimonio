import React from 'react';

const Dashboard = ({ assets, onViewAll, onNavigateToAssets }) => {
  // Cálculos
  const totalAssets = assets.length;
  
  const inUseCount = assets.filter(a => a.status === 'Em Uso').length;
  const inStockCount = assets.filter(a => a.status === 'Em Estoque').length;
  const maintenanceCount = assets.filter(a => a.status === 'Manutenção').length;

  const novoCount = assets.filter(a => a.condition === 'Novo').length;
  const usadoCount = assets.filter(a => a.condition === 'Usado').length;

  // Cálculos de porcentagem
  const inUsePercent = totalAssets ? Math.round((inUseCount / totalAssets) * 100) : 0;
  const inStockPercent = totalAssets ? Math.round((inStockCount / totalAssets) * 100) : 0;
  const maintenancePercent = totalAssets ? Math.round((maintenanceCount / totalAssets) * 100) : 0;

  // Distribuição de localizações
  const locationsMap = assets.reduce((acc, curr) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {});

  const locationsSorted = Object.entries(locationsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5 localizações

  // Patrimônios recentes (últimos 4 adicionados)
  const recentAssets = [...assets].reverse().slice(0, 4);

  // Parâmetros auxiliares do Gráfico SVG
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  const getStrokeOffset = (percent) => {
    return circumference - (percent / 100) * circumference;
  };

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do controle de patrimônios e estoque da empresa</p>
        </div>
      </header>

      {/* Grade de Cartões de KPI */}
      <div className="kpi-grid">
        {/* Total de Patrimônios */}
        <div className="kpi-card total" onClick={() => onNavigateToAssets('status', 'Todos')} style={{ cursor: 'pointer' }} title="Clique para ver todos os patrimônios">
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
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Uso */}
        <div className="kpi-card in-use" onClick={() => onNavigateToAssets('status', 'Em Uso')} style={{ cursor: 'pointer' }} title="Clique para filtrar patrimônios Em Uso">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Uso (Funcionários)</span>
            <span className="kpi-value">{inUseCount}</span>
          </div>
          <span className="kpi-badge success">{inUsePercent}% do total</span>
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Estoque */}
        <div className="kpi-card in-stock" onClick={() => onNavigateToAssets('status', 'Em Estoque')} style={{ cursor: 'pointer' }} title="Clique para filtrar patrimônios Em Estoque">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Disponível em Estoque</span>
            <span className="kpi-value">{inStockCount}</span>
          </div>
          <span className="kpi-badge warning">{inStockPercent}% do total</span>
          <div className="kpi-bg-glow"></div>
        </div>

        {/* Em Manutenção */}
        <div className="kpi-card maintenance" onClick={() => onNavigateToAssets('status', 'Manutenção')} style={{ cursor: 'pointer' }} title="Clique para filtrar patrimônios Em Manutenção">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Manutenção</span>
            <span className="kpi-value">{maintenanceCount}</span>
          </div>
          <span className="kpi-badge danger">{maintenancePercent}% do total</span>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

      {/* Seção de Gráficos */}
      <div className="charts-grid">
        {/* Gráficos de Distribuição de Status */}
        <div className="chart-card">
          <h3 className="chart-title">Status dos Equipamentos</h3>
          
          <div className="gauges-container">
            {/* Gráfico 1 */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="90" height="90" viewBox="0 0 90 90">
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

            {/* Gráfico 2 */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="90" height="90" viewBox="0 0 90 90">
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
              <span className="gauge-label">Em Estoque</span>
            </div>

            {/* Gráfico 3 */}
            <div className="gauge-item">
              <div className="gauge-svg-wrapper">
                <svg width="90" height="90" viewBox="0 0 90 90">
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
              <span className="gauge-label">Manutenção</span>
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
          </div>
        </div>

        {/* Gráfico de Barras de Distribuição por Localização */}
        <div className="chart-card">
          <h3 className="chart-title">Patrimônios por Localização</h3>
          {locationsSorted.length > 0 ? (
            <div className="bar-chart-container">
              {locationsSorted.map(([location, count]) => {
                const maxCount = Math.max(...Object.values(locationsMap));
                const widthPercent = maxCount ? (count / maxCount) * 100 : 0;
                return (
                  <div key={location} className="bar-item">
                    <div className="bar-label">{location}</div>
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
            <div className="no-data-msg">Nenhum dado de localização cadastrado.</div>
          )}
        </div>
      </div>

      {/* Patrimônios Recentes & Ação Rápida */}
      <div className="recent-assets-section">
        <div className="section-header">
          <h3 className="section-title">Últimos Patrimônios Cadastrados</h3>
          <button className="btn-link" onClick={onViewAll}>Ver inventário completo &rarr;</button>
        </div>
        
        {recentAssets.length > 0 ? (
          <div className="recent-table-card">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Nº Patrimônio</th>
                  <th>Equipamento</th>
                  <th>Funcionário</th>
                  <th>Localização</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="asset-tag-cell">#{asset.tag}</td>
                    <td>
                      <div className="asset-name-group">
                        <span className="asset-name">{asset.name}</span>
                        <span className="asset-detail">{asset.equipment}</span>
                      </div>
                    </td>
                    <td>{asset.employee || <span className="unassigned">Disponível</span>}</td>
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
          <div className="empty-state-dashboard">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <p>Nenhum equipamento cadastrado ainda.</p>
            <button className="btn btn-primary" onClick={onViewAll}>Ir para Patrimônios</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
