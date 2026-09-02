import { PublicClientApplication } from '@azure/msal-browser';

// Configuração do Microsoft Entra ID (Azure AD)
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

// Escopos de permissão solicitados ao Entra ID
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
  prompt: 'select_account'
};

let msalInstance = null;

/**
 * Limpa chaves de bloqueio de interação presas no sessionStorage
 */
const clearStuckInteractions = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.toLowerCase().includes('interaction') || key.toLowerCase().includes('msal.')) {
          if (key.includes('interaction.status')) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch (_) {}
  }
};

/**
 * Inicializa ou retorna a instância singleton do MSAL (compatível com MSAL v3)
 */
export const getMsalInstance = async () => {
  if (!msalInstance) {
    clearStuckInteractions();
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise().catch(() => null);
  }
  return msalInstance;
};

/**
 * Abre o popup oficial de autenticação da Microsoft
 * e retorna os dados do usuário autenticado.
 */
export const loginWithMicrosoft = async () => {
  const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
  if (!clientId || clientId === 'SEU_CLIENT_ID_DO_ENTRA_ID') {
    throw new Error(
      'Microsoft Entra ID não configurado no .env. Configure VITE_ENTRA_CLIENT_ID e VITE_ENTRA_TENANT_ID para habilitar o login corporativo.'
    );
  }

  // Previne travas de popups fechados anteriormente
  clearStuckInteractions();

  const msal = await getMsalInstance();

  try {
    const response = await msal.loginPopup(loginRequest);
    const account = response.account;

    const email = (
      account.username ||
      account.idTokenClaims?.email ||
      account.idTokenClaims?.preferred_username ||
      ''
    ).toLowerCase().trim();

    const name = account.name || account.idTokenClaims?.name || email.split('@')[0];
    const entraId = account.localAccountId || account.homeAccountId;

    return {
      name,
      email,
      username: email.split('@')[0],
      entraId,
      idToken: response.idToken
    };
  } catch (error) {
    clearStuckInteractions();

    if (error.errorCode === 'user_cancelled') {
      throw new Error('Autenticação cancelada pelo usuário.');
    }

    if (error.errorCode === 'interaction_in_progress') {
      throw new Error(
        'Uma tentativa anterior de autenticação ficou pendente. A trava foi liberada. Por favor, clique novamente no botão para entrar.'
      );
    }

    if (error.errorCode === 'popup_window_error' || error.message?.includes('popup')) {
      throw new Error(
        'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site na barra de endereços e tente novamente.'
      );
    }

    console.error('Erro na autenticação Microsoft Entra ID:', error);
    throw new Error(error.message || 'Falha ao autenticar com a conta Microsoft.');
  }
};

