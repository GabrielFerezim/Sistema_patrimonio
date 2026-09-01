import React, { useState, useEffect } from 'react';

export default function AssetForm({ asset, onSave, onClose, existingTags = [], employees = [], spaces = [] }) {
  const isEdit = !!asset;
  
  const [formData, setFormData] = useState({
    name: '',
    equipment: 'Notebook',
    tag: '',
    employee: '',
    location: 'Estoque Central',
    status: 'Em Estoque',
    condition: 'Novo',
    serial_number: '',
    purchase_date: '',
    value: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Setores padrão da empresa combinados com setores dos colaboradores
  const defaultSectors = [
    'Tecnologia da Informação',
    'Recursos Humanos',
    'Financeiro',
    'Marketing',
    'Vendas',
    'Operações',
    'Diretoria',
    'Administração'
  ];

  const dynamicSectors = Array.from(
    new Set([
      ...defaultSectors,
      ...employees.map(e => e.sector).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        equipment: asset.equipment || 'Notebook',
        tag: asset.tag || '',
        employee: asset.employee || '',
        location: asset.location || 'Estoque Central',
        status: asset.status || 'Em Estoque',
        condition: asset.condition || 'Novo',
        serial_number: asset.serial_number || '',
        purchase_date: asset.purchase_date || '',
        value: asset.value ? String(asset.value) : '',
        notes: asset.notes || '',
      });
    } else {
      // Sugestão automática de próxima tag (ex: PAT-007)
      const numericTags = existingTags
        .map(t => {
          const match = String(t).match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(n => !isNaN(n));
      const maxTagNum = numericTags.length > 0 ? Math.max(...numericTags) : existingTags.length;
      const nextTag = `PAT-${String(maxTagNum + 1).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, tag: nextTag, location: 'Estoque Central', status: 'Em Estoque' }));
    }
  }, [asset, existingTags]);

  const isSpaceLocation = (loc) => {
    if (!loc) return false;
    const cleanLoc = loc.trim().toLowerCase();
    return cleanLoc !== 'estoque' && cleanLoc !== 'estoque central' &&
      spaces.some(s => s.name && s.name.trim().toLowerCase() === cleanLoc);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Se mudar status para fora de "Em Uso", limpa colaborador e se for para "Em Estoque" volta local para Estoque Central
      if (name === 'status') {
        if (value !== 'Em Uso') {
          updated.employee = '';
        }
        if (value === 'Em Estoque' && prev.location !== 'Estoque Central') {
          updated.location = 'Estoque Central';
        }
      }

      // Se selecionar uma sala/espaço Trynova e estiver em estoque, muda status para "Em Uso"
      if (name === 'location') {
        if (isSpaceLocation(value)) {
          if (updated.status === 'Em Estoque') {
            updated.status = 'Em Uso';
          }
          updated.employee = '';
        } else if (value === 'Estoque Central') {
          updated.status = 'Em Estoque';
          updated.employee = '';
        }
      }

      // Se selecionar colaborador, define status como "Em Uso" e atualiza localização para o setor do colaborador
      if (name === 'employee' && value.trim() !== '') {
        if (prev.status !== 'Em Uso') {
          updated.status = 'Em Uso';
        }
        const selectedEmp = employees.find(emp => emp.name === value);
        if (selectedEmp && selectedEmp.sector) {
          updated.location = selectedEmp.sector;
        }
      }
      
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome do patrimônio é obrigatório.';
    if (!formData.equipment.trim()) newErrors.equipment = 'O tipo de equipamento é obrigatório.';
    
    if (!formData.tag.trim()) {
      newErrors.tag = 'A tag/código do patrimônio é obrigatória.';
    } else {
      const cleanTag = formData.tag.trim().toUpperCase();
      const isDuplicate = existingTags.some(t => 
        String(t).toUpperCase() === cleanTag && (!isEdit || String(asset.tag).toUpperCase() !== cleanTag)
      );
      if (isDuplicate) {
        newErrors.tag = 'Este número de patrimônio já está cadastrado.';
      }
    }

    if (!formData.location || !formData.location.trim()) {
      newErrors.location = 'Selecione a localização ou setor.';
    }
    
    // Só exige colaborador se estiver "Em Uso" e NÃO for uma sala/espaço físico
    if (formData.status === 'Em Uso' && !formData.employee.trim() && !isSpaceLocation(formData.location)) {
      newErrors.employee = 'Defina um colaborador responsável ou aloque o equipamento em uma sala/espaço.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const isSpace = isSpaceLocation(formData.location);
      let finalStatus = formData.status;
      // Equipamentos alocados em salas/espaços Trynova saem do estoque automaticamente
      if (isSpace && finalStatus === 'Em Estoque') {
        finalStatus = 'Em Uso';
      }

      onSave({
        ...(isEdit ? asset : {}),
        ...formData,
        status: finalStatus,
        id: isEdit ? asset.id : Date.now(),
        tag: formData.tag.trim().toUpperCase(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        employee: finalStatus === 'Em Uso' ? (formData.employee ? formData.employee.trim() : null) : null,
        serial_number: formData.serial_number ? formData.serial_number.trim() : null,
        value: formData.value ? parseFloat(formData.value) : null,
        notes: formData.notes ? formData.notes.trim() : null,
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <header className="modal-header">
          <div>
            <h2>{isEdit ? 'Editar Patrimônio' : 'Cadastrar Novo Patrimônio'}</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Preencha os dados e especificações técnicas do equipamento
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Tag / Código */}
            <div className="form-group">
              <label htmlFor="tag">Nº Patrimônio (Tag) *</label>
              <input
                type="text"
                id="tag"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                placeholder="Ex: PAT-001"
                className={errors.tag ? 'input-error' : ''}
              />
              {errors.tag && <span className="error-text">{errors.tag}</span>}
            </div>

            {/* Tipo de Equipamento */}
            <div className="form-group">
              <label htmlFor="equipment">Tipo de Equipamento *</label>
              <select
                id="equipment"
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                className={errors.equipment ? 'input-error' : ''}
              >
                <option value="Notebook">Notebook</option>
                <option value="Desktop">Desktop (Computador)</option>
                <option value="Monitor">Monitor</option>
                <option value="Teclado/Mouse">Teclado / Mouse</option>
                <option value="Celular/Smartphone">Celular / Smartphone</option>
                <option value="Cadeira Ergonômica">Cadeira Ergonômica</option>
                <option value="Impressora">Impressora</option>
                <option value="Servidor/Rede">Equipamento de Rede / Servidor</option>
                <option value="Nobreak/Filtro">Nobreak / Estabilizador</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.equipment && <span className="error-text">{errors.equipment}</span>}
            </div>

            {/* Nome / Modelo */}
            <div className="form-group full-width">
              <label htmlFor="name">Nome / Descrição do Equipamento *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Dell Latitude 3420 14'' Core i5 16GB"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* Número de Série */}
            <div className="form-group">
              <label htmlFor="serial_number">Número de Série (S/N)</label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="Ex: BR-DL-3420-XX"
              />
            </div>

            {/* Localização / Setor */}
            <div className="form-group">
              <label htmlFor="location">Localização / Setor *</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={errors.location ? 'input-error' : ''}
              >
                <optgroup label="Armazenamento">
                  <option value="Estoque Central">Estoque Central</option>
                </optgroup>

                {spaces && spaces.length > 0 && (
                  <optgroup label="Salas e Espaços Trynova">
                    {spaces.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.floor})
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="Setores da Empresa">
                  {dynamicSectors.map(sec => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </optgroup>

                {/* Localização personalizada (se houver vinda de dados anteriores) */}
                {formData.location &&
                  formData.location !== 'Estoque Central' &&
                  !spaces.some(s => s.name === formData.location) &&
                  !dynamicSectors.includes(formData.location) && (
                    <optgroup label="Local Atual">
                      <option value={formData.location}>{formData.location}</option>
                    </optgroup>
                  )}
              </select>
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Em Estoque">Em Estoque (Disponível)</option>
                <option value="Em Uso">Em Uso (Com Colaborador)</option>
                <option value="Manutenção">Em Manutenção</option>
                <option value="Baixado">Baixado (Inativo)</option>
              </select>
            </div>

            {/* Estado de Conservação */}
            <div className="form-group">
              <label>Estado de Conservação *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="condition"
                    value="Novo"
                    checked={formData.condition === 'Novo'}
                    onChange={handleChange}
                  />
                  <span>Novo</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="condition"
                    value="Usado"
                    checked={formData.condition === 'Usado'}
                    onChange={handleChange}
                  />
                  <span>Usado</span>
                </label>
              </div>
            </div>

            {/* Colaborador Responsável */}
            <div className="form-group full-width">
              <label htmlFor="employee" className={formData.status !== 'Em Uso' ? 'disabled-label' : ''}>
                Colaborador Responsável {formData.status === 'Em Uso' ? '*' : '(Disponível quando Em Uso)'}
              </label>
              <select
                id="employee"
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                disabled={formData.status !== 'Em Uso'}
                className={errors.employee ? 'input-error' : ''}
              >
                <option value="">{employees.length === 0 ? 'Nenhum colaborador cadastrado' : 'Selecione um colaborador...'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.sector})
                  </option>
                ))}
              </select>
              {errors.employee && <span className="error-text">{errors.employee}</span>}
            </div>

            {/* Observações Técnicas */}
            <div className="form-group full-width">
              <label htmlFor="notes">Observações / Configuração</label>
              <textarea
                id="notes"
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ex: SSD 512GB, 16GB RAM, carregador original..."
              ></textarea>
            </div>
          </div>

          <footer className="form-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Patrimônio'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
