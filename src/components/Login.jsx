import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal Esqueci Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, informe seu usuário ou e-mail e sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Credenciais inválidas.');
      }

      const userData = await response.json();
      onLoginSuccess(userData);
    } catch (err) {
      // Fallback para login offline padrão ou usuários cadastrados no localStorage
      const cleanU = username.trim().toLowerCase();
      const cleanP = password.trim();

      try {
        const localUsers = JSON.parse(localStorage.getItem('trynova_users') || '[]');
        const matchedLocal = localUsers.find(
          u => (u.username?.toLowerCase() === cleanU || u.email?.toLowerCase() === cleanU) && String(u.password).trim() === cleanP
        );
        if (matchedLocal) {
          if (matchedLocal.status === 'Inativo') {
            setError('Usuário desativado. Entre em contato com o Administrador.');
            return;
          }
          const { password: _, ...safeUser } = matchedLocal;
          onLoginSuccess(safeUser);
          return;
        }
      } catch (_) {}

      if (
        (cleanU === 'admin' || cleanU === 'gabriel.ferezim@trynova.com.br' || cleanU === 'gabriel') &&
        (cleanP === 'admin123' || cleanP === 'admin')
      ) {
        onLoginSuccess({
          id: 1,
          username: 'admin',
          name: 'Gabriel Ferezim',
          email: 'gabriel.ferezim@trynova.com.br',
          role: 'Administrador',
          department: 'Tecnologia da Informação',
          status: 'Ativo',
          avatar: 'G'
        });
      } else {
        setError(err.message || 'Erro ao autenticar. Verifique seu usuário e senha.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsForgotLoading(true);
    setForgotMessage('');

    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      setForgotMessage(`Se o e-mail ${forgotEmail} estiver cadastrado, as orientações de recuperação foram enviadas.`);
    } catch (_) {
      setForgotMessage(`Se o e-mail ${forgotEmail} estiver cadastrado, as orientações de recuperação foram enviadas.`);
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <img
              src="/trynova_logo.png"
              alt="Trynova"
              style={{ maxHeight: '44px', maxWidth: '240px', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fb = document.getElementById('login-brand-fallback');
                if (fb) fb.style.display = 'flex';
              }}
            />
            <div id="login-brand-fallback" style={{ display: 'none', alignItems: 'center', gap: '0.6rem' }}>
              <div className="login-logo-icon">T</div>
              <span className="brand-text">TRYNOVA</span>
            </div>
          </div>
          <p className="login-subtitle">Sistema de Gestão & Controle de Patrimônio</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="login-form-group">
            <label htmlFor="username">Usuário ou E-mail Corporativo</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                id="username"
                placeholder="Ex: admin ou seu.email@trynova.com.br"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Senha de Acesso</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(username.includes('@') ? username : '');
                  setForgotMessage('');
                  setIsForgotModalOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Esconder senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="login-spinner"></span>
            ) : (
              'Acessar Sistema'
            )}
          </button>
        </form>
      </div>

      {/* MODAL ESQUECI MINHA SENHA */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '90%' }}>
            <header className="modal-header">
              <div>
                <h2>Recuperar Senha</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Informe seu e-mail corporativo cadastrado para receber as orientações.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsForgotModalOpen(false)} aria-label="Fechar">
                &times;
              </button>
            </header>

            {forgotMessage ? (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {forgotMessage}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1.25rem', width: '100%' }}
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="forgot-email">E-mail Cadastrado</label>
                  <input
                    type="email"
                    id="forgot-email"
                    placeholder="seu.email@trynova.com.br"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <footer className="form-footer" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsForgotModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isForgotLoading}>
                    {isForgotLoading ? 'Enviando...' : 'Enviar Instruções'}
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
