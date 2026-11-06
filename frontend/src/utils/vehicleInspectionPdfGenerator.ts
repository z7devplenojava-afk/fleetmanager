import jsPDF from 'jspdf';
import { VehicleInspection } from '@/services/vehicleInspectionService';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

/**
 * Cria o logo institucional oficial da Viação São Silvestre em Base64
 */
function createVssLogoBadgeBase64(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fundo azul escuro da Viação São Silvestre
    ctx.fillStyle = '#10162F';
    ctx.beginPath();
    ctx.roundRect(4, 4, 152, 62, 8);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto institucional
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('VIAÇÃO', 16, 26);
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('SÃO SILVESTRE', 16, 44);

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

/**
 * Carrega uma imagem de URL externa para DataURL base64 para inclusão segura no jsPDF
 */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 300;
        canvas.height = img.height || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Gera o documento oficial do LAUDO DE INSPEÇÃO exatamente com o layout da imagem
 */
export async function generateVehicleInspectionPDF(
  inspection: VehicleInspection,
  companyLogoUrl?: string | null
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const marginX = 10;
  const contentWidth = 190;
  let currentY = 10;

  // Cor das bordas das tabelas (preto técnico)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);

  // ==========================================
  // 1. CABEÇALHO (LOGO | TÍTULO | REGISTRO & KM)
  // ==========================================
  const headerHeight = 20;
  const colLogoWidth = 42;
  const colTitleWidth = 88;
  const colRegWidth = 60;

  // Caixa esquerda: Logo
  doc.rect(marginX, currentY, colLogoWidth, headerHeight);
  let resolvedLogo = companyLogoUrl ? resolveCompanyLogoUrl(companyLogoUrl) : null;
  let logoBase64: string | null = null;
  if (resolvedLogo) {
    logoBase64 = await loadImageAsDataUrl(resolvedLogo);
  }
  if (!logoBase64) {
    logoBase64 = createVssLogoBadgeBase64();
  }
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX + 3, currentY + 2.5, colLogoWidth - 6, headerHeight - 5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('VIAÇÃO\nSÃO SILVESTRE', marginX + 5, currentY + 8);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('VIAÇÃO SÃO SILVESTRE', marginX + 5, currentY + 11);
  }

  // Caixa central: Título "LAUDO DE INSPEÇÃO"
  doc.rect(marginX + colLogoWidth, currentY, colTitleWidth, headerHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('LAUDO DE INSPEÇÃO', marginX + colLogoWidth + colTitleWidth / 2, currentY + 12, {
    align: 'center',
  });

  // Caixa direita: Nº REGISTRO & KM - HORAS
  doc.rect(marginX + colLogoWidth + colTitleWidth, currentY, colRegWidth, headerHeight);
  doc.line(
    marginX + colLogoWidth + colTitleWidth,
    currentY + headerHeight / 2,
    marginX + contentWidth,
    currentY + headerHeight / 2
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const regText = `N REGISTRO: ${inspection.registryNumber || '14598'}`;
  doc.text(regText, marginX + colLogoWidth + colTitleWidth + colRegWidth / 2, currentY + 6.5, {
    align: 'center',
  });

  const kmVal = inspection.currentMileage != null ? inspection.currentMileage : 7000;
  const hrsVal = inspection.horimeterHours ? ` - ${inspection.horimeterHours}` : ' - 215HRS';
  const kmText = `KM: ${kmVal}${hrsVal}`;
  doc.text(kmText, marginX + colLogoWidth + colTitleWidth + colRegWidth / 2, currentY + 16.5, {
    align: 'center',
  });

  currentY += headerHeight;

  // ==========================================
  // 2. DADOS PRINCIPAIS (OBRA | PLACA | DATA)
  // ==========================================
  const infoRowHeight = 9;
  const colObraWidth = 65;
  const colPlacaWidth = 65;
  const colDataWidth = 60;

  doc.rect(marginX, currentY, colObraWidth, infoRowHeight);
  doc.rect(marginX + colObraWidth, currentY, colPlacaWidth, infoRowHeight);
  doc.rect(marginX + colObraWidth + colPlacaWidth, currentY, colDataWidth, infoRowHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`OBRA: ${inspection.projectName || 'VALE'}`, marginX + 3, currentY + 6);
  doc.text(`PLACA: ${inspection.vehiclePlate || 'UVG3H03'}`, marginX + colObraWidth + 3, currentY + 6);
  doc.text(`DATA: ${formatDateBR(inspection.inspectionDate)}`, marginX + colObraWidth + colPlacaWidth + 3, currentY + 6);

  currentY += infoRowHeight;

  // ==========================================
  // 3. DESCRIÇÃO DO PROBLEMA
  // ==========================================
  const probHeight = 18;
  doc.rect(marginX, currentY, contentWidth, probHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DESCRIÇÃO DO PROBLEMA', marginX + 3, currentY + 4.5);

  const probLines = (inspection.problemDescription || '1- MANUTENÇÃO PREVENTIVA\n2-\n3-').split('\n');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  let py = currentY + 8.5;
  for (let i = 0; i < Math.min(probLines.length, 3); i++) {
    doc.text(probLines[i] || `${i + 1}-`, marginX + 3, py);
    py += 4;
  }

  currentY += probHeight;

  // ==========================================
  // 4. DESCRIÇÃO DO OCORRIDO
  // ==========================================
  const ocorridoHeight = 7.5;
  const colOcorridoTitleWidth = 65;
  const colOcorridoValWidth = 125;

  doc.rect(marginX, currentY, colOcorridoTitleWidth, ocorridoHeight);
  doc.rect(marginX + colOcorridoTitleWidth, currentY, colOcorridoValWidth, ocorridoHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DESCRIÇÃO DO OCORRIDO', marginX + 3, currentY + 5);

  doc.text(
    (inspection.occurrenceDescription || 'PREVENTIVA MENSAL').toUpperCase(),
    marginX + colOcorridoTitleWidth + colOcorridoValWidth / 2,
    currentY + 5,
    { align: 'center' }
  );

  currentY += ocorridoHeight;

  // ==========================================
  // 5. CLIENTE & EXECUÇÃO
  // ==========================================
  const clientHeight = 7.5;
  const colClientWidth = 95;
  const colExecWidth = 95;

  doc.rect(marginX, currentY, colClientWidth, clientHeight);
  doc.rect(marginX + colClientWidth, currentY, colExecWidth, clientHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`CLIENTE: ${inspection.clientName || 'MSM'}`, marginX + 3, currentY + 5);
  doc.text(
    `EXECUÇÃO: ${inspection.executionTeam || 'VAGNER SABINO / JAIRO'}`,
    marginX + colClientWidth + 3,
    currentY + 5
  );

  currentY += clientHeight;

  // ==========================================
  // 6. SERVIÇO REALIZADO (COM DESTAQUES CONFORME IMAGEM)
  // ==========================================
  const servHeight = 35;
  doc.rect(marginX, currentY, contentWidth, servHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SERVIÇO REALIZADO:', marginX + 3, currentY + 4.5);

  const servText =
    inspection.servicesPerformed ||
    'conferiu barras e ponteiras de direção, conferiu coifa e mangas de eixo, conferiu vazamentos hidraulicos, conferiu fixação dos mangotes, conferiu óleo motor, caixa e diferencial, conferiu cuícas, lonas e catracas de freio, regulou freio em geral, conferiu folgas do eixo S, conferiu vazamentos pneumáticos, conferiu cubos, conferiu freio de estacionamento, conferiu amortecedores e estabilizadores, lubrificou todo veiculo, conferiu pinos de centro e feixe de molas, conferiu rolamento de centro, conferiu flange da caixa de cambio, conferiu cruzeta, conferiu embreagem, conferiu eixo cardan, conferiu níveis de óleo e água, trocou filtro de ar, conferiu parte eletrica, conferiu sistema de registro de velocidade, conferiu pneus e calibração e aperto dos parafusos, conferiu sistema de fechamento de porta malas, conferiu motor, conferiu carroceria, conferiu ar condicionado.';

  // Quebra linhas mantendo legibilidade profissional
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const splitServ = doc.splitTextToSize(servText, contentWidth - 6);
  doc.text(splitServ, marginX + 3, currentY + 8.5);

  currentY += servHeight;

  // ==========================================
  // 7. PEÇAS TROCADAS
  // ==========================================
  const pecasHeight = 7.5;
  doc.rect(marginX, currentY, contentWidth, pecasHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const pecasText = `PEÇAS TROCADAS: ${inspection.partsReplaced || inspection.partsUsed || 'Descritas acima.'}`;
  doc.text(pecasText, marginX + 3, currentY + 5);

  currentY += pecasHeight;

  // ==========================================
  // 8. EVIDÊNCIAS FOTOGRÁFICAS (MOSAICO 2x4 - 8 FOTOS)
  // ==========================================
  const evidTitleHeight = 6.5;
  doc.rect(marginX, currentY, contentWidth, evidTitleHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EVIDÊNCIAS', marginX + contentWidth / 2, currentY + 4.5, { align: 'center' });
  currentY += evidTitleHeight;

  // Processa as 8 fotos
  let photosArray: string[] = [];
  if (inspection.evidencesUrls) {
    try {
      const parsed = JSON.parse(inspection.evidencesUrls);
      if (Array.isArray(parsed)) {
        photosArray = parsed;
      } else if (typeof parsed === 'string') {
        photosArray = [parsed];
      }
    } catch {
      photosArray = inspection.evidencesUrls.split(',').map((u) => u.trim()).filter(Boolean);
    }
  }

  const gridCols = 4;
  const gridRows = 2;
  const photoW = contentWidth / gridCols; // 47.5 mm
  const photoH = 34; // 34 mm cada foto -> total 68 mm

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const index = row * gridCols + col;
      const x = marginX + col * photoW;
      const y = currentY + row * photoH;

      doc.rect(x, y, photoW, photoH);

      const rawPhoto = photosArray[index];
      let photoDataUrl: string | null = null;
      if (rawPhoto) {
        photoDataUrl = await loadImageAsDataUrl(rawPhoto);
      }

      if (photoDataUrl) {
        try {
          doc.addImage(photoDataUrl, 'JPEG', x + 0.5, y + 0.5, photoW - 1, photoH - 1);
        } catch {
          drawPlaceholderPhoto(doc, x, y, photoW, photoH, index + 1);
        }
      } else {
        drawPlaceholderPhoto(doc, x, y, photoW, photoH, index + 1);
      }
    }
  }

  currentY += gridRows * photoH;

  // ==========================================
  // 9. DECLARAÇÃO DE CONCLUSÃO & LIBERAÇÃO
  // ==========================================
  const declHeight = 22;
  doc.rect(marginX, currentY, contentWidth, declHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    'DECLARO QUE O VEÍCULO FOI INSPECIONADO POR MIM COM SEGUINTE CONCLUSÃO',
    marginX + contentWidth / 2,
    currentY + 4.5,
    { align: 'center' }
  );

  const isSemRestricao =
    !inspection.releaseStatus || inspection.releaseStatus === 'LIBERADO_SEM_RESTRICAO';
  const isComRestricao = inspection.releaseStatus === 'LIBERADO_COM_RESTRICAO';
  const isNaoLiberado = inspection.releaseStatus === 'NAO_LIBERADO';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `( ${isSemRestricao ? 'X' : ' '} ) EQUIPAMENTO LIBERADO SEM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA`,
    marginX + 4,
    currentY + 9.5
  );
  doc.text(
    `( ${isComRestricao ? 'X' : ' '} ) EQUIPAMENTO LIBERADO COM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA`,
    marginX + 4,
    currentY + 14.5
  );
  doc.text(
    `( ${isNaoLiberado ? 'X' : ' '} ) EQUIPAMENTO NÃO LIBERADO PARA OPERAÇÃO`,
    marginX + 4,
    currentY + 19.5
  );

  currentY += declHeight;

  // ==========================================
  // 10. DESCREVER A RESTRIÇÃO
  // ==========================================
  const restrHeight = 11;
  doc.rect(marginX, currentY, contentWidth, restrHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const restrText = `DESCREVER A RESTRIÇÃO: ${inspection.restrictionDescription || 'Sem restrição.'}`;
  doc.text(restrText, marginX + 3, currentY + 7);

  currentY += restrHeight;

  // ==========================================
  // 11. ASSINATURAS (GERENTE MANUTENÇÃO | ENGENHEIRO MECÂNICO)
  // ==========================================
  const signHeight = 16;
  const colSignWidth = 95;

  doc.rect(marginX, currentY, colSignWidth, signHeight);
  doc.rect(marginX + colSignWidth, currentY, colSignWidth, signHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const gerenteText = `GERENTE MANUTENÇÃO: ${inspection.managerName || inspection.supervisorName || ''}`;
  doc.text(gerenteText, marginX + 3, currentY + 6);

  const engText = `ENGENHEIRO MECÂNICO: ${inspection.engineerName || inspection.inspectorName || ''}`;
  doc.text(engText, marginX + colSignWidth + 3, currentY + 6);

  return doc.output('blob');
}

function drawPlaceholderPhoto(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  num: number
): void {
  doc.setFillColor(245, 245, 245);
  doc.rect(x + 0.5, y + 0.5, w - 1, h - 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`[ Evidência Fotográfica ${num} ]`, x + w / 2, y + h / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

/**
 * Abre o PDF do Laudo em nova aba para visualização
 */
export async function openVehicleInspectionPDFPreview(
  inspection: VehicleInspection,
  companyLogoUrl?: string | null
): Promise<void> {
  const blob = await generateVehicleInspectionPDF(inspection, companyLogoUrl);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/**
 * Dispara o download direto do PDF do Laudo
 */
export async function downloadVehicleInspectionPDF(
  inspection: VehicleInspection,
  companyLogoUrl?: string | null
): Promise<void> {
  const blob = await generateVehicleInspectionPDF(inspection, companyLogoUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const regClean = (inspection.registryNumber || '14598').replace(/[^a-zA-Z0-9-_]/g, '');
  const plateClean = (inspection.vehiclePlate || 'VEICULO').replace(/[^a-zA-Z0-9-_]/g, '');
  a.href = url;
  a.download = `laudo-inspecao-${regClean}-${plateClean}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
