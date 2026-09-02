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
  scopes: ['User.Read', 'openid', 'profile', 'email']
};

let msalInstance = null;

/**
 * Inicializa ou retorna a instância singleton do MSAL (compatível com MSAL v3)
 */
export const getMsalInstance = async () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
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
    if (error.errorCode === 'user_cancelled') {
      throw new Error('Autenticação cancelada pelo usuário.');
    }
    console.error('Erro na autenticação Microsoft Entra ID:', error);
    throw new Error(error.message || 'Falha ao autenticar com a conta Microsoft.');
  }
};
