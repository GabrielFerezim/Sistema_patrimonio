import React, { useState } from 'react';
import { exportSpacesToCSV } from '../utils/csvHelper';

export default function SpacesList({
  spaces = [],
  assets = [],
  onSaveSpace,
  onDeleteSpace,
  onAllocateAsset,
  onTransferAsset,
  onRemoveFromSpace,
  onEditAsset,
  currentUser = null
}) {
  const userRole = currentUser?.role || 'Operador';
  const isReadOnly = userRole === 'Visualizador';
  const isAdmin = userRole === 'Administrador';
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');

  // Modais
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [spaceFormName, setSpaceFormName] = useState('');
  const [spaceFormFloor, setSpaceFormFloor] = useState('2º Andar');
  const [spaceFormType, setSpaceFormType] = useState('Sala de Reunião');
  const [spaceFormDesc, setSpaceFormDesc] = useState('');
  const [spaceFormColor, setSpaceFormColor] = useState('#3b82f6');
  const [spaceFormIcon, setSpaceFormIcon] = useState('meeting');

  // Detalhes da Sala Selecionada
  const [selectedSpaceDetails, setSelectedSpaceDetails] = useState(null);

  // Modal Alocação Rápida
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateAssetTag, setAllocateAssetTag] = useState('');
  const [allocateTargetSpace, setAllocateTargetSpace] = useState('');

  // Modal Transferência Rápida
  const [transferringAsset, setTransferringAsset] = useState(null);
  const [transferTargetSpace, setTransferTargetSpace] = useState('');

  // Modal Confirmação de Exclusão de Espaço
  const [deleteConfirmSpace, setDeleteConfirmSpace] = useState(null);

  // Pavimentos e Tipos Únicos
  const uniqueFloors = Array.from(new Set(spaces.map(s => s.floor).filter(Boolean))).sort();
  const uniqueTypes = Array.from(new Set(spaces.map(s => s.type).filter(Boolean))).sort();

  // Realce de texto
  const highlightText = (text, search) => {
    if (!text) return '-';
    if (!search || !search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  // Helper para obter patrimônios de um espaço
  const getAssetsForSpace = (spaceName) => {
    if (!spaceName) return [];
    return assets.filter(
      a => a.status !== 'Baixado' && a.status !== 'decommissioned' &&
           a.location && a.location.trim().toLowerCase() === spaceName.trim().toLowerCase()
    );
  };

  // Itens disponíveis para alocar (Em estoque ou qualquer item ativo)
  const availableAssetsToAllocate = assets.filter(
    a => a.status !== 'Baixado' && a.status !== 'decommissioned' && a.status !== 'Manutenção'
  );

  // Filtra os espaços
  const filteredSpaces = spaces.filter(space => {
    const spaceAssets = getAssetsForSpace(space.name);
    const hasMatchingAsset = spaceAssets.some(
      a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (a.serial_number && a.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const matchesSearch =
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (space.type && space.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (space.description && space.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      hasMatchingAsset;

    const matchesFloor = floorFilter === 'Todos' || space.floor === floorFilter;
    const matchesType = typeFilter === 'Todos' || space.type === typeFilter;

    return matchesSearch && matchesFloor && matchesType;
  });

  // Métricas
  const totalSpaces = spaces.length;
  const totalAllocatedAssets = spaces.reduce((acc, sp) => acc + getAssetsForSpace(sp.name).length, 0);
  const activeFloorsCount = uniqueFloors.length;
  
  // Espaço com mais itens
  let topSpace = { name: '-', count: 0 };
  spaces.forEach(sp => {
    const count = getAssetsForSpace(sp.name).length;
    if (count > topSpace.count) {
      topSpace = { name: sp.name, count };
    }
  });

  // Manipuladores do Modal de Espaço
  const handleOpenNewSpaceModal = () => {
    setEditingSpace(null);
    setSpaceFormName('');
    setSpaceFormFloor('2º Andar');
    setSpaceFormType('Sala de Reunião');
    setSpaceFormDesc('');
    setSpaceFormColor('#3b82f6');
    setSpaceFormIcon('meeting');
    setIsSpaceModalOpen(true);
  };

  const handleOpenEditSpaceModal = (space, e) => {
    if (e) e.stopPropagation();
    setEditingSpace(space);
    setSpaceFormName(space.name);
    setSpaceFormFloor(space.floor);
    setSpaceFormType(space.type || 'Sala de Reunião');
    setSpaceFormDesc(space.description || '');
    setSpaceFormColor(space.color || '#3b82f6');
    setSpaceFormIcon(space.icon || 'meeting');
    setIsSpaceModalOpen(true);
  };

  const handleSaveSpaceSubmit = (e) => {
    e.preventDefault();
    if (!spaceFormName.trim() || !spaceFormFloor.trim()) {
      alert('Por favor, informe o nome e o andar do espaço.');
      return;
    }

    onSaveSpace({
      id: editingSpace ? editingSpace.id : undefined,
      name: spaceFormName.trim(),
      floor: spaceFormFloor.trim(),
      type: spaceFormType,
      description: spaceFormDesc.trim() || null,
      color: spaceFormColor,
      icon: spaceFormIcon,
      oldName: editingSpace ? editingSpace.name : null,
      isEdit: Boolean(editingSpace)
    });

    setIsSpaceModalOpen(false);
    setEditingSpace(null);
  };

  // Manipuladores de Alocação
  const handleOpenAllocateModal = (spaceName = '') => {
    setAllocateTargetSpace(spaceName || (spaces.length > 0 ? spaces[0].name : ''));
    setAllocateAssetTag(availableAssetsToAllocate.length > 0 ? availableAssetsToAllocate[0].tag : '');
    setIsAllocateModalOpen(true);
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!allocateAssetTag || !allocateTargetSpace) {
      alert('Selecione o equipamento e o espaço de destino.');
      return;
    }
    const targetAsset = assets.find(a => a.tag === allocateAssetTag);
    if (!targetAsset) return;

    onAllocateAsset(targetAsset.id, allocateTargetSpace);
    setIsAllocateModalOpen(false);
    setAllocateAssetTag('');
  };

  // Manipuladores de Transferência
  const handleOpenTransferModal = (asset) => {
    setTransferringAsset(asset);
    const availableTargets = spaces.filter(s => s.name !== asset.location);
    setTransferTargetSpace(availableTargets.length > 0 ? availableTargets[0].name : '');
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferringAsset || !transferTargetSpace) return;
    onTransferAsset(transferringAsset.id, transferTargetSpace);
    setTransferringAsset(null);
  };

  const getSpaceIconSvg = (iconType) => {
    switch (iconType) {
      case 'presentation':
      case 'auditorio':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
      case 'server':
      case 'ti':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        );
      case 'coffee':
      case 'copa':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        );
      case 'building':
      case 'recepcao':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="18"></line>
            <line x1="15" y1="22" x2="15" y2="18"></line>
            <line x1="8" y1="6" x2="8.01" y2="6"></line>
            <line x1="16" y1="6" x2="16.01" y2="6"></line>
            <line x1="8" y1="10" x2="8.01" y2="10"></line>
            <line x1="16" y1="10" x2="16.01" y2="10"></line>
            <line x1="8" y1="14" x2="8.01" y2="14"></line>
            <line x1="16" y1="14" x2="16.01" y2="14"></line>
          </svg>
        );
      case 'meeting':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
    }
  };

  const getEquipmentCategoryIcon = () => '';

  return (
    <div className="spaces-list-container">
      {/* Cabeçalho da Página */}
      <header className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Patrimônio Trynova por Espaço</h1>
          <p className="page-subtitle">
            Gestão e inventário de equipamentos distribuídos por salas de reunião, andares e ambientes corporativos
          </p>
        </div>

        <div className="page-header-actions">
          {spaces.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportSpacesToCSV(spaces, assets)}
              title="Exportar inventário por espaços para CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Relatório</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleOpenAllocateModal('')}
              title="Alocar equipamento em um ambiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              <span>Alocar Patrimônio</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenNewSpaceModal}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Novo Espaço / Sala</span>
            </button>
          )}
        </div>
      </header>

      {/* Grade de KPIs Resumidos */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Espaços / Ambientes</span>
            <span className="kpi-value">{totalSpaces}</span>
          </div>
          <span className="kpi-sub">Salas e setores catalogados</span>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-use">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Patrimônios em Espaços</span>
            <span className="kpi-value">{totalAllocatedAssets}</span>
          </div>
          <span className="kpi-sub">Equipamentos em uso em salas</span>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card in-stock">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Pavimentos / Andares</span>
            <span className="kpi-value">{activeFloorsCount}</span>
          </div>
          <span className="kpi-sub">Níveis físicos da empresa</span>
          <div className="kpi-bg-glow"></div>
        </div>

        <div className="kpi-card total">
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Maior Acervo</span>
            <span className="kpi-value" style={{ fontSize: '1.1rem', wordBreak: 'break-word' }}>
              {topSpace.name !== '-' ? topSpace.name : 'Nenhum'}
            </span>
          </div>
          <span className="kpi-sub">{topSpace.count} itens alocados</span>
          <div className="kpi-bg-glow"></div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="filter-bar">
        <div className="filter-row-top">
          <div className="search-wrapper" style={{ flexGrow: 1 }}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por sala (ex: Sala de Reunião), andar, tipo ou equipamento alocado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Limpar busca">
                &times;
              </button>
            )}
          </div>

          <div className="filter-dropdowns">
            {/* Filtro por Andar */}
            <div className="filter-item">
              <label htmlFor="filter-space-floor">Andar / Pavimento</label>
              <select
                id="filter-space-floor"
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
              >
                <option value="Todos">Todos os Andares</option>
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo */}
            <div className="filter-item">
              <label htmlFor="filter-space-type">Tipo de Ambiente</label>
              <select
                id="filter-space-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="Todos">Todos os Tipos</option>
                {uniqueTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grade de Cards dos Espaços com Design Simples e Slim */}
      {filteredSpaces.length > 0 ? (
        <div className="spaces-slim-grid">
          {filteredSpaces.map(space => {
            const spaceAssets = getAssetsForSpace(space.name);
            const previewAssets = spaceAssets.slice(0, 2);
            const remainingCount = spaceAssets.length - previewAssets.length;

            return (
              <div key={space.id} className="space-card-slim">
                {/* Cabeçalho */}
                <div className="space-slim-header">
                  <h3 className="space-slim-title">
                    {highlightText(space.name, searchTerm)}
                  </h3>
                  <div className="space-slim-pills">
                    <span className="space-slim-pill">{space.floor}</span>
                    <span className="space-slim-pill accent">{space.type || 'Geral'}</span>
                  </div>
                </div>

                {/* Descrição */}
                {space.description && (
                  <p className="space-slim-desc">
                    {highlightText(space.description, searchTerm)}
                  </p>
                )}

                {/* Linha de Estatística */}
                <div className="space-slim-stats-row">
                  <span className="space-slim-stats-label">Equipamentos alocados:</span>
                  <span className="space-slim-stats-val">
                    {spaceAssets.length} {spaceAssets.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Preview de Itens */}
                {spaceAssets.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {previewAssets.map(a => (
                      <span key={a.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        • <strong>#{a.tag}</strong> {a.name}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)' }}>
                        +{remainingCount} outros itens
                      </span>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="space-slim-actions">
                  <button
                    type="button"
                    className="btn-space-slim-primary"
                    onClick={() => setSelectedSpaceDetails(space)}
                  >
                    <span>Ver Itens</span>
                  </button>

                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn-space-slim-icon"
                      onClick={() => handleOpenAllocateModal(space.name)}
                      title="Alocar equipamento"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  )}

                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn-space-slim-icon"
                      onClick={(e) => handleOpenEditSpaceModal(space, e)}
                      title="Editar Espaço"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}

                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn-space-slim-icon danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmSpace(space);
                      }}
                      title="Excluir Espaço"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-list">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <h3>Nenhum espaço encontrado</h3>
          <p>
            {searchTerm || floorFilter !== 'Todos' || typeFilter !== 'Todos'
              ? 'Tente alterar os termos da busca ou os filtros de andar e tipo.'
              : 'Cadastre sua primeira sala ou ambiente da Trynova para organizar os patrimônios por espaço físico!'}
          </p>
          <button className="btn btn-primary" onClick={handleOpenNewSpaceModal} style={{ marginTop: '0.75rem' }}>
            Cadastrar Novo Espaço
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / PAINEL: Detalhes dos Patrimônios do Espaço Selecionado */}
      {/* ========================================================================= */}
      {selectedSpaceDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', width: '92vw' }}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{ 
                    backgroundColor: `${selectedSpaceDetails.color || '#3b82f6'}25`, 
                    color: selectedSpaceDetails.color || '#3b82f6',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {getSpaceIconSvg(selectedSpaceDetails.icon || selectedSpaceDetails.type)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                    {selectedSpaceDetails.name}
                  </h2>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Pavimento: <strong>{selectedSpaceDetails.floor}</strong> • Tipo: <strong>{selectedSpaceDetails.type || 'Geral'}</strong>
                  </p>
                </div>
              </div>

              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedSpaceDetails(null)} 
                aria-label="Fechar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div style={{ padding: '1rem 0' }}>
              {selectedSpaceDetails.description && (
                <div style={{ 
                  backgroundColor: 'var(--bg-app)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-medium)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <strong>Observações da Sala:</strong> {selectedSpaceDetails.description}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>
                  Patrimônios Alocados nesta Sala ({getAssetsForSpace(selectedSpaceDetails.name).length})
                </h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    handleOpenAllocateModal(selectedSpaceDetails.name);
                  }}
                  style={{ fontSize: '0.8rem' }}
                >
                  + Alocar Equipamento Aqui
                </button>
              </div>

              {getAssetsForSpace(selectedSpaceDetails.name).length > 0 ? (
                <div className="table-card" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Nº Patrimônio</th>
                        <th>Equipamento / Nome</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Nº Série</th>
                        <th className="actions-header">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAssetsForSpace(selectedSpaceDetails.name).map(asset => (
                        <tr key={asset.id}>
                          <td className="asset-tag-cell">
                            <span className="tag-badge">#{asset.tag}</span>
                          </td>
                          <td>
                            <div className="asset-name-main">{asset.name}</div>
                            {asset.notes && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {asset.notes}
                              </span>
                            )}
                          </td>
                          <td>{asset.equipment}</td>
                          <td>
                            <span className={`condition-badge ${(asset.condition || 'novo').toLowerCase()}`}>
                              {asset.condition || 'Novo'}
                            </span>
                          </td>
                          <td>
                            {asset.serial_number ? (
                              <span className="asset-sn-badge">S/N: {asset.serial_number}</span>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td className="actions-cell">
                            <div className="table-actions-wrapper">
                              {/* Transferir para outro espaço */}
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleOpenTransferModal(asset)}
                                title="Transferir para outra sala"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Transferir
                              </button>

                              {/* Devolver ao Estoque Central */}
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  if (window.confirm(`Devolver ${asset.name} (#${asset.tag}) para o Estoque Central?`)) {
                                    onRemoveFromSpace(asset.id);
                                  }
                                }}
                                title="Desalocar da sala e devolver ao Estoque Central"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-warning)' }}
                              >
                                Desalocar
                              </button>

                              {onEditAsset && (
                                <button
                                  type="button"
                                  className="btn-action-icon edit"
                                  onClick={() => {
                                    onEditAsset(asset);
                                    setSelectedSpaceDetails(null);
                                  }}
                                  title="Editar Patrimônio"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)' }}>
                  <p>Nenhum equipamento alocado nesta sala no momento.</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenAllocateModal(selectedSpaceDetails.name)}
                  >
                    Alocar Equipamento Agora
                  </button>
                </div>
              )}
            </div>

            <footer className="form-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!isReadOnly && (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const sp = selectedSpaceDetails;
                      setSelectedSpaceDetails(null);
                      setDeleteConfirmSpace(sp);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Excluir Espaço</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      const sp = selectedSpaceDetails;
                      setSelectedSpaceDetails(null);
                      handleOpenEditSpaceModal(sp, e);
                    }}
                  >
                    Editar Dados da Sala
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedSpaceDetails(null)}
                >
                  Fechar
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Criar / Editar Espaço */}
      {/* ========================================================================= */}
      {isSpaceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <header className="modal-header">
              <h2>{editingSpace ? 'Editar Espaço / Sala' : 'Novo Espaço / Sala'}</h2>
              <button className="modal-close-btn" onClick={() => setIsSpaceModalOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSaveSpaceSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="space-name">Nome do Espaço / Sala *</label>
                  <input
                    type="text"
                    id="space-name"
                    value={spaceFormName}
                    onChange={(e) => setSpaceFormName(e.target.value)}
                    placeholder="Ex: Sala de Reunião Segundo Andar, Auditório, Recepção..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="space-floor">Andar / Pavimento *</label>
                  <select
                    id="space-floor"
                    value={spaceFormFloor}
                    onChange={(e) => setSpaceFormFloor(e.target.value)}
                    required
                  >
                    <option value="Térreo">Térreo</option>
                    <option value="1º Andar">1º Andar</option>
                    <option value="2º Andar">2º Andar</option>
                    <option value="3º Andar">3º Andar</option>
                    <option value="4º Andar">4º Andar</option>
                    <option value="Subsolo">Subsolo</option>
                    <option value="Área Externa">Área Externa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="space-type">Tipo de Ambiente *</label>
                  <select
                    id="space-type"
                    value={spaceFormType}
                    onChange={(e) => setSpaceFormType(e.target.value)}
                    required
                  >
                    <option value="Sala de Reunião">Sala de Reunião</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Auditório">Auditório / Convenção</option>
                    <option value="TI & Infra">TI & Infraestrutura</option>
                    <option value="Recepção">Recepção / Hall</option>
                    <option value="Copa & Convivência">Copa & Convivência</option>
                    <option value="Área Operacional">Área Operacional</option>
                    <option value="Treinamento">Sala de Treinamento</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="space-icon">Ícone Representativo</label>
                  <select
                    id="space-icon"
                    value={spaceFormIcon}
                    onChange={(e) => setSpaceFormIcon(e.target.value)}
                  >
                    <option value="meeting">Mesa de Reunião / Pessoas</option>
                    <option value="presentation">Telão / Projetor / Auditório</option>
                    <option value="server">Servidor / TI / Bancada</option>
                    <option value="building">Prédio / Recepção / Hall</option>
                    <option value="coffee">Copa / Convivência / Café</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="space-color">Cor de Destaque</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      id="space-color"
                      value={spaceFormColor}
                      onChange={(e) => setSpaceFormColor(e.target.value)}
                      style={{ height: '38px', width: '48px', padding: 0, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{spaceFormColor}</span>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="space-desc">Descrição / Detalhes do Ambiente</label>
                  <textarea
                    id="space-desc"
                    rows="3"
                    value={spaceFormDesc}
                    onChange={(e) => setSpaceFormDesc(e.target.value)}
                    placeholder="Ex: Capacidade para 12 pessoas, equipada com TV 65', projetor e 4 tomadas de chão..."
                  ></textarea>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingSpace && !isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const sp = editingSpace;
                        setIsSpaceModalOpen(false);
                        setEditingSpace(null);
                        setDeleteConfirmSpace(sp);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Excluir Espaço</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsSpaceModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSpace ? 'Salvar Alterações' : 'Criar Espaço'}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Alocar Equipamento em Espaço */}
      {/* ========================================================================= */}
      {isAllocateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <header className="modal-header">
              <h2>Alocar Patrimônio em Sala / Espaço</h2>
              <button className="modal-close-btn" onClick={() => setIsAllocateModalOpen(false)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleAllocateSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="alloc-asset">Selecione o Equipamento *</label>
                  <select
                    id="alloc-asset"
                    value={allocateAssetTag}
                    onChange={(e) => setAllocateAssetTag(e.target.value)}
                    required
                  >
                    {availableAssetsToAllocate.map(a => (
                      <option key={a.id} value={a.tag}>
                        #{a.tag} - {a.name} ({a.equipment}) [Local Atual: {a.location || 'Estoque'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="alloc-space">Espaço / Sala de Destino *</label>
                  <select
                    id="alloc-space"
                    value={allocateTargetSpace}
                    onChange={(e) => setAllocateTargetSpace(e.target.value)}
                    required
                  >
                    {spaces.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAllocateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Alocação
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Transferir Equipamento para Outro Espaço */}
      {/* ========================================================================= */}
      {transferringAsset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <header className="modal-header">
              <h2>Transferir de Ambiente</h2>
              <button className="modal-close-btn" onClick={() => setTransferringAsset(null)} aria-label="Fechar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleTransferSubmit} className="modal-form">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '1.25rem' }}>
                Transferir o patrimônio <strong>#{transferringAsset.tag}</strong> ({transferringAsset.name}) do local atual <strong>{transferringAsset.location}</strong> para uma nova sala.
              </p>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="transfer-space">Nova Sala / Espaço de Destino *</label>
                  <select
                    id="transfer-space"
                    value={transferTargetSpace}
                    onChange={(e) => setTransferTargetSpace(e.target.value)}
                    required
                  >
                    {spaces.filter(s => s.name !== transferringAsset.location).map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTransferringAsset(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Transferência
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Confirmação de Exclusão de Espaço */}
      {/* ========================================================================= */}
      {deleteConfirmSpace && (
        <div className="modal-overlay danger">
          <div className="modal-content confirm-dialog">
            <div className="confirm-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2>Excluir Espaço?</h2>
            <p>
              Tem certeza de que deseja remover o espaço <strong>{deleteConfirmSpace.name}</strong>? 
              Todos os equipamentos alocados nele serão retornados automaticamente com o status <strong>"Em Estoque"</strong> no <strong>Estoque Central</strong>.
            </p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmSpace(null)}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  onDeleteSpace(deleteConfirmSpace.id);
                  setDeleteConfirmSpace(null);
                  if (selectedSpaceDetails && selectedSpaceDetails.id === deleteConfirmSpace.id) {
                    setSelectedSpaceDetails(null);
                  }
                }}
              >
                Excluir Espaço
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
