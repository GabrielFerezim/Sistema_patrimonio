import React, { useState, useEffect, useRef } from 'react';
import { loginWithMicrosoftRedirect, initializeMsal } from '../services/authConfig';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [entraNotice, setEntraNotice] = useState('');

  // Trava para evitar disparos duplicados em React StrictMode
  const hasProcessedRef = useRef(false);

  // Processa o retorno do redirecionamento da Microsoft na MESMA ABA
  useEffect(() => {
    if (hasProcessedRef.current) return;

    const processRedirect = async () => {
      try {
        const response = await initializeMsal();

        if (response && response.account) {
          if (hasProcessedRef.current) return;
          hasProcessedRef.current = true;
          setIsMicrosoftLoading(true);
          setError('');
          setEntraNotice('');

          // Limpa a URL imediatamente (remove #code=... ou ?code=...)
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          const account = response.account;
          const email = (
            account.username ||
            account.idTokenClaims?.email ||
            account.idTokenClaims?.preferred_username ||
            ''
          ).toLowerCase().trim();

          const name = account.name || account.idTokenClaims?.name || email.split('@')[0];
          const entraId = account.localAccountId || account.homeAccountId;

          const res = await fetch('/api/auth/entra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name,
              username: email.split('@')[0],
              entraId
            })
          });

          const text = await res.text();
          let data = {};
          try {
            data = JSON.parse(text);
          } catch (_) {
            throw new Error('O servidor backend não respondeu com dados válidos. Certifique-se de que a API na porta 3001 está ativa.');
          }

          if (!res.ok) {
            throw new Error(data.error || 'Falha ao autenticar com Microsoft Entra ID.');
          }

          if (data.pendingApproval) {
            setEntraNotice(data.message);
            return;
          }

          onLoginSuccess(data);
        }
      } catch (err) {
        console.error('Erro no processamento do login Entra ID:', err);
        setError(err.message || 'Erro ao autenticar com a Microsoft.');
      } finally {
        setIsMicrosoftLoading(false);
      }
    };

    processRedirect();
  }, [onLoginSuccess]);

  // Dispara o redirecionamento para a Microsoft na MESMA ABA
  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    setError('');
    setEntraNotice('');

    try {
      await loginWithMicrosoftRedirect();
    } catch (err) {
      setError(err.message || 'Erro ao iniciar autenticação com Microsoft Entra ID.');
      setIsMicrosoftLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, informe seu usuário ou e-mail e sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    setError('');
    setEntraNotice('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Erro ao autenticar. Verifique seu usuário e senha.');
    } finally {
      setIsLoading(false);
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
              }}
            />
          </div>
          <p className="login-subtitle">Sistema de Gestão & Controle de Patrimônio</p>
        </div>

        {/* ALERTA DE STATUS / APROVAÇÃO PENDENTE DO ENTRA ID */}
        {entraNotice && (
          <div className="login-entra-notice" role="status">
            <div className="entra-notice-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="entra-notice-content">
              <strong>Aguardando Aprovação de Acesso</strong>
              <p>{entraNotice}</p>
            </div>
            <button
              type="button"
              className="entra-notice-close"
              onClick={() => setEntraNotice('')}
              title="Fechar"
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="login-error-alert" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* BOTÃO OFICIAL MICROSOFT ENTRA ID */}
        <button
          type="button"
          className="microsoft-sso-btn"
          onClick={handleMicrosoftLogin}
          disabled={isLoading || isMicrosoftLoading}
        >
          {isMicrosoftLoading ? (
            <>
              <span className="login-spinner" style={{ borderColor: '#0078d4', borderTopColor: 'transparent', width: '18px', height: '18px' }}></span>
              <span>Conectando com a Microsoft...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="10.5" height="10.5" fill="#F25022"/>
                <rect x="12.5" width="10.5" height="10.5" fill="#7FBA00"/>
                <rect y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
                <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
              </svg>
              <span>Entrar com Microsoft Entra ID</span>
            </>
          )}
        </button>

        <div className="login-divider">
          <span>ou entre com usuário e senha</span>
        </div>

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="login-form-group">
            <label htmlFor="username">Usuário ou E-mail</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuário ou e-mail"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Senha de Acesso</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading || isMicrosoftLoading}
          >
            {isLoading ? (
              <span className="login-spinner"></span>
            ) : (
              'Acessar Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
