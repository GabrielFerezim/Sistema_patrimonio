import React, { useState, useMemo } from 'react';
import { exportLicensesToCSV } from '../utils/csvHelper';

export default function SoftwareLicensesList({
  licenses = [],
  employees = [],
  assets = [],
  onSaveLicense,
  onDeleteLicense,
  onAssignSeat,
  onUnassignSeat
}) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos' | 'Disponível' | 'Esgotado' | 'Vencendo'
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [assigningLicense, setAssigningLicense] = useState(null);
  
  // Estado para visibilidade de chaves (ID da licença -> boolean)
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Produtividade');
  const [formType, setFormType] = useState('Assinatura Anual');
  const [formKey, setFormKey] = useState('');
  const [formSeats, setFormSeats] = useState(1);
  const [formExpiration, setFormExpiration] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formAdminUrl, setFormAdminUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Atribuição de Assento
  const [assignUser, setAssignUser] = useState('');
  const [assignMachine, setAssignMachine] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Auxiliar para parse de assentos
  const getAssignedArray = (lic) => {
    if (!lic || !lic.assigned_to) return [];
    if (Array.isArray(lic.assigned_to)) return lic.assigned_to;
    try {
      return JSON.parse(lic.assigned_to);
    } catch (_) {
      return [];
    }
  };

  // Categorias disponíveis
  const defaultCategories = ['Todos', 'Produtividade', 'Design & Criação', 'Sistema Operacional', 'Engenharia / Projetos', 'Segurança', 'Nuvem / Infra', 'Outros'];
  
  const allCategories = useMemo(() => {
    const fromData = licenses.map(l => l.category).filter(Boolean);
    const merged = ['Todos', ...new Set([...defaultCategories.filter(c => c !== 'Todos'), ...fromData])];
    return merged;
  }, [licenses]);

  // Cálculo de dias até expiração
  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate || expirationDate.toLowerCase() === 'perpétua' || expirationDate.toLowerCase() === 'perpetua') {
      return { status: 'perpetual', label: 'Perpétua', days: null, badgeClass: 'badge-perpetual' };
    }
    const expDate = new Date(expirationDate);
    if (isNaN(expDate.getTime())) {
      return { status: 'unknown', label: expirationDate, days: null, badgeClass: 'badge-unknown' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expirou há ${Math.abs(diffDays)}d`, days: diffDays, badgeClass: 'badge-expired' };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: `Expira em ${diffDays}d`, days: diffDays, badgeClass: 'badge-expiring' };
    } else {
      return { status: 'active', label: `Ativa (${diffDays}d)`, days: diffDays, badgeClass: 'badge-active' };
    }
  };

  // KPIs
  const totalLicenses = licenses.length;
  const totalSeats = licenses.reduce((acc, l) => acc + (parseInt(l.total_seats, 10) || 1), 0);
  const usedSeats = licenses.reduce((acc, l) => acc + getAssignedArray(l).length, 0);
  const availableSeats = Math.max(0, totalSeats - usedSeats);
  const totalAnnualCost = licenses.reduce((acc, l) => acc + (parseFloat(l.cost) || 0), 0);

  const expiringSoonCount = licenses.filter(l => {
    const exp = getExpirationStatus(l.expiration_date);
    return exp.status === 'warning' || exp.status === 'expired';
  }).length;

  // Filtragem
  const filteredLicenses = useMemo(() => {
    return licenses.filter(lic => {
      const assigned = getAssignedArray(lic);
      const total = parseInt(lic.total_seats, 10) || 1;
      const inUse = assigned.length;
      const exp = getExpirationStatus(lic.expiration_date);

      // Categoria
      if (selectedCategory !== 'Todos' && lic.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Status
      if (statusFilter === 'Disponível' && inUse >= total) return false;
      if (statusFilter === 'Esgotado' && inUse < total) return false;
      if (statusFilter === 'Vencendo' && exp.status !== 'warning' && exp.status !== 'expired') return false;

      // Busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = lic.name?.toLowerCase().includes(term);
        const matchesCat = lic.category?.toLowerCase().includes(term);
        const matchesKey = lic.license_key?.toLowerCase().includes(term);
        const matchesSupplier = lic.supplier?.toLowerCase().includes(term);
        const matchesType = lic.license_type?.toLowerCase().includes(term);
        const matchesNotes = lic.notes?.toLowerCase().includes(term);
        const matchesAssigned = assigned.some(
          a => a.user?.toLowerCase().includes(term) || a.machine?.toLowerCase().includes(term) || a.notes?.toLowerCase().includes(term)
        );
        return matchesName || matchesCat || matchesKey || matchesSupplier || matchesType || matchesNotes || matchesAssigned;
      }

      return true;
    });
  }, [licenses, selectedCategory, statusFilter, searchTerm]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingLicense(null);
    setFormName('');
    setFormCategory('Produtividade');
    setFormType('Assinatura Anual');
    setFormKey('');
    setFormSeats(1);
    setFormExpiration('');
    setFormCost('');
    setFormSupplier('');
    setFormAdminUrl('');
    setFormNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lic) => {
    setEditingLicense(lic);
    setFormName(lic.name || '');
    setFormCategory(lic.category || 'Produtividade');
    setFormType(lic.license_type || 'Assinatura Anual');
    setFormKey(lic.license_key || '');
    setFormSeats(lic.total_seats || 1);
    setFormExpiration(lic.expiration_date || '');
    setFormCost(lic.cost !== null && lic.cost !== undefined ? String(lic.cost) : '');
    setFormSupplier(lic.supplier || '');
    setFormAdminUrl(lic.admin_url || '');
    setFormNotes(lic.notes || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('O nome do software é obrigatório.');
      return;
    }

    const payload = {
      name: formName.trim(),
      category: formCategory,
      license_type: formType,
      license_key: formKey.trim() || null,
      total_seats: parseInt(formSeats, 10) || 1,
      expiration_date: formExpiration || null,
      cost: formCost ? parseFloat(formCost) : 0,
      supplier: formSupplier.trim() || null,
      admin_url: formAdminUrl.trim() || null,
      notes: formNotes.trim() || null
    };

    if (editingLicense) {
      payload.id = editingLicense.id;
      payload.assigned_to = editingLicense.assigned_to;
    } else {
      payload.assigned_to = [];
    }

    onSaveLicense(payload);
    setIsFormOpen(false);
  };

  const handleCopyKey = (id, key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const toggleRevealKey = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAssignModal = (lic) => {
    setAssigningLicense(lic);
    setAssignUser('');
    setAssignMachine('');
    setAssignNotes('');
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    if (!assignUser && !assignMachine) {
      alert('Selecione pelo menos um colaborador ou equipamento para atribuir o assento.');
      return;
    }

    if (onAssignSeat && assigningLicense) {
      onAssignSeat(assigningLicense.id, {
        user: assignUser || 'Geral / TI',
        machine: assignMachine || null,
        notes: assignNotes.trim() || null,
        assigned_at: new Date().toISOString()
      });
    }

    setAssigningLicense(null);
  };

  const handleUnassignSeat = (licId, seatIndex, userName) => {
    if (window.confirm(`Deseja revogar o assento atribuído a "${userName || 'este usuário'}"?`)) {
      if (onUnassignSeat) {
        onUnassignSeat(licId, seatIndex);
      }
    }
  };

  return (
    <div className="page-container">
      {/* Cabeçalho da Página */}
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Licenças de Software & Assinaturas</h1>
          <p className="page-subtitle">
            Gestão de softwares corporativos, controle de assentos, chaves de ativação, vencimentos e custos
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportLicensesToCSV(filteredLicenses)}
            title="Exportar inventário de licenças para planilha CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreate}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nova Licença</span>
          </button>
        </div>
      </header>

      {/* Grade de KPIs Financeiros e Operacionais */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Softwares Cadastrados</span>
            <span className="kpi-value">{totalLicenses}</span>
          </div>
        </div>

        <div className="kpi-card in-use">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Assentos Ocupados</span>
            <span className="kpi-value">
              {usedSeats} <small style={{ fontSize: '0.6em', color: 'var(--text-muted)' }}>/ {totalSeats}</small>
            </span>
          </div>
        </div>

        <div className="kpi-card in-stock">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Assentos Livres</span>
            <span className="kpi-value" style={{ color: availableSeats > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {availableSeats}
            </span>
          </div>
        </div>

        <div className="kpi-card in-maintenance">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Investimento Total</span>
            <span className="kpi-value" style={{ fontSize: '1.25rem' }}>
              R$ {totalAnnualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Licenças com Expiração Próxima */}
      {expiringSoonCount > 0 && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
            <strong>Atenção de Renovação:</strong> Existem <strong>{expiringSoonCount}</strong> software(s) com licença expirada ou com vencimento nos próximos 30 dias.
          </div>
        </div>
      )}

      {/* Barra Padronizada de Filtros, Busca e Alternador */}
      <div className="filter-bar">
        <div className="filter-row-top">
          {/* Input de Pesquisa Padronizado */}
          <div className="search-wrapper" style={{ flexGrow: 1 }}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por software, chave, fornecedor, colaborador atribuído..."
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
            {/* Filtro de Disponibilidade */}
            <div className="filter-item">
              <label htmlFor="filter-status">Disponibilidade</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todas as Licenças</option>
                <option value="Disponível">Com Assentos Livres</option>
                <option value="Esgotado">Assentos Esgotados</option>
                <option value="Vencendo">Vencendo / Expiradas</option>
              </select>
            </div>

            {/* Alternador de Visualização */}
            <div className="filter-item">
              <label>Exibição</label>
              <div className="btn-group-secondary">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('cards')}
                  title="Visualização em Cards"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('table')}
                  title="Visualização em Tabela"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <span>Tabela</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chips de Categoria Padronizados */}
        <div className="status-chips-container">
          <span className="filter-label">Categorias:</span>
          <div className="status-chips">
            {allCategories.map(cat => {
              const count = cat === 'Todos' 
                ? licenses.length 
                : licenses.filter(l => l.category?.toLowerCase() === cat.toLowerCase()).length;

              return (
                <button
                  key={cat}
                  type="button"
                  className={`status-chip ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="status-chip-label">{cat}</span>
                  <span className="status-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Modo Cards vs Modo Tabela */}
      {filteredLicenses.length > 0 ? (
        viewMode === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '1.25rem' }}>
            {filteredLicenses.map(lic => {
              const assignedArray = getAssignedArray(lic);
              const total = parseInt(lic.total_seats, 10) || 1;
              const inUse = assignedArray.length;
              const free = Math.max(0, total - inUse);
              const usagePercent = Math.min(100, Math.round((inUse / total) * 100));
              const exp = getExpirationStatus(lic.expiration_date);
              const isRevealed = !!revealedKeys[lic.id];
              const isCopied = copiedKeyId === lic.id;

              return (
                <div
                  key={lic.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {/* Topo do Card: Nome, Categoria e Ações */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
                          {lic.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="tag-badge" style={{ fontSize: '0.72rem' }}>{lic.category}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)' }}>
                            {lic.license_type}
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => handleOpenEdit(lic)}
                          title="Editar Licença"
                          style={{ padding: '0.35rem 0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => {
                            if (window.confirm(`Tem certeza de que deseja excluir a licença "${lic.name}"?`)) {
                              onDeleteLicense(lic.id);
                            }
                          }}
                          title="Excluir Licença"
                          style={{ padding: '0.35rem 0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--color-danger)', cursor: 'pointer' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso de Assentos */}
                    <div style={{ marginTop: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                        <span>
                          <strong>{inUse}</strong> de <strong>{total}</strong> assentos em uso ({usagePercent}%)
                        </span>
                        <span style={{ color: free === 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                          {free > 0 ? `${free} livre(s)` : 'Esgotado'}
                        </span>
                      </div>
                      <div style={{ height: '7px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${usagePercent}%`,
                            height: '100%',
                            backgroundColor: usagePercent >= 100 ? 'var(--color-danger)' : (usagePercent > 75 ? 'var(--color-warning)' : 'var(--primary)'),
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Dados Chave, Validade e Fornecedor */}
                    <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      {/* Chave de Ativação */}
                      {lic.license_key ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Chave / Serial:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-card)', padding: '0.15rem 0.4rem', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                              {isRevealed ? lic.license_key : (lic.license_key.length > 8 ? `${lic.license_key.slice(0, 4)}••••••••${lic.license_key.slice(-4)}` : '••••••••')}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleRevealKey(lic.id)}
                              title={isRevealed ? "Ocultar Chave" : "Mostrar Chave"}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(lic.id, lic.license_key)}
                              title="Copiar Chave"
                              style={{ background: 'none', border: 'none', color: isCopied ? 'var(--color-success)' : 'var(--primary)', cursor: 'pointer', padding: '2px', fontWeight: 600, fontSize: '0.7rem' }}
                            >
                              {isCopied ? '✓' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Validade */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Validade:</span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: exp.status === 'expired' ? 'rgba(239, 68, 68, 0.15)' : (exp.status === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                          color: exp.status === 'expired' ? 'var(--color-danger)' : (exp.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)')
                        }}>
                          {lic.expiration_date || 'Perpétua'} ({exp.label})
                        </span>
                      </div>

                      {/* Custo */}
                      {lic.cost ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Investimento:</span>
                          <strong>R$ {parseFloat(lic.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      ) : null}

                      {/* Fornecedor */}
                      {lic.supplier && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Fornecedor:</span>
                          <span>{lic.supplier}</span>
                        </div>
                      )}

                      {/* Link do Console de Administração */}
                      {lic.admin_url && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Console Admin:</span>
                          <a
                            href={lic.admin_url.startsWith('http') ? lic.admin_url : `https://${lic.admin_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                          >
                            Acessar Portal ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card: Assentos Atribuídos & Botão de Atribuição */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        ATRIBUIÇÕES ({assignedArray.length}):
                      </span>
                      {free > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(lic)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: 0
                          }}
                        >
                          + Atribuir Assento
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>Limite Atingido</span>
                      )}
                    </div>

                    {assignedArray.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {assignedArray.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.55rem',
                              backgroundColor: 'var(--bg-app)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                              <strong>{item.user}</strong>
                              {item.machine && <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>({item.machine})</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnassignSeat(lic.id, idx, item.user)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                              title="Liberar este assento de licença"
                            >
                              Liberar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                        Nenhum colaborador ou máquina atribuído.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualização em Tabela Completa */
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Software / Assinatura</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Assentos (Uso / Total)</th>
                  <th>Chave / Serial</th>
                  <th>Validade</th>
                  <th>Custo (R$)</th>
                  <th>Fornecedor</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map(lic => {
                  const assigned = getAssignedArray(lic);
                  const total = parseInt(lic.total_seats, 10) || 1;
                  const inUse = assigned.length;
                  const exp = getExpirationStatus(lic.expiration_date);

                  return (
                    <tr key={lic.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <div>{lic.name}</div>
                        {lic.admin_url && (
                          <a
                            href={lic.admin_url.startsWith('http') ? lic.admin_url : `https://${lic.admin_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.72rem', color: 'var(--primary)' }}
                          >
                            Portal Admin ↗
                          </a>
                        )}
                      </td>
                      <td>
                        <span className="tag-badge" style={{ fontSize: '0.72rem' }}>{lic.category}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{lic.license_type}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{inUse} / {total}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(lic)}
                            disabled={inUse >= total}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: inUse >= total ? 'var(--text-muted)' : 'var(--primary)',
                              cursor: inUse >= total ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'underline',
                              padding: 0
                            }}
                          >
                            {inUse >= total ? 'Cheio' : '+ Atribuir'}
                          </button>
                        </div>
                      </td>
                      <td>
                        {lic.license_key ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-app)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                              {revealedKeys[lic.id] ? lic.license_key : '••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleRevealKey(lic.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="Mostrar/Ocultar"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: exp.status === 'expired' ? 'rgba(239, 68, 68, 0.15)' : (exp.status === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                          color: exp.status === 'expired' ? 'var(--color-danger)' : (exp.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)')
                        }}>
                          {lic.expiration_date || 'Perpétua'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {lic.cost ? `R$ ${parseFloat(lic.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{lic.supplier || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => handleOpenEdit(lic)}
                            title="Editar"
                            style={{ padding: '0.3rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', cursor: 'pointer' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => {
                              if (window.confirm(`Excluir a licença "${lic.name}"?`)) onDeleteLicense(lic.id);
                            }}
                            title="Excluir"
                            style={{ padding: '0.3rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--color-danger)', cursor: 'pointer' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="empty-state">
          <p>Nenhuma licença de software encontrada para os critérios selecionados.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            Cadastrar Primeira Licença
          </button>
        </div>
      )}

      {/* Modal: Cadastro / Edição de Licença */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }}>
            <header className="modal-header">
              <h2>{editingLicense ? 'Editar Licença de Software' : 'Cadastrar Nova Licença de Software'}</h2>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSubmitForm} className="modal-form">
              {formError && (
                <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="lic-name">Nome do Software / Pacote / Assinatura *</label>
                  <input
                    type="text"
                    id="lic-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Microsoft 365 Business Standard, Adobe Photoshop, Slack Pro..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lic-category">Categoria *</label>
                  <select
                    id="lic-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Produtividade">Produtividade</option>
                    <option value="Design & Criação">Design & Criação</option>
                    <option value="Sistema Operacional">Sistema Operacional</option>
                    <option value="Engenharia / Projetos">Engenharia / Projetos</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Nuvem / Infra">Nuvem / Infra</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lic-type">Tipo de Contratação</label>
                  <select
                    id="lic-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="Assinatura Anual">Assinatura Anual</option>
                    <option value="Assinatura Mensal">Assinatura Mensal</option>
                    <option value="Perpétua / Volume">Perpétua / Volume</option>
                    <option value="Gratuita / Open-Source">Gratuita / Open-Source</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lic-seats">Total de Assentos (Licenças) *</label>
                  <input
                    type="number"
                    id="lic-seats"
                    min="1"
                    value={formSeats}
                    onChange={(e) => setFormSeats(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lic-exp">Data de Expiração / Renovação</label>
                  <input
                    type="date"
                    id="lic-exp"
                    value={formExpiration}
                    onChange={(e) => setFormExpiration(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="lic-key">Chave de Ativação / Serial</label>
                  <input
                    type="text"
                    id="lic-key"
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value)}
                    placeholder="Ex: XXXXX-XXXXX-XXXXX-XXXXX"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lic-cost">Investimento Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="lic-cost"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="Ex: 1450.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lic-supplier">Fornecedor / Revenda</label>
                  <input
                    type="text"
                    id="lic-supplier"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Ex: Microsoft, Adobe, Dell, AWS..."
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="lic-admin-url">Link do Console de Administração (Opcional)</label>
                  <input
                    type="text"
                    id="lic-admin-url"
                    value={formAdminUrl}
                    onChange={(e) => setFormAdminUrl(e.target.value)}
                    placeholder="Ex: admin.microsoft.com ou admin.google.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="lic-notes">Observações / Detalhes de Contrato</label>
                  <textarea
                    id="lic-notes"
                    rows="2"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Informações sobre o plano, renovação automática, contatos técnicos..."
                  />
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLicense ? 'Salvar Alterações' : 'Cadastrar Licença'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Atribuir Assento a Colaborador ou Máquina */}
      {assigningLicense && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '92%' }}>
            <header className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Atribuir Assento de Licença</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Software: <strong>{assigningLicense.name}</strong> ({getAssignedArray(assigningLicense).length} de {assigningLicense.total_seats} em uso)
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setAssigningLicense(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleConfirmAssign} className="modal-form" style={{ padding: '0.5rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  Colaborador Responsável:
                </label>
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="">Selecione um colaborador...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.sector})
                    </option>
                  ))}
                  <option value="Uso Compartilhado / TI">Uso Compartilhado / Bancada de TI</option>
                  <option value="Servidor / Nuvem">Servidor / Nuvem</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  Equipamento / Máquina Vinculada (Opcional):
                </label>
                <select
                  value={assignMachine}
                  onChange={(e) => setAssignMachine(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="">Nenhum equipamento específico</option>
                  {assets.map(a => (
                    <option key={a.id} value={`#${a.tag} - ${a.name}`}>
                      #{a.tag} - {a.name} ({a.employee || 'Disponível'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  Observações da Atribuição (Opcional):
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Ex: Utilizado para projetos de marketing, conta corporativa..."
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <footer className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningLicense(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Atribuição
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
