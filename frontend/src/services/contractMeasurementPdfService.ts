import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ClientContractMock,
  ContractExtraTripItem,
  ContractExcessKmItem,
  ContractDeductionItem,
} from '../data/measurementContractMockData';
import { ParteDiaria } from '../types/measurement';
import { resolveCompanyLogoUrl, getStoredCompanyBranding } from '../utils/logoUtils';

export interface GenerateMeasurementPdfOptions {
  client: ClientContractMock;
  extraTrips: ContractExtraTripItem[];
  excessKmItems: ContractExcessKmItem[];
  deductions: ContractDeductionItem[];
  partesDiarias?: ParteDiaria[];
  totals: {
    leasedTotal: number;
    extraTripsTotal: number;
    excessKmTotal: number;
    deductionsTotal: number;
    grandTotal: number;
  };
  invoiceOverride?: {
    nfNumber?: string;
    series?: string;
    nfIssueDate?: string;
    nfDueDate?: string;
    retentionISS?: number;
    retentionINSS?: number;
    retentionIR?: number;
    retentionPIS?: number;
    retentionCOFINS?: number;
    retentionCSLL?: number;
    netValue?: number;
    verificationCode?: string;
    observations?: string;
    providerCompany?: string;
    providerCnpj?: string;
    bankDetails?: string;
  };
  companyName?: string;
  companyCnpj?: string;
  companyLogoUrl?: string | null;
  companyIconUrl?: string | null;
  statusLabel?: string;
  elaboratedBy?: string;
  validatedBy?: string;
}

const formatCurrency = (val?: number | null): string => {
  const num = Number(val ?? 0);
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/**
 * Gera um selo institucional em alta resolução (PNG Base64) caso a empresa
 * não possua imagem externa cadastrada ou o carregamento falhe por CORS.
 */
function generateInstitutionalLogoBadgeBase64(companyName: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fundo arredondado estilo brasão corporativo (vermelho institucional + borda dourada)
  const r = 32;
  ctx.beginPath();
  ctx.moveTo(r, 6);
  ctx.lineTo(154 - r, 6);
  ctx.quadraticCurveTo(154, 6, 154, 6 + r);
  ctx.lineTo(154, 154 - r);
  ctx.quadraticCurveTo(154, 154, 154 - r, 154);
  ctx.lineTo(6 + r, 154);
  ctx.quadraticCurveTo(6, 154, 6, 154 - r);
  ctx.lineTo(6, 6 + r);
  ctx.quadraticCurveTo(6, 6, 6 + r, 6);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, 160, 160);
  grad.addColorStop(0, '#dc2626');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#eab308';
  ctx.stroke();

  // Iniciais da empresa (ex: "VIA" para Viação São Silvestre)
  const clean = (companyName || 'VIAÇÃO SÃO SILVESTRE').trim().toUpperCase();
  const initials = clean.startsWith('VIA')
    ? 'VIA'
    : clean
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 3)
        .map((w) => w[0])
        .join('') || 'VSS';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 80, 74);

  // Subtítulo institucional no selo
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
  ctx.fillText(' SÃO SILVESTRE ', 80, 118);

  return canvas.toDataURL('image/png');
}

/**
 * Carrega o ícone ou logomarca da empresa logada em Base64 PNG para o jsPDF,
 * preservando as dimensões originais (width / height) para não achatar imagens horizontais.
 */
async function loadCompanyLogoBase64(
  explicitLogoUrl?: string | null,
  companyName = 'VIAÇÃO SÃO SILVESTRE LTDA',
  explicitIconUrl?: string | null
): Promise<{ dataUrl: string; width: number; height: number }> {
  const storedBranding = getStoredCompanyBranding();
  let candidateUrl =
    explicitIconUrl ||
    storedBranding.iconUrl ||
    explicitLogoUrl ||
    storedBranding.logoUrl ||
    null;

  if (!candidateUrl) {
    try {
      const rawEmpresa = localStorage.getItem('empresa') || localStorage.getItem('company');
      if (rawEmpresa) {
        const parsed = JSON.parse(rawEmpresa);
        candidateUrl =
          parsed?.iconUrl ||
          parsed?.logoUrl ||
          parsed?.logo ||
          parsed?.logo_url ||
          null;
      }
    } catch {
      // ignore
    }
  }

  const resolvedUrl = resolveCompanyLogoUrl(candidateUrl);

  if (resolvedUrl) {
    try {
      const loaded = await new Promise<{ dataUrl: string; width: number; height: number } | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const timer = window.setTimeout(() => resolve(null), 2500);
        img.onload = () => {
          window.clearTimeout(timer);
          try {
            const w = img.naturalWidth || 160;
            const h = img.naturalHeight || 160;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }
            ctx.drawImage(img, 0, 0);
            resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => {
          window.clearTimeout(timer);
          resolve(null);
        };
        img.src = resolvedUrl;
      });

      if (loaded) return loaded;
    } catch {
      // fallback to badge
    }
  }

  return {
    dataUrl: generateInstitutionalLogoBadgeBase64(companyName),
    width: 160,
    height: 160,
  };
}

export class ContractMeasurementPdfService {
  /**
   * Gera e faz o download do PDF oficial da Medição Financeira:
   * - Página 1: Folha Oficial de Medição Mensal (layout executivo fiel aprovado pelo usuário + Logo da Empresa no cabeçalho)
   * - Página 2+: Detalhamento Analítico Completo dos Lançamentos que geraram a Medição
   *   (Veículos Alocados, Partes Diárias Lançadas e Turnos, Viagens Extras, Apuração de KM Excedente,
   *    Deduções/Descontos e Demonstrativo de Faturamento / NFS-e / Contas a Receber).
   */
  static async generateMeasurementPDF(options: GenerateMeasurementPdfOptions): Promise<void> {
    const {
      client,
      extraTrips = [],
      excessKmItems = [],
      deductions = [],
      partesDiarias = [],
      totals,
      invoiceOverride,
      statusLabel = 'REVISADA / LIBERADA',
      elaboratedBy = 'Setor de Medições / Operacional',
      validatedBy = 'Diretoria / Faturamento',
    } = options;

    const inv = { ...client.invoice, ...invoiceOverride };

    // Dados da empresa emitente/locadora
    let savedCompanyName = options.companyName || inv.providerCompany || 'VIAÇÃO SÃO SILVESTRE LTDA / FLUXBUS';
    let savedCompanyCnpj = options.companyCnpj || inv.providerCnpj || '33.592.510/0001-54';
    try {
      const rawEmpresa = localStorage.getItem('empresa') || localStorage.getItem('company');
      if (rawEmpresa) {
        const parsed = JSON.parse(rawEmpresa);
        if (parsed?.name && !options.companyName) {
          savedCompanyName = `${parsed.name.toUpperCase()} / FLUXBUS`;
        }
        if (parsed?.cnpj && !options.companyCnpj) {
          savedCompanyCnpj = parsed.cnpj;
        }
      }
    } catch {
      // ignore
    }

    const logoLoaded = await loadCompanyLogoBase64(
      options.companyLogoUrl,
      savedCompanyName,
      options.companyIconUrl
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const emissionTimestamp = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const drawHeaderOnCurrentPage = (subtitleText: string) => {
      // Faixa superior azul-marinho escuro (slate-900)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Linha dourada/âmbar (yellow-500)
      doc.setFillColor(234, 179, 8);
      doc.rect(0, 28, pageWidth, 1.5, 'F');

      // Ícone / Logo da Empresa no canto superior esquerdo do cabeçalho (preservando proporção sem achatar)
      let textLeftX = margin;
      if (logoLoaded?.dataUrl) {
        try {
          const ratio = (logoLoaded.width || 1) / (logoLoaded.height || 1);
          const boxH = 19.6;
          const boxW = ratio > 1.35 ? Math.min(36, Math.max(19.6, boxH * ratio * 0.85)) : 19.6;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 4.2, boxW, boxH, 2.5, 2.5, 'F');

          const innerMaxW = boxW - 1.4;
          const innerMaxH = boxH - 1.4;
          let drawW = innerMaxW;
          let drawH = innerMaxW / ratio;
          if (drawH > innerMaxH) {
            drawH = innerMaxH;
            drawW = innerMaxH * ratio;
          }
          const imgX = margin + (boxW - drawW) / 2;
          const imgY = 4.2 + (boxH - drawH) / 2;
          doc.addImage(logoLoaded.dataUrl, 'PNG', imgX, imgY, drawW, drawH);
          textLeftX = margin + boxW + 3.4;
        } catch {
          textLeftX = margin;
        }
      }

      // Nome da Empresa
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.text(savedCompanyName.toUpperCase(), textLeftX, 11);

      // CNPJ e Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `CNPJ: ${savedCompanyCnpj}  |  Gestão Integrada de Frotas & Fretamento Corporativo`,
        textLeftX,
        17.5
      );
      doc.text(subtitleText, textLeftX, 23.5);

      // Número da Medição e Emissão à direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(253, 224, 71); // yellow-300
      doc.text(`MEDIÇÃO Nº ${client.measurementNumber}`, pageWidth - margin, 13.5, {
        align: 'right',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(`Emissão: ${emissionTimestamp}`, pageWidth - margin, 21.5, { align: 'right' });
    };

    // =========================================================================
    // PÁGINA 1: FOLHA OFICIAL DE MEDIÇÃO MENSAL (RESUMO EXECUTIVO & FATURAMENTO)
    // =========================================================================
    drawHeaderOnCurrentPage('FOLHA OFICIAL DE MEDIÇÃO MENSAL DE SERVIÇOS DE TRANSPORTE');

    let currentY = 36;

    // Quadro de Identificação do Contrato / Cliente
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLIENTE / CONTRATANTE: ${(client.clientName || '').toUpperCase()}`, margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ: ${client.cnpj || '-'}`, margin + 4, currentY + 12);
    doc.text(`Contrato Nº: ${client.contractNumber || '-'}`, margin + 70, currentY + 12);
    doc.text(
      `Período de Apuração: ${formatDateBR(client.periodStart)} até ${formatDateBR(client.periodEnd)}`,
      margin + 4,
      currentY + 18
    );
    doc.text(`Vencimento Fatura: ${formatDateBR(inv.nfDueDate || client.dueDate)}`, margin + 115, currentY + 18);

    currentY += 27;

    // Totais Consolidados da Medição
    const totalLeased = Number(totals?.leasedTotal ?? 0);
    const totalExtras = Number(totals?.extraTripsTotal ?? 0);
    const totalExcessKm = Number(totals?.excessKmTotal ?? 0);
    const totalDeductions = Number(totals?.deductionsTotal ?? 0);
    const totalLiquidoMedicao = Number(
      totals?.grandTotal ?? totalLeased + totalExtras + totalExcessKm - totalDeductions
    );

    // Resumo dos Totais (Card em 5 colunas)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');

    const colWidth = (pageWidth - margin * 2) / 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text('1. Veículos Locados', margin + 3, currentY + 5);
    doc.text('2. Viagens Extras', margin + colWidth + 3, currentY + 5);
    doc.text('3. KM Excedente', margin + colWidth * 2 + 3, currentY + 5);
    doc.text('4. Deduções / Débitos', margin + colWidth * 3 + 3, currentY + 5);
    doc.text('TOTAL LÍQUIDO MEDIÇÃO', margin + colWidth * 4 + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text(formatCurrency(totalLeased), margin + 3, currentY + 12);
    doc.text(formatCurrency(totalExtras), margin + colWidth + 3, currentY + 12);
    doc.text(formatCurrency(totalExcessKm), margin + colWidth * 2 + 3, currentY + 12);
    doc.setTextColor(220, 38, 38);
    doc.text(
      totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : 'R$ 0,00',
      margin + colWidth * 3 + 3,
      currentY + 12
    );

    doc.setTextColor(22, 101, 52);
    doc.setFontSize(9);
    doc.text(formatCurrency(totalLiquidoMedicao), margin + colWidth * 4 + 3, currentY + 12);

    currentY += 21;

    // Seção 1 da Capa: Veículos Locados sob Contrato Fixo
    const leasedList = client.leasedVehicles || [];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`1. VEÍCULOS LOCADOS SOB CONTRATO FIXO (${leasedList.length})`, margin, currentY);
    currentY += 3;

    if (leasedList.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhum veículo alocado para este cliente no período da medição.', margin, currentY + 4);
      currentY += 10;
    } else {
      const leasedRows = leasedList.map((item, idx) => [
        String(idx + 1),
        `${item.description}\nTrajeto: ${item.route || '-'}${item.observations ? ` (${item.observations})` : ''}`,
        item.plate,
        formatCurrency(item.monthlyRate || item.periodValue),
        `${item.workingDays} dias`,
        formatCurrency(item.dailyRate),
        formatCurrency(item.periodValue),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { top: 34, left: margin, right: margin },
        head: [['Item', 'Descrição do Serviço / Trajeto', 'Placa', 'Valor Mensal', 'Dias', 'Valor Diário', 'Total Período']],
        body: leasedRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [51, 65, 85],
          valign: 'top',
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, fontStyle: 'bold', textColor: [29, 78, 216] },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 23, halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] },
        },
      });

      // @ts-ignore
      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 25) + 7;
    }

    // Quadro de Faturamento e Dados da NFS-e na Página 1
    if (currentY > pageHeight - 65) {
      doc.addPage();
      drawHeaderOnCurrentPage('FOLHA OFICIAL DE MEDIÇÃO MENSAL DE SERVIÇOS DE TRANSPORTE');
      currentY = 36;
    }

    const pisVal = Number(
      invoiceOverride?.retentionPIS ??
        (totalLiquidoMedicao > 0 ? Number((totalLiquidoMedicao * 0.0065).toFixed(2)) : 0)
    );
    const cofinsVal = Number(
      invoiceOverride?.retentionCOFINS ??
        (totalLiquidoMedicao > 0 ? Number((totalLiquidoMedicao * 0.03).toFixed(2)) : 0)
    );
    const csllVal = Number(
      invoiceOverride?.retentionCSLL ??
        (totalLiquidoMedicao > 0 ? Number((totalLiquidoMedicao * 0.01).toFixed(2)) : 0)
    );
    const valorLiquidoNF =
      Number(inv.netValue || 0) > 0
        ? Number(inv.netValue)
        : Math.max(0, totalLiquidoMedicao - (pisVal + cofinsVal + csllVal));

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('FATURAMENTO DA MEDIÇÃO & NOTA FISCAL DE SERVIÇO (NFS-e)', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    doc.text(
      `NFS-e Nº: ${inv.nfNumber || 'A Emitir'}  |  Série: ${invoiceOverride?.series || '1'}`,
      margin + 4,
      currentY + 12
    );
    doc.text(`Emissão NF: ${formatDateBR(inv.nfIssueDate || client.periodEnd)}`, margin + 65, currentY + 12);
    doc.text(`Vencimento: ${formatDateBR(inv.nfDueDate || client.dueDate)}`, margin + 120, currentY + 12);

    doc.text(
      `Retenções: PIS (0.65%): ${formatCurrency(pisVal)}  |  COFINS (3.00%): ${formatCurrency(cofinsVal)}  |  CSLL (1.00%): ${formatCurrency(csllVal)}`,
      margin + 4,
      currentY + 18
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text(`VALOR LÍQUIDO A RECEBER: ${formatCurrency(valorLiquidoNF)}`, margin + 4, currentY + 24);

    currentY += 34;

    // Assinaturas da Página 1
    if (currentY > pageHeight - 35) {
      doc.addPage();
      drawHeaderOnCurrentPage('FOLHA OFICIAL DE MEDIÇÃO MENSAL DE SERVIÇOS DE TRANSPORTE');
      currentY = 40;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Atestamos que os serviços de transporte fretado constantes nesta medição foram prestados a contento e estão em conformidade com o contrato.',
      margin,
      currentY
    );
    currentY += 12;

    const signWidth = (pageWidth - margin * 2 - 20) / 2;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin, currentY, margin + signWidth, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text((client.clientName || '').toUpperCase(), margin, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Fiscal do Contrato / Aprovador', margin, currentY + 8);

    doc.line(margin + signWidth + 20, currentY, pageWidth - margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(savedCompanyName.toUpperCase(), margin + signWidth + 20, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Gerência de Tráfego & Fretamento', margin + signWidth + 20, currentY + 8);

    // =========================================================================
    // PÁGINA 2+: ANEXO ANALÍTICO — DETALHAMENTO DOS LANÇAMENTOS QUE GERARAM A MEDIÇÃO
    // =========================================================================
    doc.addPage();
    drawHeaderOnCurrentPage('DETALHAMENTO ANALÍTICO DOS LANÇAMENTOS QUE GERARAM A MEDIÇÃO');

    let detailY = 35;

    // Faixa de Contexto Analítico no topo da Página 2
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, detailY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `MEMÓRIA DE CÁLCULO E LANÇAMENTOS ANALÍTICOS — MEDIÇÃO Nº ${client.measurementNumber} (${statusLabel})`,
      margin + 3,
      detailY + 5.2
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Cliente: ${client.clientName} (${client.cnpj})  |  Contrato: ${client.contractNumber}  |  Período: ${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}`,
      margin + 3,
      detailY + 10.8
    );

    detailY += 18;

    const ensureDetailSpace = (neededMm: number) => {
      if (detailY + neededMm > pageHeight - 16) {
        doc.addPage();
        drawHeaderOnCurrentPage('DETALHAMENTO ANALÍTICO DOS LANÇAMENTOS QUE GERARAM A MEDIÇÃO');
        detailY = 36;
      }
    };

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 1: MEMÓRIA DE CÁLCULO DOS VEÍCULOS LOCADOS SOB CONTRATO FIXO
    // -------------------------------------------------------------------------
    ensureDetailSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `1. DETALHAMENTO DOS VEÍCULOS LOCADOS SOB CONTRATO FIXO (${leasedList.length} VEÍCULO(S))`,
      margin,
      detailY
    );
    detailY += 2.5;

    const detailedLeasedRows =
      leasedList.length > 0
        ? leasedList.map((v, idx) => [
            String(idx + 1),
            v.plate,
            v.description || 'Locação de Veículo sob Contrato Fixo',
            v.route || '-',
            `${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}`,
            `${v.workingDays}d / ${v.stoppedDays || 0}d`,
            formatCurrency(v.monthlyRate || v.periodValue),
            formatCurrency(v.dailyRate),
            formatCurrency(v.periodValue),
          ])
        : [
            [
              '-',
              '-',
              'Nenhum veículo fixo alocado para este cliente neste período.',
              '-',
              `${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}`,
              '0d',
              'R$ 0,00',
              'R$ 0,00',
              'R$ 0,00',
            ],
          ];

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [
        [
          '#',
          'Placa',
          'Descrição do Serviço / Modalidade',
          'Itinerário / Unidade',
          'Período',
          'Trab./Par.',
          'Valor Mensal',
          'Diária',
          'Total Apurado',
        ],
      ],
      body: detailedLeasedRows,
      foot: [
        [
          '',
          'SUBTOTAL',
          `${leasedList.length} veículo(s) alocado(s) no contrato`,
          '',
          '',
          `${leasedList.reduce((acc, v) => acc + Number(v.workingDays || 0), 0)}d`,
          '',
          '',
          formatCurrency(totalLeased),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, textColor: [51, 65, 85], cellPadding: 1.6, valign: 'top' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 7, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 18, fontStyle: 'bold', textColor: [29, 78, 216] },
        2: { cellWidth: 46 },
        3: { cellWidth: 34 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 13, halign: 'center' },
        6: { cellWidth: 19, halign: 'right' },
        7: { cellWidth: 16, halign: 'right' },
        8: { cellWidth: 19, halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] },
      },
    });

    // @ts-ignore
    detailY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : detailY + 18) + 6;

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 2: DETALHAMENTO DAS PARTES DIÁRIAS LANÇADAS NO PERÍODO
    // -------------------------------------------------------------------------
    ensureDetailSpace(30);
    const totalKmDrivenPartes = partesDiarias.reduce((acc, pd) => acc + Number(pd.kmDriven || 0), 0);
    const totalKmConsideredPartes = partesDiarias.reduce(
      (acc, pd) => acc + Number(pd.kmConsidered ?? pd.kmDriven ?? 0),
      0
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `2. DETALHAMENTO DAS PARTES DIÁRIAS (BOLETINS OPERACIONAIS LANÇADOS) (${partesDiarias.length} BOLETIM(NS) — ${totalKmConsideredPartes.toLocaleString('pt-BR')} KM)`,
      margin,
      detailY
    );
    detailY += 2.5;

    const statusMap: Record<string, string> = {
      APPROVED: 'VALIDADA',
      VALIDADA: 'VALIDADA',
      PENDING: 'EM ANÁLISE',
      REJECTED: 'GLOSADA',
    };

    const partesRows =
      partesDiarias.length > 0
        ? partesDiarias.map((pd, idx) => {
            const tripsSummary =
              pd.trips && pd.trips.length > 0
                ? pd.trips
                    .map(
                      (t) =>
                        `[${t.startTime || ''}-${t.endTime || ''}] ${t.itinerary || t.activityCode || ''}${
                          t.kmPerTrip ? ` (${t.kmPerTrip}km)` : ''
                        }`
                    )
                    .join(' | ')
                : pd.notes || 'Operação contratual regular';

            return [
              String(idx + 1),
              `#${pd.number}`,
              formatDateBR(pd.date),
              `${pd.vehiclePlate}${pd.vehicleModel ? `\n(${pd.vehicleModel})` : ''}`,
              pd.driverName || '-',
              `${pd.startTime || '-'} às ${pd.endTime || '-'}`,
              `${Number(pd.kmInitial || 0).toLocaleString('pt-BR')} -> ${Number(pd.kmFinal || 0).toLocaleString('pt-BR')}`,
              `${Number(pd.kmDriven || 0).toLocaleString('pt-BR')} km`,
              `${Number(pd.kmConsidered ?? pd.kmDriven ?? 0).toLocaleString('pt-BR')} km`,
              tripsSummary,
              statusMap[pd.status] || pd.status || 'VALIDADA',
            ];
          })
        : [
            [
              '-',
              '-',
              '-',
              leasedList[0]?.plate || '-',
              '-',
              '-',
              '-',
              '0 km',
              '0 km',
              'Nenhuma parte diária individual apontada no período (apuração por franquia mensal fixa de locação).',
              'MENSAL',
            ],
          ];

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [
        [
          '#',
          'Boletim',
          'Data',
          'Placa / Veículo',
          'Motorista',
          'Jornada',
          'Hodômetro',
          'KM Rod.',
          'KM Cons.',
          'Turnos / Itinerários / Atividades Executadas',
          'Status',
        ],
      ],
      body: partesRows,
      foot: [
        [
          '',
          'TOTAL',
          `${partesDiarias.length} bol.`,
          '',
          '',
          '',
          'TOTAL KM:',
          `${totalKmDrivenPartes.toLocaleString('pt-BR')} km`,
          `${totalKmConsideredPartes.toLocaleString('pt-BR')} km`,
          'Apuração operacional consolidada das partes diárias do período',
          'OK',
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.2, textColor: [51, 65, 85], cellPadding: 1.5, valign: 'top' },
      footStyles: { fillColor: [254, 243, 199], textColor: [120, 53, 15], fontSize: 6.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 6, halign: 'center' },
        1: { cellWidth: 13, fontStyle: 'bold' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 21, fontStyle: 'bold', textColor: [29, 78, 216] },
        4: { cellWidth: 23 },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 13, halign: 'right' },
        8: { cellWidth: 13, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 28 },
        10: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
      },
    });

    // @ts-ignore
    detailY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : detailY + 18) + 6;

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 3: DETALHAMENTO DE VIAGENS EXTRAS & TURNOS ESPECIAIS
    // -------------------------------------------------------------------------
    ensureDetailSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `3. DETALHAMENTO DE VIAGENS EXTRAS & TURNOS ESPECIAIS (${extraTrips.length} VIAGEM(NS))`,
      margin,
      detailY
    );
    detailY += 2.5;

    const extraRows =
      extraTrips.length > 0
        ? extraTrips.map((et, idx) => [
            String(idx + 1),
            formatDateBR(et.date),
            et.plate,
            et.route,
            et.vehicleType || 'Ônibus Rodoviário',
            formatCurrency(et.tripCost),
            formatCurrency(et.tripCost),
          ])
        : [
            [
              '-',
              '-',
              '-',
              'Nenhuma viagem extra ou turno adicional faturado neste período.',
              '-',
              'R$ 0,00',
              'R$ 0,00',
            ],
          ];

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [['#', 'Data', 'Placa', 'Trajeto / Finalidade da Viagem Extra', 'Tipo de Veículo', 'Valor Unit.', 'Total']],
      body: extraRows,
      foot: [
        [
          '',
          'SUBTOTAL',
          `${extraTrips.length} viag.`,
          'Total apurado em viagens extras e turnos adicionais no período',
          '',
          '',
          formatCurrency(totalExtras),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, textColor: [51, 65, 85], cellPadding: 1.6 },
      footStyles: { fillColor: [239, 246, 255], textColor: [30, 58, 138], fontSize: 6.8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 20, fontStyle: 'bold', textColor: [29, 78, 216] },
        3: { cellWidth: 70 },
        4: { cellWidth: 28 },
        5: { cellWidth: 19, halign: 'right' },
        6: { cellWidth: 19, halign: 'right', fontStyle: 'bold' },
      },
    });

    // @ts-ignore
    detailY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : detailY + 18) + 6;

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 4: APURAÇÃO DE QUILOMETRAGEM EXCEDENTE (HODÔMETRO X FRANQUIA)
    // -------------------------------------------------------------------------
    ensureDetailSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `4. DETALHAMENTO DE QUILOMETRAGEM EXCEDENTE — APURAÇÃO DE HODÔMETRO (${excessKmItems.length} APURAÇÃO(ÕES))`,
      margin,
      detailY
    );
    detailY += 2.5;

    const kmRows =
      excessKmItems.length > 0
        ? excessKmItems.map((ek, idx) => [
            String(idx + 1),
            ek.periodMonth || 'PERÍODO',
            ek.plate,
            `${Number(ek.franchiseKm || 0).toLocaleString('pt-BR')} km`,
            `${Number(ek.totalKmDriven || 0).toLocaleString('pt-BR')} km`,
            `${Number(ek.disregardedKm || 0).toLocaleString('pt-BR')} km`,
            `${Number(ek.consideredKm || 0).toLocaleString('pt-BR')} km`,
            `${Number(ek.excessKm || 0).toLocaleString('pt-BR')} km`,
            formatCurrency(ek.excessKmRate),
            formatCurrency(ek.totalValue),
          ])
        : [
            [
              '-',
              '-',
              '-',
              '0 km',
              '0 km',
              '0 km',
              '0 km',
              '0 km',
              'R$ 0,00',
              'R$ 0,00',
            ],
          ];

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [
        [
          '#',
          'Mês/Ref.',
          'Placa',
          'Franquia (KM)',
          'KM Rodado',
          'KM Descons.',
          'KM Consid.',
          'KM Excedente',
          'Tarifa KM',
          'Total Exced.',
        ],
      ],
      body: kmRows,
      foot: [
        [
          '',
          'SUBTOTAL',
          '',
          `${excessKmItems.reduce((a, b) => a + Number(b.franchiseKm || 0), 0).toLocaleString('pt-BR')} km`,
          `${excessKmItems.reduce((a, b) => a + Number(b.totalKmDriven || 0), 0).toLocaleString('pt-BR')} km`,
          `${excessKmItems.reduce((a, b) => a + Number(b.disregardedKm || 0), 0).toLocaleString('pt-BR')} km`,
          `${excessKmItems.reduce((a, b) => a + Number(b.consideredKm || 0), 0).toLocaleString('pt-BR')} km`,
          `${excessKmItems.reduce((a, b) => a + Number(b.excessKm || 0), 0).toLocaleString('pt-BR')} km`,
          '',
          formatCurrency(totalExcessKm),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 6.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.4, textColor: [51, 65, 85], cellPadding: 1.5 },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 6.6, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 18, fontStyle: 'bold', textColor: [29, 78, 216] },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 21, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 19, halign: 'right' },
        9: { cellWidth: 21, halign: 'right', fontStyle: 'bold' },
      },
    });

    // @ts-ignore
    detailY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : detailY + 18) + 6;

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 5: DEDUÇÕES, GLOSAS, SEGUROS & DESCONTOS CONTRATUAIS
    // -------------------------------------------------------------------------
    ensureDetailSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `5. DETALHAMENTO DE DEDUÇÕES, GLOSAS, SEGUROS & REPASSES CONTRATUAIS (${deductions.length} LANÇAMENTO(S))`,
      margin,
      detailY
    );
    detailY += 2.5;

    const deductionRows =
      deductions.length > 0
        ? deductions.map((d, idx) => [
            String(idx + 1),
            formatDateBR(d.date),
            d.plate || 'CONTRATO',
            d.description,
            d.type === 'CREDIT' ? 'CRÉDITO (+)' : 'DÉBITO (-)',
            d.type === 'CREDIT' ? `+${formatCurrency(d.value)}` : `-${formatCurrency(d.value)}`,
          ])
        : [
            [
              '-',
              '-',
              '-',
              'Nenhuma dedução, glosa ou desconto contratual lançado neste período.',
              '-',
              'R$ 0,00',
            ],
          ];

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [['#', 'Data', 'Placa / Ref.', 'Descrição do Lançamento', 'Natureza', 'Valor']],
      body: deductionRows,
      foot: [
        [
          '',
          'SUBTOTAL',
          '',
          'Total de deduções / descontos aplicados ao fechamento da medição',
          '',
          totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : 'R$ 0,00',
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, textColor: [51, 65, 85], cellPadding: 1.6 },
      footStyles: { fillColor: [254, 242, 242], textColor: [153, 27, 27], fontSize: 6.8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 22, fontStyle: 'bold' },
        3: { cellWidth: 88 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      },
    });

    // @ts-ignore
    detailY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : detailY + 18) + 6;

    // -------------------------------------------------------------------------
    // SEÇÃO ANALÍTICA 6: ESPELHO DE FATURAMENTO, RETENÇÕES, CONTAS A RECEBER & DISCRIMINAÇÃO NFS-e
    // -------------------------------------------------------------------------
    ensureDetailSpace(42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      '6. DEMONSTRATIVO ANALÍTICO PARA FATURAMENTO, EMISSÃO DE NFS-e E CONTAS A RECEBER',
      margin,
      detailY
    );
    detailY += 2.5;

    const placasAlocadas = leasedList.map((v) => v.plate).filter(Boolean).join(', ') || 'FROTA';
    const discriminacaoNFSe =
      `FATURAMENTO REFERENTE À LOCAÇÃO DE VEÍCULOS E PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE — CONTRATO Nº ${client.contractNumber} — MEDIÇÃO Nº ${client.measurementNumber} — PERÍODO: ${formatDateBR(client.periodStart)} A ${formatDateBR(client.periodEnd)}. ` +
      `VEÍCULOS ALOCADOS (${leasedList.length}): ${
        leasedList.map((v) => `[${v.plate} - ${v.description} - ${v.workingDays}d - ${formatCurrency(v.periodValue)}]`).join('; ') || 'N/A'
      }. ` +
      `PARTES DIÁRIAS APURADAS: ${partesDiarias.length} BOLETIM(NS) (${totalKmConsideredPartes.toLocaleString('pt-BR')} KM CONSIDERADOS). ` +
      `VIAGENS EXTRAS: ${formatCurrency(totalExtras)} | KM EXCEDENTE: ${formatCurrency(totalExcessKm)} | DEDUÇÕES: -${formatCurrency(totalDeductions)}. ` +
      `VALOR BRUTO DA FATURA: ${formatCurrency(totalLiquidoMedicao)} | RETENÇÕES (PIS/COFINS/CSLL): -${formatCurrency(pisVal + cofinsVal + csllVal)} | VALOR LÍQUIDO A RECEBER: ${formatCurrency(valorLiquidoNF)} — VENCIMENTO: ${formatDateBR(inv.nfDueDate || client.dueDate)}.`;

    autoTable(doc, {
      startY: detailY,
      margin: { top: 34, left: margin, right: margin },
      head: [
        [
          'Emitente / Locadora',
          'Cliente / Tomador (Faturado)',
          'Composição Bruta & Retenções',
          'Contas a Receber (Financeiro)',
        ],
      ],
      body: [
        [
          `${savedCompanyName}\nCNPJ: ${savedCompanyCnpj}\nCód. Serviço: 16.01 / 07.02\nFatura: FAT-LOC-${client.measurementNumber}/2026`,
          `${client.clientName}\nCNPJ: ${client.cnpj}\nContrato: ${client.contractNumber}\nVeículos: ${placasAlocadas}`,
          `Bruto Medição: ${formatCurrency(totalLiquidoMedicao)}\n(-) PIS (0,65%): ${formatCurrency(pisVal)}\n(-) COFINS (3,00%): ${formatCurrency(cofinsVal)}\n(-) CSLL (1,00%): ${formatCurrency(csllVal)}\n(-) ISS / INSS: ${formatCurrency(Number(inv.retentionISS || 0) + Number(inv.retentionINSS || 0))}`,
          `LÍQUIDO A RECEBER: ${formatCurrency(valorLiquidoNF)}\nNFS-e Nº: ${inv.nfNumber || 'A EMITIR'}\nEmissão: ${formatDateBR(inv.nfIssueDate || client.periodEnd)}\nVencimento: ${formatDateBR(inv.nfDueDate || client.dueDate)}\nStatus: SINCRONIZADO NO FINANCEIRO`,
        ],
        [
          {
            content: `DISCRIMINAÇÃO DOS SERVIÇOS PARA CORPO DA NOTA FISCAL (NFS-e):\n${discriminacaoNFSe}`,
            colSpan: 4,
            styles: {
              fillColor: [255, 251, 235],
              textColor: [30, 41, 59],
              fontSize: 6.5,
              fontStyle: 'normal',
            },
          },
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, textColor: [51, 65, 85], cellPadding: 2, valign: 'top' },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: 46 },
        2: { cellWidth: 46 },
        3: { cellWidth: 46, fontStyle: 'bold' },
      },
    });

    // Garantir cabeçalho com logo e rodapé numerado em todas as páginas geradas
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      if (p > 1) {
        drawHeaderOnCurrentPage('DETALHAMENTO ANALÍTICO DOS LANÇAMENTOS QUE GERARAM A MEDIÇÃO');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      doc.text(
        `${savedCompanyName} • Módulo de Medição & Faturamento de Contratos (Medição Nº ${client.measurementNumber})`,
        margin,
        pageHeight - 4
      );
      doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 4, {
        align: 'right',
      });
    }

    const clientSlug = (client.clientName || 'cliente')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
    const filename = `medicao-${client.measurementNumber}-${clientSlug}.pdf`;
    doc.save(filename);
  }

  /**
   * Gera e faz o download do arquivo Excel (.xlsx) completo com todas as abas da medição do período:
   * 1. Resumo da Medição
   * 2. Veículos Locados
   * 3. Partes Diárias Lançadas (com detalhamento de trajetos/atividades)
   * 4. Viagens Extras
   * 5. KM Excedente
   * 6. Débitos e Descontos
   * 7. Espelho de Faturamento & NFS-e
   */
  static generateMeasurementExcel(options: GenerateMeasurementPdfOptions): void {
    const {
      client,
      extraTrips,
      excessKmItems,
      deductions,
      partesDiarias = [],
      totals,
      invoiceOverride,
      statusLabel = 'REVISADA / LIBERADA',
      elaboratedBy = 'Setor de Medições / Operacional',
      validatedBy = 'Diretoria / Faturamento',
    } = options;
    const inv = { ...client.invoice, ...invoiceOverride };

    const wb = XLSX.utils.book_new();

    // ABA 1: Resumo Consolidado da Medição
    const resumoRows = [
      ['BOLETIM DE MEDIÇÃO FINANCEIRA E OPERACIONAL - VIAÇÃO SÃO SILVESTRE LTDA'],
      [],
      ['DADOS DO CONTRATO E PERÍODO'],
      ['Nº da Medição', client.measurementNumber, 'Contrato', client.contractNumber],
      ['Cliente / Contratante', client.clientName, 'CNPJ', client.cnpj],
      [
        'Período de Apuração',
        `${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}`,
        'Vencimento Fatura/NF',
        formatDateBR(inv.nfDueDate || client.dueDate),
      ],
      ['Status da Medição', statusLabel, 'Elaborado / Revisado por', `${elaboratedBy} / ${validatedBy}`],
      [],
      ['RESUMO FINANCEIRO DO PERÍODO'],
      ['Categoria', 'Quantidade de Registros', 'Valor Apurado (R$)'],
      ['1. Veículos Locados sob Contrato Fixo', client.leasedVehicles.length, totals.leasedTotal],
      ['2. Partes Diárias Lançadas no Período', partesDiarias.length, 0],
      ['3. Viagens Extras e Turnos Adicionais', extraTrips.length, totals.extraTripsTotal],
      ['4. Quilometragem Excedente (Hodômetro)', excessKmItems.length, totals.excessKmTotal],
      ['5. Deduções / Descontos Contratuais', deductions.length, -Math.abs(totals.deductionsTotal)],
      ['TOTAL LÍQUIDO DA MEDIÇÃO (R$)', '', totals.grandTotal],
      [],
      ['DADOS DE FATURAMENTO (NFS-e)'],
      ['Número NFS-e', inv.nfNumber || 'A EMITIR'],
      ['Data Emissão NFS-e', formatDateBR(inv.nfIssueDate)],
      ['Data Vencimento NFS-e', formatDateBR(inv.nfDueDate || client.dueDate)],
      ['Código de Verificação', inv.verificationCode || '-'],
      ['Retenção ISS (R$)', inv.retentionISS || 0],
      ['Retenção INSS (R$)', inv.retentionINSS || 0],
      ['Retenção IR (R$)', inv.retentionIR || 0],
      ['Valor Líquido Nota Fiscal (R$)', inv.netValue || totals.grandTotal],
      ['Observações', inv.observations || '-'],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
    wsResumo['!cols'] = [{ wch: 36 }, { wch: 34 }, { wch: 28 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, '1_Resumo_Medicao');

    // ABA 2: Veículos Locados
    const veiculosHeader = [
      'Item',
      'Placa',
      'Descrição do Veículo / Serviço',
      'Rota / Alocação',
      'Dias Trabalhados',
      'Dias Parados',
      'Valor Mensal Contratado (R$)',
      'Diária Contratual (R$)',
      'Valor Apurado no Período (R$)',
      'Observações',
    ];
    const veiculosData = client.leasedVehicles.map((v, idx) => [
      idx + 1,
      v.plate,
      v.description,
      v.route || '-',
      v.workingDays,
      v.stoppedDays || 0,
      v.monthlyRate || 0,
      v.dailyRate || 0,
      v.periodValue || 0,
      v.observations || '',
    ]);
    veiculosData.push([
      '',
      'TOTAL',
      `${client.leasedVehicles.length} veículo(s)`,
      '',
      client.leasedVehicles.reduce((acc, v) => acc + (v.workingDays || 0), 0),
      client.leasedVehicles.reduce((acc, v) => acc + (v.stoppedDays || 0), 0),
      '',
      '',
      totals.leasedTotal,
      '',
    ]);
    const wsVeiculos = XLSX.utils.aoa_to_sheet([veiculosHeader, ...veiculosData]);
    wsVeiculos['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 38 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsVeiculos, '2_Veiculos_Locados');

    // ABA 3: Partes Diárias Lançadas
    const partesHeader = [
      'Item',
      'Nº Boletim',
      'Data',
      'Placa',
      'Modelo Veículo',
      'Motorista',
      'Matrícula',
      'Hora Inicial',
      'Hora Final',
      'KM Inicial',
      'KM Final',
      'KM Rodado',
      'KM Considerado',
      'Qtd. Viagens/Turnos',
      'Detalhamento dos Trajetos / Atividades',
      'Status',
      'Observações',
    ];
    const statusMap: Record<string, string> = {
      APPROVED: 'APROVADA',
      PENDING: 'EM ANÁLISE',
      REJECTED: 'GLOSADA',
    };
    const partesData: (string | number)[][] = partesDiarias.map((pd, idx) => {
      const tripsText =
        pd.trips && pd.trips.length > 0
          ? pd.trips
              .map(
                (t) =>
                  `[${t.startTime || ''}-${t.endTime || ''}] ${t.itinerary || t.activityCode || ''} (${t.kmPerTrip || 0}km)`
              )
              .join(' ; ')
          : pd.notes || 'Operação normal';
      return [
        idx + 1,
        pd.number,
        formatDateBR(pd.date),
        pd.vehiclePlate,
        pd.vehicleModel || '-',
        pd.driverName || '-',
        pd.driverRegistration || '-',
        pd.startTime || '-',
        pd.endTime || '-',
        pd.kmInitial || 0,
        pd.kmFinal || 0,
        pd.kmDriven || 0,
        pd.kmConsidered ?? pd.kmDriven ?? 0,
        pd.trips?.length || 1,
        tripsText,
        statusMap[pd.status] || pd.status || 'APROVADA',
        pd.notes || '',
      ];
    });
    partesData.push([
      '',
      'TOTAL',
      `${partesDiarias.length} boletim(ns)`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      partesDiarias.reduce((acc, p) => acc + (p.kmDriven || 0), 0),
      partesDiarias.reduce((acc, p) => acc + (p.kmConsidered ?? p.kmDriven ?? 0), 0),
      partesDiarias.reduce((acc, p) => acc + (p.trips?.length || 1), 0),
      '',
      '',
      '',
    ]);
    const wsPartes = XLSX.utils.aoa_to_sheet([partesHeader, ...partesData]);
    wsPartes['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 12 },
      { wch: 11 },
      { wch: 11 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 48 },
      { wch: 14 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPartes, '3_Partes_Diarias');

    // ABA 4: Viagens Extras
    const extrasHeader = [
      'Item',
      'Data da Viagem',
      'Placa do Veículo',
      'Trajeto / Itinerário / Turno Extra',
      'Tipo de Veículo',
      'Valor da Viagem Extra (R$)',
    ];
    const extrasData: (string | number)[][] = extraTrips.map((et, idx) => [
      idx + 1,
      formatDateBR(et.date),
      et.plate,
      et.route,
      et.vehicleType || '-',
      et.tripCost || 0,
    ]);
    extrasData.push(['', 'TOTAL', `${extraTrips.length} viagem(ns)`, '', '', totals.extraTripsTotal]);
    const wsExtras = XLSX.utils.aoa_to_sheet([extrasHeader, ...extrasData]);
    wsExtras['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 44 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsExtras, '4_Viagens_Extras');

    // ABA 5: KM Excedente
    const kmHeader = [
      'Item',
      'Período / Mês',
      'Placa',
      'Franquia Contratada (KM)',
      'KM Rodado Total',
      'KM Desconsiderado',
      'KM Considerado',
      'KM Excedido',
      'Tarifa KM Excedente (R$)',
      'Valor Total Excedente (R$)',
    ];
    const kmData: (string | number)[][] = excessKmItems.map((ek, idx) => [
      idx + 1,
      ek.periodMonth || '-',
      ek.plate,
      ek.franchiseKm || 0,
      ek.totalKmDriven || 0,
      ek.disregardedKm || 0,
      ek.consideredKm || 0,
      ek.excessKm || 0,
      ek.excessKmRate || 0,
      ek.totalValue || 0,
    ]);
    kmData.push([
      '',
      'TOTAL',
      '',
      excessKmItems.reduce((a, b) => a + (b.franchiseKm || 0), 0),
      excessKmItems.reduce((a, b) => a + (b.totalKmDriven || 0), 0),
      excessKmItems.reduce((a, b) => a + (b.disregardedKm || 0), 0),
      excessKmItems.reduce((a, b) => a + (b.consideredKm || 0), 0),
      excessKmItems.reduce((a, b) => a + (b.excessKm || 0), 0),
      '',
      totals.excessKmTotal,
    ]);
    const wsKm = XLSX.utils.aoa_to_sheet([kmHeader, ...kmData]);
    wsKm['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsKm, '5_KM_Excedente');

    // ABA 6: Débitos e Descontos
    const debitosHeader = ['Item', 'Data', 'Placa / Ref.', 'Descrição do Débito / Repasse', 'Natureza', 'Valor (R$)'];
    const debitosData: (string | number)[][] = deductions.map((d, idx) => [
      idx + 1,
      formatDateBR(d.date),
      d.plate || 'CONTRATO',
      d.description,
      d.type === 'CREDIT' ? 'CRÉDITO (+)' : 'DÉBITO (-)',
      d.type === 'CREDIT' ? d.value : -Math.abs(d.value),
    ]);
    debitosData.push(['', 'TOTAL', '', '', '', -Math.abs(totals.deductionsTotal)]);
    const wsDebitos = XLSX.utils.aoa_to_sheet([debitosHeader, ...debitosData]);
    wsDebitos['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 44 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsDebitos, '6_Debitos_Descontos');

    // ABA 7: Espelho de Faturamento, Emissão de Nota Fiscal (NFS-e) e Contas a Receber
    const placasAlocadas = client.leasedVehicles.map((v) => v.plate).join(', ') || '-';
    const discriminacaoNFSe = `FATURAMENTO REFERENTE À LOCAÇÃO DE VEÍCULOS E PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE — CONTRATO Nº ${client.contractNumber} — MEDIÇÃO Nº ${client.measurementNumber} — PERÍODO: ${formatDateBR(client.periodStart)} A ${formatDateBR(client.periodEnd)}. VEÍCULOS ALOCADOS (${client.leasedVehicles.length}): ${
      client.leasedVehicles
        .map((v) => `[${v.plate} - ${v.description} - ${v.workingDays}d - R$ ${(v.periodValue || 0).toFixed(2)}]`)
        .join('; ') || 'N/A'
    }. PARTES DIÁRIAS: ${partesDiarias.length} BOLETIM(NS). VIAGENS EXTRAS: R$ ${totals.extraTripsTotal.toFixed(2)}. KM EXCEDENTE: R$ ${totals.excessKmTotal.toFixed(2)}. DEDUÇÕES: -R$ ${totals.deductionsTotal.toFixed(2)}. VALOR BRUTO: R$ ${totals.grandTotal.toFixed(2)} | VALOR LÍQUIDO A RECEBER: R$ ${(inv.netValue || totals.grandTotal).toFixed(2)} — VENCIMENTO: ${formatDateBR(inv.nfDueDate || client.dueDate)}.`;

    const faturamentoRows = [
      ['ESPELHO PARA FATURAMENTO AO CLIENTE, EMISSÃO DE NOTA FISCAL (NFS-e) E CONTAS A RECEBER'],
      [],
      ['1. IDENTIFICAÇÃO DO PRESTADOR / LOCADORA DE VEÍCULOS'],
      ['Empresa Prestadora / Locadora', invoiceOverride?.providerCompany || 'VIAÇÃO SÃO SILVESTRE LTDA'],
      ['CNPJ do Prestador', invoiceOverride?.providerCnpj || '19.876.543/0001-10'],
      ['Código de Serviço / CNAE', '16.01 / 7711-0/00 - Locação de Veículos e Fretamento Contínuo'],
      ['Dados Bancários p/ Recebimento', invoiceOverride?.bankDetails || 'Banco Itaú (341) Ag. 3150 C/C 44890-2 · PIX CNPJ'],
      [],
      ['2. DADOS DO CLIENTE / TOMADOR PARA EMISSÃO DA NOTA FISCAL E FATURA'],
      ['Razão Social do Cliente', client.clientName],
      ['CNPJ do Cliente', client.cnpj],
      ['Número do Contrato', client.contractNumber],
      ['Número do Boletim de Medição', client.measurementNumber],
      ['Número da Fatura de Locação', `FAT-LOC-${client.measurementNumber}/2026`],
      ['Número da Nota Fiscal (NFS-e)', inv.nfNumber || 'A EMITIR PELO SETOR DE FATURAMENTO'],
      ['Data de Emissão da Fatura / NF', formatDateBR(inv.nfIssueDate || client.periodEnd)],
      ['Data de Vencimento (Contas a Receber)', formatDateBR(inv.nfDueDate || client.dueDate)],
      ['Período de Competência', `${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}`],
      ['Placas dos Veículos Alocados', placasAlocadas],
      [],
      ['3. COMPOSIÇÃO DO VALOR PARA FATURAMENTO E CONTAS A RECEBER'],
      ['Item de Faturamento', 'Base / Quantidade', 'Valor (R$)'],
      ['Locação de Veículos sob Contrato Fixo', `${client.leasedVehicles.length} veículo(s) (${placasAlocadas})`, totals.leasedTotal],
      ['Viagens Extras e Turnos Adicionais', `${extraTrips.length} viagem(ns)`, totals.extraTripsTotal],
      ['Quilometragem Excedente Apurada', `${excessKmItems.length} apuração(ões)`, totals.excessKmTotal],
      ['Deduções / Descontos Contratuais', `${deductions.length} lançamento(s)`, -Math.abs(totals.deductionsTotal)],
      ['VALOR BRUTO DA FATURA / NOTA FISCAL (R$)', '', totals.grandTotal],
      ['(-) Retenção PIS (0,65%)', '', invoiceOverride?.retentionPIS || 0],
      ['(-) Retenção COFINS (3,00%)', '', invoiceOverride?.retentionCOFINS || 0],
      ['(-) Retenção CSLL (1,00%)', '', invoiceOverride?.retentionCSLL || 0],
      ['(-) Retenção ISS (R$)', '', inv.retentionISS || 0],
      ['(-) Retenção INSS (R$)', '', inv.retentionINSS || 0],
      ['(-) Retenção IRRF (R$)', '', inv.retentionIR || 0],
      ['(=) VALOR LÍQUIDO DISPONÍVEL NO CONTAS A RECEBER (R$)', '', inv.netValue || totals.grandTotal],
      [],
      ['4. TEXTO PRONTO PARA DISCRIMINAÇÃO DOS SERVIÇOS NA NOTA FISCAL (COPIAR E COLAR)'],
      ['Discriminação Completa para NFS-e / Fatura', discriminacaoNFSe],
    ];
    const wsFaturamento = XLSX.utils.aoa_to_sheet(faturamentoRows);
    wsFaturamento['!cols'] = [{ wch: 44 }, { wch: 68 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsFaturamento, '7_Faturamento_e_NFSe');

    const safeClientName = (client.clientName || 'Cliente')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 35);
    const safeNumber = String(client.measurementNumber || '001').replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `Medicao_${safeNumber}_${safeClientName}.xlsx`);
  }
}
