import React, { useState } from 'react';

export default function MaintenanceList({
  maintenances = [],
  assets = [],
  employees = [],
  onCreateMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
  currentUser = null
}) {
  const userRole = currentUser?.role || 'Operador';
  const isReadOnly = userRole === 'Visualizador';
  const isAdmin = userRole === 'Administrador';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Em Aberto');

  // Modal de abertura de chamado de manutenção
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [provider, setProvider] = useState('');
  const [cost, setCost] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [ticketNotes, setTicketNotes] = useState('');

  // Modal de finalização de chamado
  const [closingTicket, setClosingTicket] = useState(null);
  const [returnDestination, setReturnDestination] = useState('Estoque'); // 'Estoque' ou 'Colaborador'
  const [assignedEmployee, setAssignedEmployee] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [finalNotes, setFinalNotes] = useState('');

  // Itens disponíveis para enviar à manutenção (ativos que não estejam já em manutenção)
  const availableAssetsForMaintenance = assets.filter(a => a.status !== 'Manutenção' && a.status !== 'Baixado');

  const openCreateModal = () => {
    setSelectedAssetTag(availableAssetsForMaintenance.length > 0 ? availableAssetsForMaintenance[0].tag : '');
    setIssueDescription('');
    setProvider('');
    setCost('');
    setExpectedReturn('');
    setTicketNotes('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!selectedAssetTag || !issueDescription.trim()) {
      alert('Por favor, selecione um patrimônio e descreva o motivo da manutenção.');
      return;
    }

    const assetObj = assets.find(a => a.tag === selectedAssetTag);
    if (!assetObj) return;

    onCreateMaintenance({
      asset_id: assetObj.id,
      asset_tag: assetObj.tag,
      asset_name: assetObj.name,
      issue_description: issueDescription.trim(),
      provider: provider.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      expected_return_at: expectedReturn || null,
      notes: ticketNotes.trim() || null,
      employee_name: assetObj.employee || null
    });

    setIsCreateModalOpen(false);
  };

  const handleStartCloseTicket = (ticket) => {
    setClosingTicket(ticket);
    setReturnDestination(ticket.employee_name ? 'Colaborador' : 'Estoque');
    setAssignedEmployee(ticket.employee_name || '');
    setFinalCost(ticket.cost ? String(ticket.cost) : '');
    setFinalNotes(ticket.notes || '');
  };

  const handleCloseTicketSubmit = (e) => {
    e.preventDefault();
    if (!closingTicket) return;

    onUpdateMaintenance(closingTicket.id, {
      status: 'Concluída',
      return_destination: returnDestination,
      employee_name: returnDestination === 'Colaborador' ? assignedEmployee : null,
      cost: finalCost ? parseFloat(finalCost) : null,
      notes: finalNotes.trim() || null
    });

    setClosingTicket(null);
  };

  // Filtra manutenções
  const filteredMaintenances = maintenances.filter(m => {
    const matchesSearch =
      m.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.issue_description && m.issue_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.provider && m.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.employee_name && m.employee_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Em Aberto' && (m.status === 'Em Manutenção' || m.status === 'Em Aberto')) ||
      (statusFilter === 'Concluídas' && m.status === 'Concluída');

    return matchesSearch && matchesStatus;
  });

  // Métricas
  const activeCount = maintenances.filter(m => m.status !== 'Concluída').length;
  const completedCount = maintenances.filter(m => m.status === 'Concluída').length;
  const totalCost = maintenances.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="maintenance-list-container">
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Controle de Manutenção</h1>
          <p className="page-subtitle">Gerencie os reparos, ordens de serviço, assistência técnica e custos de equipamentos</p>
        </div>
        {!isReadOnly && (
          <div className="page-header-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Abrir Chamado</span>
            </button>
          </div>
        )}
      </header>

      {/* Grade de KPIs Resumidos */}
      <div className="kpi-grid">
        <div className="kpi-card maintenance" onClick={() => setStatusFilter('Em Aberto')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Equipamentos em Reparo</span>
            <span className="kpi-value">{activeCount}</span>
          </div>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-use" onClick={() => setStatusFilter('Concluídas')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Manutenções Concluídas</span>
            <span className="kpi-value">{completedCount}</span>
          </div>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flexGrow: 1 }}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar chamado por tag, descrição, fornecedor ou colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Limpar busca">
              &times;
            </button>
          )}
        </div>

        {/* Chips de Status */}
        <div className="status-chips">
          {[
            { label: 'Em Aberto', value: 'Em Aberto', count: activeCount },
            { label: 'Concluídas', value: 'Concluídas', count: completedCount },
            { label: 'Todas', value: 'Todos', count: maintenances.length }
          ].map(chip => (
            <button
              key={chip.value}
              type="button"
              className={`status-chip ${statusFilter === chip.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(chip.value)}
            >
              <span className="status-chip-dot"></span>
              <span className="status-chip-label">{chip.label}</span>
              <span className="status-chip-count">{chip.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Chamados */}
      {filteredMaintenances.length > 0 ? (
        <div className="table-card">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>Equipamento</th>
                <th>Defeito / Motivo</th>
                <th>Assistência / Prestador</th>
                <th>Data Envio</th>
                <th>Previsão</th>
                <th>Custo</th>
                <th>Status</th>
                <th className="actions-header">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaintenances.map(ticket => {
                const isClosed = ticket.status === 'Concluída';

                return (
                  <tr key={ticket.id}>
                    <td className="asset-tag-cell">
                      <span className="tag-badge">#{ticket.asset_tag}</span>
                    </td>
                    <td>
                      <div className="asset-name-main">{ticket.asset_name}</div>
                      {ticket.employee_name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Resp: {ticket.employee_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="employee-asset-notes" title={ticket.issue_description}>
                        {ticket.issue_description}
                      </span>
                    </td>
                    <td>{ticket.provider || '-'}</td>
                    <td>{formatDate(ticket.opened_at)}</td>
                    <td>{ticket.expected_return_at || '-'}</td>
                    <td>
                      {ticket.cost ? (
                        <strong>{parseFloat(ticket.cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      ) : (
                        <span className="unassigned">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${isClosed ? 'em-uso' : 'manutencao'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {!isReadOnly && ticket.status === 'Em Aberto' ? (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleStartCloseTicket(ticket)}
                            title="Concluir manutenção e devolver ao estoque/colaborador"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Concluir
                          </button>
                        ) : (
                          ticket.status === 'Concluída' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                              ✓ Finalizado
                            </span>
                          )
                        )}
                        {isAdmin && onDeleteMaintenance && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              if (window.confirm(`Deseja excluir o registro de manutenção #${ticket.asset_tag} (${ticket.asset_name})?`)) {
                                onDeleteMaintenance(ticket.id);
                              }
                            }}
                            title="Excluir chamado de manutenção"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--color-danger)' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h3>Nenhum registro de manutenção encontrado</h3>
          <p>
            {searchTerm || statusFilter !== 'Em Aberto'
              ? 'Tente alterar os filtros de pesquisa.'
              : 'Nenhum equipamento está em manutenção no momento.'}
          </p>
        </div>
      )}

      {/* Modal: Abrir Chamado de Manutenção */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <header className="modal-header">
              <h2>Novo Chamado de Manutenção</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="maint-asset">Selecione o Patrimônio *</label>
                  <select
                    id="maint-asset"
                    value={selectedAssetTag}
                    onChange={(e) => setSelectedAssetTag(e.target.value)}
                    required
                  >
                    {availableAssetsForMaintenance.map(a => (
                      <option key={a.id} value={a.tag}>
                        #{a.tag} - {a.name} ({a.status}{a.employee ? ` • ${a.employee}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="maint-issue">Problema / Motivo do Envio *</label>
                  <textarea
                    id="maint-issue"
                    rows="3"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Ex: Troca de tela, reparo na fonte de alimentação, formatação..."
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="maint-provider">Fornecedor / Técnico</label>
                  <input
                    type="text"
                    id="maint-provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Ex: Dell Suporte, InfoTech Express..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maint-cost">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="maint-cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Ex: 350.00"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="maint-return">Previsão de Retorno</label>
                  <input
                    type="date"
                    id="maint-return"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                  />
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Envio
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Concluir Manutenção */}
      {closingTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <header className="modal-header">
              <h2>Concluir Manutenção</h2>
              <button className="modal-close-btn" onClick={() => setClosingTicket(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleCloseTicketSubmit} className="modal-form">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1.25rem' }}>
                Finalizar manutenção do patrimônio <strong>#{closingTicket.asset_tag}</strong> ({closingTicket.asset_name}).
              </p>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Destino após Manutenção *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="returnDest"
                        value="Estoque"
                        checked={returnDestination === 'Estoque'}
                        onChange={() => setReturnDestination('Estoque')}
                      />
                      <span>Devolver ao Estoque</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="returnDest"
                        value="Colaborador"
                        checked={returnDestination === 'Colaborador'}
                        onChange={() => setReturnDestination('Colaborador')}
                      />
                      <span>Devolver ao Colaborador</span>
                    </label>
                  </div>
                </div>

                {returnDestination === 'Colaborador' && (
                  <div className="form-group full-width">
                    <label htmlFor="return-emp">Colaborador Destinatário *</label>
                    <select
                      id="return-emp"
                      value={assignedEmployee}
                      onChange={(e) => setAssignedEmployee(e.target.value)}
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
                )}

                <div className="form-group full-width">
                  <label htmlFor="final-notes">Notas da Assistência Técnica</label>
                  <textarea
                    id="final-notes"
                    rows="2"
                    value={finalNotes}
                    onChange={(e) => setFinalNotes(e.target.value)}
                    placeholder="Ex: Peça substituída com garantia de 90 dias..."
                  ></textarea>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setClosingTicket(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Concluir & Atualizar Patrimônio
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
