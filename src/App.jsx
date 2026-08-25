import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import SpacesList from './components/SpacesList';
import StockList from './components/StockList';
import EmployeesList from './components/EmployeesList';
import MaintenanceList from './components/MaintenanceList';
import DecommissionedList from './components/DecommissionedList';
import SoftwareLicensesList from './components/SoftwareLicensesList';
import AuditLogView from './components/AuditLogView';
import Login from './components/Login';
import './App.css';

// Espaços / Ambientes físicos iniciais da Trynova
const initialSpaces = [
  {
    id: 1,
    name: 'Sala de Reunião - 2º Andar',
    floor: '2º Andar',
    type: 'Sala de Reunião',
    description: 'Sala de conferência principal com Smart TV 65", mesa para 10 lugares e projetor',
    icon: 'meeting',
    color: '#3b82f6'
  },
  {
    id: 2,
    name: 'Auditório Trynova',
    floor: '1º Andar',
    type: 'Auditório',
    description: 'Auditório para convenções e apresentações com sistema de som e telão',
    icon: 'presentation',
    color: '#8b5cf6'
  },
  {
    id: 3,
    name: 'Laboratório de T.I',
    floor: '2º Andar',
    type: 'TI & Infra',
    description: 'Ambiente de bancada técnica, manutenção e servidores de rede',
    icon: 'server',
    color: '#10b981'
  },
  {
    id: 4,
    name: 'Recepção Central',
    floor: 'Térreo',
    type: 'Recepção',
    description: 'Hall de entrada e atendimento aos visitantes',
    icon: 'building',
    color: '#f59e0b'
  }
];

// Dados iniciais para exibição rica caso o banco esteja offline
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
    serial_number: 'BR-DELL-3420-99',
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
    serial_number: 'LG-29WK600-01',
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
    serial_number: 'C02G8990Q05D',
    notes: 'Chip Apple M2, 8GB RAM, 256GB SSD.',
    last_verified: null
  },
  {
    id: 4,
    tag: 'PAT-004',
    name: 'Cadeira Office Cavaletti',
    equipment: 'Cadeira Ergonômica',
    employee: null,
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    serial_number: 'CAV-NR17-2024',
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
    serial_number: 'SM-S901B-44',
    notes: 'Celular corporativo. Tela com película aplicada.',
    last_verified: null
  },
  {
    id: 6,
    tag: 'PAT-006',
    name: 'Impressora HP LaserJet Pro',
    equipment: 'Impressora',
    employee: null,
    location: 'Administração',
    status: 'Manutenção',
    condition: 'Usado',
    serial_number: 'HP-M404DW-09',
    notes: 'Enviado para manutenção da placa lógica em 15/05/2026.',
    last_verified: null
  },
  {
    id: 7,
    tag: 'PAT-007',
    name: 'Smart TV Samsung Crystal 65" 4K',
    equipment: 'Smart TV / Display',
    employee: null,
    location: 'Sala de Reunião - 2º Andar',
    status: 'Em Uso',
    condition: 'Novo',
    serial_number: 'SAM-65CU7700-BR',
    notes: 'Suporte articulado de parede, cabo HDMI 5m e controle remoto.',
    last_verified: null
  },
  {
    id: 8,
    tag: 'PAT-008',
    name: 'Projetor Epson PowerLite Laser',
    equipment: 'Projetor',
    employee: null,
    location: 'Auditório Trynova',
    status: 'Em Uso',
    condition: 'Novo',
    serial_number: 'EP-L210SW-90',
    notes: 'Resolução WXGA, fixado no teto com tela de projeção retrátil.',
    last_verified: null
  },
  {
    id: 9,
    tag: 'PAT-009',
    name: 'Câmera Videoconferência Logitech Rally',
    equipment: 'Câmera / Conferência',
    employee: null,
    location: 'Sala de Reunião - 2º Andar',
    status: 'Em Uso',
    condition: 'Novo',
    serial_number: 'LOGI-RALLY-01',
    notes: 'Sistema 4K Ultra-HD com microfone de mesa e viva-voz integrado.',
    last_verified: null
  },
  {
    id: 10,
    tag: 'PAT-010',
    name: 'Monitor Dell 24" P2419H IPS',
    equipment: 'Monitor',
    employee: null,
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    serial_number: 'CN-0P2419H-88',
    notes: 'Monitor com ajuste de altura e rotação. Pronto para entrega.',
    last_verified: new Date().toISOString()
  },
  {
    id: 11,
    tag: 'PAT-011',
    name: 'Kit Teclado e Mouse sem Fio Logitech MK235',
    equipment: 'Teclado/Mouse',
    employee: null,
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    serial_number: 'LOGI-MK235-992',
    notes: 'Teclado padrão ABNT2 com receptor USB nano unificado.',
    last_verified: new Date().toISOString()
  },
  {
    id: 12,
    tag: 'PAT-012',
    name: 'Suporte Articulado Ergonômico para Notebook',
    equipment: 'Suporte Ergonômico',
    employee: null,
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    serial_number: 'SUP-ERG-2024',
    notes: 'Apoio em alumínio reforçado com regulagem de altura e inclinação.',
    last_verified: new Date().toISOString()
  }
];

const initialEmployees = [
  { id: 1, name: 'Thiago Alencar', sector: 'Tecnologia da Informação', ramal: '4001', team: 'C&A', role: 'Analista de Suporte' },
  { id: 2, name: 'Mariana Costa', sector: 'Marketing', ramal: '4002', team: 'Latam', role: 'Coordenadora de Marketing' },
  { id: 3, name: 'Carlos Eduardo', sector: 'Diretoria', ramal: '4003', team: 'Prosegur', role: 'Diretor Executivo' },
  { id: 4, name: 'Aline Schmidt', sector: 'Vendas', ramal: '4004', team: 'Latam', role: 'Executiva de Vendas' },
  { id: 5, name: 'Gabriel Ferezim', sector: 'Tecnologia da Informação', ramal: '4005', team: 'C&A', role: 'Assistente de T.I I' }
];

const initialMaintenances = [
  {
    id: 1,
    asset_id: 6,
    asset_tag: 'PAT-006',
    asset_name: 'Impressora HP LaserJet Pro',
    issue_description: 'Falha na conexão de rede e placa lógica',
    provider: 'Suporte Técnico HP',
    cost: 350.00,
    status: 'Em Manutenção',
    opened_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expected_return_at: '2026-08-28',
    notes: 'Aguardando substituição da peça.'
  }
];

const initialAuditLogs = [
  {
    id: 1,
    action_type: 'CADASTRO',
    description: 'Cadastro do patrimônio PAT-001 (Dell Latitude)',
    entity_type: 'PATRIMONIO',
    entity_id: 'PAT-001',
    user_name: 'Gabriel Ferezim',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    action_type: 'ENTREGA',
    description: 'Equipamento PAT-001 entregue para Thiago Alencar',
    entity_type: 'PATRIMONIO',
    entity_id: 'PAT-001',
    user_name: 'Gabriel Ferezim',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    action_type: 'MANUTENCAO',
    description: 'PAT-006 enviado para assistência técnica HP',
    entity_type: 'PATRIMONIO',
    entity_id: 'PAT-006',
    user_name: 'Gabriel Ferezim',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const initialLicenses = [
  {
    id: 1,
    name: 'Microsoft 365 Business Standard',
    category: 'Produtividade',
    license_type: 'Assinatura Anual',
    license_key: 'MS365-TRYN-2025-ENTERPRISE',
    total_seats: 10,
    assigned_to: [
      { id: 1, user: 'Thiago Alencar', machine: 'PAT-001', assigned_at: new Date().toISOString() },
      { id: 2, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() },
      { id: 3, user: 'Gabriel Ferezim', machine: 'PAT-005', assigned_at: new Date().toISOString() }
    ],
    expiration_date: '2026-12-31',
    cost: 1450.00,
    supplier: 'Microsoft Cloud Services',
    notes: 'Pacote Office completo com Teams e OneDrive.'
  },
  {
    id: 2,
    name: 'Adobe Creative Cloud All Apps',
    category: 'Design & Criação',
    license_type: 'Assinatura Anual',
    license_key: 'ADOBE-CC-PRO-2024',
    total_seats: 3,
    assigned_to: [
      { id: 1, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() }
    ],
    expiration_date: '2026-11-15',
    cost: 3200.00,
    supplier: 'Adobe Systems Brasil',
    notes: 'Photoshop, Illustrator, Premiere Pro, After Effects e InDesign.'
  },
  {
    id: 3,
    name: 'Windows 11 Pro OEM',
    category: 'Sistema Operacional',
    license_type: 'Perpétua / Volume',
    license_key: 'WIN11-PRO-OEM-VOL-9921',
    total_seats: 15,
    assigned_to: [
      { id: 1, user: 'Thiago Alencar', machine: 'PAT-001', assigned_at: new Date().toISOString() },
      { id: 2, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() },
      { id: 3, user: 'Carlos Eduardo', machine: 'PAT-003', assigned_at: new Date().toISOString() },
      { id: 4, user: 'Aline Schmidt', machine: 'PAT-004', assigned_at: new Date().toISOString() },
      { id: 5, user: 'Gabriel Ferezim', machine: 'PAT-005', assigned_at: new Date().toISOString() }
    ],
    expiration_date: 'Perpétua',
    cost: 0.00,
    supplier: 'Dell OEM Licensing',
    notes: 'Licenças OEM de fábrica.'
  },
  {
    id: 4,
    name: 'AutoCAD 2024 Architecture',
    category: 'Engenharia / Projetos',
    license_type: 'Assinatura Anual',
    license_key: 'AUTODESK-ACAD-2024-BR',
    total_seats: 2,
    assigned_to: [],
    expiration_date: '2026-09-30',
    cost: 4800.00,
    supplier: 'Autodesk Brasil',
    notes: 'Licença para desenvolvimento imobiliário e plantas.'
  }
];

export default function App() {
  const [assets, setAssets] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [licenses, setLicenses] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_licenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return initialLicenses;
  });
  const [maintenances, setMaintenances] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Filtros persistidos
  const [assetStatusFilter, setAssetStatusFilter] = useState('Todos');
  const [assetLocationFilter, setAssetLocationFilter] = useState('Todos');
  const [assetEquipmentFilter, setAssetEquipmentFilter] = useState('Todos');

  // Tema
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('trynova_theme') || 'light';
  });

  // Autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('trynova_session');
  });

  const [user, setUser] = useState(() => {
    const session = localStorage.getItem('trynova_session');
    return session ? JSON.parse(session) : null;
  });

  // Gerenciador de Toasts
  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Aplica tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trynova_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Registra log local e na API
  const addAuditLog = useCallback(async (action_type, description, entity_id = null, entity_type = 'GERAL') => {
    const newLog = {
      id: Date.now(),
      action_type,
      description,
      entity_type,
      entity_id,
      user_name: user ? user.name : 'Administrador',
      created_at: new Date().toISOString()
    };

    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (err) {
      console.warn('Não foi possível sincronizar o log na API:', err);
    }
  }, [user]);

  // Carregamento de dados (com fallback automático offline)
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);

    // 1. Assets
    try {
      const resAssets = await fetch('/api/assets');
      if (resAssets.ok) {
        const data = await resAssets.json();
        setAssets(data);
        localStorage.setItem('trynova_patrimonio', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_patrimonio');
      setAssets(saved ? JSON.parse(saved) : initialAssets);
    }

    // 2. Employees
    try {
      const resEmp = await fetch('/api/employees');
      if (resEmp.ok) {
        const data = await resEmp.json();
        setEmployees(data);
        localStorage.setItem('trynova_employees', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_employees');
      setEmployees(saved ? JSON.parse(saved) : initialEmployees);
    }

    // 3. Maintenances
    try {
      const resMaint = await fetch('/api/maintenances');
      if (resMaint.ok) {
        const data = await resMaint.json();
        setMaintenances(data);
        localStorage.setItem('trynova_maintenances', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_maintenances');
      setMaintenances(saved ? JSON.parse(saved) : initialMaintenances);
    }

    // 4. Audit Logs
    try {
      const resLogs = await fetch('/api/audit-logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data);
        localStorage.setItem('trynova_audit_logs', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_audit_logs');
      setAuditLogs(saved ? JSON.parse(saved) : initialAuditLogs);
    }

    // 5. Spaces / Ambientes Trynova
    try {
      const resSpaces = await fetch('/api/spaces');
      if (resSpaces.ok) {
        const data = await resSpaces.json();
        setSpaces(data);
        localStorage.setItem('trynova_spaces', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_spaces');
      setSpaces(saved ? JSON.parse(saved) : initialSpaces);
    }

    // 6. Licenses / Licenças de Software
    try {
      const resLic = await fetch('/api/licenses');
      if (resLic.ok) {
        const data = await resLic.json();
        const listToSet = Array.isArray(data) && data.length > 0 ? data : initialLicenses;
        setLicenses(listToSet);
        localStorage.setItem('trynova_licenses', JSON.stringify(listToSet));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_licenses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLicenses(Array.isArray(parsed) && parsed.length > 0 ? parsed : initialLicenses);
        } catch (_) {
          setLicenses(initialLicenses);
        }
      } else {
        setLicenses(initialLicenses);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, fetchAllData]);

  // Persistência local contínua
  useEffect(() => {
    if (assets.length > 0) localStorage.setItem('trynova_patrimonio', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    if (spaces.length > 0) localStorage.setItem('trynova_spaces', JSON.stringify(spaces));
  }, [spaces]);

  useEffect(() => {
    if (employees.length > 0) localStorage.setItem('trynova_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (licenses.length > 0) localStorage.setItem('trynova_licenses', JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    if (maintenances.length > 0) localStorage.setItem('trynova_maintenances', JSON.stringify(maintenances));
  }, [maintenances]);

  useEffect(() => {
    if (auditLogs.length > 0) localStorage.setItem('trynova_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // ----------------------------------------------------
  // MANIPULADORES DE PATRIMÔNIOS (ASSETS)
  // ----------------------------------------------------
  const handleSaveAsset = async (savedAsset) => {
    try {
      if (editingAsset) {
        const response = await fetch(`/api/assets/${savedAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedAsset)
        });
        
        let updated = savedAsset;
        if (response.ok) {
          updated = await response.json();
        }
        
        setAssets(prev => prev.map(item => item.id === updated.id ? updated : item));
        addToast(`Patrimônio #${savedAsset.tag} atualizado com sucesso!`, 'success');
        addAuditLog('ATUALIZACAO', `Atualizado patrimônio #${savedAsset.tag} (${savedAsset.name})`, savedAsset.tag, 'PATRIMONIO');
      } else {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedAsset)
        });

        let created = savedAsset;
        if (response.ok) {
          created = await response.json();
        } else {
          created = { ...savedAsset, id: Date.now() };
        }

        setAssets(prev => [created, ...prev]);
        addToast(`Patrimônio #${savedAsset.tag} cadastrado com sucesso!`, 'success');
        addAuditLog('CADASTRO', `Cadastrado novo patrimônio #${savedAsset.tag} (${savedAsset.name})`, savedAsset.tag, 'PATRIMONIO');
      }
      setIsFormOpen(false);
      setEditingAsset(null);
    } catch (err) {
      console.error('Erro ao salvar patrimônio:', err);
      addToast('Erro ao processar cadastro no servidor. Salvo localmente.', 'warning');
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDeleteAsset = async (id) => {
    const target = assets.find(a => a.id === id);
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter(item => item.id !== id));
      addToast(`Patrimônio #${target ? target.tag : id} excluído.`, 'info');
      if (target) {
        addAuditLog('EXCLUSAO', `Excluído patrimônio #${target.tag} (${target.name})`, target.tag, 'PATRIMONIO');
      }
    } catch {
      setAssets(prev => prev.filter(item => item.id !== id));
      addToast(`Patrimônio removido localmente.`, 'info');
    }
  };

  const handleDecommissionAsset = async (assetId, reason = '') => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updated = {
      ...asset,
      status: 'Baixado',
      employee: null,
      decommission_reason: reason || 'Baixa operacional',
      last_verified: new Date().toISOString()
    };

    try {
      const res = await fetch(`/api/assets/${assetId}/decommission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(prev => prev.map(a => a.id === assetId ? data : a));
      } else {
        setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
      }
    } catch (err) {
      console.warn('Falha na requisição de baixa, atualizando localmente:', err);
      setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    }

    addToast(`Baixa confirmada no patrimônio #${asset.tag}.`, 'warning');
    addAuditLog('BAIXA', `Baixa no patrimônio #${asset.tag}. Motivo: ${reason || 'Não informado'}`, asset.tag, 'PATRIMONIO');
  };

  const handleReactivateAsset = async (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updated = {
      ...asset,
      status: 'Em Estoque',
      employee: null,
      decommission_reason: null,
      last_verified: new Date().toISOString()
    };

    try {
      const res = await fetch(`/api/assets/${assetId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(prev => prev.map(a => a.id === assetId ? data : a));
      } else {
        setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
      }
    } catch (err) {
      console.warn('Falha na requisição de reativação, atualizando localmente:', err);
      setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    }

    addToast(`Patrimônio #${asset.tag} reativado para o estoque!`, 'success');
    addAuditLog('REATIVACAO', `Patrimônio #${asset.tag} (${asset.name}) reativado para o estoque central`, asset.tag, 'PATRIMONIO');
  };

  const handleVerifyAsset = async (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const nowIso = new Date().toISOString();
    const updated = { ...asset, last_verified: nowIso };

    try {
      await fetch(`/api/assets/${assetId}/verify`, { method: 'POST' });
    } catch (err) {
      console.warn('Falha na requisição de verificação física:', err);
    }

    setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    addToast(`Patrimônio #${asset.tag} marcado como verificado fisicamente hoje!`, 'success');
    addAuditLog('VERIFICACAO', `Verificação física de inventário realizada no patrimônio #${asset.tag}`, asset.tag, 'PATRIMONIO');
  };

  const handleSendToStockAsset = async (id) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;

    const updated = {
      ...asset,
      status: 'Em Estoque',
      employee: null,
      last_verified: new Date().toISOString()
    };

    try {
      await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Falha na devolução para estoque via API:', err);
    }

    setAssets(prev => prev.map(a => a.id === id ? updated : a));
    addToast(`Equipamento #${asset.tag} devolvido ao estoque!`, 'info');
    addAuditLog('ENTREGA', `Patrimônio #${asset.tag} devolvido ao estoque central`, asset.tag, 'PATRIMONIO');
  };

  const handleAssignAsset = async (id, employeeName, location) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;

    const updated = {
      ...asset,
      status: 'Em Uso',
      employee: employeeName,
      location: location || asset.location,
      last_verified: new Date().toISOString()
    };

    try {
      await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Falha ao vincular patrimônio via API:', err);
    }

    setAssets(prev => prev.map(a => a.id === id ? updated : a));
    addToast(`Equipamento #${asset.tag} entregue para ${employeeName}!`, 'success');
    addAuditLog('ENTREGA', `Equipamento #${asset.tag} vinculado ao colaborador ${employeeName}`, asset.tag, 'PATRIMONIO');
  };

  const handleImportAssets = (newAssetsList) => {
    if (!newAssetsList || newAssetsList.length === 0) return;

    let addedCount = 0;
    setAssets(prev => {
      const existingTags = new Set(prev.map(a => a.tag.toUpperCase()));
      const validToAdd = [];

      newAssetsList.forEach((item, index) => {
        let tag = item.tag;
        if (existingTags.has(tag.toUpperCase())) {
          tag = `${tag}-IMP${index + 1}`;
        }
        existingTags.add(tag.toUpperCase());
        validToAdd.push({
          ...item,
          id: Date.now() + index,
          tag,
          last_verified: new Date().toISOString()
        });
      });

      addedCount = validToAdd.length;
      return [...validToAdd, ...prev];
    });

    addToast(`${addedCount} patrimônios importados com sucesso!`, 'success');
    addAuditLog('CADASTRO', `Importação em lote de ${addedCount} patrimônios via arquivo CSV`, 'LOTE', 'PATRIMONIO');
  };

  // ----------------------------------------------------
  // MANIPULADORES DE ESPAÇOS / AMBIENTES (SPACES)
  // ----------------------------------------------------
  const handleSaveSpace = async (savedSpace) => {
    try {
      if (savedSpace.id && typeof savedSpace.id === 'number' && savedSpace.id < 1500000000000) {
        const response = await fetch(`/api/spaces/${savedSpace.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedSpace)
        });

        let updated = savedSpace;
        if (response.ok) {
          updated = await response.json();
        }

        setSpaces(prev => prev.map(item => item.id === updated.id ? updated : item));

        // Se o nome mudou, atualiza a localização dos patrimônios da sala
        if (savedSpace.oldName && savedSpace.oldName !== updated.name) {
          setAssets(prev => prev.map(a => {
            if (a.location === savedSpace.oldName) {
              return { ...a, location: updated.name };
            }
            return a;
          }));
        }

        addToast(`Espaço "${updated.name}" atualizado com sucesso!`, 'success');
        addAuditLog('ATUALIZACAO', `Atualizado espaço ${updated.name}`, updated.name, 'ESPACO');
      } else {
        const response = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedSpace)
        });

        let created = savedSpace;
        if (response.ok) {
          created = await response.json();
        } else {
          created = { ...savedSpace, id: Date.now() };
        }

        setSpaces(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        addToast(`Espaço "${created.name}" cadastrado com sucesso!`, 'success');
        addAuditLog('CADASTRO', `Cadastrado novo espaço ${created.name} (${created.floor})`, created.name, 'ESPACO');
      }
    } catch (err) {
      console.error('Erro ao salvar espaço:', err);
      addToast('Erro ao salvar espaço no servidor. Salvo localmente.', 'warning');
    }
  };

  const handleDeleteSpace = async (id) => {
    const target = spaces.find(s => s.id === id);
    try {
      await fetch(`/api/spaces/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Falha ao excluir espaço na API:', err);
    }

    setSpaces(prev => prev.filter(item => item.id !== id));

    if (target) {
      setAssets(prev => prev.map(asset => {
        if (asset.location === target.name) {
          return {
            ...asset,
            location: 'Estoque Central',
            status: 'Em Estoque',
            employee: null
          };
        }
        return asset;
      }));
      addToast(`Espaço "${target.name}" excluído. Equipamentos retornaram ao Estoque Central.`, 'info');
      addAuditLog('EXCLUSAO', `Excluído espaço ${target.name}. Equipamentos retornaram ao Estoque.`, target.name, 'ESPACO');
    }
  };

  const handleAllocateAssetToSpace = async (assetId, spaceName) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updated = {
      ...asset,
      location: spaceName,
      status: 'Em Uso',
      employee: null
    };

    try {
      await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Falha ao alocar patrimônio no espaço via API:', err);
    }

    setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    addToast(`Patrimônio #${asset.tag} alocado em "${spaceName}"!`, 'success');
    addAuditLog('ENTREGA', `Patrimônio #${asset.tag} (${asset.name}) alocado na sala ${spaceName}`, asset.tag, 'PATRIMONIO');
  };

  const handleTransferAssetBetweenSpaces = async (assetId, newSpaceName) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const oldLocation = asset.location;
    const updated = {
      ...asset,
      location: newSpaceName,
      status: 'Em Uso'
    };

    try {
      await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Falha ao transferir patrimônio via API:', err);
    }

    setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    addToast(`Patrimônio #${asset.tag} transferido para "${newSpaceName}"!`, 'success');
    addAuditLog('ENTREGA', `Patrimônio #${asset.tag} transferido de "${oldLocation}" para "${newSpaceName}"`, asset.tag, 'PATRIMONIO');
  };

  const handleRemoveAssetFromSpace = async (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const oldLocation = asset.location;
    const updated = {
      ...asset,
      location: 'Estoque Central',
      status: 'Em Estoque',
      employee: null
    };

    try {
      await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Falha ao desalocar patrimônio via API:', err);
    }

    setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    addToast(`Patrimônio #${asset.tag} desalocado de "${oldLocation}" e retornado ao Estoque!`, 'info');
    addAuditLog('ENTREGA', `Patrimônio #${asset.tag} desalocado de "${oldLocation}" para Estoque Central`, asset.tag, 'PATRIMONIO');
  };

  const handleBatchMoveToSpace = async (assetIds, targetLocation) => {
    for (const id of assetIds) {
      const asset = assets.find(a => a.id === id);
      if (!asset) continue;

      const updated = {
        ...asset,
        location: targetLocation,
        status: targetLocation === 'Estoque Central' ? 'Em Estoque' : 'Em Uso'
      };

      try {
        await fetch(`/api/assets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.warn('Falha ao mover em lote:', err);
      }

      setAssets(prev => prev.map(a => a.id === id ? updated : a));
    }

    addToast(`${assetIds.length} patrimônio(s) movidos para "${targetLocation}"!`, 'success');
    addAuditLog('TRANSFERENCIA', `${assetIds.length} patrimônios transferidos em lote para "${targetLocation}"`, 'LOTE', 'PATRIMONIO');
  };

  const handleBatchReturnToStock = async (assetIds) => {
    await handleBatchMoveToSpace(assetIds, 'Estoque Central');
  };

  // ----------------------------------------------------
  // MANIPULADORES DE COLABORADORES (EMPLOYEES)
  // ----------------------------------------------------
  const handleSaveEmployee = async (savedEmployee) => {
    try {
      if (savedEmployee.id && typeof savedEmployee.id === 'number' && savedEmployee.id < 1500000000000) {
        const response = await fetch(`/api/employees/${savedEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedEmployee)
        });

        let updated = savedEmployee;
        if (response.ok) {
          updated = await response.json();
        }

        setEmployees(prev => prev.map(item => item.id === updated.id ? updated : item));
        
        // Atualiza referências caso o nome tenha mudado
        if (savedEmployee.oldName && savedEmployee.oldName !== updated.name) {
          setAssets(prev => prev.map(asset => {
            if (asset.employee === savedEmployee.oldName) {
              return { ...asset, employee: updated.name };
            }
            return asset;
          }));
        }

        addToast(`Colaborador ${updated.name} atualizado!`, 'success');
        addAuditLog('ATUALIZACAO', `Atualizado cadastro do colaborador ${updated.name}`, updated.name, 'FUNCIONARIO');
      } else {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedEmployee)
        });

        let created = savedEmployee;
        if (response.ok) {
          created = await response.json();
        } else {
          created = { ...savedEmployee, id: Date.now() };
        }

        setEmployees(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        addToast(`Colaborador ${created.name} cadastrado!`, 'success');
        addAuditLog('CADASTRO', `Cadastrado novo colaborador ${created.name} (${created.sector})`, created.name, 'FUNCIONARIO');
      }
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Falha ao excluir colaborador na API:', err);
    }

    setEmployees(prev => prev.filter(item => item.id !== id));
    
    // Devolve equipamentos para o estoque
    setAssets(prev => prev.map(asset => {
      if (asset.employee === name) {
        return {
          ...asset,
          employee: null,
          status: asset.status === 'Em Uso' ? 'Em Estoque' : asset.status
        };
      }
      return asset;
    }));

    addToast(`Colaborador ${name} excluído. Equipamentos retornados ao estoque.`, 'info');
    addAuditLog('EXCLUSAO', `Excluído colaborador ${name}. Equipamentos vinculados retornaram ao estoque.`, name, 'FUNCIONARIO');
  };

  const handleOnboardEmployeeWithKit = async (employeeData, assetIdsToAssign = []) => {
    // 1. Cadastra o Colaborador
    await handleSaveEmployee(employeeData);

    // 2. Aloca todos os itens do kit
    if (assetIdsToAssign && assetIdsToAssign.length > 0) {
      for (const assetId of assetIdsToAssign) {
        await handleAssignAsset(assetId, employeeData.name, employeeData.sector);
      }
    }

    addToast(`Onboarding concluído! ${employeeData.name} cadastrado com ${assetIdsToAssign.length} equipamento(s) entregues.`, 'success');
  };

  const handleOffboardEmployee = async ({ employee, returnedAssetIds = [], destination = 'Estoque Central', notes = '', removeEmployee = false }) => {
    for (const assetId of returnedAssetIds) {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) continue;

      const updated = {
        ...asset,
        employee: null,
        status: destination === 'Em Manutenção' ? 'Em Manutenção' : 'Em Estoque',
        location: destination === 'Em Manutenção' ? 'Laboratório de TI / Manutenção' : 'Estoque Central',
        notes: notes ? `${asset.notes ? asset.notes + ' | ' : ''}Devolvido em offboarding (${new Date().toLocaleDateString('pt-BR')}): ${notes}` : asset.notes
      };

      try {
        await fetch(`/api/assets/${assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.warn('Falha ao atualizar ativo no offboarding:', err);
      }

      setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
      addAuditLog('DEVOLUCAO', `Devolvido de ${employee.name} para ${updated.location}`, asset.tag, 'PATRIMONIO');
    }

    if (removeEmployee) {
      await handleDeleteEmployee(employee.id, employee.name);
    } else {
      addToast(`Offboarding concluído! ${returnedAssetIds.length} item(ns) devolvidos por ${employee.name}.`, 'success');
      addAuditLog('OFFBOARDING', `Offboarding concluído para ${employee.name}. ${returnedAssetIds.length} item(ns) devolvidos.`, employee.name, 'FUNCIONARIO');
    }
  };

  // ----------------------------------------------------
  // MANIPULADORES DE MANUTENÇÃO (MAINTENANCES)
  // ----------------------------------------------------
  const handleCreateMaintenance = async (ticketData) => {
    try {
      const response = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      let created = ticketData;
      if (response.ok) {
        created = await response.json();
      } else {
        created = { ...ticketData, id: Date.now(), status: 'Em Manutenção', opened_at: new Date().toISOString() };
      }

      setMaintenances(prev => [created, ...prev]);

      // Atualiza status do patrimônio correspondente
      setAssets(prev => prev.map(a => {
        if (a.tag === ticketData.asset_tag) {
          return {
            ...a,
            status: 'Manutenção',
            notes: a.notes ? `${a.notes} | Em Manutenção: ${ticketData.issue_description}` : `Em Manutenção: ${ticketData.issue_description}`
          };
        }
        return a;
      }));

      addToast(`Chamado de manutenção aberto para #${ticketData.asset_tag}!`, 'warning');
      addAuditLog('MANUTENCAO', `Patrimônio #${ticketData.asset_tag} (${ticketData.asset_name}) enviado para manutenção: ${ticketData.issue_description}`, ticketData.asset_tag, 'PATRIMONIO');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMaintenance = async (maintId, updateData) => {
    try {
      const response = await fetch(`/api/maintenances/${maintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      let updatedRecord = null;
      if (response.ok) {
        updatedRecord = await response.json();
      }

      const existing = maintenances.find(m => m.id === maintId);
      const tag = existing ? existing.asset_tag : '';

      setMaintenances(prev => prev.map(m => m.id === maintId ? { ...m, ...updateData, closed_at: new Date().toISOString() } : m));

      // Reajusta o patrimônio correspondente
      if (updateData.status === 'Concluída' && tag) {
        setAssets(prev => prev.map(a => {
          if (a.tag === tag) {
            if (updateData.return_destination === 'Colaborador' && updateData.employee_name) {
              return {
                ...a,
                status: 'Em Uso',
                employee: updateData.employee_name,
                last_verified: new Date().toISOString()
              };
            } else {
              return {
                ...a,
                status: 'Em Estoque',
                employee: null,
                last_verified: new Date().toISOString()
              };
            }
          }
          return a;
        }));
      }

      addToast(`Manutenção concluída para #${tag}!`, 'success');
      addAuditLog('MANUTENCAO', `Manutenção concluída para #${tag}. Destino: ${updateData.return_destination}`, tag, 'PATRIMONIO');
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // MANIPULADORES DE LICENÇAS DE SOFTWARE (LICENSES)
  // ----------------------------------------------------
  const handleSaveLicense = async (licenseData) => {
    const isExisting = licenseData.id && licenses.some(l => l.id === licenseData.id);

    if (isExisting) {
      setLicenses(prev => {
        const updated = prev.map(item => item.id === licenseData.id ? { ...item, ...licenseData } : item);
        localStorage.setItem('trynova_licenses', JSON.stringify(updated));
        return updated;
      });
      addToast(`Licença "${licenseData.name}" atualizada com sucesso!`, 'success');
      addAuditLog('ATUALIZACAO', `Atualizada licença de software: ${licenseData.name}`, licenseData.name, 'LICENCA');

      try {
        if (typeof licenseData.id === 'number' && licenseData.id < 1500000000000) {
          await fetch(`/api/licenses/${licenseData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(licenseData)
          });
        }
      } catch (err) {
        console.warn('API offline, salvo localmente:', err);
      }
    } else {
      const newLicense = {
        ...licenseData,
        id: licenseData.id || Date.now(),
        assigned_to: licenseData.assigned_to || []
      };

      setLicenses(prev => {
        const updated = [newLicense, ...prev];
        localStorage.setItem('trynova_licenses', JSON.stringify(updated));
        return updated;
      });
      addToast(`Licença "${newLicense.name}" cadastrada com sucesso!`, 'success');
      addAuditLog('CADASTRO', `Cadastrada licença de software: ${newLicense.name}`, newLicense.name, 'LICENCA');

      try {
        const response = await fetch('/api/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLicense)
        });
        if (response.ok) {
          const created = await response.json();
          setLicenses(prev => {
            const updated = prev.map(l => l.id === newLicense.id ? created : l);
            localStorage.setItem('trynova_licenses', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn('API offline, cadastrado localmente:', err);
      }
    }
  };

  const handleDeleteLicense = async (id) => {
    const lic = licenses.find(l => l.id === id);
    setLicenses(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('trynova_licenses', JSON.stringify(updated));
      return updated;
    });
    addToast(`Licença "${lic ? lic.name : id}" excluída.`, 'info');
    addAuditLog('EXCLUSAO', `Excluída licença de software: ${lic ? lic.name : id}`, String(id), 'LICENCA');

    try {
      if (typeof id === 'number' && id < 1500000000000) {
        await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('Falha ao excluir licença na API:', err);
    }
  };

  const handleAssignLicenseSeat = async (licId, seatData) => {
    const lic = licenses.find(l => l.id === licId);
    if (!lic) return;

    const currentAssigned = Array.isArray(lic.assigned_to)
      ? [...lic.assigned_to]
      : (typeof lic.assigned_to === 'string' ? JSON.parse(lic.assigned_to || '[]') : []);

    const updatedAssigned = [...currentAssigned, { ...seatData, id: Date.now() }];
    const updatedLic = { ...lic, assigned_to: updatedAssigned };

    await handleSaveLicense(updatedLic);
  };

  const handleUnassignLicenseSeat = async (licId, seatIndex) => {
    const lic = licenses.find(l => l.id === licId);
    if (!lic) return;

    const currentAssigned = Array.isArray(lic.assigned_to)
      ? [...lic.assigned_to]
      : (typeof lic.assigned_to === 'string' ? JSON.parse(lic.assigned_to || '[]') : []);

    const updatedAssigned = currentAssigned.filter((_, idx) => idx !== seatIndex);
    const updatedLic = { ...lic, assigned_to: updatedAssigned };

    await handleSaveLicense(updatedLic);
  };

  // ----------------------------------------------------
  // NAVEGAÇÃO & ATALHOS
  // ----------------------------------------------------
  const handleNavigateToAssetsWithFilter = (filterType, filterValue) => {
    if (filterType === 'status') setAssetStatusFilter(filterValue);
    if (filterType === 'location') setAssetLocationFilter(filterValue);
    if (filterType === 'equipment') setAssetEquipmentFilter(filterValue);
    setActiveTab('assets');
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('trynova_session', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    addToast(`Bem-vindo de volta, ${userData.name || 'Administrador'}!`, 'success');
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza de que deseja sair do sistema?')) {
      localStorage.removeItem('trynova_session');
      setUser(null);
      setIsLoggedIn(false);
      addToast('Sessão encerrada com segurança.', 'info');
    }
  };

  const existingTags = assets.map(a => a.tag);

  const assetCounts = {
    total: assets.length,
    spaces: spaces.length,
    stock: assets.filter(a => a.status === 'Em Estoque').length,
    maintenance: assets.filter(a => a.status === 'Manutenção').length,
    employees: employees.length,
    licenses: licenses.length,
    decommissioned: assets.filter(a => a.status === 'Baixado' || a.status === 'decommissioned').length
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      theme={theme}
      toggleTheme={toggleTheme}
      user={user}
      onAddNewAsset={() => {
        setEditingAsset(null);
        setIsFormOpen(true);
      }}
      toasts={toasts}
      onDismissToast={removeToast}
      assetCounts={assetCounts}
    >
      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Carregando dados do acervo patrimonial...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <Dashboard
          assets={assets}
          employees={employees}
          maintenances={maintenances}
          onNavigateToAssets={handleNavigateToAssetsWithFilter}
          onNavigateToTab={setActiveTab}
          onAddNewAsset={() => {
            setEditingAsset(null);
            setIsFormOpen(true);
          }}
        />
      ) : activeTab === 'spaces' ? (
        <SpacesList
          spaces={spaces}
          assets={assets}
          onSaveSpace={handleSaveSpace}
          onDeleteSpace={handleDeleteSpace}
          onAllocateAsset={handleAllocateAssetToSpace}
          onTransferAsset={handleTransferAssetBetweenSpaces}
          onRemoveFromSpace={handleRemoveAssetFromSpace}
          onEditAsset={handleEditAsset}
        />
      ) : activeTab === 'stock' ? (
        <StockList
          assets={assets}
          employees={employees}
          onAssign={handleAssignAsset}
          onDecommission={handleDecommissionAsset}
        />
      ) : activeTab === 'employees' ? (
        <EmployeesList
          assets={assets}
          employees={employees}
          onSaveEmployee={handleSaveEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onDecommission={handleDecommissionAsset}
          onSendToStock={handleSendToStockAsset}
          onOnboardEmployeeWithKit={handleOnboardEmployeeWithKit}
          onOffboardEmployee={handleOffboardEmployee}
        />
      ) : activeTab === 'maintenance' ? (
        <MaintenanceList
          maintenances={maintenances}
          assets={assets}
          employees={employees}
          onCreateMaintenance={handleCreateMaintenance}
          onUpdateMaintenance={handleUpdateMaintenance}
        />
      ) : activeTab === 'licenses' ? (
        <SoftwareLicensesList
          licenses={licenses}
          employees={employees}
          assets={assets}
          onSaveLicense={handleSaveLicense}
          onDeleteLicense={handleDeleteLicense}
          onAssignSeat={handleAssignLicenseSeat}
          onUnassignSeat={handleUnassignLicenseSeat}
        />
      ) : activeTab === 'decommissioned' ? (
        <DecommissionedList
          assets={assets}
          onReactivate={handleReactivateAsset}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
        />
      ) : activeTab === 'audit' ? (
        <AuditLogView logs={auditLogs} />
      ) : (
        <AssetList
          assets={assets}
          employees={employees}
          spaces={spaces}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          onDecommission={handleDecommissionAsset}
          onReactivate={handleReactivateAsset}
          onAddNew={() => {
            setEditingAsset(null);
            setIsFormOpen(true);
          }}
          onSendToStock={handleSendToStockAsset}
          onSendToMaintenance={(asset) => {
            handleCreateMaintenance({
              asset_id: asset.id,
              asset_tag: asset.tag,
              asset_name: asset.name,
              issue_description: 'Encaminhado para manutenção preventiva/corretiva',
              employee_name: asset.employee
            });
            setActiveTab('maintenance');
          }}
          onImportAssets={handleImportAssets}
          onBatchMoveToSpace={handleBatchMoveToSpace}
          onBatchReturnToStock={handleBatchReturnToStock}
          statusFilter={assetStatusFilter}
          setStatusFilter={setAssetStatusFilter}
          locationFilter={assetLocationFilter}
          setLocationFilter={setAssetLocationFilter}
          equipmentFilter={assetEquipmentFilter}
          setEquipmentFilter={setAssetEquipmentFilter}
        />
      )}

      {/* Modal de Formulário de Patrimônio */}
      {isFormOpen && (
        <AssetForm
          asset={editingAsset}
          existingTags={existingTags}
          employees={employees}
          spaces={spaces}
          onSave={handleSaveAsset}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAsset(null);
          }}
        />
      )}
    </Layout>
  );
}
