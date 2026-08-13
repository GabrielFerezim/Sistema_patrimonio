import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cores da marca Trynova
const COLORS = {
  navyDark:   [21,  34,  67],   // #152243
  navyMid:    [30,  58, 138],   // #1e3a8a
  steel:      [59, 130, 246],   // #3b82f6
  steelLight: [96, 165, 250],   // #60a5fa
  gray900:    [15,  23,  42],
  gray700:    [51,  65,  85],
  gray500:    [100,116,139],
  gray200:    [226,232,240],
  gray100:    [241,245,249],
  white:      [255,255,255],
  green:      [22, 163,  74],
};

/**
 * Desenha um retângulo com gradiente simulado (faixas verticais)
 */
function drawGradientRect(doc, x, y, w, h, colorStart, colorEnd, steps = 20) {
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(colorStart[0] + (colorEnd[0] - colorStart[0]) * t);
    const g = Math.round(colorStart[1] + (colorEnd[1] - colorStart[1]) * t);
    const b = Math.round(colorStart[2] + (colorEnd[2] - colorStart[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(x + (w / steps) * i, y, w / steps + 0.5, h, 'F');
  }
}

/**
 * Retorna a data atual formatada em português
 */
function formatarData(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Gera e baixa o Termo de Responsabilidade de Equipamentos em PDF.
 */
export async function gerarTermoResponsabilidade(employee, assets) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W   = doc.internal.pageSize.getWidth();   // 210
  const PAGE_H   = doc.internal.pageSize.getHeight();  // 297
  const MARGIN   = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const equipamentos = assets.filter(
    (a) => a.employee === employee.name && a.status !== 'decommissioned'
  );

  // ══════════════════════════════════════════════════════════════
  // CABEÇALHO — Barra gradiente azul
  // ══════════════════════════════════════════════════════════════
  drawGradientRect(doc, 0, 0, PAGE_W, 38, COLORS.navyDark, COLORS.navyMid);

  // Barra fina de destaque na base do header
  doc.setFillColor(...COLORS.steel);
  doc.rect(0, 36, PAGE_W, 2.5, 'F');

  // Tentar carregar logo da empresa
  try {
    const logoImg = new Image();
    logoImg.src = '/trynova_icon.png';
    await new Promise((res) => {
      logoImg.onload = res;
      logoImg.onerror = res;
      setTimeout(res, 800);
    });
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      doc.addImage(logoImg, 'PNG', MARGIN, 5, 22, 22);
    }
  } catch (_) { /* sem logo */ }

  // Nome da empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('TRYNOVA', MARGIN + 26, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.steelLight);
  doc.text('Sistema de Controle de Patrimônio', MARGIN + 26, 20);

  // Título do documento (lado direito do header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.steelLight);
  doc.text('TERMO DE RESPONSABILIDADE', PAGE_W - MARGIN, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 180, 220);
  doc.text(`Emitido em: ${formatarData()}`, PAGE_W - MARGIN, 19, { align: 'right' });
  doc.text(`Protocolo: TRY-${employee.id || '00'}-${Date.now().toString().slice(-6)}`, PAGE_W - MARGIN, 24, { align: 'right' });

  // ══════════════════════════════════════════════════════════════
  // TÍTULO PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.navyMid);
  doc.text('TERMO DE RESPONSABILIDADE DE EQUIPAMENTOS', PAGE_W / 2, y, { align: 'center' });

  // Linha decorativa dupla
  y += 4;
  doc.setDrawColor(...COLORS.steel);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 1.8, PAGE_W - MARGIN, y + 1.8);

  // ══════════════════════════════════════════════════════════════
  // DADOS DO FUNCIONÁRIO — Card com fundo azul escuro suave
  // ══════════════════════════════════════════════════════════════
  y += 10;

  // Background do card
  doc.setFillColor(237, 242, 255);
  doc.roundedRect(MARGIN, y, CONTENT_W, 36, 3, 3, 'F');
  doc.setDrawColor(...COLORS.steel);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, CONTENT_W, 36, 3, 3, 'S');

  // Barra lateral esquerda colorida
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, 3, 36, 1.5, 1.5, 'F');

  // Ícone de pessoa (SVG simulado com círculo + retângulo)
  doc.setFillColor(...COLORS.navyMid);
  doc.circle(MARGIN + 12, y + 9, 4.5, 'F');
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN + 7, y + 15, 10, 7, 2, 2, 'F');

  // Dados em 2 colunas
  const col1x = MARGIN + 26;
  const col2x = MARGIN + CONTENT_W / 2 + 5;

  // Rótulos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray500);
  doc.text('COLABORADOR', col1x, y + 8);
  doc.text('CARGO / FUNÇÃO', col2x, y + 8);

  // Valores
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray900);
  doc.text(employee.name || '—', col1x, y + 15);
  doc.setFontSize(10);
  doc.text(employee.role || '—', col2x, y + 15);

  // Segunda linha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray500);
  doc.text('SETOR / DEPARTAMENTO', col1x, y + 23);
  doc.text('RAMAL / EQUIPE', col2x, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray700);
  doc.text(employee.sector || '—', col1x, y + 29);
  doc.text(`${employee.ramal ? 'R: ' + employee.ramal : '—'}  ${employee.team && employee.team !== 'Nenhuma' ? '  |  ' + employee.team : ''}`, col2x, y + 29);

  y += 44;

  // ══════════════════════════════════════════════════════════════
  // TEXTO LEGAL — Box com borda cinza
  // ══════════════════════════════════════════════════════════════
  // Título da seção
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.white);
  doc.text('▸  DECLARAÇÃO E COMPROMISSO', MARGIN + 4, y + 4.8);

  y += 10;

  // Box do texto legal
  doc.setFillColor(...COLORS.gray100);
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 52, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...COLORS.gray700);

  const textoLegal =
    `Pelo presente instrumento, o(a) colaborador(a) acima identificado(a) declara ter recebido, em ` +
    `perfeito estado de conservação, os equipamentos e bens patrimoniais abaixo relacionados, de ` +
    `propriedade exclusiva da empresa TRYNOVA.\n\n` +
    `Ao assinar este termo, o(a) signatário(a) assume integralmente os seguintes compromissos:\n\n` +
    `  I.   Utilizar os equipamentos exclusivamente para fins profissionais e institucionais;\n` +
    `  II.  Zelar pela guarda, conservação e correta utilização dos bens recebidos;\n` +
    `  III. Comunicar imediatamente ao departamento de TI/Patrimônio qualquer ocorrência de dano,\n` +
    `       perda, furto, roubo ou extravio dos itens;\n` +
    `  IV.  Devolver todos os itens elencados neste termo em condição equivalente à recebida, quando\n` +
    `       solicitado ou ao término do vínculo empregatício com a empresa.\n\n` +
    `Em caso de perda por negligência, dano por uso indevido ou não devolução, o(a) colaborador(a) ` +
    `responsabiliza-se pelo ressarcimento integral do valor de mercado dos equipamentos danificados ou extraviados.`;

  const linhasLegal = doc.splitTextToSize(textoLegal, CONTENT_W - 8);
  doc.text(linhasLegal, MARGIN + 4, y + 6);

  y += 58;

  // ══════════════════════════════════════════════════════════════
  // TABELA DE EQUIPAMENTOS
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.white);
  doc.text(
    `▸  RELAÇÃO DE EQUIPAMENTOS  (${equipamentos.length} ${equipamentos.length === 1 ? 'item' : 'itens'})`,
    MARGIN + 4, y + 4.8
  );

  y += 9;

  const tableBody = equipamentos.length > 0
    ? equipamentos.map((a, i) => [
        String(i + 1).padStart(2, '0'),
        a.tag || '—',
        a.name || '—',
        a.equipment || '—',
        a.condition || '—',
        a.location || '—',
      ])
    : [['—', '—', 'Nenhum equipamento vinculado a este colaborador', '—', '—', '—']];

  autoTable(doc, {
    startY: y,
    head: [['#', 'TAG', 'Descrição do Equipamento', 'Tipo', 'Condição', 'Localização']],
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineColor: COLORS.gray200,
      lineWidth: 0.2,
      textColor: COLORS.gray700,
    },
    headStyles: {
      fillColor: [237, 242, 255],
      textColor: COLORS.navyMid,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: COLORS.steel,
      lineWidth: 0.4,
    },
    alternateRowStyles: {
      fillColor: COLORS.gray100,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, fontStyle: 'bold', textColor: COLORS.navyMid },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 32 },
    },
    didDrawCell: (data) => {
      // Colorir condição
      if (data.section === 'body' && data.column.index === 4 && data.cell.raw) {
        const cond = String(data.cell.raw).toLowerCase();
        let color = COLORS.gray500;
        if (cond === 'novo' || cond === 'ótimo') color = COLORS.green;
        else if (cond === 'usado') color = [234, 179, 8];
        else if (cond === 'danificado') color = [220, 38, 38];
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(
          data.cell.raw,
          data.cell.x + data.cell.width / 2,
          data.cell.y + data.cell.height / 2 + 1,
          { align: 'center' }
        );
      }
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ══════════════════════════════════════════════════════════════
  // ÁREA DE ASSINATURAS
  // ══════════════════════════════════════════════════════════════
  // Verificar nova página
  if (y > PAGE_H - 80) {
    doc.addPage();
    y = 20;
  }

  // Título da seção
  doc.setFillColor(...COLORS.navyMid);
  doc.roundedRect(MARGIN, y, CONTENT_W, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.white);
  doc.text('▸  DECLARAÇÃO DE CIÊNCIA E ASSINATURA', MARGIN + 4, y + 4.8);

  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.gray700);
  const textoDeclaro = `Declaro que li e compreendi todas as cláusulas deste Termo de Responsabilidade, concordando integralmente com as condições estabelecidas.`;
  const linhasDeclaro = doc.splitTextToSize(textoDeclaro, CONTENT_W);
  doc.text(linhasDeclaro, MARGIN, y);

  y += 12;

  // Três campos de assinatura
  const sigW  = (CONTENT_W - 10) / 3;
  const sigH  = 28;
  const sigPositions = [
    { x: MARGIN,               label: employee.name || 'Colaborador', sublabel: 'Assinatura do Colaborador' },
    { x: MARGIN + sigW + 5,    label: 'Responsável de TI',            sublabel: 'Assinatura e Carimbo' },
    { x: MARGIN + (sigW + 5)*2,label: 'Gestor / RH',                  sublabel: 'Visto do Gestor' },
  ];

  sigPositions.forEach(({ x, label, sublabel }) => {
    // Box de assinatura
    doc.setFillColor(...COLORS.gray100);
    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, sigW, sigH, 2, 2, 'FD');

    // Linha de assinatura
    doc.setDrawColor(...COLORS.navyMid);
    doc.setLineWidth(0.6);
    doc.line(x + 4, y + 18, x + sigW - 4, y + 18);

    // Rótulos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.navyMid);
    const labelLines = doc.splitTextToSize(label, sigW - 6);
    doc.text(labelLines, x + sigW / 2, y + 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text(sublabel, x + sigW / 2, y + 26.5, { align: 'center' });
  });

  y += sigH + 8;

  // Campo de data
  const dateBoxW = 60;
  doc.setFillColor(...COLORS.gray100);
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, dateBoxW, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray500);
  doc.text('LOCAL E DATA', MARGIN + dateBoxW / 2, y + 5, { align: 'center' });
  doc.setDrawColor(...COLORS.navyMid);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 4, y + 11, MARGIN + dateBoxW - 4, y + 11);
  doc.setFontSize(7);
  doc.text(`_____________________, ${formatarData()}`, MARGIN + dateBoxW / 2, y + 13, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // RODAPÉ — em todas as páginas
  // ══════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);

    // Linha acima do rodapé
    doc.setDrawColor(...COLORS.steel);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);

    // Faixa de cor no extremo inferior
    doc.setFillColor(...COLORS.navyDark);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.steelLight);
    doc.text(
      'TRYNOVA — Sistema de Controle de Patrimônio  |  Documento gerado automaticamente — não requer assinatura eletrônica',
      PAGE_W / 2, PAGE_H - 5,
      { align: 'center' }
    );
    doc.setTextColor(150, 180, 220);
    doc.text(`Página ${pg} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
  }

  // ══════════════════════════════════════════════════════════════
  // DOWNLOAD
  // ══════════════════════════════════════════════════════════════
  const nomeArquivo = `Termo_Responsabilidade_${employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}
