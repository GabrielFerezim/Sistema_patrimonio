import React, { useState } from 'react';

const MaintenanceList = ({ assets, employees = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [layoutMode, setLayoutMode] = useState('list'); // 'list' ou 'grid'

    // Modal states for CRUD Employee
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeSector, setEmployeeSector] = useState('Tecnologia da Informação');
    const [employeeRole, setEmployeeRole] = useState('');
    const [employeeRamal, setEmployeeRamal] = useState('');
    const [employeeTeam, setEmployeeTeam] = useState('Nenhuma');
    const [validationError, setValidationError] = useState('');

    // Asset viewer modal state
    const [activeEmployeeAssets, setActiveEmployeeAssets] = useState(null);
    
    const closeEmployeeModal = () => {
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        setEmployeeName('');
        setEmployeeSector('Tecnologia da Informação');
        setEmployeeRole('');
        setEmployeeRamal('');
        setEmployeeTeam('Nenhuma');
        setValidationError('');
    };

    const handleEmployeeFormSubmit = (e) => {
        e.preventDefault();
        if (!employeeName.trim() || !employeeSector.trim() || !employeeRole.trim()) {
            setValidationError('Por favor, preencha todos os campos obrigatórios (Nome, Cargo, Setor).');
            return;
        }

        // Verifica nomes duplicados (ignorando o que está sendo editado)
        const isDuplicate = employees.some(emp =>
            emp.name.toLowerCase().trim() === employeeName.toLowerCase().trim() &&
            (!editingEmployee || emp.id !== editingEmployee.id)
        );

        if (isDuplicate) {
            setValidationError('Já existe um funcionário cadastrado com este nome.');
            return;
        }

        const savedData = {
            name: employeeName.trim(),
            sector: employeeSector.trim(),
            role: employeeRole.trim(),
            ramal: employeeRamal.trim(),
            team: employeeTeam,
        };

        if (editingEmployee) {
            savedData.id = editingEmployee.id;
            savedData.oldName = editingEmployee.name;
        }

        onSaveEmployee(savedData);
        closeEmployeeModal();
    };

    const handleDeleteClick = (emp) => {
        if (window.confirm(`Tem certeza de que deseja excluir o funcionário "${emp.name}"? Todos os patrimônios em uso por ele voltarão para o estoque.`)) {
            onDeleteEmployee(emp.id, emp.name);
        }
    };

    // Mapeia os funcionários atuais e busca seus patrimônios
    const employeesWithAssets = employees.map(emp => {
        const empAssets = assets.filter(
            asset => asset.status === 'Em Uso' && asset.employee && asset.employee.trim().toLowerCase() === emp.name.trim().toLowerCase()
        );
        return {
            ...emp,
            assets: empAssets
        };
    });

    // Filtra pelo termo de busca
    const filteredEmployees = employeesWithAssets.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.team && emp.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
        emp.assets.some(asset =>
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.equipment.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Agrupa os funcionários filtrados por setor
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

    // Converte os grupos de setores em um array ordenado
    const sectors = Object.values(sectorGroups).sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
    );

    // Métricas
    const totalEmployees = employees.length;
    const totalAssignedAssets = assets.filter(a => a.status === 'Em Uso' && a.employee).length;
    const totalMaintenanceAssets = assets.filter(a => a.status === 'Manutenção').length;

    return (
        <div className="employees-list-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Funcionários</h1>
                    <p className="page-subtitle">Acompanhe a distribuição e responsabilidade dos equipamentos por colaborador e setor</p>
                </div>

            </header>

            {/* Grade de KPIs Resumidos */}
            {totalEmployees > 0 && (
                <div className="employees-kpi-grid">
                    <div className="emp-kpi-card">
                        <div className="emp-kpi-icon active-user">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench-icon lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>
                        </div>
                        <div className="emp-kpi-info">
                            <span className="emp-kpi-label">Equipamentos para manutenção</span>
                            <span className="emp-kpi-value">{totalMaintenanceAssets}</span>
                        </div>
                    </div>

                    <div className="emp-kpi-card">
                        <div className="emp-kpi-icon assets">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-laptop-minimal-check-icon lucide-laptop-minimal-check"><path d="M2 20h20"/><path d="m9 10 2 2 4-4"/><rect x="3" y="4" width="18" height="12" rx="2"/></svg>
                        </div>
                        <div className="emp-kpi-info">
                            <span className="emp-kpi-label">Equipamentos em manutenção</span>
                            <span className="emp-kpi-value">{totalAssignedAssets}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra de Filtros e Alternador de Layout */}
            <div className="filter-bar">
                <div className="search-wrapper" style={{ flexGrow: 1 }}>
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Pesquisar por funcionário, cargo, setor, equipe ou equipamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Limpar busca">
                            &times;
                        </button>
                    )}
                </div>

                {/* Botão de Alternância de Layout (Design Profissional Enterprise) */}
                <div className="layout-toggle-group">
                    <button
                        type="button"
                        className={`layout-toggle-btn ${layoutMode === 'list' ? 'active' : ''}`}
                        onClick={() => setLayoutMode('list')}
                        title="Visualização em Lista de Diretório"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
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
                        title="Visualização em Cards de Perfil"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Cards
                    </button>
                </div>
            </div>

            {/* Listagem de Setores e Grades de Cards/Tabelas */}
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
                                                    {/* Top Row: Actions + Team Badge */}
                                                    <div className="profile-card-top">
                                                        <div className="profile-card-actions">
            
                                                            <button className="profile-btn-action delete" onClick={() => handleDeleteClick(emp)} title="Excluir Funcionário">
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {emp.team && emp.team !== 'Nenhuma' && (
                                                            <span className={`team-badge ${teamClass}`}>
                                                                {emp.team}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Avatar */}
                                                    <div className={`profile-card-avatar-wrapper ${teamClass}`}>
                                                        <div className="profile-card-avatar">
                                                            {emp.name.charAt(0).toUpperCase()} {/* charArt serve para exibir a inicial do nome */}
                                                        </div>
                                                    </div>

                                                    {/* Employee Identity */}
                                                    <div className="profile-card-identity">
                                                        <h4 className="profile-card-name" title={emp.name}>{emp.name}</h4>
                                                        <p className="profile-card-role" title={emp.role || 'Sem Cargo'}>
                                                            {emp.role || 'Sem Cargo'}
                                                        </p>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="profile-card-details">
                                                        <div className="profile-detail-row">
                                                            <span className="detail-icon">☎</span>
                                                            <span className="detail-text">
                                                                Ramal: <strong>{emp.ramal || '-'}</strong>
                                                            </span>
                                                        </div>
                                                        <div className="profile-detail-row">
                                                            <span className="detail-icon">📦</span>
                                                            <span className="detail-text">
                                                                Posse: <strong>{emp.assets.length} {emp.assets.length === 1 ? 'item' : 'itens'}</strong>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* View Assets Action Button */}
                                                    <button
                                                        className="btn btn-secondary btn-profile-view-assets"
                                                        onClick={() => setActiveEmployeeAssets(emp)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                                        </svg>
                                                        Ver Patrimônios
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* MODO LISTA/TABELA (TABULAR DIRECTORY VIEW - DEFAULT) */
                                    <div className="table-card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                                        <table className="employees-dir-table">
                                            <thead>
                                                <tr>
                                                    <th>Colaborador</th>
                                                    <th>Cargo</th>
                                                    <th>Equipe</th>
                                                    <th>Ramal</th>
                                                    <th>Patrimônios em Posse</th>
                                                    <th className="actions-header">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sector.employees.map(emp => {
                                                    const sanitizedTeam = (emp.team || 'none').toLowerCase().replace(/[^a-z]/g, '');
                                                    const teamClass = `team-${sanitizedTeam}`;

                                                    return (
                                                        <tr key={emp.id} className={`employee-table-row ${teamClass}`}>
                                                            {/* Colaborador (Avatar + Nome) */}
                                                            <td className="emp-identity-cell">
                                                                <div className={`employee-avatarsmall ${teamClass}`}>
                                                                    {emp.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="emp-name-main">{emp.name}</span>
                                                            </td>

                                                            {/* Cargo */}
                                                            <td className="emp-role-cell">
                                                                <span className="emp-role-text">{emp.role || '-'}</span>
                                                            </td>

                                                            {/* Equipe */}
                                                            <td>
                                                                {emp.team && emp.team !== 'Nenhuma' ? (
                                                                    <span className={`team-badge ${teamClass}`}>
                                                                        {emp.team}
                                                                    </span>
                                                                ) : (
                                                                    <span className="team-badge-none">-</span>
                                                                )}
                                                            </td>

                                                            {/* Ramal */}
                                                            <td className="emp-ramal-cell">
                                                                {emp.ramal ? (
                                                                    <strong>{emp.ramal}</strong>
                                                                ) : (
                                                                    <span className="unassigned">-</span>
                                                                )}
                                                            </td>

                                                            {/* Quantidade de Patrimônios */}
                                                            <td className="emp-assets-cell">
                                                                <span className="assets-count-badge-compact">
                                                                    📦 {emp.assets.length} {emp.assets.length === 1 ? 'item' : 'itens'}
                                                                </span>
                                                            </td>

                                                            {/* Ações */}
                                                            <td className="actions-cell">
                                                                <button
                                                                    className="btn-action delete"
                                                                    onClick={() => handleDeleteClick(emp)}
                                                                    title="Excluir Funcionário"
                                                                >
                                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" />
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    className="btn-action view-assets-list-btn"
                                                                    onClick={() => setActiveEmployeeAssets(emp)}
                                                                    title="Ver Patrimônios"
                                                                    style={{ color: 'var(--primary-light)' }}
                                                                >
                                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
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
                    <h3>Nenhum funcionário encontrado</h3>
                    <p>
                        {searchTerm
                            ? 'Nenhum resultado corresponde à sua pesquisa.'
                            : 'Não há funcionários cadastrados no sistema. Clique em "Cadastrar Funcionário" para começar.'}
                    </p>
                </div>
            )}

            {/* Modal de Cadastro/Edição de Funcionário */}
            {isEmployeeModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <header className="modal-header">
                            <h2>{editingEmployee ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}</h2>
                            <button className="modal-close-btn" onClick={closeEmployeeModal} aria-label="Fechar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        <form onSubmit={handleEmployeeFormSubmit} className="modal-form">
                            {validationError && (
                                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                                    {validationError}
                                </div>
                            )}

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="empName">Nome do Funcionário *</label>
                                    <input
                                        type="text"
                                        id="empName"
                                        value={employeeName}
                                        onChange={(e) => setEmployeeName(e.target.value)}
                                        placeholder="Ex: Gabriel Ferezim"
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="empRole">Cargo *</label>
                                    <input
                                        type="text"
                                        id="empRole"
                                        value={employeeRole}
                                        onChange={(e) => setEmployeeRole(e.target.value)}
                                        placeholder="Ex: Assistente de T.I I"
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="empSector">Setor / Departamento *</label>
                                    <select
                                        id="empSector"
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
                                        <option value="Administração / Financeiro">Administração / Financeiro</option>
                                        <option value="Departamento Pessoal">Departamento Pessoal</option>
                                        <option value="GESTÃO PATRIMONIAL | Renovações">GESTÃO PATRIMONIAL | Renovações</option>
                                        <option value="GESTÃO PATRIMONIAL"> GESTÃO PATRIMONIAL </option>
                                        <option value="GESTÃO PATRIMONIAL | Registro de Imóveis"> GESTÃO PATRIMONIAL | Registro de Imóveis </option>
                                        <option value="DESENVOLVIMENTO IMOBILIÁRIO | Estudos e Expansões"> DESENVOLVIMENTO IMOBILIÁRIO | Estudos e Expansões </option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="empTeam">Equipe / Cliente *</label>
                                    <select
                                        id="empTeam"
                                        value={employeeTeam}
                                        onChange={(e) => setEmployeeTeam(e.target.value)}
                                        required
                                    >
                                        <option value="Nenhuma">Nenhuma / Outra</option>
                                        <option value="C&A">C&A</option>
                                        <option value="Latam">Latam</option>
                                        <option value="Prosegur">Prosegur</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="empRamal">Ramal</label>
                                    <input
                                        type="text"
                                        id="empRamal"
                                        value={employeeRamal}
                                        onChange={(e) => setEmployeeRamal(e.target.value)}
                                        placeholder="Ex: 4002"
                                    />
                                </div>
                            </div>

                            <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeEmployeeModal}>
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

            {/* Modal de Exibição de Patrimônios (Viewer Modal) */}
            {activeEmployeeAssets && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
                        <header className="modal-header">
                            <div>
                                <h2>Patrimônios em Posse</h2>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Colaborador: <strong>{activeEmployeeAssets.name}</strong> ({activeEmployeeAssets.role})
                                </p>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setActiveEmployeeAssets(null)}
                                aria-label="Fechar"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        <div className="modal-body" style={{ padding: '1rem 0' }}>
                            {activeEmployeeAssets.assets.length > 0 ? (
                                <div className="table-card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)' }}>
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
                                                        <span className={`condition-badge ${asset.condition.toLowerCase()}`}>
                                                            {asset.condition}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="employee-asset-notes" title={asset.notes || 'Sem observações'} style={{ maxWidth: '240px' }}>
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
                                    <div className="empty-icon-wrapper">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                                            <line x1="9" y1="22" x2="9" y2="16" />
                                            <line x1="15" y1="22" x2="15" y2="16" />
                                            <line x1="2" y1="16" x2="22" y2="16" />
                                        </svg>
                                    </div>
                                    <h3>Nenhum patrimônio em posse</h3>
                                    <p>Este funcionário não possui equipamentos em uso no momento.</p>
                                </div>
                            )}
                        </div>

                        <footer className="form-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setActiveEmployeeAssets(null)}
                            >
                                Fechar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceList;
