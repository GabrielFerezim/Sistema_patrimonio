import React, { useState } from 'react';

export default function AuditLogView({ logs = [], onClearLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('TODOS');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedFilter === 'TODOS' || log.action_type === selectedFilter;

    return matchesSearch && matchesType;
  });

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CADASTRO':
      case 'CRIACAO':
        return 'badge-success';
      case 'EXCLUSAO':
      case 'BAIXA':
        return 'badge-danger';
      case 'MANUTENCAO':
      case 'ENTREGA':
        return 'badge-warning';
      case 'ATUALIZACAO':
      case 'VERIFICACAO':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CADASTRO':
      case 'CRIACAO':
        return '➕';
      case 'EXCLUSAO':
        return '🗑️';
      case 'BAIXA':
        return '⛔';
      case 'MANUTENCAO':
        return '🔧';
      case 'ENTREGA':
        return '📦';
      case 'ATUALIZACAO':
        return '✏️';
      case 'VERIFICACAO':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="audit-log-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Histórico & Auditoria</h1>
          <p className="page-subtitle">Rastreabilidade completa de todas as movimentações, entregas e alterações de patrimônio</p>
        </div>
      </header>

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flexGrow: 1 }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar histórico por patrimônio, colaborador ou descrição..."
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
            <label htmlFor="filter-action">Tipo de Operação</label>
            <select
              id="filter-action"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="TODOS">Todas as Operações</option>
              <option value="CADASTRO">Cadastros</option>
              <option value="ENTREGA">Entregas / Vinculações</option>
              <option value="MANUTENCAO">Manutenções</option>
              <option value="BAIXA">Baixas / Desativações</option>
              <option value="ATUALIZACAO">Edições</option>
              <option value="VERIFICACAO">Verificações de Inventário</option>
              <option value="EXCLUSAO">Exclusões</option>
            </select>
          </div>
        </div>
      </div>

      {/* Linha do Tempo Visual */}
      {filteredLogs.length > 0 ? (
        <div className="audit-timeline-card">
          <div className="audit-timeline">
            {filteredLogs.map((log, index) => {
              const icon = getActionIcon(log.action_type);
              const badgeClass = getActionBadgeClass(log.action_type);

              return (
                <div key={log.id || index} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="timeline-icon">{icon}</span>
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className={`timeline-badge ${badgeClass}`}>
                        {log.action_type || 'OPERAÇÃO'}
                      </span>
                      <span className="timeline-date">
                        {formatDate(log.created_at || log.timestamp)}
                      </span>
                    </div>

                    <div className="timeline-body">
                      <p className="timeline-text">{log.description}</p>
                      
                      <div className="timeline-meta">
                        {log.entity_id && (
                          <span className="meta-entity">
                            Alvo: <strong>#{log.entity_id}</strong>
                          </span>
                        )}
                        <span className="meta-user">
                          Responsável: <strong>{log.user_name || 'Administrador'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <h3>Nenhum registro de auditoria encontrado</h3>
          <p>As ações realizadas no sistema (como cadastros, entregas e manutenções) serão registradas automaticamente aqui.</p>
        </div>
      )}
    </div>
  );
}
