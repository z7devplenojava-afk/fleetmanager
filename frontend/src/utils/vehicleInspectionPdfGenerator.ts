import jsPDF from 'jspdf';
import { VehicleInspection } from '@/services/vehicleInspectionService';
import { resolveCompanyLogoUrl, getStoredCompanyBranding } from '@/utils/logoUtils';

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

/**
 * Cria o selo institucional oficial da Viação São Silvestre em Base64 (fallback caso não haja arquivo de imagem)
 */
function createVssLogoBadgeBase64(companyName = 'VIAÇÃO SÃO SILVESTRE'): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const grad = ctx.createLinearGradient(0, 0, 320, 140);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(4, 4, 312, 132, 16);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Círculo de destaque à esquerda
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(48, 70, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VSS', 48, 70);

    // Texto institucional
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('VIAÇÃO', 92, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(
      companyName.toUpperCase().replace(/^VIA[CÇ][AÃ]O\s+/i, '').substring(0, 16) || 'SÃO SILVESTRE',
      92,
      82
    );

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

/**
 * Carrega uma imagem de URL ou DataURL para Base64 PNG/JPEG com suas dimensões originais
 */
async function loadImageWithDimensions(
  url: string,
  asPng = false
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url || typeof url !== 'string') return null;

  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'Anonymous';
    }
    const timer = window.setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const w = img.naturalWidth || img.width || 300;
        const h = img.naturalHeight || img.height || 150;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = asPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88);
        resolve({ dataUrl, width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Resolve e carrega a Logomarca Oficial da Empresa cadastrada no sistema
 * (priorizando `logoUrl` da empresa para relatórios horizontais, depois `iconUrl` e `/logo.png`)
 */
async function resolveAndLoadCompanyLogo(
  explicitLogoUrl?: string | null
): Promise<{ dataUrl: string; width: number; height: number }> {
  const storedBranding = getStoredCompanyBranding();
  let companyName = 'VIAÇÃO SÃO SILVESTRE';
  const candidates: string[] = [];

  if (explicitLogoUrl) candidates.push(explicitLogoUrl);
  if (storedBranding.logoUrl) candidates.push(storedBranding.logoUrl);

  try {
    const rawEmpresa = localStorage.getItem('empresa') || localStorage.getItem('company');
    if (rawEmpresa) {
      const parsed = JSON.parse(rawEmpresa);
      if (parsed?.name || parsed?.razaoSocial || parsed?.nomeFantasia) {
        companyName = parsed.nomeFantasia || parsed.name || parsed.razaoSocial;
      }
      if (parsed?.logoUrl) candidates.push(parsed.logoUrl);
      if (parsed?.logo) candidates.push(parsed.logo);
      if (parsed?.logo_url) candidates.push(parsed.logo_url);
      if (parsed?.iconUrl) candidates.push(parsed.iconUrl);
    }
  } catch {
    // ignore
  }

  if (storedBranding.iconUrl) candidates.push(storedBranding.iconUrl);
  if (typeof window !== 'undefined') {
    candidates.push(`${window.location.origin}/logo.png`);
  }

  for (const rawCandidate of candidates) {
    if (!rawCandidate) continue;
    const resolved =
      rawCandidate.startsWith('data:') || rawCandidate.startsWith('http')
        ? rawCandidate
        : resolveCompanyLogoUrl(rawCandidate) || rawCandidate;
    if (!resolved) continue;

    const loaded = await loadImageWithDimensions(resolved, true);
    if (loaded && loaded.dataUrl) {
      return loaded;
    }
  }

  return {
    dataUrl: createVssLogoBadgeBase64(companyName),
    width: 320,
    height: 140,
  };
}

/**
 * Gera o documento oficial do LAUDO DE INSPEÇÃO com a logomarca da empresa e até 10 evidências
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
  // 1. CABEÇALHO (LOGOMARCA DA EMPRESA | TÍTULO | REGISTRO & KM)
  // ==========================================
  const headerHeight = 20;
  const colLogoWidth = 44;
  const colTitleWidth = 86;
  const colRegWidth = 60;

  // Caixa esquerda: Logomarca da Empresa
  doc.rect(marginX, currentY, colLogoWidth, headerHeight);
  const logoObj = await resolveAndLoadCompanyLogo(companyLogoUrl);
  if (logoObj && logoObj.dataUrl) {
    try {
      const maxW = colLogoWidth - 4;
      const maxH = headerHeight - 3;
      const ratio = logoObj.width / Math.max(1, logoObj.height);
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const offsetX = marginX + (colLogoWidth - drawW) / 2;
      const offsetY = currentY + (headerHeight - drawH) / 2;
      doc.addImage(logoObj.dataUrl, 'PNG', offsetX, offsetY, drawW, drawH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('VIAÇÃO\nSÃO SILVESTRE', marginX + 4, currentY + 8);
    }
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
  // 6. SERVIÇO REALIZADO
  // ==========================================
  const servHeight = 35;
  doc.rect(marginX, currentY, contentWidth, servHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SERVIÇO REALIZADO:', marginX + 3, currentY + 4.5);

  const servText =
    inspection.servicesPerformed ||
    'conferiu barras e ponteiras de direção, conferiu coifa e mangas de eixo, conferiu vazamentos hidraulicos, conferiu fixação dos mangotes, conferiu óleo motor, caixa e diferencial, conferiu cuícas, lonas e catracas de freio, regulou freio em geral, conferiu folgas do eixo S, conferiu vazamentos pneumáticos, conferiu cubos, conferiu freio de estacionamento, conferiu amortecedores e estabilizadores, lubrificou todo veiculo, conferiu pinos de centro e feixe de molas, conferiu rolamento de centro, conferiu flange da caixa de cambio, conferiu cruzeta, conferiu embreagem, conferiu eixo cardan, conferiu níveis de óleo e água, trocou filtro de ar, conferiu parte eletrica, conferiu sistema de registro de velocidade, conferiu pneus e calibração e aperto dos parafusos, conferiu sistema de fechamento de porta malas, conferiu motor, conferiu carroceria, conferiu ar condicionado.';

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
  // 8. EVIDÊNCIAS FOTOGRÁFICAS (ATÉ 10 FOTOS)
  // ==========================================
  const evidTitleHeight = 6.5;
  doc.rect(marginX, currentY, contentWidth, evidTitleHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EVIDÊNCIAS', marginX + contentWidth / 2, currentY + 4.5, { align: 'center' });
  currentY += evidTitleHeight;

  let photosArray: string[] = [];
  if (inspection.evidencesUrls) {
    try {
      const parsed = JSON.parse(inspection.evidencesUrls);
      if (Array.isArray(parsed)) {
        photosArray = parsed.filter(Boolean).slice(0, 10);
      } else if (typeof parsed === 'string') {
        photosArray = [parsed];
      }
    } catch {
      photosArray = inspection.evidencesUrls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, 10);
    }
  }

  // Se houver mais de 8 fotos (9 ou 10), usa grade 5x2; caso contrário 4x2
  const gridCols = photosArray.length > 8 ? 5 : 4;
  const gridRows = 2;
  const photoW = contentWidth / gridCols;
  const photoH = 34;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const index = row * gridCols + col;
      const x = marginX + col * photoW;
      const y = currentY + row * photoH;

      doc.rect(x, y, photoW, photoH);

      const rawPhoto = photosArray[index];
      let loadedPhoto: { dataUrl: string; width: number; height: number } | null = null;
      if (rawPhoto) {
        loadedPhoto = await loadImageWithDimensions(rawPhoto, false);
      }

      if (loadedPhoto && loadedPhoto.dataUrl) {
        try {
          doc.addImage(loadedPhoto.dataUrl, 'JPEG', x + 0.5, y + 0.5, photoW - 1, photoH - 1);
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
  // 11. ASSINATURAS (ENCARREGADO DE MANUTENÇÃO | MECÂNICO)
  // ==========================================
  const signHeight = 16;
  const colSignWidth = 95;

  doc.rect(marginX, currentY, colSignWidth, signHeight);
  doc.rect(marginX + colSignWidth, currentY, colSignWidth, signHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const encarregadoText = `ENCARREGADO DE MANUTENÇÃO: ${inspection.managerName || inspection.supervisorName || ''}`;
  doc.text(encarregadoText, marginX + 3, currentY + 6);

  const mecanicoText = `MECÂNICO: ${inspection.engineerName || inspection.inspectorName || ''}`;
  doc.text(mecanicoText, marginX + colSignWidth + 3, currentY + 6);

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
  doc.setFontSize(6.5);
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
