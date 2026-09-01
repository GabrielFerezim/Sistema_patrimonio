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
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        );
      case 'EXCLUSAO':
      case 'BAIXA':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        );
      case 'MANUTENCAO':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'ENTREGA':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'ATUALIZACAO':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      default:
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
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
        <div className="page-header-info">
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
