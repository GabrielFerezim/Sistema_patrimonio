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
    cacheLocation: 'localStorage', // Usar localStorage para preservar o estado no redirect
    storeAuthStateInCookie: true
  }
};

// Escopos de permissão solicitados ao Entra ID
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
  prompt: 'select_account'
};

export const msalInstance = new PublicClientApplication(msalConfig);
let isInitialized = false;

/**
 * Inicializa o MSAL e processa qualquer retorno de redirecionamento
 */
export const initializeMsal = async () => {
  if (!isInitialized) {
    await msalInstance.initialize();
    isInitialized = true;
  }
  // Processa o resultado do redirecionamento
  return await msalInstance.handleRedirectPromise().catch((err) => {
    console.warn('Erro ao processar redirect MSAL:', err);
    return null;
  });
};

/**
 * Inicia o fluxo de login via redirecionamento na MESMA ABA
 * (Evita pop-ups bloqueados e abas duplicadas)
 */
export const loginWithMicrosoftRedirect = async () => {
  const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
  if (!clientId || clientId === 'SEU_CLIENT_ID_DO_ENTRA_ID') {
    throw new Error(
      'Microsoft Entra ID não configurado no .env. Configure VITE_ENTRA_CLIENT_ID e VITE_ENTRA_TENANT_ID para habilitar o login corporativo.'
    );
  }

  await initializeMsal();
  await msalInstance.loginRedirect(loginRequest);
};
