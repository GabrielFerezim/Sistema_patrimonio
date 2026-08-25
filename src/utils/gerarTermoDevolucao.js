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

function formatarDataExtenso(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Gera e realiza o download do Termo de Devolução e Quitação Patrimonial em PDF.
 */
export async function gerarTermoDevolucao(employee, returnedAssets = [], offboardingNotes = '') {
  if (!employee) {
    console.warn('gerarTermoDevolucao: colaborador não informado.');
    return;
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PAGE_W    = doc.internal.pageSize.getWidth();   // 210mm
    const PAGE_H    = doc.internal.pageSize.getHeight();  // 297mm
    const MARGIN    = 16;
    const CONTENT_W = PAGE_W - MARGIN * 2;

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
    } catch (_) {}

    // Informações laterais no cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('TERMO DE DEVOLUÇÃO & QUITAÇÃO', PAGE_W - MARGIN, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, PAGE_W - MARGIN, 21.5, { align: 'right' });
    doc.text(`Ref: DEV-${employee.id || '00'}-${Date.now().toString().slice(-4)}`, PAGE_W - MARGIN, 26, { align: 'right' });

    // Linha divisória suave
    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, 30, PAGE_W - MARGIN, 30);

    let cursorY = 36;

    // 2. IDENTIFICAÇÃO DO COLABORADOR
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 25, 2, 2, 'F');
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 25, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('DADOS DO COLABORADOR', MARGIN + 5, cursorY + 5.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Nome:', MARGIN + 5, cursorY + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(employee.name || '-', MARGIN + 20, cursorY + 12.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Cargo:', MARGIN + 95, cursorY + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(employee.role || 'Colaborador', MARGIN + 110, cursorY + 12.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Setor:', MARGIN + 5, cursorY + 19.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(employee.sector || '-', MARGIN + 20, cursorY + 19.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Equipe/Cliente:', MARGIN + 95, cursorY + 19.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(employee.team || 'Geral', MARGIN + 125, cursorY + 19.5);

    cursorY += 31;

    // 3. TABELA DE EQUIPAMENTOS DEVOLVIDOS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text(`RELAÇÃO DE EQUIPAMENTOS DEVOLVIDOS (${returnedAssets.length} ITENS)`, MARGIN, cursorY);

    cursorY += 3;

    const tableRows = (returnedAssets || []).map((asset, index) => [
      String(index + 1).padStart(2, '0'),
      asset.tag || '-',
      asset.name || '-',
      asset.equipment || '-',
      asset.serial_number || 'Não informado',
      asset.condition || 'Devolvido',
      'Conferido / Recebido'
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['#', 'Tag/Patrimônio', 'Descrição do Equipamento', 'Categoria', 'Nº de Série', 'Estado', 'Status Devolução']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Nenhum equipamento físico pendente registrado', '-', '-', '-', 'Concluído']],
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.navyMid,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
        cellPadding: 2.2
      },
      bodyStyles: {
        textColor: COLORS.gray900,
        fontSize: 7.5,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 26 },
        4: { cellWidth: 28, fontStyle: 'normal' },
        5: { cellWidth: 18 },
        6: { cellWidth: 28, textColor: COLORS.green, fontStyle: 'bold' }
      },
      margin: { left: MARGIN, right: MARGIN }
    });

    cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY + 20) + 6;

    // Observações se houver
    if (offboardingNotes) {
      doc.setFillColor(...COLORS.gray100);
      doc.roundedRect(MARGIN, cursorY, CONTENT_W, 12, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.gray700);
      doc.text('Observações de Devolução:', MARGIN + 4, cursorY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray900);
      doc.text(String(offboardingNotes).slice(0, 120), MARGIN + 44, cursorY + 5);
      cursorY += 16;
    }

    // 4. DECLARAÇÃO DE QUITAÇÃO PATRIMONIAL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('DECLARAÇÃO DE DEVOLUÇÃO E QUITAÇÃO PATRIMONIAL', MARGIN, cursorY);
    cursorY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.gray700);

    const declarationText = 
      `1. Pelo presente instrumento, atesta-se que o(a) colaborador(a) acima qualificado(a) realizou a devolução formal de todos os equipamentos, ferramentas de trabalho e periféricos corporativos anteriormente sob sua custódia e responsabilidade.\n` +
      `2. Os bens foram devidamente conferidos e testados pela equipe técnica responsável, encontrando-se nas condições registradas neste termo.\n` +
      `3. Com a assinatura deste documento, dá-se plena, geral e irrevogável quitação quanto à posse e guarda de patrimônios da empresa, inexistindo quaisquer pendências de devolução de ativos físicos vinculados ao seu cadastro.`;

    const splitDeclaration = doc.splitTextToSize(declarationText, CONTENT_W);
    doc.text(splitDeclaration, MARGIN, cursorY);
    cursorY += splitDeclaration.length * 3.4 + 10;

    // Local e data (Santa Isabel - SP)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray700);
    doc.text(`Santa Isabel - SP, ${formatarDataExtenso(new Date())}.`, PAGE_W / 2, cursorY, { align: 'center' });
    cursorY += 14;

    // 5. CAMPOS DE ASSINATURA (GESTÃO)
    const signW = 75;
    const col1X = MARGIN + 8;
    const col2X = PAGE_W - MARGIN - signW - 8;

    // Linhas de assinatura
    doc.setDrawColor(...COLORS.gray500);
    doc.setLineWidth(0.4);
    doc.line(col1X, cursorY, col1X + signW, cursorY);
    doc.line(col2X, cursorY, col2X + signW, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray900);
    doc.text(employee.name || 'Colaborador(a)', col1X + signW / 2, cursorY + 4.5, { align: 'center' });
    doc.text('Gestão', col2X + signW / 2, cursorY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray500);
    doc.text('Assinatura do(a) Colaborador(a)', col1X + signW / 2, cursorY + 8.5, { align: 'center' });
    doc.text('Representante / Responsável', col2X + signW / 2, cursorY + 8.5, { align: 'center' });

    // Rodapé limpo
    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);

    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text(`Termo de Devolução e Quitação de Bens Patrimoniais • Documento Emitido Digitalmente`, PAGE_W / 2, PAGE_H - 6, { align: 'center' });

    // Nome do arquivo de saída
    const cleanName = (employee.name || 'colaborador').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`termo_devolucao_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar termo de devolução em PDF:', error);
    alert('Não foi possível gerar o PDF de devolução: ' + (error.message || 'Erro desconhecido'));
  }
}
