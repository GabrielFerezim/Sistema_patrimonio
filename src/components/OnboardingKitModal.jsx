import React, { useState, useEffect } from 'react';
import { gerarTermoResponsabilidade } from '../utils/gerarTermo';

export default function OnboardingKitModal({
  isOpen,
  onClose,
  assets = [],
  employees = [],
  onConfirmOnboarding
}) {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeSector, setEmployeeSector] = useState('Tecnologia da Informação');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeRamal, setEmployeeRamal] = useState('');
  const [employeeTeam, setEmployeeTeam] = useState('Nenhuma');
  const [validationError, setValidationError] = useState('');

  // Itens em estoque disponíveis
  const stockAssets = assets.filter(
    a => a.status === 'Em Estoque'
  );

  // Categorias padrão do Kit de Onboarding
  const [includeMonitor, setIncludeMonitor] = useState(true);
  const [selectedMonitorId, setSelectedMonitorId] = useState('');

  const [includeKeyboard, setIncludeKeyboard] = useState(true);
  const [selectedKeyboardId, setSelectedKeyboardId] = useState('');

  const [includeSupport, setIncludeSupport] = useState(true);
  const [selectedSupportId, setSelectedSupportId] = useState('');

  const [includeNotebook, setIncludeNotebook] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState('');

  const [includeHeadset, setIncludeHeadset] = useState(false);
  const [selectedHeadsetId, setSelectedHeadsetId] = useState('');

  // Itens extras customizados adicionados manualmente
  const [customSelectedAssetIds, setCustomSelectedAssetIds] = useState([]);

  // Estado de Sucesso pós-criação para baixar termo
  const [createdResult, setCreatedResult] = useState(null);

  // Filtrar itens do estoque por categoria
  const monitorStock = stockAssets.filter(
    a => a.equipment?.toLowerCase().includes('monitor') ||
         a.name?.toLowerCase().includes('monitor') ||
         a.name?.toLowerCase().includes('tela') ||
         a.equipment?.toLowerCase().includes('display')
  );

  const keyboardStock = stockAssets.filter(
    a => a.equipment?.toLowerCase().includes('teclado') ||
         a.name?.toLowerCase().includes('teclado') ||
         a.name?.toLowerCase().includes('mouse')
  );

  const supportStock = stockAssets.filter(
    a => a.equipment?.toLowerCase().includes('suporte') ||
         a.name?.toLowerCase().includes('suporte') ||
         a.name?.toLowerCase().includes('apoio') ||
         a.name?.toLowerCase().includes('base')
  );

  const notebookStock = stockAssets.filter(
    a => a.equipment?.toLowerCase().includes('notebook') ||
         a.equipment?.toLowerCase().includes('desktop') ||
         a.equipment?.toLowerCase().includes('computador') ||
         a.name?.toLowerCase().includes('dell') ||
         a.name?.toLowerCase().includes('thinkpad') ||
         a.name?.toLowerCase().includes('macbook')
  );

  const headsetStock = stockAssets.filter(
    a => a.equipment?.toLowerCase().includes('headset') ||
         a.equipment?.toLowerCase().includes('fone') ||
         a.name?.toLowerCase().includes('headset') ||
         a.name?.toLowerCase().includes('fone')
  );

  // Auto-selecionar o primeiro item disponível em estoque quando abrir
  useEffect(() => {
    if (isOpen) {
      setEmployeeName('');
      setEmployeeSector('Tecnologia da Informação');
      setEmployeeRole('');
      setEmployeeRamal('');
      setEmployeeTeam('Nenhuma');
      setValidationError('');
      setCreatedResult(null);
      setCustomSelectedAssetIds([]);

      // Auto-seleção padrão
      if (monitorStock.length > 0) {
        setSelectedMonitorId(String(monitorStock[0].id));
        setIncludeMonitor(true);
      } else {
        setSelectedMonitorId('');
        setIncludeMonitor(false);
      }

      if (keyboardStock.length > 0) {
        setSelectedKeyboardId(String(keyboardStock[0].id));
        setIncludeKeyboard(true);
      } else {
        setSelectedKeyboardId('');
        setIncludeKeyboard(false);
      }

      if (supportStock.length > 0) {
        setSelectedSupportId(String(supportStock[0].id));
        setIncludeSupport(true);
      } else {
        setSelectedSupportId('');
        setIncludeSupport(false);
      }

      if (notebookStock.length > 0) {
        setSelectedNotebookId(String(notebookStock[0].id));
      } else {
        setSelectedNotebookId('');
      }

      if (headsetStock.length > 0) {
        setSelectedHeadsetId(String(headsetStock[0].id));
      } else {
        setSelectedHeadsetId('');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Montar lista de IDs de patrimônios selecionados no kit
  const getSelectedKitAssetIds = () => {
    const ids = [];
    if (includeMonitor && selectedMonitorId) ids.push(Number(selectedMonitorId));
    if (includeKeyboard && selectedKeyboardId) ids.push(Number(selectedKeyboardId));
    if (includeSupport && selectedSupportId) ids.push(Number(selectedSupportId));
    if (includeNotebook && selectedNotebookId) ids.push(Number(selectedNotebookId));
    if (includeHeadset && selectedHeadsetId) ids.push(Number(selectedHeadsetId));
    
    customSelectedAssetIds.forEach(id => {
      if (!ids.includes(id)) ids.push(id);
    });

    return ids;
  };

  const selectedKitAssets = assets.filter(a => getSelectedKitAssetIds().includes(a.id));

  // Itens restantes em estoque não selecionados (para o seletor livre)
  const remainingStockAssets = stockAssets.filter(a => !getSelectedKitAssetIds().includes(a.id));

  const handleAddCustomAsset = (e) => {
    const val = Number(e.target.value);
    if (val && !customSelectedAssetIds.includes(val)) {
      setCustomSelectedAssetIds(prev => [...prev, val]);
    }
    e.target.value = '';
  };

  const handleRemoveCustomAsset = (id) => {
    setCustomSelectedAssetIds(prev => prev.filter(i => i !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!employeeName.trim() || !employeeSector.trim()) {
      setValidationError('Nome e Setor do novo colaborador são obrigatórios.');
      return;
    }

    const isDuplicate = employees.some(
      emp => emp.name.toLowerCase().trim() === employeeName.toLowerCase().trim()
    );

    if (isDuplicate) {
      setValidationError('Já existe um colaborador cadastrado com este nome.');
      return;
    }

    const employeePayload = {
      name: employeeName.trim(),
      sector: employeeSector.trim(),
      role: employeeRole.trim() || 'Colaborador',
      ramal: employeeRamal.trim() || '-',
      team: employeeTeam || 'Nenhuma',
    };

    const assetIdsToAssign = getSelectedKitAssetIds();

    try {
      await onConfirmOnboarding(employeePayload, assetIdsToAssign);

      // Guarda o resultado para permitir baixar o termo no modal
      const assignedAssetsData = assets.filter(a => assetIdsToAssign.includes(a.id));
      setCreatedResult({
        employee: employeePayload,
        assets: assignedAssetsData
      });
    } catch (err) {
      console.error(err);
      setValidationError('Erro ao processar o onboarding. Verifique a conexão.');
    }
  };

  const handleDownloadTermo = () => {
    if (!createdResult) return;
    gerarTermoResponsabilidade(createdResult.employee, createdResult.assets);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px', width: '94vw' }}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Onboarding com Kit de Equipamentos</h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Cadastre o novo usuário e entregue o kit de trabalho com itens do estoque
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {createdResult ? (
          /* ========================================================================= */
          /* TELA DE SUCESSO PÓS-ONBOARDING */
          /* ========================================================================= */
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Onboarding Concluído com Sucesso!
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-medium)', maxWidth: '520px', margin: '0 auto 1.25rem auto' }}>
              O colaborador <strong>{createdResult.employee.name}</strong> foi cadastrado no setor <strong>{createdResult.employee.sector}</strong> e recebeu <strong>{createdResult.assets.length}</strong> equipamento(s) do estoque.
            </p>

            {createdResult.assets.length > 0 && (
              <div style={{
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxWidth: '560px',
                margin: '0 auto 1.5rem auto',
                border: '1px solid var(--border-color)',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  EQUIPAMENTOS ENTREGUES NO KIT:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {createdResult.assets.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span><strong>#{a.tag}</strong> {a.name}</span>
                      <span className="tag-badge" style={{ fontSize: '0.72rem' }}>{a.equipment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadTermo}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Baixar Termo de Responsabilidade (PDF)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem' }}
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FORMULÁRIO DE ONBOARDING COM KIT */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="modal-form">
            {validationError && (
              <div className="alert-box error" style={{ marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO NOVO COLABORADOR */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  1
                </span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Dados do Novo Colaborador
                </h3>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="onb-name">Nome Completo *</label>
                  <input
                    type="text"
                    id="onb-name"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Ex: Lucas Mendonça Silva"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-sector">Setor / Departamento *</label>
                  <select
                    id="onb-sector"
                    value={employeeSector}
                    onChange={(e) => setEmployeeSector(e.target.value)}
                    required
                  >
                    <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Operações">Operações</option>
                    <option value="Administração">Administração</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="onb-role">Cargo / Função</label>
                  <input
                    type="text"
                    id="onb-role"
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value)}
                    placeholder="Ex: Analista de Sistemas, Designer..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-ramal">Ramal Telefônico</label>
                  <input
                    type="text"
                    id="onb-ramal"
                    value={employeeRamal}
                    onChange={(e) => setEmployeeRamal(e.target.value)}
                    placeholder="Ex: 4015"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="onb-team">Equipe / Cliente</label>
                  <input
                    type="text"
                    id="onb-team"
                    list="onb-team-suggestions"
                    value={employeeTeam}
                    onChange={(e) => setEmployeeTeam(e.target.value)}
                    placeholder="Ex: C&A, Latam, Prosegur, Geral..."
                  />
                  <datalist id="onb-team-suggestions">
                    <option value="Nenhuma">Nenhuma / Geral</option>
                    <option value="C&A" />
                    <option value="Latam" />
                    <option value="Prosegur" />
                    {Array.from(new Set(employees.map(e => e.team).filter(Boolean))).map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MONTAGEM DO KIT DE EQUIPAMENTOS AUTOMÁTICO */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    2
                  </span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Kit de Equipamentos de Trabalho (Estoque)
                  </h3>
                </div>

                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: selectedKitAssets.length > 0 ? 'var(--primary)' : 'var(--text-muted)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)'
                }}>
                  {selectedKitAssets.length} item(ns) selecionado(s)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* 1. MONITOR / TELA */}
                <div style={{
                  backgroundColor: includeMonitor ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: `1px solid ${includeMonitor ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={includeMonitor}
                        onChange={(e) => setIncludeMonitor(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Monitor / Tela</span>
                    </label>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: monitorStock.length > 0 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {monitorStock.length > 0 ? `${monitorStock.length} disponível(is) em estoque` : 'Sem estoque'}
                    </span>
                  </div>

                  {includeMonitor && (
                    <div>
                      {monitorStock.length > 0 ? (
                        <select
                          value={selectedMonitorId}
                          onChange={(e) => setSelectedMonitorId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        >
                          {monitorStock.map(a => (
                            <option key={a.id} value={a.id}>
                              #{a.tag} - {a.name} ({a.condition || 'Novo'}) {a.serial_number ? `[S/N: ${a.serial_number}]` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', margin: 0 }}>
                          Nenhum monitor encontrado com status "Em Estoque". Desmarque ou cadastre um monitor no estoque.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. TECLADO & MOUSE */}
                <div style={{
                  backgroundColor: includeKeyboard ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: `1px solid ${includeKeyboard ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={includeKeyboard}
                        onChange={(e) => setIncludeKeyboard(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Teclado & Mouse</span>
                    </label>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: keyboardStock.length > 0 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {keyboardStock.length > 0 ? `${keyboardStock.length} disponível(is) em estoque` : 'Sem estoque'}
                    </span>
                  </div>

                  {includeKeyboard && (
                    <div>
                      {keyboardStock.length > 0 ? (
                        <select
                          value={selectedKeyboardId}
                          onChange={(e) => setSelectedKeyboardId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        >
                          {keyboardStock.map(a => (
                            <option key={a.id} value={a.id}>
                              #{a.tag} - {a.name} ({a.condition || 'Novo'}) {a.serial_number ? `[S/N: ${a.serial_number}]` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', margin: 0 }}>
                          Nenhum teclado/mouse encontrado em estoque.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. SUPORTE DE NOTEBOOK / ACESSÓRIO */}
                <div style={{
                  backgroundColor: includeSupport ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: `1px solid ${includeSupport ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={includeSupport}
                        onChange={(e) => setIncludeSupport(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Suporte de Notebook / Apoio Ergonômico</span>
                    </label>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: supportStock.length > 0 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {supportStock.length > 0 ? `${supportStock.length} disponível(is) em estoque` : 'Sem estoque'}
                    </span>
                  </div>

                  {includeSupport && (
                    <div>
                      {supportStock.length > 0 ? (
                        <select
                          value={selectedSupportId}
                          onChange={(e) => setSelectedSupportId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        >
                          {supportStock.map(a => (
                            <option key={a.id} value={a.id}>
                              #{a.tag} - {a.name} ({a.condition || 'Novo'}) {a.serial_number ? `[S/N: ${a.serial_number}]` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', margin: 0 }}>
                          Nenhum suporte encontrado em estoque.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. NOTEBOOK / COMPUTADOR (OPCIONAL) */}
                <div style={{
                  backgroundColor: includeNotebook ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: `1px solid ${includeNotebook ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={includeNotebook}
                        onChange={(e) => setIncludeNotebook(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Notebook / Computador (Opcional)</span>
                    </label>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: notebookStock.length > 0 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {notebookStock.length > 0 ? `${notebookStock.length} disponível(is) em estoque` : 'Sem estoque'}
                    </span>
                  </div>

                  {includeNotebook && (
                    <div>
                      {notebookStock.length > 0 ? (
                        <select
                          value={selectedNotebookId}
                          onChange={(e) => setSelectedNotebookId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        >
                          {notebookStock.map(a => (
                            <option key={a.id} value={a.id}>
                              #{a.tag} - {a.name} ({a.equipment}) {a.serial_number ? `[S/N: ${a.serial_number}]` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', margin: 0 }}>
                          Nenhum computador disponível em estoque no momento.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. HEADSET / FONE (OPCIONAL) */}
                <div style={{
                  backgroundColor: includeHeadset ? 'var(--bg-card)' : 'var(--bg-app)',
                  border: `1px solid ${includeHeadset ? 'var(--primary-light)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={includeHeadset}
                        onChange={(e) => setIncludeHeadset(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Headset / Fone de Ouvido (Opcional)</span>
                    </label>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: headsetStock.length > 0 ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {headsetStock.length > 0 ? `${headsetStock.length} disponível(is) em estoque` : 'Sem estoque'}
                    </span>
                  </div>

                  {includeHeadset && (
                    <div>
                      {headsetStock.length > 0 ? (
                        <select
                          value={selectedHeadsetId}
                          onChange={(e) => setSelectedHeadsetId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        >
                          {headsetStock.map(a => (
                            <option key={a.id} value={a.id}>
                              #{a.tag} - {a.name} ({a.equipment}) {a.serial_number ? `[S/N: ${a.serial_number}]` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', margin: 0 }}>
                          Nenhum headset disponível em estoque no momento.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ITENS EXTRAS ADICIONADOS MANUALMENTE */}
                {customSelectedAssetIds.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                      Itens Extras no Kit:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {customSelectedAssetIds.map(id => {
                        const asset = assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <span>• <strong>#{asset.tag}</strong> {asset.name} ({asset.equipment})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomAsset(id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ADICIONAR OUTRO ITEM LIVRE DO ESTOQUE */}
                {remainingStockAssets.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <select
                      onChange={handleAddCustomAsset}
                      defaultValue=""
                      style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
                    >
                      <option value="" disabled>+ Adicionar outro equipamento livre do estoque ao kit...</option>
                      {remainingStockAssets.map(a => (
                        <option key={a.id} value={a.id}>
                          #{a.tag} - {a.name} ({a.equipment}) [S/N: {a.serial_number || '-'}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* RESUMO E FOOTER */}
            <footer className="form-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>Criar Colaborador e Entregar Kit ({selectedKitAssets.length})</span>
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
