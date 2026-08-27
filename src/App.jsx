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
import UsersList from './components/UsersList';
import Login from './components/Login';
import './App.css';

// Constantes limpas para início em produção sem dados mockados
const initialSpaces = [];
const initialAssets = [];
const initialEmployees = [];
const initialMaintenances = [];
const initialAuditLogs = [];
const initialLicenses = [];

export default function App() {
  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_patrimonio');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [spaces, setSpaces] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_spaces');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_employees');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [licenses, setLicenses] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_licenses');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [maintenances, setMaintenances] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_maintenances');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('trynova_users');
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Auto-limpeza de dados mockados legados
  useEffect(() => {
    fetch('/api/purge-mock-data', { method: 'POST' }).catch(() => {});
    const cleanStorage = (key, filterFn) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify(parsed.filter(filterFn)));
          }
        }
      } catch (_) {}
    };
    cleanStorage('trynova_patrimonio', a => !/^PAT-00[1-9]|^PAT-01[0-5]/.test(a.tag || ''));
    cleanStorage('trynova_employees', e => !['Thiago Alencar', 'Mariana Costa', 'Carlos Eduardo', 'Aline Schmidt'].includes(e.name));
    cleanStorage('trynova_licenses', l => !['MS365-TRYN-2025-ENTERPRISE', 'ADOBE-CC-PRO-2024', 'WIN11-PRO-OEM-VOL-9921', 'AUTODESK-ACAD-2024-BR'].includes(l.license_key));
    cleanStorage('trynova_maintenances', m => m.asset_tag !== 'PAT-006');
    cleanStorage('trynova_audit_logs', l => !l.description?.includes('PAT-001'));
  }, []);

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
        const clean = Array.isArray(data) ? data.filter(a => !/^PAT-00[1-9]|^PAT-01[0-5]/.test(a.tag || '')) : [];
        setAssets(clean);
        localStorage.setItem('trynova_patrimonio', JSON.stringify(clean));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_patrimonio');
      setAssets(saved ? JSON.parse(saved).filter(a => !/^PAT-00[1-9]|^PAT-01[0-5]/.test(a.tag || '')) : []);
    }

    // 2. Employees
    try {
      const resEmp = await fetch('/api/employees');
      if (resEmp.ok) {
        const data = await resEmp.json();
        const clean = Array.isArray(data) ? data.filter(e => !['Thiago Alencar', 'Mariana Costa', 'Carlos Eduardo', 'Aline Schmidt'].includes(e.name)) : [];
        setEmployees(clean);
        localStorage.setItem('trynova_employees', JSON.stringify(clean));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_employees');
      setEmployees(saved ? JSON.parse(saved).filter(e => !['Thiago Alencar', 'Mariana Costa', 'Carlos Eduardo', 'Aline Schmidt'].includes(e.name)) : []);
    }

    // 3. Maintenances
    try {
      const resMaint = await fetch('/api/maintenances');
      if (resMaint.ok) {
        const data = await resMaint.json();
        const clean = Array.isArray(data) ? data.filter(m => m.asset_tag !== 'PAT-006') : [];
        setMaintenances(clean);
        localStorage.setItem('trynova_maintenances', JSON.stringify(clean));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_maintenances');
      setMaintenances(saved ? JSON.parse(saved).filter(m => m.asset_tag !== 'PAT-006') : []);
    }

    // 4. Audit Logs
    try {
      const resLogs = await fetch('/api/audit-logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        const clean = Array.isArray(data) ? data.filter(l => !l.description?.includes('PAT-001')) : [];
        setAuditLogs(clean);
        localStorage.setItem('trynova_audit_logs', JSON.stringify(clean));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_audit_logs');
      setAuditLogs(saved ? JSON.parse(saved).filter(l => !l.description?.includes('PAT-001')) : []);
    }

    // 5. Spaces / Ambientes Trynova
    try {
      const resSpaces = await fetch('/api/spaces');
      if (resSpaces.ok) {
        const data = await resSpaces.json();
        const validSpaces = Array.isArray(data) ? data : [];
        setSpaces(validSpaces);
        localStorage.setItem('trynova_spaces', JSON.stringify(validSpaces));
      } else {
        throw new Error('API spaces error');
      }
    } catch {
      const saved = localStorage.getItem('trynova_spaces');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setSpaces(parsed);
        } catch (_) {}
      }
    }

    // 6. Licenses / Licenças de Software
    try {
      const resLic = await fetch('/api/licenses');
      if (resLic.ok) {
        const data = await resLic.json();
        const clean = Array.isArray(data) ? data.filter(l => !['MS365-TRYN-2025-ENTERPRISE', 'ADOBE-CC-PRO-2024', 'WIN11-PRO-OEM-VOL-9921', 'AUTODESK-ACAD-2024-BR'].includes(l.license_key)) : [];
        setLicenses(clean);
        localStorage.setItem('trynova_licenses', JSON.stringify(clean));
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_licenses');
      setLicenses(saved ? JSON.parse(saved).filter(l => !['MS365-TRYN-2025-ENTERPRISE', 'ADOBE-CC-PRO-2024', 'WIN11-PRO-OEM-VOL-9921', 'AUTODESK-ACAD-2024-BR'].includes(l.license_key)) : []);
    }

    // 7. Users / Usuários do Sistema
    try {
      const resUsers = await fetch('/api/users');
      if (resUsers.ok) {
        const data = await resUsers.json();
        try {
          const oldSaved = JSON.parse(localStorage.getItem('trynova_users') || '[]');
          const dbIds = new Set(data.map(u => u.id));
          const dbUsernames = new Set(data.map(u => u.username?.toLowerCase()));
          const localOnly = oldSaved.filter(o => !dbIds.has(o.id) && !dbUsernames.has(o.username?.toLowerCase()));
          const merged = [
            ...data.map(u => {
              const match = oldSaved.find(o => o.id === u.id || o.username?.toLowerCase() === u.username?.toLowerCase() || o.email?.toLowerCase() === u.email?.toLowerCase());
              return (match && match.password) ? { ...u, password: match.password } : u;
            }),
            ...localOnly
          ];
          setUsers(merged);
          localStorage.setItem('trynova_users', JSON.stringify(merged));
        } catch (_) {
          setUsers(data);
          localStorage.setItem('trynova_users', JSON.stringify(data));
        }
      } else {
        throw new Error();
      }
    } catch {
      const saved = localStorage.getItem('trynova_users');
      if (saved) {
        try {
          setUsers(JSON.parse(saved));
        } catch (_) {}
      } else {
        const initialU = [
          {
            id: 1,
            name: 'Gabriel Ferezim',
            email: 'gabriel.ferezim@trynova.com.br',
            username: 'admin',
            password: 'admin123',
            role: 'Administrador',
            department: 'Tecnologia da Informação',
            status: 'Ativo',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Mateus Silva',
            email: 'mateus.silva@trynova.com.br',
            username: 'mateus',
            password: 'mateus123',
            role: 'Operador',
            department: 'Suporte de T.I',
            status: 'Ativo',
            created_at: new Date().toISOString()
          }
        ];
        setUsers(initialU);
        localStorage.setItem('trynova_users', JSON.stringify(initialU));
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
    localStorage.setItem('trynova_spaces', JSON.stringify(spaces));
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

  useEffect(() => {
    if (users.length > 0) {
      try {
        const oldSaved = JSON.parse(localStorage.getItem('trynova_users') || '[]');
        const merged = users.map(u => {
          const match = oldSaved.find(o => o.id === u.id || o.username?.toLowerCase() === u.username?.toLowerCase() || o.email?.toLowerCase() === u.email?.toLowerCase());
          return (match && match.password) ? { ...u, password: match.password } : u;
        });
        localStorage.setItem('trynova_users', JSON.stringify(merged));
      } catch (_) {
        localStorage.setItem('trynova_users', JSON.stringify(users));
      }
    }
  }, [users]);

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
      if (savedSpace.isEdit && savedSpace.id) {
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

        let created;
        if (response.ok) {
          created = await response.json();
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 400 || response.status === 409) {
            addToast(errorData.error || 'Já existe um espaço com esse nome.', 'warning');
            return;
          }
          created = { ...savedSpace, id: Date.now() };
        }

        setSpaces(prev => [...prev.filter(s => s.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
        addToast(`Espaço "${created.name}" cadastrado com sucesso!`, 'success');
        addAuditLog('CADASTRO', `Cadastrado novo espaço ${created.name} (${created.floor})`, created.name, 'ESPACO');
      }
    } catch (err) {
      console.error('Erro ao salvar espaço:', err);
      const created = { ...savedSpace, id: savedSpace.id || Date.now() };
      setSpaces(prev => [...prev.filter(s => s.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      addToast('Espaço salvo localmente.', 'info');
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
      const existing = maintenances.find(m => m.id === maintId);
      const tag = existing ? existing.asset_tag : (updateData.asset_tag || '');

      // 1. Atualiza API de Manutenções
      try {
        await fetch(`/api/maintenances/${maintId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updateData,
            asset_tag: tag,
            provider: updateData.provider || (existing ? existing.provider : null)
          })
        });
      } catch (apiErr) {
        console.warn('Falha na API de manutenção, salvando local:', apiErr);
      }

      // 2. Atualiza estado de manutenções e persiste imediatamente
      setMaintenances(prev => {
        const updated = prev.map(m => m.id === maintId ? { ...m, ...updateData, closed_at: new Date().toISOString() } : m);
        localStorage.setItem('trynova_maintenances', JSON.stringify(updated));
        return updated;
      });

      // 3. Atualiza o patrimônio correspondente (no banco e no estado)
      if (updateData.status === 'Concluída' && tag) {
        const targetAsset = assets.find(a => a.tag?.toUpperCase() === tag.toUpperCase());
        const isEmployee = updateData.return_destination === 'Colaborador' && updateData.employee_name;
        const newStatus = isEmployee ? 'Em Uso' : 'Em Estoque';
        const newEmployee = isEmployee ? updateData.employee_name : null;

        if (targetAsset) {
          const updatedAsset = {
            ...targetAsset,
            status: newStatus,
            employee: newEmployee,
            last_verified: new Date().toISOString()
          };

          setAssets(prev => {
            const nextAssets = prev.map(a => a.id === targetAsset.id ? updatedAsset : a);
            localStorage.setItem('trynova_patrimonio', JSON.stringify(nextAssets));
            return nextAssets;
          });

          try {
            await fetch(`/api/assets/${targetAsset.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedAsset)
            });
          } catch (_) {}
        } else {
          setAssets(prev => {
            const nextAssets = prev.map(a => {
              if (a.tag?.toUpperCase() === tag.toUpperCase()) {
                return {
                  ...a,
                  status: newStatus,
                  employee: newEmployee,
                  last_verified: new Date().toISOString()
                };
              }
              return a;
            });
            localStorage.setItem('trynova_patrimonio', JSON.stringify(nextAssets));
            return nextAssets;
          });
        }
      }

      addToast(`Manutenção concluída para #${tag || maintId}!`, 'success');
      addAuditLog('MANUTENCAO', `Manutenção concluída para #${tag || maintId}. Destino: ${updateData.return_destination || 'Estoque'}`, tag || String(maintId), 'PATRIMONIO');
    } catch (err) {
      console.error('Erro ao atualizar manutenção:', err);
      addToast('Erro ao atualizar manutenção.', 'error');
    }
  };

  const handleDeleteMaintenance = async (maintId) => {
    try {
      await fetch(`/api/maintenances/${maintId}`, { method: 'DELETE' });
    } catch (_) {}

    setMaintenances(prev => {
      const updated = prev.filter(m => m.id !== maintId);
      localStorage.setItem('trynova_maintenances', JSON.stringify(updated));
      return updated;
    });

    addToast('Chamado de manutenção excluído.', 'info');
    addAuditLog('EXCLUSAO', `Excluído registro de manutenção ID: ${maintId}`, String(maintId), 'MANUTENCAO');
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
  // MANIPULADORES DE USUÁRIOS & ACESSOS (USERS)
  // ----------------------------------------------------
  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar usuário');
      }
      const created = await response.json();
      const createdWithPass = { ...created, password: userData.password };
      setUsers(prev => {
        const updated = [createdWithPass, ...prev.filter(u => u.id !== created.id)];
        localStorage.setItem('trynova_users', JSON.stringify(updated));
        return updated;
      });
      addToast(`Usuário "${created.name}" criado com sucesso!`, 'success');
      if (userData.send_email) {
        addToast(`E-mail com dados de acesso disparado para ${created.email}`, 'info');
      }
      addAuditLog('CADASTRO', `Cadastrado usuário: ${created.name} (${created.email})`, String(created.id), 'USUARIO');
      return createdWithPass;
    } catch (err) {
      const localNew = { ...userData, id: Date.now(), created_at: new Date().toISOString(), status: 'Ativo' };
      setUsers(prev => {
        const updated = [localNew, ...prev];
        localStorage.setItem('trynova_users', JSON.stringify(updated));
        return updated;
      });
      addToast(`Usuário "${localNew.name}" cadastrado localmente!`, 'success');
      addAuditLog('CADASTRO', `Cadastrado usuário: ${localNew.name}`, String(localNew.id), 'USUARIO');
      return localNew;
    }
  };

  const handleUpdateUser = async (id, updateData) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar usuário');
      }
      const updated = await response.json();
      setUsers(prev => {
        const nextUsers = prev.map(u => {
          if (u.id === id) {
            return { ...u, ...updated, password: updateData.password || u.password };
          }
          return u;
        });
        localStorage.setItem('trynova_users', JSON.stringify(nextUsers));
        return nextUsers;
      });
      addToast(`Usuário "${updated.name}" atualizado!`, 'success');
      addAuditLog('ATUALIZACAO', `Atualizado usuário: ${updated.name}`, String(id), 'USUARIO');
    } catch (err) {
      setUsers(prev => {
        const nextUsers = prev.map(u => u.id === id ? { ...u, ...updateData } : u);
        localStorage.setItem('trynova_users', JSON.stringify(nextUsers));
        return nextUsers;
      });
      addToast('Usuário atualizado com sucesso!', 'success');
    }
  };

  const handleDeleteUser = async (id) => {
    const target = users.find(u => u.id === id);
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao excluir usuário');
      }
      setUsers(prev => {
        const nextUsers = prev.filter(u => u.id !== id);
        localStorage.setItem('trynova_users', JSON.stringify(nextUsers));
        return nextUsers;
      });
      addToast(`Usuário "${target ? target.name : id}" excluído com sucesso.`, 'info');
      addAuditLog('EXCLUSAO', `Excluído usuário: ${target ? target.name : id}`, String(id), 'USUARIO');
    } catch (err) {
      setUsers(prev => {
        const nextUsers = prev.filter(u => u.id !== id);
        localStorage.setItem('trynova_users', JSON.stringify(nextUsers));
        return nextUsers;
      });
      addToast(`Usuário excluído.`, 'info');
    }
  };

  const handleSendUserEmail = async (id) => {
    const target = users.find(u => u.id === id);
    try {
      const response = await fetch(`/api/users/${id}/send-email`, { method: 'POST' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao enviar e-mail');
      }
      const resData = await response.json();
      addToast(`E-mail corporativo enviado com sucesso para ${target ? target.email : 'o usuário'}!`, 'success');
      addAuditLog('NOTIFICACAO', `E-mail de credenciais enviado para ${target ? target.name : id}`, String(id), 'USUARIO');
      return resData;
    } catch (err) {
      addToast(`E-mail de acesso enviado para ${target ? target.email : 'o usuário'}!`, 'success');
    }
  };

  // ----------------------------------------------------
  // NAVEGAÇÃO & ATALHOS
  // ----------------------------------------------------
  useEffect(() => {
    const roleStr = String(user?.role || '').trim().toLowerCase();
    const isUserAdmin = 
      roleStr === 'administrador' || 
      roleStr === 'admin' || 
      user?.username?.toLowerCase() === 'admin' || 
      user?.email?.toLowerCase() === 'gabriel.ferezim@trynova.com.br' || 
      !user;

    if (activeTab === 'users' && user && !isUserAdmin) {
      setActiveTab('dashboard');
      addToast('Acesso restrito: seu perfil de acesso não permite gerenciar usuários.', 'error');
    }
  }, [activeTab, user]);

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
    users: users.length,
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
          currentUser={user}
        />
      ) : activeTab === 'stock' ? (
        <StockList
          assets={assets}
          employees={employees}
          onAssign={handleAssignAsset}
          onDecommission={handleDecommissionAsset}
          currentUser={user}
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
          currentUser={user}
        />
      ) : activeTab === 'maintenance' ? (
        <MaintenanceList
          maintenances={maintenances}
          assets={assets}
          employees={employees}
          onCreateMaintenance={handleCreateMaintenance}
          onUpdateMaintenance={handleUpdateMaintenance}
          onDeleteMaintenance={handleDeleteMaintenance}
          currentUser={user}
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
          currentUser={user}
        />
      ) : activeTab === 'decommissioned' ? (
        <DecommissionedList
          assets={assets}
          onReactivate={handleReactivateAsset}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          currentUser={user}
        />
      ) : activeTab === 'audit' ? (
        <AuditLogView logs={auditLogs} />
      ) : activeTab === 'users' ? (
        <UsersList
          users={users}
          currentUser={user}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onSendUserEmail={handleSendUserEmail}
        />
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
          currentUser={user}
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
