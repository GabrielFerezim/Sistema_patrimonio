import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Paleta de Cores Corporativas Trynova
const COLORS = {
  navyDark: [21, 34, 67],    // #152243
  navyMid: [30, 58, 138],    // #1e3a8a (Trynova Deep Blue)
  steel: [59, 130, 246],     // #3b82f6 (Trynova Accent)
  steelLight: [96, 165, 250],
  gray900: [15, 23, 42],
  gray700: [51, 65, 85],
  gray500: [100, 116, 139],
  gray200: [226, 232, 240],
  gray100: [241, 245, 249],
  white: [255, 255, 255],
  green: [16, 185, 129],
  amber: [245, 158, 11],
  red: [239, 68, 68]
};

/**
 * Gera e baixa a Ficha Técnica / Ordem de Serviço de Manutenção em PDF.
 * Permite ao técnico assinalar tópicos de defeito e preencher laudo técnico.
 */
export async function gerarFichaManutencao(ticket, asset = null) {
  if (!ticket && !asset) {
    console.warn('gerarFichaManutencao: Chamado ou Patrimônio não informado.');
    return;
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PAGE_W = doc.internal.pageSize.getWidth();   // 210mm
    const PAGE_H = doc.internal.pageSize.getHeight();  // 297mm
    const MARGIN = 14;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const assetTag = ticket?.asset_tag || asset?.tag || 'S/N';
    const assetName = ticket?.asset_name || asset?.name || 'Equipamento';
    const assetCategory = asset?.equipment || '-';
    const assetSerial = asset?.serial_number || 'Não informado';
    const employeeName = ticket?.employee_name || asset?.employee || 'Estoque / Setor';
    const provider = ticket?.provider || 'Assistência Técnica Especializada';
    const issueDesc = ticket?.issue_description || 'Manutenção Corretiva / Preventiva';
    const ticketId = ticket?.id || 'AVULSO';

    // 1. CABEÇALHO COM LOGO OFICIAL
    try {
      const logoImg = new Image();
      logoImg.src = '/trynova_doc_logo.png?v=' + Date.now();
      await new Promise((res) => {
        logoImg.onload = res;
        logoImg.onerror = res;
        setTimeout(res, 400);
      });
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        doc.addImage(logoImg, 'PNG', MARGIN, 10, 15, 15);
      }
    } catch (_) { }

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('ORDEM DE SERVIÇO & FICHA TÉCNICA', PAGE_W - MARGIN, 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, PAGE_W - MARGIN, 19.5, { align: 'right' });
    doc.text(`OS Nº: OS-${ticketId}-${assetTag} | Status: ${ticket?.status || 'Em Manutenção'}`, PAGE_W - MARGIN, 23.5, { align: 'right' });

    // Linha divisória
    doc.setDrawColor(...COLORS.gray200);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, 27, PAGE_W - MARGIN, 27);

    let cursorY = 31;

    // 2. DADOS DO EQUIPAMENTO & ORIGEM
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 23, 2, 2, 'F');
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 23, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('1. DADOS DO EQUIPAMENTO & ATENDIMENTO', MARGIN + 4, cursorY + 5);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray700);
    doc.text('Patrimônio:', MARGIN + 4, cursorY + 10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray900);
    doc.text(`#${assetTag}`, MARGIN + 23, cursorY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Equipamento:', MARGIN + 55, cursorY + 10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray900);
    doc.text(assetName.length > 35 ? assetName.substring(0, 35) + '...' : assetName, MARGIN + 76, cursorY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Nº Série:', MARGIN + 4, cursorY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(assetSerial, MARGIN + 23, cursorY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray700);
    doc.text('Origem / Resp:', MARGIN + 55, cursorY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text(employeeName, MARGIN + 76, cursorY + 16);

    cursorY += 27;

    // 3. MOTIVO DO ENVIO / RELATO INICIAL
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('DEFEITO RELATADO NO ENVIO:', MARGIN + 4, cursorY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...COLORS.gray900);
    const splitIssue = doc.splitTextToSize(issueDesc || 'Conferência técnica geral e reparos necessários.', CONTENT_W - 8);
    doc.text(splitIssue.slice(0, 2), MARGIN + 4, cursorY + 9.5);

    cursorY += 18;

    // 4. CHECKLIST DE DEFEITOS & DIAGNÓSTICO PARA O TÉCNICO ASSINALAR
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('2. DIAGNÓSTICO DO TÉCNICO (ASSINALE OS ITENS COM DEFEITO)', MARGIN, cursorY);

    cursorY += 3.5;

    const checklistCol1 = [
      '[   ] Tela / Display quebrado, trincado ou com listras',
      '[   ] Sem vídeo / Luz de fundo (Backlight) apagada',
      '[   ] Teclado com teclas falhando, duras ou ausentes',
      '[   ] Touchpad / Mouse com defeito ou sem clique',
      '[   ] Bateria viciada, estufada ou não carrega',
      '[   ] Não liga / Curto-circuito na Placa-Mãe',
      '[   ] Conector de Carga (DC Jack) danificado / folga',
      '[   ] Carregador / Fonte com defeito ou cabo rompido'
    ];

    const checklistCol2 = [
      '[   ] Som / Alto-falantes / Microfone sem funcionar',
      '[   ] Portas USB / HDMI / P2 / Rede com defeito',
      '[   ] Superaquecimento / Cooler travado ou barulhento',
      '[   ] Carcaça quebrada / Dobradiça danificada',
      '[   ] Sistema Operacional corrompido / Travando / Lento',
      '[   ] Vírus / Falha de boot / Necessita Formatação',
      '[   ] Upgrade de Hardware (SSD / Memória RAM)',
      '[   ] Limpeza Preventiva / Troca de Pasta Térmica'
    ];

    const boxH = 40;
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray900);

    let itemY = cursorY + 4.5;
    for (let i = 0; i < checklistCol1.length; i++) {
      doc.text(checklistCol1[i], MARGIN + 4, itemY);
      doc.text(checklistCol2[i], MARGIN + (CONTENT_W / 2) + 2, itemY);
      itemY += 4.4;
    }

    cursorY += boxH + 4;

    // 5. TABELA DE PEÇAS & COMPONENTES UTILIZADOS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('3. PEÇAS / COMPONENTES SUBSTITUÍDOS OU ADICIONADOS', MARGIN, cursorY);

    cursorY += 2.5;

    autoTable(doc, {
      startY: cursorY,
      head: [['Item / Componente', 'Modelo / Especificação Técnica', 'Nº de Série da Nova Peça', 'Valor (R$)']],
      body: [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', '']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.navyMid,
        textColor: COLORS.white,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: COLORS.gray900,
        cellPadding: 3.5
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 65 },
        2: { cellWidth: 45 },
        3: { cellWidth: 22, halign: 'right' }
      },
      margin: { left: MARGIN, right: MARGIN }
    });

    cursorY = doc.lastAutoTable.finalY + 4;

    // 6. LAUDO TÉCNICO, TESTES FINAIS E SOLUÇÃO APLICADA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('4. LAUDO TÉCNICO & SOLUÇÃO APLICADA', MARGIN, cursorY);

    cursorY += 3;

    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 26, 2, 2, 'FD');

    // Linhas pautadas para o técnico escrever à mão
    doc.setDrawColor(...COLORS.gray200);
    doc.line(MARGIN + 4, cursorY + 8, PAGE_W - MARGIN - 4, cursorY + 8);
    doc.line(MARGIN + 4, cursorY + 14, PAGE_W - MARGIN - 4, cursorY + 14);
    doc.line(MARGIN + 4, cursorY + 20, PAGE_W - MARGIN - 4, cursorY + 20);

    cursorY += 28;

    // 7. TESTES FINAIS DE QUALIDADE & PARECER
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 11, 2, 2, 'F');
    doc.setDrawColor(...COLORS.gray200);
    doc.roundedRect(MARGIN, cursorY, CONTENT_W, 11, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.navyMid);
    doc.text('TESTES FINAIS:', MARGIN + 4, cursorY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text('[   ] Display/Vídeo   [   ] Áudio/Som   [   ] Teclado/Touchpad   [   ] Wi-Fi/Rede   [   ] Carga/Bateria   [   ] Temperatura', MARGIN + 28, cursorY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.navyMid);
    doc.text('PARECER FINAL:', MARGIN + 4, cursorY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray900);
    doc.text('(   ) Aprovado p/ Retorno ao Uso          (   ) Sem Conserto (Sucatear / Baixar)          (   ) Em Observação', MARGIN + 28, cursorY + 8.5);

    cursorY += 15;

    // 8. CAMPOS DE ASSINATURA
    const signBoxW = (CONTENT_W - 10) / 2;

    // Técnico
    doc.setDrawColor(...COLORS.gray700);
    doc.line(MARGIN, cursorY + 10, MARGIN + signBoxW, cursorY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray900);
    doc.text('TÉCNICO RESPONSÁVEL (ASSINATURA / CARIMBO)', MARGIN + signBoxW / 2, cursorY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.gray500);
    doc.text('Nome Legível / Data: ____/____/________', MARGIN + signBoxW / 2, cursorY + 17.5, { align: 'center' });

    // Responsável Trynova
    doc.line(PAGE_W - MARGIN - signBoxW, cursorY + 10, PAGE_W - MARGIN, cursorY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray900);
    doc.text('RESPONSÁVEL T.I / TRYNOVA', PAGE_W - MARGIN - signBoxW / 2, cursorY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.gray500);
    doc.text('Recebido e Conferido / Data: ____/____/________', PAGE_W - MARGIN - signBoxW / 2, cursorY + 17.5, { align: 'center' });

    // Rodapé de segurança
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray500);
    doc.text('Trynova • Gestão de Ativos e Controle de Manutenção • Documento Oficial de Ordem de Serviço', PAGE_W / 2, PAGE_H - 7, { align: 'center' });

    // Salva o PDF
    const filename = `Ficha_Tecnica_OS_${assetTag}_${ticketId}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Erro ao gerar Ficha Técnica de Manutenção:', error);
    alert('Erro ao gerar o PDF da Ficha Técnica. Verifique o console para mais detalhes.');
    return false;
  }
}
