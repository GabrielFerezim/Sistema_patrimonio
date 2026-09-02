import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeMsal } from './services/authConfig.js'

// Detecta se a janela atual é o pop-up de retorno do MSAL
const isMsalPopup = () => {
  return (
    typeof window !== 'undefined' &&
    window.opener &&
    window.opener !== window &&
    (window.location.hash.includes('code=') ||
      window.location.hash.includes('state=') ||
      window.location.search.includes('code='))
  );
};

// Inicializa o MSAL logo na montagem
initializeMsal()
  .then(() => {
    // Se for o pop-up de login da Microsoft, o MSAL já processou o token.
    // Fecha a janela pop-up automaticamente sem renderizar a aplicação inteira.
    if (isMsalPopup()) {
      setTimeout(() => {
        try {
          window.close();
        } catch (_) {}
      }, 300);
      return;
    }

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    console.error('Erro na inicialização do MSAL:', err);
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
