import React, { useState } from 'react';

export default function UsersList({
  users = [],
  currentUser = null,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  highlightText = (text) => text
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form State Usuário
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Operador');
  const [formDepartment, setFormDepartment] = useState('Tecnologia da Informação');
  const [formStatus, setFormStatus] = useState('Ativo');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-gera senha segura
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pass);
    setShowPassword(true);
  };

  // Abre modal de criação
  const openCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('Operador');
    setFormDepartment('Tecnologia da Informação');
    setFormStatus('Ativo');
    setFormError('');
    setShowPassword(false);
    generateSecurePassword();
    setIsCreateModalOpen(true);
  };

  // Abre modal de edição
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role || 'Operador');
    setFormDepartment(user.department || 'Geral');
    setFormStatus(user.status || 'Ativo');
    setFormError('');
    setShowPassword(false);
  };

  // Submissão de criação
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formUsername.trim() || !formPassword.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const created = await onCreateUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        username: formUsername.trim().toLowerCase(),
        password: formPassword.trim(),
        role: formRole,
        department: formDepartment
      });

      setIsCreateModalOpen(false);

      // Mostra tela de credenciais para fácil cópia
      setCreatedUserCredentials({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        username: formUsername.trim().toLowerCase(),
        password: formPassword.trim(),
        role: formRole,
        department: formDepartment
      });
    } catch (err) {
      setFormError(err.message || 'Erro ao criar usuário.');
    }
  };

  // Submissão de edição
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formUsername.trim()) {
      setFormError('Nome, e-mail e usuário são obrigatórios.');
      return;
    }

    try {
      await onUpdateUser(editingUser.id, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        username: formUsername.trim().toLowerCase(),
        password: formPassword.trim() ? formPassword.trim() : undefined,
        role: formRole,
        department: formDepartment,
        status: formStatus
      });
      setEditingUser(null);
    } catch (err) {
      setFormError(err.message || 'Erro ao atualizar usuário.');
    }
  };

  // Copiar dados do usuário
  const handleCopyCredentials = (user) => {
    const textToCopy = `*TRYNOVA - Credenciais de Acesso ao Sistema de Patrimônio*\n\n` +
      `*Nome:* ${user.name}\n` +
      `*E-mail:* ${user.email}\n` +
      `*Usuário:* ${user.username}\n` +
      `*Senha:* ${user.password || 'Sua senha cadastrada'}\n` +
      `*Perfil:* ${user.role}\n` +
      `*Link de Acesso:* ${window.location.origin}\n\n` +
      `_Acesse o sistema com seu usuário e senha._`;

    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Métricas
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'Administrador').length;
  const operatorUsers = users.filter(u => u.role === 'Operador' || u.role === 'Técnico').length;
  const rhUsers = users.filter(u => u.role === 'Recursos Humanos' || u.role === 'RH').length;
  const activeUsers = users.filter(u => (u.status || 'Ativo') === 'Ativo').length;

  // Filtragem
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'Todos' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'Todos' || (u.status || 'Ativo') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const userRoleStr = String(currentUser?.role || '').trim().toLowerCase();
  const isCurrentUserAdmin = 
    userRoleStr === 'administrador' || 
    userRoleStr === 'admin' || 
    currentUser?.username?.toLowerCase() === 'admin' || 
    currentUser?.email?.toLowerCase() === 'gabriel.ferezim@trynova.com.br' || 
    !currentUser;

  if (currentUser && !isCurrentUserAdmin) {
    return (
      <div className="access-denied-container" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: 'var(--bg-card)',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            Acesso Restrito ao Administrador
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
            Seu perfil atual de acesso (<strong>{currentUser.role}</strong>) não possui permissão para visualizar, criar ou editar os usuários e credenciais do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-list-container">
      {/* Header Principal */}
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Usuários & Acessos</h1>
          <p className="page-subtitle">
            Gerencie os usuários do sistema, defina perfis de acesso e permissões de segurança
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <span>Novo Usuário</span>
          </button>
        </div>
      </header>

      {/* Grade de KPIs */}
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
            <span className="kpi-label">Total de Usuários</span>
            <span className="kpi-value">{totalUsers}</span>
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
            <span className="kpi-label">Administradores</span>
            <span className="kpi-value">{adminUsers}</span>
          </div>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-stock">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Operadores & Técnicos</span>
            <span className="kpi-value">{operatorUsers}</span>
          </div>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-maintenance">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14 14"></polyline>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Acessos Ativos</span>
            <span className="kpi-value">{activeUsers}</span>
          </div>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

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
              placeholder="Pesquisar por nome, e-mail, usuário ou departamento..."
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
              <label htmlFor="filter-role-user">Perfil</label>
              <select
                id="filter-role-user"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="Todos">Todos os Perfis</option>
                <option value="Administrador">Administrador</option>
                <option value="Operador">Operador</option>
                <option value="Recursos Humanos">Recursos Humanos / RH</option>
                <option value="Visualizador">Visualizador / Consulta</option>
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="filter-status-user">Status</label>
              <select
                id="filter-status-user"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="table-card">
        <table className="employees-dir-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail Corporativo</th>
              <th>Login / Usuário</th>
              <th>Perfil de Acesso</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th className="actions-header" style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const isAdmin = user.role === 'Administrador';
                const isCurrent = currentUser && (currentUser.id === user.id || currentUser.username === user.username);

                return (
                  <tr key={user.id} className="employee-table-row">
                    {/* Nome & Avatar */}
                    <td className="emp-identity-cell">
                      <div className="employee-avatarsmall" style={{ background: isAdmin ? 'var(--primary)' : 'var(--primary-light)' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="emp-name-main">
                          {highlightText(user.name, searchTerm)}
                          {isCurrent && (
                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              (Você)
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {user.department || 'Tecnologia da Informação'}
                        </span>
                      </div>
                    </td>

                    {/* E-mail */}
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-light)' }}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        {highlightText(user.email, searchTerm)}
                      </span>
                    </td>

                    {/* Username */}
                    <td>
                      <code style={{ fontSize: '0.8rem', padding: '2px 6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                        @{highlightText(user.username, searchTerm)}
                      </code>
                    </td>

                    {/* Perfil */}
                    <td>
                      <span className={`status-badge ${user.role === 'Administrador' ? 'in-use' : ((user.role === 'Recursos Humanos' || user.role === 'RH') ? 'novo' : 'in-stock')}`} style={{ fontWeight: 600 }}>
                        {user.role || 'Operador'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${(user.status || 'Ativo') === 'Ativo' ? 'in-stock' : 'in-maintenance'}`}>
                        {user.status || 'Ativo'}
                      </span>
                    </td>

                    {/* Último Acesso */}
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Nunca acessou'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyCredentials(user)}
                          title="Copiar dados de acesso para área de transferência"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(user)}
                          title="Editar dados e permissões"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>

                        {user.username !== 'admin' && user.email !== 'gabriel.ferezim@trynova.com.br' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteConfirmUser(user)}
                            title="Excluir usuário"
                            style={{ padding: '0.3rem 0.55rem', color: 'var(--color-danger)' }}
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
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhum usuário encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <header className="modal-header">
              <h2>Cadastrar Novo Usuário</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="user-name">Nome Completo *</label>
                  <input
                    type="text"
                    id="user-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-email">E-mail Corporativo *</label>
                  <input
                    type="email"
                    id="user-email"
                    value={formEmail}
                    onChange={(e) => {
                      setFormEmail(e.target.value);
                      if (!formUsername && e.target.value.includes('@')) {
                        setFormUsername(e.target.value.split('@')[0]);
                      }
                    }}
                    placeholder="Ex: joao.silva@trynova.com.br"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-username">Nome de Usuário (Login) *</label>
                  <input
                    type="text"
                    id="user-username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Ex: joao.silva"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-role">Perfil de Acesso *</label>
                  <select
                    id="user-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    <option value="Administrador">Administrador (Acesso Total)</option>
                    <option value="Operador">Operador / Técnico (Gestão e Cadastros)</option>
                    <option value="Recursos Humanos">Recursos Humanos (Colaboradores e Termos)</option>
                    <option value="Visualizador">Visualizador (Apenas Consulta)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="user-dept">Departamento / Setor</label>
                  <input
                    type="text"
                    id="user-dept"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Ex: Suporte Técnico, RH, Financeiro..."
                  />
                </div>

                <div className="form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label htmlFor="user-password" style={{ margin: 0 }}>Senha de Acesso Inicial *</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={generateSecurePassword}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      Gerar Senha Segura
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="user-password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Usuário
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENCIAIS CRIADAS (FACILITADOR PARA COPIAR) */}
      {createdUserCredentials && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2>Usuário Criado com Sucesso!</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setCreatedUserCredentials(null)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <div style={{ padding: '0.5rem 0 1rem 0' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
                As credenciais do usuário <strong>{createdUserCredentials.name}</strong> foram salvas. Você pode copiá-las abaixo para enviar diretamente ao colaborador:
              </p>

              <div style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div><strong>Login / Usuário:</strong> <code>{createdUserCredentials.username}</code></div>
                <div><strong>E-mail:</strong> {createdUserCredentials.email}</div>
                <div><strong>Senha Inicial:</strong> <code style={{ color: 'var(--color-success)', fontWeight: 700 }}>{createdUserCredentials.password}</code></div>
                <div><strong>Perfil:</strong> {createdUserCredentials.role}</div>
              </div>
            </div>

            <footer className="form-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleCopyCredentials(createdUserCredentials)}
              >
                {copySuccess ? 'Copiado!' : 'Copiar Credenciais'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setCreatedUserCredentials(null)}>
                Concluir
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <header className="modal-header">
              <h2>Editar Usuário: {editingUser.name}</h2>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="modal-form">
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="edit-user-name">Nome Completo *</label>
                  <input
                    type="text"
                    id="edit-user-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-email">E-mail Corporativo *</label>
                  <input
                    type="email"
                    id="edit-user-email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-username">Nome de Usuário (Login) *</label>
                  <input
                    type="text"
                    id="edit-user-username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-role">Nível de Acesso *</label>
                  <select
                    id="edit-user-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={editingUser.username === 'admin'}
                  >
                    <option value="Administrador">Administrador (Total)</option>
                    <option value="Operador">Operador (Edição e Controle)</option>
                    <option value="Visualizador">Visualizador (Somente Leitura)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-status">Status da Conta</label>
                  <select
                    id="edit-user-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo (Bloqueado)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label htmlFor="edit-user-pass" style={{ margin: 0 }}>Redefinir Senha (Opcional)</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={generateSecurePassword}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      Gerar Nova Senha
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="edit-user-pass"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {deleteConfirmUser && (
        <div className="modal-overlay danger">
          <div className="modal-content confirm-dialog">
            <div className="confirm-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2>Excluir Usuário?</h2>
            <p>
              Tem certeza de que deseja excluir o acesso de <strong>{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username})? Esta ação não pode ser desfeita.
            </p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
              >
                Excluir Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
