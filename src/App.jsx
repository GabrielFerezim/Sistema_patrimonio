import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import Login from './components/Login';
import EmployeesList from './components/EmployeesList';
import StockList from './components/StockList';
import './App.css';

// Dados simulados iniciais para apresentar o sistema populado
const initialAssets = [
  {
    id: 1,
    tag: 'PAT-001',
    name: 'Dell Latitude 3420 14"',
    equipment: 'Notebook',
    employee: 'Thiago Alencar',
    location: 'Tecnologia da Informação',
    status: 'Em Uso',
    condition: 'Novo',
    notes: 'Intel Core i5, 16GB RAM, 512GB SSD. Comprado em 10/2024.',
    last_verified: new Date().toISOString()
  },
  {
    id: 2,
    tag: 'PAT-002',
    name: 'LG UltraWide 29" IPS',
    equipment: 'Monitor',
    employee: 'Mariana Costa',
    location: 'Marketing',
    status: 'Em Uso',
    condition: 'Usado',
    notes: 'Resolução 2560x1080. Sem detalhes.',
    last_verified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    tag: 'PAT-003',
    name: 'MacBook Pro M2 13"',
    equipment: 'Notebook',
    employee: 'Carlos Eduardo',
    location: 'Diretoria',
    status: 'Em Uso',
    condition: 'Novo',
    notes: 'Chip Apple M2, 8GB RAM, 256GB SSD.',
    last_verified: null
  },
  {
    id: 4,
    tag: 'PAT-004',
    name: 'Cadeira Office Cavaletti',
    equipment: 'Cadeira Ergonômica',
    employee: '',
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    notes: 'Modelo ergonômico NR17, cor preta.',
    last_verified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    tag: 'PAT-005',
    name: 'Samsung Galaxy S22 128GB',
    equipment: 'Celular/Smartphone',
    employee: 'Aline Schmidt',
    location: 'Vendas',
    status: 'Em Uso',
    condition: 'Usado',
    notes: 'Celular corporativo. Tela trincada no canto inferior.',
    last_verified: null
  },
  {
    id: 6,
    tag: 'PAT-006',
    name: 'Impressora HP LaserJet Pro',
    equipment: 'Impressora',
    employee: '',
    location: 'Administração',
    status: 'Manutenção',
    condition: 'Usado',
    notes: 'Enviado para manutenção da placa de rede física em 15/05/2026.',
    last_verified: null
  }
];

function App() {
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de Autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const session = localStorage.getItem('trynova_session');
    return !!session;
  });
  const [user, setUser] = useState(() => {
    const session = localStorage.getItem('trynova_session');
    return session ? JSON.parse(session) : null;
  });

  // Busca todos os patrimônios do banco de dados
  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) throw new Error('Falha ao conectar ao banco de dados Neon.');
      const data = await response.json();
      setAssets(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar do banco de dados:", err);
      setError("Erro ao se conectar ao banco de dados Neon. Exibindo dados locais offline.");
      // Fallback para o LocalStorage
      const saved = localStorage.getItem('trynova_patrimonio');
      if (saved) {
        try {
          setAssets(JSON.parse(saved));
        } catch (e) {
          setAssets(initialAssets);
        }
      } else {
        setAssets(initialAssets);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAssets();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  // Sincroniza de volta no localstorage para fallback/cache
  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem('trynova_patrimonio', JSON.stringify(assets));
    }
  }, [assets]);

  // Manipuladores de CRUD
  const handleSaveAsset = async (savedAsset) => {
    try {
      if (editingAsset) {
        // Modo edição (PUT)
        const response = await fetch(`/api/assets/${savedAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedAsset)
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Falha ao atualizar patrimônio.');
        }
        const updated = await response.json();
        setAssets(prev => prev.map(item => item.id === updated.id ? updated : item));
      } else {
        // Modo criação (POST)
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedAsset)
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Falha ao cadastrar patrimônio.');
        }
        const created = await response.json();
        setAssets(prev => [created, ...prev]);
      }
      setIsFormOpen(false);
      setEditingAsset(null);
      setError(null);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert(err.message);
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDeleteAsset = async (id) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao excluir patrimônio.');
      }
      setAssets(prev => prev.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert(err.message);
    }
  };

  const handleAddNewAsset = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleVerifyAsset = async (id) => {
    try {
      const response = await fetch(`/api/assets/${id}/verify`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Falha ao verificar patrimônio no banco de dados.');
      }
      const updated = await response.json();
      setAssets(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (err) {
      console.error("Erro ao verificar patrimônio:", err);
      // Fallback local caso dê erro ou offline (Banco de dados não conectado)
      setAssets(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, last_verified: new Date().toISOString() };
        }
        return item;
      }));
    }
  };

  const handleAssignAsset = async (id, employeeName, location) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    const updatedAsset = {
      ...asset,
      status: 'Em Uso',
      employee: employeeName,
      location: location || asset.location,
      last_verified: new Date().toISOString()
    };
    
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAsset)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao vincular funcionário.');
      }
      const updated = await response.json();
      setAssets(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (err) {
      console.error("Erro ao vincular:", err);
      // Fallback local
      setAssets(prev => prev.map(item => item.id === id ? updatedAsset : item));
    }
  };

  const handleViewAllAssets = () => {
    setActiveTab('assets');
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('trynova_session', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza de que deseja sair?')) {
      localStorage.removeItem('trynova_session');
      setUser(null);
      setIsLoggedIn(false);
      setAssets([]);
    }
  };

  // Obtém a lista de tags para validação de unicidade
  const existingTags = assets.map(a => a.tag);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Navegação do Menu Lateral */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* Área de Conteúdo Principal */}
      <main className="main-content">
        {error && (
          <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Conectando ao banco de dados Neon Postgres...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <Dashboard 
            assets={assets} 
            onViewAll={handleViewAllAssets} 
          />
        ) : activeTab === 'stock' ? (
          <StockList 
            assets={assets} 
            onAssign={handleAssignAsset} 
          />
        ) : activeTab === 'employees' ? (
          <EmployeesList 
            assets={assets} 
          />
        ) : (
          <AssetList 
            assets={assets} 
            onEdit={handleEditAsset} 
            onDelete={handleDeleteAsset} 
            onAddNew={handleAddNewAsset} 
            onVerify={handleVerifyAsset}
          />
        )}
      </main>

      {/* Formulário Modal Overlay */}
      {isFormOpen && (
        <AssetForm 
          asset={editingAsset}
          existingTags={existingTags}
          onSave={handleSaveAsset} 
          onClose={() => {
            setIsFormOpen(false);
            setEditingAsset(null);
          }} 
        />
      )}
    </div>
  );
}

export default App;
