import type { FuelRecord, Vehicle } from '@/types/fleet';

export interface FuelReportsKpis {
  totalCost: number;
  totalLiters: number;
  avgPricePerLiter: number;
  avgCostPerRecord: number;
  totalRecords: number;
  uniqueVehicles: number;
}

export function computeFuelReportsKpis(records: FuelRecord[]): FuelReportsKpis {
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalLiters = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
  return {
    totalCost,
    totalLiters,
    avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
    avgCostPerRecord: records.length > 0 ? totalCost / records.length : 0,
    totalRecords: records.length,
    uniqueVehicles: new Set(records.map((r) => r.vehicleId)).size,
  };
}

export interface FuelReportsPDFOptions {
  reportView: 'period' | 'vehicle' | 'worksite' | 'garage' | 'driver' | 'all';
  reportTitle?: string;
  fuelRecords: FuelRecord[];
  vehicles?: Vehicle[];
  kpis: FuelReportsKpis;
  filters: {
    startDate?: string;
    endDate?: string;
    vehicleId?: string;
    vehiclePlate?: string;
    driver?: string;
    station?: string;
    costCenter?: string;
    fuelType?: string;
    garageId?: string;
    garageName?: string;
  };
  company?: {
    name?: string;
    tradeName?: string;
    cnpj?: string;
    logoUrl?: string | null;
    phone?: string;
    email?: string;
    address?: string;
  };
  userName?: string;
}

function formatCurrency(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(val: number, decimals = 1): string {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  DIESEL: 'Diesel',
  FLEX: 'Flex',
};

function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function fetchLogoAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const viaImage = await loadImageAsBase64(url);
    if (viaImage) return viaImage;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Gera relatório de abastecimento (todos os tipos) no padrão OS corporativo.
 */
export async function generateFuelReportsPDF(options: FuelReportsPDFOptions) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 12;
  const marginRight = 12;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = 10;

  // Load logo
  let logoBase64: string | null = null;
  if (options.company?.logoUrl) {
    try { logoBase64 = await fetchLogoAsBase64(options.company.logoUrl); } catch { logoBase64 = null; }
  }

  // ── 1. CABEÇALHO INSTITUCIONAL ──
  const logoWidth = 32;
  const logoHeight = 14;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginLeft, y, logoWidth, logoHeight);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(options.company?.tradeName || options.company?.name || 'FROTA', marginLeft, y + 8);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(22, 101, 52);
    doc.text(options.company?.tradeName || options.company?.name || 'GESTÃO DE FROTAS', marginLeft, y + 6);
  }

  const companyTextX = logoBase64 ? marginLeft + logoWidth + 4 : marginLeft;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(options.company?.name || 'SISTEMA DE GESTÃO DE FROTAS', companyTextX, y + (logoBase64 ? 4 : 10));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const cnpjText = options.company?.cnpj ? `CNPJ: ${options.company.cnpj}` : 'CONTROLE OPERACIONAL DE ABASTECIMENTO';
  const contactText = [options.company?.phone, options.company?.email].filter(Boolean).join(' • ');
  doc.text(cnpjText + (contactText ? ` • ${contactText}` : ''), companyTextX, y + (logoBase64 ? 8.5 : 14));
  if (options.company?.address) {
    doc.text(options.company.address, companyTextX, y + (logoBase64 ? 12.5 : 18));
  }

  // Título e badge
  const VIEW_LABELS: Record<string, string> = {
    period: 'ANÁLISE POR PERÍODO',
    vehicle: 'ANÁLISE POR VEÍCULO',
    worksite: 'ANÁLISE POR OBRA / SETOR',
    garage: 'ANÁLISE POR POSTO / GARAGEM',
    driver: 'ANÁLISE POR MOTORISTA',
    all: 'RELATÓRIO GERAL CONSOLIDADO',
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text(options.reportTitle || 'RELATÓRIO DE ABASTECIMENTOS INTERNOS', pageWidth - marginRight, y + 4, { align: 'right' });

  const badgeText = VIEW_LABELS[options.reportView] || 'CONSOLIDADO';
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(187, 247, 208);
  const badgeWidth = 50;
  const badgeHeight = 5.5;
  const badgeX = pageWidth - marginRight - badgeWidth;
  const badgeY = y + 6;
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.text(badgeText, badgeX + badgeWidth / 2, badgeY + 3.8, { align: 'center' });

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const protocol = `REL-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo: ${protocol} • Emissão: ${dateStr}`, pageWidth - marginRight, y + 16, { align: 'right' });

  y += 20;

  // Linha verde
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 4;

  // ── 2. FILTROS APLICADOS ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, y, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('PARÂMETROS DO RELATÓRIO:', marginLeft + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  const filterItems: string[] = [];
  if (options.filters.startDate) filterItems.push(`De: ${fmtDate(options.filters.startDate)}`);
  if (options.filters.endDate) filterItems.push(`Até: ${fmtDate(options.filters.endDate)}`);
  if (options.filters.garageName && options.filters.garageName !== 'ALL') {
    filterItems.push(`Garagem: ${options.filters.garageName}`);
  }
  filterItems.push(`Veículo: ${options.filters.vehicleId === 'ALL' || !options.filters.vehicleId ? 'Todos' : options.filters.vehiclePlate || options.filters.vehicleId}`);
  filterItems.push(`Motorista: ${options.filters.driver === 'ALL' || !options.filters.driver ? 'Todos' : options.filters.driver}`);
  filterItems.push(`Combustível: ${options.filters.fuelType === 'ALL' || !options.filters.fuelType ? 'Todos' : FUEL_LABELS[options.filters.fuelType] || options.filters.fuelType}`);
  if (options.filters.costCenter && options.filters.costCenter !== 'ALL') {
    filterItems.push(`Setor: ${options.filters.costCenter}`);
  }
  if (options.userName) filterItems.push(`Operador: ${options.userName}`);

  doc.text(filterItems.join('  |  '), marginLeft + 3, y + 8);
  y += 13;

  // ── 3. GRADE DE KPIs ──
  const kpis = [
    { label: 'REGISTROS', value: String(options.kpis.totalRecords), color: '#1e293b' },
    { label: 'CUSTO TOTAL', value: formatCurrency(options.kpis.totalCost), color: '#15803d' },
    { label: 'VOLUME TOTAL', value: `${formatNumber(options.kpis.totalLiters)} L`, color: '#0369a1' },
    { label: 'PREÇO MÉDIO / L', value: `R$ ${options.kpis.avgPricePerLiter.toFixed(3)}`, color: '#b45309' },
    { label: 'CUSTO MÉDIO', value: formatCurrency(options.kpis.avgCostPerRecord), color: '#6b21a8' },
    { label: 'VEÍCULOS', value: String(options.kpis.uniqueVehicles), color: '#0f766e' },
  ];

  const kpiCols = 6;
  const kpiGap = 2;
  const kpiWidth = (contentWidth - (kpiGap * (kpiCols - 1))) / kpiCols;
  const kpiHeight = 12;

  kpis.forEach((kpi, index) => {
    const kpiX = marginLeft + index * (kpiWidth + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kpiX, y, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFillColor(kpi.color);
    doc.rect(kpiX, y + 1.5, 1, kpiHeight - 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 2.5, y + 3.8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(kpi.color);
    doc.text(kpi.value, kpiX + 2.5, y + 9);
  });

  y += kpiHeight + 6;

  // ── 4. CONTEÚDO POR TIPO DE VISUALIZAÇÃO ──

  if (options.reportView === 'period') {
    // Agrupamento por mês
    const monthMap = new Map<string, { cost: number; liters: number; count: number }>();
    options.fuelRecords.forEach(r => {
      const key = r.date?.substring(0, 7) || 'sem-data';
      const cur = monthMap.get(key) || { cost: 0, liters: 0, count: 0 };
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      cur.count += 1;
      monthMap.set(key, cur);
    });

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const periodRows = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => {
        const [y2, m] = month.split('-');
        const label = `${monthNames[parseInt(m, 10) - 1]}/${y2?.slice(2) || ''}`;
        const avgPrice = d.liters > 0 ? d.cost / d.liters : 0;
        return [label, String(d.count), `${formatNumber(d.liters)} L`, formatCurrency(avgPrice), formatCurrency(d.cost)];
      });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('CONSOLIDAÇÃO MENSAL DE ABASTECIMENTO', marginLeft, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Mês/Ano', 'Abastec.', 'Volume (L)', 'Preço Médio / L', 'Custo Total']],
      body: periodRows,
      foot: [['TOTAL', String(options.kpis.totalRecords), `${formatNumber(options.kpis.totalLiters)} L`,
        `R$ ${options.kpis.avgPricePerLiter.toFixed(3)}`, formatCurrency(options.kpis.totalCost)]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { halign: 'right', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 40 },
        4: { halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

  } else if (options.reportView === 'vehicle') {
    // Por veículo
    const vehicleMap = new Map<string, { cost: number; liters: number; count: number; model: string }>();
    options.fuelRecords.forEach(r => {
      const plate = r.vehiclePlate || r.vehicleId || 'N/I';
      const cur = vehicleMap.get(plate) || { cost: 0, liters: 0, count: 0, model: r.vehicleModel || '' };
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      cur.count += 1;
      vehicleMap.set(plate, cur);
    });

    const vehicleRows = Array.from(vehicleMap.entries())
      .sort(([, a], [, b]) => b.cost - a.cost)
      .map(([plate, d]) => [
        plate,
        d.model || '—',
        String(d.count),
        `${formatNumber(d.liters)} L`,
        d.liters > 0 ? `R$ ${(d.cost / d.liters).toFixed(3)}` : '—',
        formatCurrency(d.cost),
      ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ANÁLISE DE ABASTECIMENTO POR VEÍCULO', marginLeft, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Placa', 'Modelo', 'Abastec.', 'Volume (L)', 'Preço Médio/L', 'Custo Total']],
      body: vehicleRows,
      foot: [['TOTAL', `${options.kpis.uniqueVehicles} veículos`, String(options.kpis.totalRecords),
        `${formatNumber(options.kpis.totalLiters)} L`, `R$ ${options.kpis.avgPricePerLiter.toFixed(3)}`,
        formatCurrency(options.kpis.totalCost)]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

  } else if (options.reportView === 'worksite') {
    // Por obra/setor (costCenter)
    const sectorMap = new Map<string, { cost: number; liters: number; count: number }>();
    options.fuelRecords.forEach(r => {
      const sector = (r as any).costCenter || r.obraName || 'Não informado';
      const cur = sectorMap.get(sector) || { cost: 0, liters: 0, count: 0 };
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      cur.count += 1;
      sectorMap.set(sector, cur);
    });

    const sectorRows = Array.from(sectorMap.entries())
      .sort(([, a], [, b]) => b.cost - a.cost)
      .map(([sector, d]) => [
        sector,
        String(d.count),
        `${formatNumber(d.liters)} L`,
        formatCurrency(d.cost),
        `${((d.cost / options.kpis.totalCost) * 100).toFixed(1)}%`,
      ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ANÁLISE POR OBRA / SETOR DE CUSTO', marginLeft, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Obra / Setor', 'Abastec.', 'Volume (L)', 'Custo Total', '% do Total']],
      body: sectorRows,
      foot: [['TOTAL', String(options.kpis.totalRecords), `${formatNumber(options.kpis.totalLiters)} L`,
        formatCurrency(options.kpis.totalCost), '100%']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 35, textColor: [22, 101, 52], fontStyle: 'bold' },
        4: { halign: 'right', cellWidth: 22 },
      },
      margin: { left: marginLeft, right: marginRight },
    });

  } else if (options.reportView === 'garage') {
    // Por posto/garagem (station)
    const stationMap = new Map<string, { cost: number; liters: number; count: number }>();
    options.fuelRecords.forEach(r => {
      const station = r.station || 'Não informado';
      const cur = stationMap.get(station) || { cost: 0, liters: 0, count: 0 };
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      cur.count += 1;
      stationMap.set(station, cur);
    });

    const stationRows = Array.from(stationMap.entries())
      .sort(([, a], [, b]) => b.liters - a.liters)
      .map(([station, d]) => [
        station,
        String(d.count),
        `${formatNumber(d.liters)} L`,
        d.liters > 0 ? formatCurrency(d.cost / d.liters) : '—',
        formatCurrency(d.cost),
      ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ANÁLISE POR POSTO / GARAGEM', marginLeft, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Posto / Garagem', 'Abastec.', 'Volume (L)', 'Preço Médio / L', 'Custo Total']],
      body: stationRows,
      foot: [['TOTAL', String(options.kpis.totalRecords), `${formatNumber(options.kpis.totalLiters)} L`,
        `R$ ${options.kpis.avgPricePerLiter.toFixed(3)}`, formatCurrency(options.kpis.totalCost)]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

  } else if (options.reportView === 'driver') {
    // Por motorista
    const driverMap = new Map<string, { cost: number; liters: number; count: number }>();
    options.fuelRecords.forEach(r => {
      const name = typeof r.driver === 'string' ? r.driver : ((r.driver as any)?.name || 'Não informado');
      const cur = driverMap.get(name) || { cost: 0, liters: 0, count: 0 };
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      cur.count += 1;
      driverMap.set(name, cur);
    });

    const driverRows = Array.from(driverMap.entries())
      .sort(([, a], [, b]) => b.cost - a.cost)
      .map(([name, d]) => [
        name,
        String(d.count),
        `${formatNumber(d.liters)} L`,
        d.liters > 0 ? formatCurrency(d.cost / d.liters) : '—',
        formatCurrency(d.cost),
      ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ANÁLISE POR MOTORISTA', marginLeft, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Motorista', 'Abastec.', 'Volume (L)', 'Preço Médio / L', 'Custo Total']],
      body: driverRows,
      foot: [['TOTAL', String(options.kpis.totalRecords), `${formatNumber(options.kpis.totalLiters)} L`,
        `R$ ${options.kpis.avgPricePerLiter.toFixed(3)}`, formatCurrency(options.kpis.totalCost)]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });

  } else {
    // Relatório geral / todos — tabela analítica detalhada
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('LANÇAMENTOS INDIVIDUAIS DE ABASTECIMENTO', marginLeft, y);
    y += 2;

    const detailRows = options.fuelRecords.map(r => [
      fmtDate(r.date),
      r.vehiclePlate || '—',
      FUEL_LABELS[r.fuelType] || r.fuelType,
      r.station || '—',
      typeof r.driver === 'string' ? r.driver : ((r.driver as any)?.name || '—'),
      `${formatNumber(r.quantity || 0)} L`,
      (r.mileage || 0).toLocaleString('pt-BR'),
      formatCurrency(r.cost || 0),
    ]);

    const detailFoot = [['TOTAIS', `${options.kpis.totalRecords} reg.`, '', '', '',
      `${formatNumber(options.kpis.totalLiters)} L`, '', formatCurrency(options.kpis.totalCost)]];

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Placa', 'Combustível', 'Posto', 'Motorista', 'Litros', 'KM', 'Total (R$)']],
      body: detailRows,
      foot: detailFoot,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.6, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 18 },
        3: { cellWidth: 36 },
        4: { cellWidth: 30 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });
  }

  // ── 5. RODAPÉ COM PAGINAÇÃO (PADRÃO OS) ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 9, pageWidth - marginRight, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      (options.company?.name || 'FluxBus') + ' • Gestão Integrada de Frotas & Operações',
      marginLeft,
      pageHeight - 5,
    );
    doc.text(
      'Documento corporativo oficial • Emissão automatizada via sistema',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' },
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, pageHeight - 5, { align: 'right' });
  }

  return doc;
}

/**
 * Faz o download direto do PDF gerado.
 */
export async function downloadFuelReportsPDF(options: FuelReportsPDFOptions): Promise<void> {
  const doc = await generateFuelReportsPDF(options);
  const baseName = options.reportTitle
    ? options.reportTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
    : 'relatorio-abastecimentos-internos';
  const filename = `${baseName}-${options.reportView}-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Abre o PDF em nova aba para visualização/impressão.
 */
export async function previewFuelReportsPDF(options: FuelReportsPDFOptions): Promise<void> {
  const doc = await generateFuelReportsPDF(options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
