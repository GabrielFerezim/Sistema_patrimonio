import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import './App.css';

// Initial mock data to present a populated system out of the box
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
    notes: 'Intel Core i5, 16GB RAM, 512GB SSD. Comprado em 10/2024.'
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
    notes: 'Resolução 2560x1080. Sem detalhes.'
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
    notes: 'Chip Apple M2, 8GB RAM, 256GB SSD.'
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
    notes: 'Modelo ergonômico NR17, cor preta.'
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
    notes: 'Celular corporativo. Tela trincada no canto inferior.'
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
    notes: 'Enviado para manutenção da placa de rede física em 15/05/2026.'
  }
];

function App() {
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all assets from DB
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
      // Fallback to LocalStorage
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
    fetchAssets();
  }, []);

  // Sync back to localstorage for fallback/cache
  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem('trynova_patrimonio', JSON.stringify(assets));
    }
  }, [assets]);

  // CRUD Handlers
  const handleSaveAsset = async (savedAsset) => {
    try {
      if (editingAsset) {
        // Edit mode (PUT)
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
        // Create mode (POST)
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

  const handleViewAllAssets = () => {
    setActiveTab('assets');
  };

  // Get list of tags for uniqueness validation
  const existingTags = assets.map(a => a.tag);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
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
        ) : (
          <AssetList 
            assets={assets} 
            onEdit={handleEditAsset} 
            onDelete={handleDeleteAsset} 
            onAddNew={handleAddNewAsset} 
          />
        )}
      </main>

      {/* Modal Form Overlay */}
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
