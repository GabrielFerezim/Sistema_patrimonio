import React, { useState, useRef } from 'react';
import { gerarTermoResponsabilidade } from '../utils/gerarTermo';
import { gerarTermoDevolucao } from '../utils/gerarTermoDevolucao';
import { exportEmployeesToCSV } from '../utils/csvHelper';
import TermActionsDropdown from './TermActionsDropdown';
import OnboardingKitModal from './OnboardingKitModal';

export default function EmployeesList({
  assets = [],
  employees = [],
  onSaveEmployee,
  onDeleteEmployee,
  onDecommission,
  onSendToStock,
  onOnboardEmployeeWithKit,
  onOffboardEmployee,
  currentUser = null
}) {
  const userRole = currentUser?.role || 'Operador';
  const roleStr = String(userRole).trim().toLowerCase();
  const isReadOnly = userRole === 'Visualizador';
  const isAdmin = userRole === 'Administrador';
  const isRH = roleStr === 'recursos humanos' || roleStr === 'rh' || roleStr === 'dp';
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutMode, setLayoutMode] = useState('list'); // 'list' ou 'grid'
  const [selectedSectorTab, setSelectedSectorTab] = useState('Todos');
  const [selectedTeamTab, setSelectedTeamTab] = useState('Todos');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Modal de Offboarding
  const [offboardingEmployee, setOffboardingEmployee] = useState(null);
  const [offboardSelectedAssetIds, setOffboardSelectedAssetIds] = useState([]);
  const [offboardDestination, setOffboardDestination] = useState('Estoque Central');
  const [offboardNotes, setOffboardNotes] = useState('');
  const [offboardRemoveEmp, setOffboardRemoveEmp] = useState(false);

  // Modal de Cadastro/Edição de Colaborador
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSector, setEmployeeSector] = useState('Tecnologia da Informação');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeRamal, setEmployeeRamal] = useState('');
  const [employeeTeam, setEmployeeTeam] = useState('Nenhuma');
  const [validationError, setValidationError] = useState('');

  // Visualizador de Patrimônios do Colaborador
  const [activeEmployeeAssets, setActiveEmployeeAssets] = useState(null);
  const [decommissionAsset, setDecommissionAsset] = useState(null);
  const [decommissionReason, setDecommissionReason] = useState('');

  // Linhas expandidas na tabela
  const [expandedRows, setExpandedRows] = useState({});

  // Upload de termo assinado
  const termFileInputRef = useRef(null);
  const [pendingTermEmpId, setPendingTermEmpId] = useState(null);
  const [termData, setTermData] = useState({}); // { [empId]: { signed_term_name, signed_term_at, signed_term } }

  // Sincroniza termos já gravados nos colaboradores
  React.useEffect(() => {
    const initialMap = {};
    employees.forEach(emp => {
      if (emp.signed_term_name) {
        initialMap[emp.id] = {
          signed_term_name: emp.signed_term_name,
          signed_term_at: emp.signed_term_at,
          signed_term: emp.signed_term
        };
      }
    });
    setTermData(prev => ({ ...initialMap, ...prev }));
  }, [employees]);

  const handleDownloadTermo = (emp) => {
    gerarTermoResponsabilidade(emp, assets);
  };

  const handleUploadTermClick = (empId) => {
    setPendingTermEmpId(empId);
    if (termFileInputRef.current) {
      termFileInputRef.current.value = '';
      termFileInputRef.current.click();
    }
  };

  const handleTermFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingTermEmpId) return;

    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. O tamanho máximo permitido é 8MB.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        try {
          const res = await fetch(`/api/employees/${pendingTermEmpId}/term`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64, fileName: file.name }),
          });

          if (res.ok) {
            const data = await res.json();
            setTermData(prev => ({
              ...prev,
              [pendingTermEmpId]: { 
                signed_term_name: data.signed_term_name, 
                signed_term_at: data.signed_term_at, 
                signed_term: base64 
              },
            }));
          } else {
            setTermData(prev => ({
              ...prev,
              [pendingTermEmpId]: { 
                signed_term_name: file.name, 
                signed_term_at: new Date().toISOString(), 
                signed_term: base64 
              },
            }));
          }
        } catch {
          setTermData(prev => ({
            ...prev,
            [pendingTermEmpId]: { 
              signed_term_name: file.name, 
              signed_term_at: new Date().toISOString(), 
              signed_term: base64 
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Erro ao processar arquivo de termo:', err);
    }
  };

  const handleRemoveTerm = async (empId) => {
    if (!window.confirm('Deseja remover o termo assinado deste colaborador?')) return;
    try {
      await fetch(`/api/employees/${empId}/term`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Erro ao remover termo via API:', err);
    }
    setTermData(prev => { 
      const updated = { ...prev }; 
      delete updated[empId]; 
      return updated; 
    });
  };

  const handleDownloadSignedTerm = async (empId) => {
    let t = termData[empId];
    if (!t || !t.signed_term) {
      try {
        const res = await fetch(`/api/employees/${empId}/term`);
        if (res.ok) {
          const data = await res.json();
          t = {
            ...t,
            signed_term: data.signed_term,
            signed_term_name: data.signed_term_name || t?.signed_term_name,
            signed_term_at: data.signed_term_at || t?.signed_term_at
          };
          setTermData(prev => ({ ...prev, [empId]: t }));
        } else {
          alert('Nenhum arquivo de termo encontrado.');
          return;
        }
      } catch {
        alert('Erro ao carregar termo assinado do servidor.');
        return;
      }
    }

    if (!t || !t.signed_term) {
      alert('Nenhum termo em anexo encontrado.');
      return;
    }

    const link = document.createElement('a');
    link.href = t.signed_term;
    link.download = t.signed_term_name || 'termo_assinado.pdf';
    link.click();
  };

  const toggleRowExpanded = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setEmployeeName('');
    setEmployeeSector('Tecnologia da Informação');
    setEmployeeRole('');
    setEmployeeRamal('');
    setEmployeeTeam('Nenhuma');
    setValidationError('');
    setIsEmployeeModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEmployeeName(emp.name);
    setEmployeeSector(emp.sector || 'Tecnologia da Informação');
    setEmployeeRole(emp.role || '');
    setEmployeeRamal(emp.ramal || '');
    setEmployeeTeam(emp.team || 'Nenhuma');
    setValidationError('');
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!employeeName.trim() || !employeeSector.trim()) {
      setValidationError('Nome e Setor são campos obrigatórios.');
      return;
    }

    const isDuplicate = employees.some(emp =>
      emp.name.toLowerCase().trim() === employeeName.toLowerCase().trim() &&
      (!editingEmployee || emp.id !== editingEmployee.id)
    );

    if (isDuplicate) {
      setValidationError('Já existe um colaborador cadastrado com este nome.');
      return;
    }

    const payload = {
      name: employeeName.trim(),
      sector: employeeSector.trim(),
      role: employeeRole.trim(),
      ramal: employeeRamal.trim(),
      team: employeeTeam || 'Nenhuma',
    };

    if (editingEmployee) {
      payload.id = editingEmployee.id;
      payload.oldName = editingEmployee.name;
    }

    onSaveEmployee(payload);
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteClick = (emp) => {
    if (window.confirm(`Tem certeza de que deseja excluir o colaborador "${emp.name}"? Todos os equipamentos em posse voltarão automaticamente para o estoque.`)) {
      onDeleteEmployee(emp.id, emp.name);
    }
  };

  // Offboarding
  const handleOpenOffboard = (emp) => {
    setOffboardingEmployee(emp);
    const empAssetIds = (emp.assets || []).map(a => a.id);
    setOffboardSelectedAssetIds(empAssetIds);
    setOffboardDestination('Estoque Central');
    setOffboardNotes('Equipamentos conferidos e devolvidos em bom estado.');
    setOffboardRemoveEmp(false);
  };

  const handleToggleOffboardAsset = (assetId) => {
    setOffboardSelectedAssetIds(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleDownloadTermoDevolucao = async (emp) => {
    if (!emp) return;
    const empAssets = emp.assets || [];
    try {
      await gerarTermoDevolucao(emp, empAssets, 'Termo avulso de conferência e devolução de equipamentos.');
    } catch (err) {
      console.error('Erro ao gerar termo de devolução:', err);
    }
  };

  const handleConfirmOffboard = async () => {
    if (!offboardingEmployee) return;

    // 1. Extrai a lista de equipamentos que estão sendo devolvidos
    const empAssets = offboardingEmployee.assets || [];
    const returnedAssetsList = empAssets.filter(a => offboardSelectedAssetIds.includes(a.id));

    // Guarda cópias seguras
    const empCopy = { ...offboardingEmployee };
    const notesCopy = offboardNotes;
    const assetIdsCopy = [...offboardSelectedAssetIds];
    const destinationCopy = offboardDestination;
    const removeEmployeeCopy = offboardRemoveEmp;

    // 2. Executa o download do Termo de Devolução & Quitação em PDF
    try {
      await gerarTermoDevolucao(empCopy, returnedAssetsList, notesCopy);
    } catch (err) {
      console.error('Erro ao gerar PDF de devolução:', err);
    }

    // 3. Executa a baixa e desvinculação dos itens no sistema
    if (onOffboardEmployee) {
      await onOffboardEmployee({
        employee: empCopy,
        returnedAssetIds: assetIdsCopy,
        destination: destinationCopy,
        notes: notesCopy,
        removeEmployee: removeEmployeeCopy
      });
    }

    setOffboardingEmployee(null);
  };

  const getEquipmentCategoryIcon = () => '';

  // Realce de texto
  const highlightText = (text, search) => {
    if (!text) return '-';
    if (!search || !search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  // Mapeia colaboradores com seus patrimônios
  const employeesWithAssets = employees.map(emp => {
    const empAssets = assets.filter(
      a => a.status === 'Em Uso' && a.employee && a.employee.trim().toLowerCase() === emp.name.trim().toLowerCase()
    );
    return {
      ...emp,
      assets: empAssets
    };
  });

  const allSectors = Array.from(new Set(employees.map(e => e.sector).filter(Boolean))).sort();
  
  // Extrai todas as equipes/clientes únicas cadastradas no banco
  const allTeams = Array.from(new Set(employees.map(e => e.team).filter(Boolean))).sort();

  // Filtragem
  const filteredEmployees = employeesWithAssets.filter(emp => {
    const matchesSector = selectedSectorTab === 'Todos' || emp.sector === selectedSectorTab;
    const matchesTeam = selectedTeamTab === 'Todos' || (emp.team || 'Nenhuma') === selectedTeamTab;
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.team && emp.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.assets.some(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSector && matchesTeam && matchesSearch;
  });

  // Agrupamento por setor
  const sectorGroups = {};
  filteredEmployees.forEach(emp => {
    const sectorName = emp.sector || 'Sem Setor';
    const sectorKey = sectorName.trim().toLowerCase();

    if (!sectorGroups[sectorKey]) {
      sectorGroups[sectorKey] = {
        name: sectorName,
        employees: []
      };
    }
    sectorGroups[sectorKey].employees.push(emp);
  });

  const sectors = Object.values(sectorGroups).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Métricas
  const totalEmployees = employees.length;
  const totalSectors = new Set(employees.map(e => e.sector.trim().toLowerCase())).size;
  const totalTeams = new Set(employees.map(e => (e.team || 'Nenhuma').trim().toLowerCase()).filter(t => t !== 'nenhuma')).size;
  const totalAssignedAssets = assets.filter(a => a.status === 'Em Uso' && a.employee).length;

  return (
    <div className="employees-list-container">
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Colaboradores & Custódia</h1>
          <p className="page-subtitle">Acompanhe a distribuição de equipamentos por colaborador e gerencie termos de responsabilidade</p>
        </div>
        
        <div className="page-header-actions">
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={() => exportEmployeesToCSV(filteredEmployees, assets)}
            title="Exportar lista de colaboradores para CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          {!isReadOnly && (
            <>
              {!isRH && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  title="Cadastrar novo colaborador e entregar kit de equipamentos do estoque"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>Onboarding com Kit</span>
                </button>
              )}

              <button 
                type="button" 
                className={isRH ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} 
                onClick={openAddModal}
                title="Cadastrar novo colaborador"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>Cadastrar Colaborador</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Grade de KPIs */}
      {totalEmployees > 0 && (
        <div className="kpi-grid">
          <div className="kpi-card total">
            <div className="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Total de Colaboradores</span>
              <span className="kpi-value">{totalEmployees}</span>
            </div>
            <div className="kpi-bg-glow"></div>
          </div>

          <div className="kpi-card in-use">
            <div className="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Setores Cadastrados</span>
              <span className="kpi-value">{totalSectors}</span>
            </div>
            <div className="kpi-bg-glow"></div>
          </div>

          <div className="kpi-card in-stock">
            <div className="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Equipes & Clientes</span>
              <span className="kpi-value">{totalTeams || allTeams.length}</span>
            </div>
            <div className="kpi-bg-glow"></div>
          </div>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="filter-row-top">
          <div className="search-wrapper" style={{ flexGrow: 1 }}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por colaborador, cargo, setor, equipe ou equipamento..."
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
            {/* Filtro Setor */}
            <div className="filter-item">
              <label htmlFor="filter-sector-emp">Setor</label>
              <select
                id="filter-sector-emp"
                value={selectedSectorTab}
                onChange={(e) => setSelectedSectorTab(e.target.value)}
              >
                <option value="Todos">Todos os Setores</option>
                {allSectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Filtro Equipe / Cliente */}
            <div className="filter-item">
              <label htmlFor="filter-team-emp">Equipe / Cliente</label>
              <select
                id="filter-team-emp"
                value={selectedTeamTab}
                onChange={(e) => setSelectedTeamTab(e.target.value)}
              >
                <option value="Todos">Todas as Equipes/Clientes</option>
                {allTeams.map(teamName => (
                  <option key={teamName} value={teamName}>
                    {teamName === 'Nenhuma' ? 'Sem Equipe / Geral' : teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Alternador de Layout */}
          <div className="layout-toggle-group">
            <button 
              type="button"
              className={`layout-toggle-btn ${layoutMode === 'list' ? 'active' : ''}`}
              onClick={() => setLayoutMode('list')}
              title="Exibição em Tabela / Diretório"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Tabela
            </button>
            <button 
              type="button"
              className={`layout-toggle-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              title="Exibição em Cards"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Cards
            </button>
          </div>
        </div>

        {/* Chips de Equipes / Clientes */}
        <div className="status-chips-container">
          <span className="filter-label">Clientes / Equipes:</span>
          <div className="status-chips">
            {['Todos', ...allTeams].map(teamName => {
              const count = teamName === 'Todos'
                ? employees.length
                : employees.filter(e => (e.team || 'Nenhuma') === teamName).length;

              return (
                <button
                  key={teamName}
                  type="button"
                  className={`status-chip ${selectedTeamTab === teamName ? 'active' : ''}`}
                  onClick={() => setSelectedTeamTab(teamName)}
                >
                  <span className="status-chip-label">
                    {teamName === 'Nenhuma' ? 'Geral / Sem Equipe' : teamName}
                  </span>
                  <span className="status-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Listagem de Setores */}
      {sectors.length > 0 ? (
        <div className="sectors-layout-container">
          {sectors.map(sector => {
            const sectorEmployeeCount = sector.employees.length;
            const sectorAssetCount = sector.employees.reduce((acc, emp) => acc + emp.assets.length, 0);

            return (
              <div key={sector.name} className="sector-section">
                <header className="sector-section-header">
                  <h3 className="sector-section-title">
                    {sector.name}
                    <span className="sector-section-badge">
                      {sectorEmployeeCount} {sectorEmployeeCount === 1 ? 'colaborador' : 'colaboradores'} • {sectorAssetCount} {sectorAssetCount === 1 ? 'patrimônio' : 'patrimônios'}
                    </span>
                  </h3>
                </header>

                {layoutMode === 'grid' ? (
                  /* MODO CARDS (GRID VIEW) */
                  <div className="employees-profile-grid">
                    {sector.employees.map(emp => {
                      const sanitizedTeam = (emp.team || 'none').toLowerCase().replace(/[^a-z]/g, '');
                      const teamClass = `team-${sanitizedTeam}`;

                      return (
                        <div key={emp.id} className={`employee-profile-card ${teamClass}`}>
                          <div className="profile-card-top">
                            <span className="profile-sector-badge" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 500 }}>
                              {emp.sector}
                            </span>
                            <span className={`team-badge ${teamClass}`}>
                              {highlightText(emp.team && emp.team !== 'Nenhuma' ? emp.team : 'Geral', searchTerm)}
                            </span>
                          </div>

                          <div className={`profile-card-avatar-wrapper ${teamClass}`}>
                            <div className="profile-card-avatar">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          </div>

                          <div className="profile-card-identity">
                            <h4 className="profile-card-name" title={emp.name}>{highlightText(emp.name, searchTerm)}</h4>
                            <p className="profile-card-role" title={emp.role || 'Sem Cargo'}>
                              {highlightText(emp.role || 'Sem Cargo', searchTerm)}
                            </p>
                          </div>

                          <div className="profile-card-details">
                            <div className="profile-detail-row">
                              <span className="detail-text">
                                Equipe: <strong>{highlightText(emp.team && emp.team !== 'Nenhuma' ? emp.team : 'Geral', searchTerm)}</strong>
                              </span>
                            </div>
                            <div className="profile-detail-row">
                              <span className="detail-text">
                                Ramal: <strong>{highlightText(emp.ramal || '-', searchTerm)}</strong>
                              </span>
                            </div>
                            <div className="profile-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                              <span className="detail-text">Equipamentos:</span>
                              {emp.assets.length > 0 ? (
                                <button
                                  type="button"
                                  className="emp-slim-badge"
                                  onClick={() => setActiveEmployeeAssets(emp)}
                                  title="Ver equipamentos"
                                >
                                  <span className="emp-slim-count">{emp.assets.length}</span>
                                  <span className="emp-slim-label">{emp.assets.length === 1 ? 'item' : 'itens'}</span>
                                </button>
                              ) : (
                                <span className="emp-slim-empty">0 itens</span>
                              )}
                            </div>
                          </div>

                          <div className="profile-term-section">
                            <TermActionsDropdown 
                              employee={emp}
                              termInfo={termData[emp.id]}
                              onDownload={handleDownloadTermo}
                              onDownloadDevolucao={handleDownloadTermoDevolucao}
                              onUploadClick={handleUploadTermClick}
                              onRemove={handleRemoveTerm}
                              onDownloadSigned={handleDownloadSignedTerm}
                              onEdit={openEditModal}
                              onDelete={handleDeleteClick}
                              onViewAssets={() => setActiveEmployeeAssets(emp)}
                              onOffboard={handleOpenOffboard}
                              userRole={userRole}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* MODO LISTA / TABELA (TABULAR DIRECTORY) */
                  <div className="table-card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                    <table className="employees-dir-table">
                      <thead>
                        <tr>
                          <th>Colaborador</th>
                          <th>Cargo</th>
                          <th>Ramal</th>
                          <th>Equipamentos</th>
                          <th className="actions-header">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sector.employees.map(emp => {
                          const sanitizedTeam = (emp.team || 'none').toLowerCase().replace(/[^a-z]/g, '');
                          const teamClass = `team-${sanitizedTeam}`;
                          const isExpanded = expandedRows[emp.id];

                          return (
                            <React.Fragment key={emp.id}>
                              <tr className={`employee-table-row ${teamClass} ${isExpanded ? 'row-expanded' : ''}`}>
                                {/* Colaborador */}
                                <td className="emp-identity-cell">
                                  <div className={`employee-avatarsmall ${teamClass}`}>
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="emp-name-main">{highlightText(emp.name, searchTerm)}</span>
                                </td>

                                {/* Cargo */}
                                <td className="emp-role-cell">
                                  <span className="emp-role-text">{highlightText(emp.role || '-', searchTerm)}</span>
                                </td>

                                {/* Ramal */}
                                <td>
                                  <span className="emp-ramal-badge">{highlightText(emp.ramal || '-', searchTerm)}</span>
                                </td>

                                {/* Equipamentos */}
                                <td className="assets-count-cell">
                                  {emp.assets.length > 0 ? (
                                    <button 
                                      type="button"
                                      className="emp-slim-badge"
                                      onClick={() => setActiveEmployeeAssets(emp)}
                                      title={`Ver equipamentos de ${emp.name}`}
                                    >
                                      <span className="emp-slim-count">{emp.assets.length}</span>
                                      <span className="emp-slim-label">{emp.assets.length === 1 ? 'item' : 'itens'}</span>
                                    </button>
                                  ) : (
                                    <span className="emp-slim-empty">—</span>
                                  )}
                                </td>

                                {/* Ações */}
                                <td className="actions-cell" style={{ textAlign: 'right' }}>
                                  <TermActionsDropdown 
                                    employee={emp}
                                    termInfo={termData[emp.id]}
                                    onDownload={handleDownloadTermo}
                                    onDownloadDevolucao={handleDownloadTermoDevolucao}
                                    onUploadClick={handleUploadTermClick}
                                    onRemove={handleRemoveTerm}
                                    onDownloadSigned={handleDownloadSignedTerm}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteClick}
                                    onViewAssets={() => setActiveEmployeeAssets(emp)}
                                    onOffboard={handleOpenOffboard}
                                    userRole={userRole}
                                  />
                                </td>
                              </tr>

                              {/* Painel Expansível de Patrimônios */}
                              {isExpanded && (
                                <tr className="employee-details-row">
                                  <td colSpan="6">
                                    <div className="employee-expanded-panel">
                                      <h5 className="panel-title">Equipamentos Vinculados ({emp.assets.length})</h5>
                                      {emp.assets.length > 0 ? (
                                        <div className="compact-assets-grid">
                                          {emp.assets.map(asset => (
                                            <div key={asset.id} className="compact-asset-item">
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden', flexGrow: 1 }}>
                                                <div className="compact-asset-tag">#{highlightText(asset.tag, searchTerm)}</div>
                                                <div className="compact-asset-info">
                                                  <span className="compact-asset-name">{highlightText(asset.name, searchTerm)}</span>
                                                  <span className="compact-asset-type">{highlightText(asset.equipment, searchTerm)}</span>
                                                </div>
                                              </div>
                                              <div className="compact-asset-meta">
                                                <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                                                  {asset.condition || 'Novo'}
                                                </span>
                                                <button
                                                  type="button"
                                                  className="btn-action decommission"
                                                  onClick={() => setDecommissionAsset(asset)}
                                                  title="Dar Baixa (Aposentar item)"
                                                  style={{ width: '26px', height: '26px', minHeight: 'auto', padding: 0 }}
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="8" y1="12" x2="16" y2="12" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="no-assets-text">Nenhum patrimônio em posse no momento.</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
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
          <h3>Nenhum colaborador encontrado</h3>
          <p>
            {searchTerm 
              ? 'Nenhum resultado corresponde à sua pesquisa.' 
              : 'Não há colaboradores cadastrados no momento.'}
          </p>
        </div>
      )}

      {/* Modal: Cadastro/Edição de Colaborador */}
      {isEmployeeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <header className="modal-header">
              <h2>{editingEmployee ? 'Editar Colaborador' : 'Cadastrar Colaborador'}</h2>
              <button className="modal-close-btn" onClick={() => setIsEmployeeModalOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleEmployeeSubmit} className="modal-form">
              {!editingEmployee && (
                <div style={{
                  backgroundColor: 'var(--primary-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <strong>Dica:</strong> Deseja entregar o Kit com Tela, Teclado e Suporte do estoque?
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setIsEmployeeModalOpen(false);
                      setIsOnboardingModalOpen(true);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Usar Onboarding com Kit
                  </button>
                </div>
              )}

              {validationError && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                  {validationError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="emp-name">Nome do Colaborador *</label>
                  <input
                    type="text"
                    id="emp-name"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Ex: Gabriel Ferezim"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="emp-role">Cargo / Função *</label>
                  <input
                    type="text"
                    id="emp-role"
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value)}
                    placeholder="Ex: Assistente de T.I I"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-sector">Setor / Departamento *</label>
                  <select
                    id="emp-sector"
                    value={employeeSector}
                    onChange={(e) => setEmployeeSector(e.target.value)}
                    required
                  >
                    <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Administração">Administração</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Departamento Pessoal">Departamento Pessoal</option>
                    <option value="GESTÃO PATRIMONIAL">GESTÃO PATRIMONIAL</option>
                    <option value="DESENVOLVIMENTO IMOBILIÁRIO">DESENVOLVIMENTO IMOBILIÁRIO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="emp-team">Equipe / Cliente *</label>
                  <input
                    type="text"
                    id="emp-team"
                    list="team-suggestions-list"
                    value={employeeTeam}
                    onChange={(e) => setEmployeeTeam(e.target.value)}
                    placeholder="Selecione ou digite (Ex: C&A, Latam, Prosegur, Geral...)"
                    required
                  />
                  <datalist id="team-suggestions-list">
                    <option value="Nenhuma">Nenhuma / Geral</option>
                    <option value="C&A" />
                    <option value="Latam" />
                    <option value="Prosegur" />
                    {allTeams.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="emp-ramal">Ramal Telefônico</label>
                  <input
                    type="text"
                    id="emp-ramal"
                    value={employeeRamal}
                    onChange={(e) => setEmployeeRamal(e.target.value)}
                    placeholder="Ex: 4005"
                  />
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEmployeeModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Patrimônios */}
      {activeEmployeeAssets && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
            <header className="modal-header">
              <div>
                <h2>Equipamentos do Colaborador</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Colaborador: <strong>{activeEmployeeAssets.name}</strong> ({activeEmployeeAssets.role})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveEmployeeAssets(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="modal-body" style={{ padding: '1rem 0' }}>
              {activeEmployeeAssets.assets.length > 0 ? (
                <div className="table-card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Nº Patrimônio</th>
                        <th>Nome / Descrição</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeEmployeeAssets.assets.map(asset => (
                        <tr key={asset.id}>
                          <td className="asset-tag-cell">
                            <span className="tag-badge">#{asset.tag}</span>
                          </td>
                          <td>
                            <span className="asset-name-main">{asset.name}</span>
                          </td>
                          <td>{asset.equipment}</td>
                          <td>
                            <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                              {asset.condition || 'Novo'}
                            </span>
                          </td>
                          <td>
                            <span className="employee-asset-notes">
                              {asset.notes || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-list" style={{ padding: '2rem 1rem' }}>
                  <p>Este colaborador não possui equipamentos vinculados no momento.</p>
                </div>
              )}
            </div>

            <footer className="form-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setActiveEmployeeAssets(null)}>
                Fechar
              </button>
            </footer>
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
            <h2>Dar Baixa no Equipamento?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              Você está prestes a dar baixa no patrimônio <strong>{decommissionAsset.name}</strong> (#{decommissionAsset.tag}). 
              Ele será desvinculado e marcado permanentemente como inativo.
            </p>
            
            <div className="form-group" style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
              <label htmlFor="decommission-reason-emp" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-main)' }}>
                Motivo da Baixa (Opcional):
              </label>
              <textarea
                id="decommission-reason-emp"
                rows="3"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                placeholder="Ex: Defeito sem conserto, perda, obsolescência..."
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

      {/* Modal: Offboarding / Devolução de Bens */}
      {offboardingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', width: '92%' }}>
            <header className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="18" y1="8" x2="23" y2="13" />
                    <line x1="23" y1="8" x2="18" y2="13" />
                  </svg>
                  Offboarding / Devolução de Patrimônio
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Colaborador: <strong>{offboardingEmployee.name}</strong> ({offboardingEmployee.role || 'Colaborador'} • {offboardingEmployee.sector})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setOffboardingEmployee(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="modal-body" style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Lista de Equipamentos em Custódia para Conferência */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Equipamentos a Devolver ({offboardSelectedAssetIds.length} de {offboardingEmployee.assets.length} selecionados):
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                    onClick={() => {
                      if (offboardSelectedAssetIds.length === offboardingEmployee.assets.length) {
                        setOffboardSelectedAssetIds([]);
                      } else {
                        setOffboardSelectedAssetIds(offboardingEmployee.assets.map(a => a.id));
                      }
                    }}
                  >
                    {offboardSelectedAssetIds.length === offboardingEmployee.assets.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>

                {offboardingEmployee.assets.length > 0 ? (
                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-app)',
                    padding: '0.4rem'
                  }}>
                    {offboardingEmployee.assets.map(asset => {
                      const isSelected = offboardSelectedAssetIds.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                            marginBottom: '0.25rem',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? 'var(--border-color)' : 'transparent'}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleOffboardAsset(asset.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.85rem' }}>#{asset.tag}</strong>
                              <span style={{ fontSize: '0.85rem', marginLeft: '0.4rem' }}>{asset.name}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {asset.equipment} • S/N: {asset.serial_number || 'Sem S/N'}
                              </div>
                            </div>
                          </div>
                          <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                            {asset.condition || 'Novo'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Este colaborador não possui nenhum equipamento vinculado no momento.
                  </p>
                )}
              </div>

              {/* Destino dos Itens Devolvidos */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Destino dos Equipamentos Devolvidos:
                </label>
                <select
                  value={offboardDestination}
                  onChange={(e) => setOffboardDestination(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="Estoque Central">Estoque Central (Disponibilizar para novos usuários)</option>
                  <option value="Em Manutenção">Enviar para Revisão / Higienização Técnica</option>
                </select>
              </div>

              {/* Observações da Devolução */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                  Observações da Conferência Física / Quitação:
                </label>
                <textarea
                  rows="2"
                  value={offboardNotes}
                  onChange={(e) => setOffboardNotes(e.target.value)}
                  placeholder="Ex: Equipamentos conferidos em bom estado, fontes e cabos inclusos..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Opção de Excluir / Desativar Colaborador */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={offboardRemoveEmp}
                  onChange={(e) => setOffboardRemoveEmp(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Remover cadastro do colaborador do sistema após a conclusão do offboarding</span>
              </label>
            </div>

            <footer className="form-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOffboardingEmployee(null)}>
                Cancelar
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    const empAssets = offboardingEmployee.assets || [];
                    const selected = empAssets.filter(a => offboardSelectedAssetIds.includes(a.id));
                    await gerarTermoDevolucao(offboardingEmployee, selected, offboardNotes);
                  }}
                  title="Baixar apenas o documento PDF de devolução sem alterar os dados"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Baixar Termo PDF</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmOffboard}
                  disabled={offboardSelectedAssetIds.length === 0 && (offboardingEmployee.assets || []).length > 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Concluir Offboarding & Baixar PDF</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Modal: Onboarding com Kit de Equipamentos */}
      <OnboardingKitModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        assets={assets}
        employees={employees}
        onConfirmOnboarding={onOnboardEmployeeWithKit}
      />

      {/* Input oculto para upload do termo assinado */}
      <input
        ref={termFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleTermFileChange}
      />
    </div>
  );
}
