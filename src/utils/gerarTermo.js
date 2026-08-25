import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Paleta de Cores Corporativas Trynova
const COLORS = {
  navyDark:   [21,  34,  67],   // #152243
  navyMid:    [30,  58, 138],   // #1e3a8a (Trynova Deep Blue)
  steel:      [59, 130, 246],   // #3b82f6 (Trynova Accent)
  steelLight: [96, 165, 250],   // #60a5fa
  gray900:    [15,  23,  42],
  gray700:    [51,  65,  85],
  gray500:    [100, 116, 139],
  gray200:    [226, 232, 240],
  gray100:    [241, 245, 249],
  white:      [255, 255, 255],
  green:      [16,  185, 129],
  amber:      [245, 158, 11],
  red:        [239, 68,  68]
};

/**
 * Retorna a data atual formatada por extenso em português
 */
function formatarDataExtenso(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Gera e realiza o download do Termo de Responsabilidade em PDF de alta qualidade.
 */
export async function gerarTermoResponsabilidade(employee, assets) {
  if (!employee) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W    = doc.internal.pageSize.getWidth();   // 210mm
  const PAGE_H    = doc.internal.pageSize.getHeight();  // 297mm
  const MARGIN    = 16;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Filtra equipamentos do colaborador
  const empAssets = (assets || []).filter(
    (a) => a.employee && a.employee.trim().toLowerCase() === employee.name.trim().toLowerCase() && a.status === 'Em Uso'
  );

  // 1. CABEÇALHO LIMPO COM LOGOTIPO COMPLETO (SEM TEXTO DUPLICADO)
  try {
    const logoImg = new Image();
    logoImg.src = '/trynova_logo.png';
    await new Promise((res) => {
      logoImg.onload = res;
      logoImg.onerror = res;
      setTimeout(res, 400);
    });
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      doc.addImage(logoImg, 'PNG', MARGIN, 12, 50, 10.7);
    }
  } catch (err) {
    console.warn('Logotipo não encontrado para o PDF do termo:', err);
  }

  // Informações laterais no cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.navyMid);
  doc.text('TERMO DE RESPONSABILIDADE', PAGE_W - MARGIN, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray500);
  doc.text(`Data de Emissão: ${formatarDataExtenso()}`, PAGE_W - MARGIN, 21.5, { align: 'right' });
  doc.text(`Doc Ref: TR-${String(employee.id || '0').padStart(4, '0')}-${Date.now().toString().slice(-4)}`, PAGE_W - MARGIN, 26, { align: 'right' });

  // Linha divisória suave
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 30, PAGE_W - MARGIN, 30);

  // 2. TÍTULO DO DOCUMENTO
  let y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...COLORS.navyMid);
  doc.text('TERMO DE CAUÇÃO E RESPONSABILIDADE DE USO DE EQUIPAMENTOS', PAGE_W / 2, y, { align: 'center' });

  y += 3.5;
  doc.setDrawColor(...COLORS.steel);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // 3. CARTÃO DE DADOS DO COLABORADOR
  y += 6;
  doc.setFillColor(243, 247, 255);
  doc.roundedRect(MARGIN, y, CONTENT_W, 26, 2, 2, 'F');
  doc.setDrawColor(...COLORS.steel);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CONTENT_W, 26, 2, 2, 'S');

  // Faixa lateral no card
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, 3, 26, 1, 1, 'F');

  const col1X = MARGIN + 8;
  const col2X = MARGIN + CONTENT_W / 2 + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.gray500);
  doc.text('COLABORADOR(A):', col1X, y + 6);
  doc.text('CARGO / FUNÇÃO:', col2X, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.navyDark);
  doc.text(employee.name || '—', col1X, y + 11.5);
  doc.setFontSize(9);
  doc.text(employee.role || 'Não especificado', col2X, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.gray500);
  doc.text('SETOR / DEPARTAMENTO:', col1X, y + 17.5);
  doc.text('EQUIPE / RAMAL:', col2X, y + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.gray700);
  doc.text(employee.sector || '—', col1X, y + 22.5);
  doc.text(`${employee.team || 'Geral'}  •  Ramal: ${employee.ramal || '-'}`, col2X, y + 22.5);

  y += 32;

  // 4. CLÁUSULAS E COMPROMISSOS LEGAIS
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('1. DECLARAÇÃO DE RECEBIMENTO E CLÁUSULAS DE COMPROMISSO', MARGIN + 4, y + 4.2);

  y += 7.5;
  doc.setFillColor(...COLORS.gray100);
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 44, 1.5, 1.5, 'FD');

  const textoClausulas = [
    '1.1. O(A) Colaborador(a) declara receber os bens patrimoniais listados neste termo em perfeito estado de funcionamento.',
    '1.2. O uso dos equipamentos é estritamente corporativo e profissional, devendo observar as políticas de segurança da informação.',
    '1.3. O(A) Colaborador(a) compromete-se a zelar pela integridade, guarda e conservação dos bens, comunicando imediatamente à gestão qualquer avaria, furto, roubo ou extravio.',
    '1.4. Em caso de dano decorrente de negligência ou não devolução na rescisão contratual, o colaborador autoriza os procedimentos cabíveis nos termos da legislação vigente.',
    '1.5. A devolução dos bens dar-se-á no mesmo estado de conservação recebido, ressalvado o desgaste natural pelo uso regular.'
  ];

  let clausulaY = y + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.gray700);

  textoClausulas.forEach((item) => {
    const lines = doc.splitTextToSize(item, CONTENT_W - 8);
    doc.text(lines, MARGIN + 4, clausulaY);
    clausulaY += lines.length * 2.8 + 1.2;
  });

  y += 48;

  // 5. TABELA DE EQUIPAMENTOS ENTREGUES
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text(`2. RELAÇÃO DE EQUIPAMENTOS ENTREGUES (${empAssets.length} ${empAssets.length === 1 ? 'ITEM' : 'ITENS'})`, MARGIN + 4, y + 4.2);

  y += 7.5;

  const tableBody = empAssets.map((asset, idx) => [
    String(idx + 1).padStart(2, '0'),
    asset.tag ? `#${asset.tag}` : '—',
    asset.name || '—',
    asset.equipment || '—',
    asset.serial_number || 'Não informado',
    asset.condition || 'Novo',
    asset.sector || employee.sector || '—'
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['-', '-', 'Nenhum equipamento registrado em posse', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'TAG', 'Descrição do Equipamento', 'Tipo', 'Nº de Série', 'Estado', 'Setor']],
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
      lineColor: COLORS.gray200,
      lineWidth: 0.2,
      textColor: COLORS.gray700
    },
    headStyles: {
      fillColor: [235, 242, 255],
      textColor: COLORS.navyMid,
      fontStyle: 'bold',
      fontSize: 7.2,
      lineColor: COLORS.steel,
      lineWidth: 0.4
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20, fontStyle: 'bold', textColor: COLORS.navyMid },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26 }
    }
  });

  y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 30) + 6;

  // 6. ÁREA DE ASSINATURA (SEMPRE CABE EM 1 PÁGINA OU CRIA NOVA)
  if (y > PAGE_H - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('3. TERMO DE CIÊNCIA E ASSINATURA DAS PARTES', MARGIN + 4, y + 4.2);

  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.gray700);
  doc.text('Declaro que li, concordo e aceito expressamente todas as condições e termos do presente documento.', MARGIN, y);

  y += 5;

  // Local e data (Santa Isabel - SP)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray700);
  doc.text(`Santa Isabel - SP, ${formatarDataExtenso(new Date())}.`, PAGE_W / 2, y, { align: 'center' });

  y += 6;

  // 2 Caixas de Assinatura Limpas
  const boxW = (CONTENT_W - 12) / 2;
  const boxH = 24;
  const signBoxes = [
    { x: MARGIN, name: employee.name || 'Colaborador(a)', role: 'Assinatura do Colaborador(a)' },
    { x: MARGIN + boxW + 12, name: 'Gestão', role: 'Representante da Empresa' }
  ];

  signBoxes.forEach(sb => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.3);
    doc.roundedRect(sb.x, y, boxW, boxH, 1.5, 1.5, 'FD');

    // Linha de assinatura
    doc.setDrawColor(...COLORS.navyMid);
    doc.setLineWidth(0.4);
    doc.line(sb.x + 8, y + 14, sb.x + boxW - 8, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.navyDark);
    doc.text(sb.name, sb.x + boxW / 2, y + 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text(sb.role, sb.x + boxW / 2, y + 21.5, { align: 'center' });
  });

  // 7. RODAPÉ FIXO EM TODAS AS PÁGINAS
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.gray500);
    doc.text(
      'Termo de Responsabilidade e Uso de Equipamentos  |  Documento Emitido Digitalmente',
      PAGE_W / 2, PAGE_H - 6,
      { align: 'center' }
    );

    doc.text(`Página ${p} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }

  // 8. DISPARA O DOWNLOAD
  const cleanName = (employee.name || 'colaborador').replace(/\s+/g, '_');
  const fileName = `Termo_Responsabilidade_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
