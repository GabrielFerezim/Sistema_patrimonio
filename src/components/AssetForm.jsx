import React, { useState, useEffect } from 'react';

const AssetForm = ({ asset, onSave, onClose, existingTags }) => {
  const isEdit = !!asset;
  
  const [formData, setFormData] = useState({
    name: '',
    equipment: '',
    tag: '',
    employee: '',
    location: '',
    status: 'Em Estoque',
    condition: 'Novo',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        equipment: asset.equipment || '',
        tag: asset.tag || '',
        employee: asset.employee || '',
        location: asset.location || '',
        status: asset.status || 'Em Estoque',
        condition: asset.condition || 'Novo',
        notes: asset.notes || '',
      });
    } else {
      // Sugere uma nova tag (ex: PAT-XXX)
      const nextId = existingTags.length + 1;
      const suggestedTag = `PAT-${String(nextId).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, tag: suggestedTag }));
    }
  }, [asset, existingTags]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // UX Profissional: Se o status não for 'Em Uso', o funcionário deve estar vazio
      if (name === 'status' && value !== 'Em Uso') {
        updated.employee = '';
      }
      // Se o funcionário for digitado, define automaticamente o status para 'Em Uso'
      if (name === 'employee' && value.trim() !== '' && prev.status !== 'Em Uso') {
        updated.status = 'Em Uso';
      }
      
      return updated;
    });

    // Limpa o erro para aquele campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome do patrimônio é obrigatório.';
    if (!formData.equipment.trim()) newErrors.equipment = 'O tipo de equipamento é obrigatório.';
    
    if (!formData.tag.trim()) {
      newErrors.tag = 'O número do patrimônio é obrigatório.';
    } else if (!isEdit && existingTags.includes(formData.tag.trim())) {
      newErrors.tag = 'Este número de patrimônio já está cadastrado.';
    } else if (isEdit && asset.tag !== formData.tag.trim() && existingTags.includes(formData.tag.trim())) {
      newErrors.tag = 'Este número de patrimônio já está cadastrado.';
    }

    if (!formData.location.trim()) newErrors.location = 'A localização é obrigatória.';
    
    if (formData.status === 'Em Uso' && !formData.employee.trim()) {
      newErrors.employee = 'Defina um funcionário para equipamentos em uso.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...(isEdit ? asset : {}), // Preserva campos não editados no formulário, como last_verified
        ...formData,
        id: isEdit ? asset.id : Date.now(),
        // Normaliza os campos
        tag: formData.tag.trim().toUpperCase(),
        name: formData.name.trim(),
        employee: formData.status === 'Em Uso' ? formData.employee.trim() : '',
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>{isEdit ? 'Editar Patrimônio' : 'Cadastrar Novo Patrimônio'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Tag do Patrimônio */}
            <div className="form-group">
              <label htmlFor="tag">Nº Patrimônio (Tag/Código) *</label>
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

            {/* Nome do Patrimônio */}
            <div className="form-group">
              <label htmlFor="name">Nome do Patrimônio *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Notebook Dell Latitude 3420"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* Tipo de Equipamento */}
            <div className="form-group">
              <label htmlFor="equipment">Equipamento *</label>
              <select
                id="equipment"
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                className={errors.equipment ? 'input-error' : ''}
              >
                <option value="">Selecione...</option>
                <option value="Notebook">Notebook</option>
                <option value="Desktop">Desktop (Computador)</option>
                <option value="Monitor">Monitor</option>
                <option value="Teclado/Mouse">Teclado / Mouse</option>
                <option value="Celular/Smartphone">Celular / Smartphone</option>
                <option value="Cadeira Ergonômica">Cadeira Ergonômica</option>
                <option value="Impressora">Impressora</option>
                <option value="Servidor/Rede">Equipamento de Rede / Servidor</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.equipment && <span className="error-text">{errors.equipment}</span>}
            </div>

            {/* Localização */}
            <div className="form-group">
              <label htmlFor="location">Localização (Departamento/Sala) *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: TI, Marketing, Estoque Central"
                className={errors.location ? 'input-error' : ''}
              />
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
                <option value="Em Uso">Em Uso</option>
                <option value="Em Estoque">Em Estoque</option>
                <option value="Manutenção">Em Manutenção</option>
              </select>
            </div>

            {/* Estado de Conservação */}
            <div className="form-group">
              <label htmlFor="condition">Estado de Conservação *</label>
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

            {/* Nome do Funcionário (Estilização condicional) */}
            <div className="form-group full-width">
              <label htmlFor="employee" className={formData.status !== 'Em Uso' ? 'disabled-label' : ''}>
                Funcionário Responsável {formData.status === 'Em Uso' ? '*' : '(Disponível apenas em Uso)'}
              </label>
              <input
                type="text"
                id="employee"
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                placeholder={formData.status === 'Em Uso' ? "Nome do funcionário" : "Só aplicável quando estiver 'Em Uso'"}
                disabled={formData.status !== 'Em Uso'}
                className={errors.employee ? 'input-error' : ''}
              />
              {errors.employee && <span className="error-text">{errors.employee}</span>}
            </div>

            {/* Observações */}
            <div className="form-group full-width">
              <label htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ex: Detalhes de configuração, número de série, reparos feitos..."
              ></textarea>
            </div>
          </div>

          <footer className="form-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
