import React, { useState, useEffect } from 'react';

export default function UsersList({
  users = [],
  currentUser = null,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onSendUserEmail,
  highlightText = (text) => text
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [emailPreviewUser, setEmailPreviewUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form State Usuário
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Operador');
  const [formDepartment, setFormDepartment] = useState('Tecnologia da Informação');
  const [formStatus, setFormStatus] = useState('Ativo');
  const [formSendEmail, setFormSendEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Trynova - Gestão de Patrimônio');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState('');

  // Carrega configurações SMTP ao montar
  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch('/api/smtp-config');
      if (res.ok) {
        const data = await res.json();
        if (data.is_configured) {
          setSmtpHost(data.host || '');
          setSmtpPort(data.port || 587);
          setSmtpSecure(!!data.secure);
          setSmtpUser(data.user || '');
          setSmtpFromName(data.from_name || 'Trynova - Gestão de Patrimônio');
          setSmtpFromEmail(data.from_email || '');
          setSmtpConfigured(true);
        }
      }
    } catch (_) {}
  };

  // Presets Rápidos de SMTP
  const applyPreset = (type) => {
    setSmtpFeedback('');
    setSmtpTestResult(null);
    if (type === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpFromName('Trynova - Gestão de Patrimônio');
      if (!smtpUser.includes('@gmail.com') && !smtpUser) {
        setSmtpUser('seu-email@gmail.com');
      }
    } else if (type === 'office365') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpFromName('Trynova - Gestão de Patrimônio');
    } else if (type === 'trynova') {
      setSmtpHost('mail.trynova.com.br');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpFromName('Trynova - Gestão de Patrimônio');
      if (!smtpUser) setSmtpUser('notificacoes@trynova.com.br');
    }
  };

  // Salvar Configurações SMTP
  const handleSaveSmtp = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpFeedback('');

    try {
      const res = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from_name: smtpFromName,
          from_email: smtpFromEmail || smtpUser
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar SMTP');
      }

      setSmtpConfigured(true);
      setSmtpFeedback('✓ Configurações de e-mail salvas com sucesso!');
    } catch (err) {
      setSmtpFeedback('❌ ' + err.message);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Testar Envio de E-mail SMTP
  const handleTestSmtp = async () => {
    const targetEmail = smtpTestEmail.trim() || (currentUser ? currentUser.email : smtpUser);
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Por favor, informe um e-mail de destino válido para o teste.');
      return;
    }

    // Salva primeiro para garantir que o teste use as credenciais mais recentes
    await handleSaveSmtp();

    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: targetEmail })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao testar conexão SMTP');
      }

      setSmtpTestResult({
        success: true,
        message: `✓ E-mail de teste enviado com sucesso para ${targetEmail}! Verifique sua caixa de entrada (e pasta de spam).`
      });
    } catch (err) {
      setSmtpTestResult({
        success: false,
        message: `❌ Falha ao enviar: ${err.message}`
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

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
    setFormSendEmail(true);
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
        department: formDepartment,
        send_email: formSendEmail
      });

      setIsCreateModalOpen(false);

      if (formSendEmail) {
        setEmailPreviewUser({
          ...created,
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          username: formUsername.trim().toLowerCase(),
          password: formPassword.trim(),
          role: formRole,
          emailSent: created?.emailSent,
          emailWarning: created?.emailWarning
        });
      }
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

  // Reenviar e-mail de acesso
  const handleResendEmail = async (user) => {
    setIsSendingEmail(true);
    try {
      const res = await onSendUserEmail(user.id);
      setEmailPreviewUser({
        ...user,
        password: '(Senha confidencial cadastrada - ou redefina na edição)',
        emailSent: res?.emailSent,
        emailWarning: res?.emailWarning
      });
    } catch (err) {
      alert(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Copiar dados do e-mail
  const handleCopyCredentials = (user) => {
    const textToCopy = `*TRYNOVA - Credenciais de Acesso ao Sistema de Patrimônio*\n\n` +
      `👤 *Nome:* ${user.name}\n` +
      `📧 *E-mail:* ${user.email}\n` +
      `🔑 *Usuário:* ${user.username}\n` +
      `🔒 *Senha:* ${user.password || user.generatedPassword || 'Sua senha cadastrada'}\n` +
      `🛡️ *Perfil:* ${user.role}\n` +
      `🌐 *Link de Acesso:* ${window.location.origin}\n\n` +
      `_Acesse o sistema e atualize sua senha no primeiro login se desejar._`;

    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Métricas
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'Administrador').length;
  const operatorUsers = users.filter(u => u.role === 'Operador' || u.role === 'Técnico').length;
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

  return (
    <div className="users-list-container">
      {/* Header Principal */}
      <header className="page-header">
        <div className="page-title-group">
          <h1>Usuários & Acessos</h1>
          <p className="page-subtitle">
            Gerencie as contas de acesso ao sistema, defina permissões e envie credenciais automaticamente por e-mail.
          </p>
        </div>

        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSmtpFeedback('');
              setSmtpTestResult(null);
              setSmtpTestEmail(currentUser ? currentUser.email : '');
              setIsSmtpModalOpen(true);
            }}
            title="Configurar servidor de envio de e-mails (Gmail, Outlook, Host próprio)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: smtpConfigured ? 'var(--color-success)' : 'var(--text-muted)' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Configurar E-mail (SMTP)</span>
            {smtpConfigured && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
            )}
          </button>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <span>Novo Usuário</span>
          </button>
        </div>
      </header>

      {/* Alerta de Configuração SMTP se ainda não configurado */}
      {!smtpConfigured && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💡</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              Para que os e-mails cheguem <strong>diretamente na caixa de entrada real</strong> dos usuários, configure seu servidor de envio (Gmail, Outlook ou SMTP próprio).
            </span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSmtpFeedback('');
              setSmtpTestResult(null);
              setSmtpTestEmail(currentUser ? currentUser.email : '');
              setIsSmtpModalOpen(true);
            }}
            style={{ fontSize: '0.78rem' }}
          >
            ⚙️ Configurar Agora
          </button>
        </div>
      )}

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
              <th className="actions-header">Ações</th>
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
                      <span className={`status-badge ${isAdmin ? 'in-use' : 'in-stock'}`} style={{ fontWeight: 600 }}>
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
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleResendEmail(user)}
                          title="Enviar / Reenviar e-mail de acesso"
                          disabled={isSendingEmail}
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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

      {/* MODAL: CONFIGURAÇÃO DE E-MAIL (SMTP) */}
      {isSmtpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', width: '90%' }}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                <div>
                  <h2>Configurações do Servidor de E-mail (SMTP)</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Defina o servidor para que as credenciais cheguem na caixa de entrada dos usuários.
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsSmtpModalOpen(false)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <form onSubmit={handleSaveSmtp} className="modal-form">
              {/* Presets Rápidos */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                  Preenchimento Automático por Provedor:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset('gmail')}>
                    🔵 Gmail / Google Workspace
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset('office365')}>
                    🟠 Outlook / Office 365
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset('trynova')}>
                    🟢 Trynova / SMTP Próprio
                  </button>
                </div>
              </div>

              {smtpFeedback && (
                <div style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: smtpFeedback.startsWith('✓') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: smtpFeedback.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}>
                  {smtpFeedback}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="smtp-host">Servidor SMTP (Host) *</label>
                  <input
                    type="text"
                    id="smtp-host"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="Ex: smtp.gmail.com ou smtp.office365.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="smtp-port">Porta SMTP *</label>
                  <input
                    type="number"
                    id="smtp-port"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587 ou 465"
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                    />
                    <span>Conexão SSL/TLS Direta (Porta 465)</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="smtp-user">Usuário / E-mail de Envio *</label>
                  <input
                    type="email"
                    id="smtp-user"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="Ex: notificacoes@trynova.com.br"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="smtp-pass">Senha ou Senha de App *</label>
                  <input
                    type="password"
                    id="smtp-pass"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="Senha do e-mail ou Senha de App"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="smtp-from-name">Nome do Remetente</label>
                  <input
                    type="text"
                    id="smtp-from-name"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="Ex: Trynova - Gestão de Patrimônio"
                  />
                </div>
              </div>

              {/* Dica para Gmail / Senha de App */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', margin: '0.75rem 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                📌 <strong>Como usar Gmail:</strong> Acesse sua Conta Google &gt; <em>Segurança</em> &gt; <em>Verificação em 2 etapas</em> &gt; <strong>Senhas de app</strong>. Crie uma senha de app e cole no campo acima.
              </div>

              {/* Área de Teste de Envio */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  🧪 Testar Envio em Tempo Real
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="Digite seu e-mail para receber um teste"
                    value={smtpTestEmail}
                    onChange={(e) => setSmtpTestEmail(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleTestSmtp}
                    disabled={isTestingSmtp || !smtpHost || !smtpUser}
                  >
                    {isTestingSmtp ? 'Enviando teste...' : 'Enviar Teste'}
                  </button>
                </div>

                {smtpTestResult && (
                  <div style={{
                    marginTop: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: smtpTestResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    color: smtpTestResult.success ? 'var(--color-success)' : 'var(--color-danger)',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}>
                    {smtpTestResult.message}
                  </div>
                )}
              </div>

              <footer className="form-footer" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSmtpModalOpen(false)}>
                  Fechar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingSmtp}>
                  {isSavingSmtp ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO USUÁRIO */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%' }}>
            <header className="modal-header">
              <div>
                <h2>Cadastrar Novo Usuário</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Crie os dados de acesso e envie as instruções diretamente para o e-mail do colaborador.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              {formError && (
                <div className="login-error-alert" style={{ marginBottom: '1rem' }}>
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="user-name">Nome Completo *</label>
                  <input
                    type="text"
                    id="user-name"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!formUsername) {
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '.');
                        setFormUsername(clean);
                      }
                    }}
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
                    placeholder="Ex: T.I, Marketing, Operações..."
                  />
                </div>

                <div className="form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label htmlFor="user-pass" style={{ margin: 0 }}>Senha Inicial de Acesso *</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={generateSecurePassword}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      ⚡ Gerar Senha Segura
                    </button>
                  </div>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="user-pass"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Defina ou gere uma senha"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                {/* Checkbox de Envio de E-mail */}
                <div className="form-group full-width" style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formSendEmail}
                      onChange={(e) => setFormSendEmail(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>📧 Enviar e-mail de acesso corporativo com instruções para o usuário</span>
                  </label>
                  <p style={{ margin: '0.35rem 0 0 1.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    O destinatário receberá o link do sistema, seu usuário, senha inicial e orientações de segurança.
                  </p>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Usuário & Enviar
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%' }}>
            <header className="modal-header">
              <div>
                <h2>Editar Usuário</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Atualize permissões, departamento ou redefina a senha de <strong>{editingUser.name}</strong>.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)} aria-label="Fechar">
                &times;
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="modal-form">
              {formError && (
                <div className="login-error-alert" style={{ marginBottom: '1rem' }}>
                  <span>{formError}</span>
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
                  <label htmlFor="edit-user-role">Perfil de Acesso *</label>
                  <select
                    id="edit-user-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    <option value="Administrador">Administrador (Acesso Total)</option>
                    <option value="Operador">Operador / Técnico (Gestão e Cadastros)</option>
                    <option value="Visualizador">Visualizador (Apenas Consulta)</option>
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
                      ⚡ Gerar Nova Senha
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

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
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

      {/* MODAL: PRÉ-VISUALIZAÇÃO DO E-MAIL DE ACESSO ENVIADO */}
      {emailPreviewUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', width: '90%' }}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📨</span>
                <div>
                  <h2>E-mail de Acesso Corporativo</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Instruções e credenciais de acesso para <strong>{emailPreviewUser.email}</strong>.
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEmailPreviewUser(null)} aria-label="Fechar">
                &times;
              </button>
            </header>

            {/* Status do Envio */}
            <div style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              backgroundColor: emailPreviewUser.emailSent ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: emailPreviewUser.emailSent ? 'var(--color-success)' : 'var(--color-warning)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                {emailPreviewUser.emailSent
                  ? `✓ Entregue com sucesso na caixa de entrada de ${emailPreviewUser.email}!`
                  : `⚠️ Servidor SMTP não conectado. Configure o SMTP no botão acima para entrega automática.`}
              </span>
              {!emailPreviewUser.emailSent && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEmailPreviewUser(null);
                    setIsSmtpModalOpen(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                >
                  ⚙️ Configurar SMTP
                </button>
              )}
            </div>

            {/* Template do E-mail */}
            <div style={{
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Para:</div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{emailPreviewUser.name} &lt;{emailPreviewUser.email}&gt;</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Assunto: Trynova - Seus dados de acesso
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                <p>Olá, <strong>{emailPreviewUser.name}</strong>!</p>
                <p>Sua conta de acesso ao <strong>Sistema de Gestão de Patrimônio & Ativos da Trynova</strong> foi configurada com sucesso pelo Administrador.</p>

                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px dashed var(--primary-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  margin: '0.85rem 0'
                }}>
                  <div style={{ marginBottom: '0.4rem' }}>
                    🌐 <strong>URL do Sistema:</strong> <a href={window.location.origin} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>{window.location.origin}</a>
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>
                    👤 <strong>Usuário / E-mail:</strong> <code>{emailPreviewUser.username}</code> ou <code>{emailPreviewUser.email}</code>
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>
                    🔒 <strong>Senha Inicial:</strong> <code style={{ backgroundColor: 'var(--bg-app)', padding: '2px 6px', fontWeight: 700, color: 'var(--primary)' }}>{emailPreviewUser.password || emailPreviewUser.generatedPassword || 'Definida pelo Administrador'}</code>
                  </div>
                  <div>
                    🛡️ <strong>Perfil de Acesso:</strong> {emailPreviewUser.role}
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ⚠️ <em>Por segurança, recomendamos alterar sua senha após o primeiro acesso ao sistema.</em>
                </p>
                <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Atenciosamente,<br />Gestão de T.I - Trynova
                </p>
              </div>
            </div>

            <footer className="form-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleCopyCredentials(emailPreviewUser)}
              >
                {copySuccess ? '✓ Copiado com Sucesso!' : '📋 Copiar Credenciais'}
              </button>

              <button type="button" className="btn btn-primary" onClick={() => setEmailPreviewUser(null)}>
                Concluir
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {deleteConfirmUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h3>Excluir Usuário?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.25rem 0' }}>
              Tem certeza que deseja remover o acesso de <strong>{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username})? Esta ação não pode ser desfeita.
            </p>

            <div className="confirm-buttons">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={async () => {
                  await onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
