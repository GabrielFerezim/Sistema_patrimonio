/**
 * Utilitários para Exportação e Importação de Planilhas CSV no Sistema Trynova
 */

/**
 * Converte um array de dados de patrimônios em arquivo CSV e dispara o download
 */
export function exportAssetsToCSV(assets, fileName = 'inventario_patrimonio') {
  if (!assets || assets.length === 0) {
    alert('Não há patrimônios para exportar.');
    return;
  }

  const headers = [
    'Tag/Código',
    'Nome do Patrimônio',
    'Tipo de Equipamento',
    'Responsável',
    'Localização/Setor',
    'Status',
    'Estado de Conservação',
    'Nº de Série',
    'Data de Compra',
    'Valor (R$)',
    'Observações'
  ];

  const rows = assets.map(a => [
    a.tag || '',
    a.name || '',
    a.equipment || '',
    a.employee || 'Disponível',
    a.location || '',
    a.status || '',
    a.condition || '',
    a.serial_number || '',
    a.purchase_date || '',
    a.value ? String(a.value) : '',
    (a.notes || '').replace(/[\r\n]+/g, ' ')
  ]);

  downloadCSV(headers, rows, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Converte a lista de itens baixados em arquivo CSV
 */
export function exportDecommissionedToCSV(assets, fileName = 'relatorio_itens_baixados') {
  if (!assets || assets.length === 0) {
    alert('Não há itens baixados para exportar.');
    return;
  }

  const headers = [
    'Tag/Código',
    'Nome do Patrimônio',
    'Tipo de Equipamento',
    'Nº de Série',
    'Status',
    'Motivo da Baixa',
    'Observações'
  ];

  const rows = assets.map(a => [
    a.tag || '',
    a.name || '',
    a.equipment || '',
    a.serial_number || '',
    a.status || 'Baixado',
    a.decommission_reason || 'Baixa operacional',
    (a.notes || '').replace(/[\r\n]+/g, ' ')
  ]);

  downloadCSV(headers, rows, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Converte a lista de espaços e patrimônios alocados em CSV
 */
export function exportSpacesToCSV(spaces, assets, fileName = 'relatorio_patrimonio_espacos') {
  if (!spaces || spaces.length === 0) {
    alert('Não há espaços para exportar.');
    return;
  }

  const headers = [
    'Nome do Espaço/Sala',
    'Andar/Pavimento',
    'Tipo de Ambiente',
    'Qtd. Equipamentos Alocados',
    'Relação de Patrimônios (Tag - Equipamento)',
    'Descrição do Espaço'
  ];

  const rows = spaces.map(sp => {
    const spaceAssets = assets.filter(
      a => a.status !== 'Baixado' && a.status !== 'decommissioned' &&
           a.location && a.location.trim().toLowerCase() === sp.name.trim().toLowerCase()
    );
    const assetTags = spaceAssets.map(a => `${a.tag} (${a.name})`).join('; ');

    return [
      sp.name || '',
      sp.floor || '',
      sp.type || 'Geral',
      String(spaceAssets.length),
      assetTags || 'Nenhum equipamento',
      (sp.description || '').replace(/[\r\n]+/g, ' ')
    ];
  });

  downloadCSV(headers, rows, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Converte a lista de colaboradores e patrimônios em CSV
 */
export function exportEmployeesToCSV(employees, assets, fileName = 'relatorio_colaboradores') {
  if (!employees || employees.length === 0) {
    alert('Não há colaboradores para exportar.');
    return;
  }

  const headers = [
    'Nome do Colaborador',
    'Cargo',
    'Setor/Departamento',
    'Equipe/Cliente',
    'Ramal',
    'Qtd. Patrimônios em Posse',
    'Relação de Equipamentos (Tags)'
  ];

  const rows = employees.map(emp => {
    const empAssets = assets.filter(
      a => a.status === 'Em Uso' && a.employee && a.employee.trim().toLowerCase() === emp.name.trim().toLowerCase()
    );
    const assetTags = empAssets.map(a => `${a.tag} (${a.name})`).join('; ');

    return [
      emp.name || '',
      emp.role || '-',
      emp.sector || '',
      emp.team || 'Nenhuma',
      emp.ramal || '-',
      String(empAssets.length),
      assetTags || 'Nenhum'
    ];
  });

  downloadCSV(headers, rows, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Dispara o download de um conteúdo CSV com suporte a UTF-8 (BOM para acentuação no Excel)
 */
function downloadCSV(headers, rows, fileName) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCell).join(';'),
    ...rows.map(row => row.map(escapeCell).join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Faz o parse de arquivo CSV importado para objetos de patrimônio
 */
export function parseAssetsCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('O arquivo CSV deve conter um cabeçalho e pelo menos uma linha de dados.');
  }

  // Identifica delimitador (; ou ,)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  
  const parseRow = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
  const parsedAssets = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length < 2) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const tag = rowObj['tag/código'] || rowObj['tag'] || rowObj['código'] || rowObj['patrimonio'] || `PAT-${Date.now().toString().slice(-4)}`;
    const name = rowObj['nome do patrimônio'] || rowObj['nome'] || rowObj['descricao'] || 'Equipamento Importado';
    const equipment = rowObj['tipo de equipamento'] || rowObj['tipo'] || rowObj['equipamento'] || 'Outros';
    const location = rowObj['localização/setor'] || rowObj['localização'] || rowObj['setor'] || 'Estoque Central';
    const status = rowObj['status'] || 'Em Estoque';
    const condition = rowObj['estado de conservação'] || rowObj['condição'] || rowObj['estado'] || 'Novo';
    const employee = rowObj['responsável'] || rowObj['funcionario'] || '';
    const notes = rowObj['observações'] || rowObj['obs'] || '';

    parsedAssets.push({
      tag: tag.toUpperCase().trim(),
      name: name.trim(),
      equipment: equipment.trim(),
      location: location.trim(),
      status: status.trim() || 'Em Estoque',
      condition: condition.trim() || 'Novo',
      employee: employee.trim() || null,
      notes: notes.trim() || null
    });
  }

  return parsedAssets;
}

/**
 * Converte a lista de licenças de software em CSV
 */
export function exportLicensesToCSV(licenses, fileName = 'relatorio_licencas_software') {
  if (!licenses || licenses.length === 0) {
    alert('Não há licenças para exportar.');
    return;
  }

  const headers = [
    'Software/Licença',
    'Categoria',
    'Tipo de Licença',
    'Total de Assentos',
    'Assentos em Uso',
    'Assentos Livres',
    'Chave de Ativação',
    'Data de Expiração/Renovação',
    'Custo (R$)',
    'Fornecedor',
    'Observações'
  ];

  const rows = licenses.map(l => {
    const assignedArray = Array.isArray(l.assigned_to) ? l.assigned_to : (typeof l.assigned_to === 'string' ? JSON.parse(l.assigned_to || '[]') : []);
    const inUse = assignedArray.length;
    const total = l.total_seats || 1;
    const free = Math.max(0, total - inUse);

    return [
      l.name || '',
      l.category || '',
      l.license_type || '',
      String(total),
      String(inUse),
      String(free),
      l.license_key || '',
      l.expiration_date || 'Perpétua',
      l.cost ? String(l.cost) : '0.00',
      l.supplier || '',
      (l.notes || '').replace(/[\r\n]+/g, ' ')
    ];
  });

  downloadCSV(headers, rows, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
}

