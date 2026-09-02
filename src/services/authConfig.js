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
    cacheLocation: 'sessionStorage', // Encerra o cache do token ao fechar a aba/navegador
    storeAuthStateInCookie: false
  }
};

// Escopos de permissão solicitados ao Entra ID
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
  prompt: 'select_account'
};

export const msalInstance = new PublicClientApplication(msalConfig);
let isInitialized = false;
let redirectHandled = false;

/**
 * Inicializa o MSAL e processa o retorno do redirecionamento
 * (Garante que a resposta não seja reprocessada em loop no logout)
 */
export const initializeMsal = async () => {
  if (!isInitialized) {
    await msalInstance.initialize();
    isInitialized = true;
  }

  // Se o redirect já foi processado nesta sessão, não repete
  if (redirectHandled) {
    return null;
  }

  const result = await msalInstance.handleRedirectPromise().catch((err) => {
    console.warn('Erro ao processar redirect MSAL:', err);
    return null;
  });

  if (result && result.account) {
    redirectHandled = true;
  }

  return result;
};

/**
 * Inicia o fluxo de login via redirecionamento na MESMA ABA
 */
export const loginWithMicrosoftRedirect = async () => {
  const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
  if (!clientId || clientId === 'SEU_CLIENT_ID_DO_ENTRA_ID') {
    throw new Error(
      'Microsoft Entra ID não configurado no .env. Configure VITE_ENTRA_CLIENT_ID e VITE_ENTRA_TENANT_ID para habilitar o login corporativo.'
    );
  }

  // Prepara para novo redirect
  redirectHandled = false;
  await initializeMsal();
  await msalInstance.loginRedirect(loginRequest);
};

/**
 * Limpa contas e tokens do MSAL ao realizar logout
 */
export const logoutMsal = async () => {
  redirectHandled = true; // Impede que o retorno em cache faça auto-login ao sair
  try {
    sessionStorage.clear();
    const accounts = msalInstance.getAllAccounts();
    for (const account of accounts) {
      await msalInstance.clearCache().catch(() => {});
    }
  } catch (_) {}
};
