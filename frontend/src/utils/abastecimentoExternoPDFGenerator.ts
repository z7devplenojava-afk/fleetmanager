import type { FuelRecord } from '@/types/fleet';

export interface AbastecimentoExternoPDFOptions {
  reportType: 'executive' | 'detailed' | 'client' | 'vehicle' | 'station' | 'period';
  fuelRecords: FuelRecord[];
  stats: {
    count: number;
    totalCost: number;
    totalLiters: number;
    totalKm: number;
    avgConsumption: number;
    avgCostPerKm: number;
    avgPricePerLiter?: number;
  };
  clientSummary?: Array<{
    client: string;
    contracts: string;
    count: number;
    liters: number;
    km: number;
    avgConsumption: number;
    cost: number;
  }>;
  vehicleSummary?: Array<{
    plate: string;
    clients: string;
    count: number;
    liters: number;
    km: number;
    avgConsumption: number;
    cost: number;
  }>;
  stationSummary?: Array<{
    station: string;
    count: number;
    liters: number;
    avgPricePerLiter: number;
    cost: number;
    vehicles: string;
  }>;
  periodSummary?: Array<{
    date: string;
    formattedDate: string;
    count: number;
    liters: number;
    km: number;
    avgConsumption: number;
    avgPricePerLiter: number;
    cost: number;
    stations: string;
  }>;
  filters: {
    startDate?: string;
    endDate?: string;
    selectedClient?: string;
    selectedVehicle?: string;
    selectedStation?: string;
    sortDir?: string;
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

function formatNumber(val: number, decimals: number = 1): string {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Gera o documento jsPDF para o Relatório de Abastecimento Externo
 * no mesmo padrão visual corporativo e executivo da Ordem de Serviço (OS).
 */
export async function generateAbastecimentoExternoPDFDoc(options: AbastecimentoExternoPDFOptions) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 12;
  const marginRight = 12;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = 10;

  // Carregar logo se disponível
  let logoBase64: string | null = null;
  if (options.company?.logoUrl) {
    try {
      logoBase64 = await loadImageAsBase64(options.company.logoUrl);
    } catch {
      logoBase64 = null;
    }
  }

  // 1. CABEÇALHO INSTITUCIONAL (PADRÃO OS)
  const logoWidth = 32;
  const logoHeight = 14;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginLeft, y, logoWidth, logoHeight);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(options.company?.tradeName || options.company?.name || 'FLUXBUS', marginLeft, y + 8);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(22, 101, 52); // Verde corporativo
    doc.text(options.company?.tradeName || options.company?.name || 'FLUXBUS GESTÃO DE FROTAS', marginLeft, y + 6);
  }

  // Dados da Empresa (ao lado da logo)
  const companyTextX = logoBase64 ? marginLeft + logoWidth + 4 : marginLeft;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(options.company?.name || 'FLUXBUS - GESTÃO INTEGRADA DE FROTAS & OPERAÇÕES', companyTextX, y + (logoBase64 ? 4 : 10));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const cnpjText = options.company?.cnpj ? `CNPJ: ${options.company.cnpj}` : 'SISTEMA DE CONTROLE OPERACIONAL';
  const contactText = [options.company?.phone, options.company?.email].filter(Boolean).join(' • ');
  doc.text(cnpjText + (contactText ? ` • ${contactText}` : ''), companyTextX, y + (logoBase64 ? 8.5 : 14));
  if (options.company?.address) {
    doc.text(options.company.address, companyTextX, y + (logoBase64 ? 12.5 : 18));
  }

  // Lado Direito: Título do Documento e Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52); // Verde esmeralda escuro
  doc.text('RELATÓRIO DE ABASTECIMENTO EXTERNO', pageWidth - marginRight, y + 4, { align: 'right' });

  // Badge tipo de relatório
  const reportTypeLabels: Record<string, string> = {
    executive: 'CONSOLIDADO EXECUTIVO',
    period: 'CONSOLIDADO POR PERÍODO',
    detailed: 'ANALÍTICO DETALHADO',
    client: 'RESUMO POR CLIENTE',
    vehicle: 'RESUMO POR VEÍCULO',
    station: 'RESUMO POR POSTO',
  };
  const typeBadgeText = reportTypeLabels[options.reportType] || 'POSTOS EXTERNOS';

  doc.setFillColor(220, 252, 231); // Fundo verde claro
  doc.setDrawColor(187, 247, 208);
  const badgeWidth = 44;
  const badgeHeight = 5.5;
  const badgeX = pageWidth - marginRight - badgeWidth;
  const badgeY = y + 6;
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.text(typeBadgeText, badgeX + badgeWidth / 2, badgeY + 3.8, { align: 'center' });

  // Data e Protocolo
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const protocol = `EXT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo: ${protocol} • Emissão: ${dateStr}`, pageWidth - marginRight, y + 16, { align: 'right' });

  y += 20;

  // Linha divisória de destaque verde esmeralda
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 4;

  // 2. QUADRO DE FILTROS APLICADOS
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
  if (options.filters.startDate) {
    filterItems.push(`Início: ${new Date(options.filters.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}`);
  }
  if (options.filters.endDate) {
    filterItems.push(`Fim: ${new Date(options.filters.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`);
  }
  filterItems.push(`Cliente: ${options.filters.selectedClient === 'ALL' || !options.filters.selectedClient ? 'Todos' : options.filters.selectedClient}`);
  filterItems.push(`Veículo: ${options.filters.selectedVehicle === 'ALL' || !options.filters.selectedVehicle ? 'Todos' : options.filters.selectedVehicle}`);
  filterItems.push(`Posto: ${options.filters.selectedStation === 'ALL' || !options.filters.selectedStation ? 'Todos' : options.filters.selectedStation}`);
  if (options.userName) {
    filterItems.push(`Operador: ${options.userName}`);
  }

  doc.text(filterItems.join('  |  '), marginLeft + 3, y + 8);
  y += 13;

  // 3. GRADE DE INDICADORES / KPIS EXECUTIVOS (PADRÃO OS)
  const kpis = [
    { label: 'REGISTROS', value: String(options.stats.count), color: '#1e293b' },
    { label: 'CUSTO TOTAL', value: formatCurrency(options.stats.totalCost), color: '#15803d' },
    { label: 'VOLUME TOTAL', value: `${formatNumber(options.stats.totalLiters)} L`, color: '#0369a1' },
    { label: 'KM RODADOS', value: `${formatNumber(options.stats.totalKm, 0)} km`, color: '#475569' },
    { label: 'CONSUMO MÉDIO', value: options.stats.avgConsumption > 0 ? `${formatNumber(options.stats.avgConsumption, 2)} L/km` : '—', color: '#b45309' },
    { label: 'CUSTO MÉDIO / KM', value: formatCurrency(options.stats.avgCostPerKm), color: '#6b21a8' },
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

    // Barra de cor sutil na esquerda de cada card
    doc.setFillColor(kpi.color);
    doc.rect(kpiX, y + 1.5, 1, kpiHeight - 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 2.5, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color);
    doc.text(kpi.value, kpiX + 2.5, y + 9);
  });

  y += kpiHeight + 5;

  // 4. TABELAS DE DADOS CONFORME O TIPO DE RELATÓRIO
  if (options.reportType === 'executive') {
    // 4.1 Resumo por Cliente
    if (options.clientSummary && options.clientSummary.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('1. CONSOLIDAÇÃO POR CLIENTE E CONTRATO', marginLeft, y);
      y += 2;

      const clientHead = [['Cliente', 'Contrato(s)', 'Abastecimentos', 'Litros', 'KM Total', 'Consumo (L/km)', 'Custo Total']];
      const clientBody = options.clientSummary.map(c => [
        c.client,
        c.contracts || '—',
        String(c.count),
        `${formatNumber(c.liters)} L`,
        `${formatNumber(c.km, 0)} km`,
        c.avgConsumption > 0 ? formatNumber(c.avgConsumption, 2) : '—',
        formatCurrency(c.cost),
      ]);

      const clientFoot = [[
        'TOTAL GERAL',
        '',
        String(options.stats.count),
        `${formatNumber(options.stats.totalLiters)} L`,
        `${formatNumber(options.stats.totalKm, 0)} km`,
        options.stats.avgConsumption > 0 ? formatNumber(options.stats.avgConsumption, 2) : '—',
        formatCurrency(options.stats.totalCost),
      ]];

      autoTable(doc, {
        startY: y,
        head: clientHead,
        body: clientBody,
        foot: clientFoot,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 46 },
          1: { cellWidth: 32 },
          2: { halign: 'right', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', cellWidth: 24, textColor: [22, 101, 52], fontStyle: 'bold' },
        },
        margin: { left: marginLeft, right: marginRight },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // 4.2 Resumo por Veículo
    if (options.vehicleSummary && options.vehicleSummary.length > 0) {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('2. CONSOLIDAÇÃO POR VEÍCULO', marginLeft, y);
      y += 2;

      const vehicleHead = [['Veículo (Placa)', 'Cliente(s)', 'Abastecimentos', 'Litros', 'KM Rodado', 'Consumo (L/km)', 'Custo Total']];
      const vehicleBody = options.vehicleSummary.map(v => [
        v.plate,
        v.clients || '—',
        String(v.count),
        `${formatNumber(v.liters)} L`,
        `${formatNumber(v.km, 0)} km`,
        v.avgConsumption > 0 ? formatNumber(v.avgConsumption, 2) : '—',
        formatCurrency(v.cost),
      ]);

      autoTable(doc, {
        startY: y,
        head: vehicleHead,
        body: vehicleBody,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 28 },
          1: { cellWidth: 50 },
          2: { halign: 'right', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', cellWidth: 24, textColor: [22, 101, 52], fontStyle: 'bold' },
        },
        margin: { left: marginLeft, right: marginRight },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // 4.3 Resumo por Posto
    if (options.stationSummary && options.stationSummary.length > 0) {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('3. CONSOLIDAÇÃO POR POSTO DE ABASTECIMENTO', marginLeft, y);
      y += 2;

      const stationHead = [['Posto Externo', 'Abastecimentos', 'Litros', 'Preço Médio / L', 'Custo Total', 'Veículo(s)']];
      const stationBody = options.stationSummary.map(s => [
        s.station,
        String(s.count),
        `${formatNumber(s.liters)} L`,
        formatCurrency(s.avgPricePerLiter),
        formatCurrency(s.cost),
        s.vehicles || '—',
      ]);

      autoTable(doc, {
        startY: y,
        head: stationHead,
        body: stationBody,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { halign: 'right', cellWidth: 20 },
          2: { halign: 'right', cellWidth: 22 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 24, textColor: [22, 101, 52], fontStyle: 'bold' },
          5: { cellWidth: 43 },
        },
        margin: { left: marginLeft, right: marginRight },
      });
    }
  } else if (options.reportType === 'period') {
    // Relatório Cronológico Consolidado por Período / Data
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('CONSOLIDAÇÃO CRONOLÓGICA POR DATA DO PERÍODO', marginLeft, y);
    y += 2;

    const periodData = options.periodSummary && options.periodSummary.length > 0
      ? options.periodSummary
      : (() => {
          const map = new Map<string, { count: number; cost: number; liters: number; km: number; stations: Set<string> }>();
          options.fuelRecords.forEach(r => {
            const d = r.date;
            const cur = map.get(d) || { count: 0, cost: 0, liters: 0, km: 0, stations: new Set<string>() };
            cur.count += 1;
            cur.cost += r.cost || 0;
            cur.liters += r.quantity || 0;
            if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
              cur.km += (r.mileage - r.initialMileage);
            }
            if (r.station) cur.stations.add(r.station);
            map.set(d, cur);
          });
          return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => {
            const parts = date.split('-');
            return {
              date,
              formattedDate: `${parts[2]}/${parts[1]}/${parts[0]}`,
              count: d.count,
              cost: d.cost,
              liters: d.liters,
              km: d.km,
              avgConsumption: d.km > 0 ? d.liters / d.km : 0,
              avgPricePerLiter: d.liters > 0 ? d.cost / d.liters : 0,
              stations: Array.from(d.stations).slice(0, 2).join(', ') || '—',
            };
          });
        })();

    const periodHead = [['Data', 'Abastec.', 'Volume (L)', 'KM Rodados', 'Consumo (L/km)', 'Preço Médio/L', 'Postos Utilizados', 'Total (R$)']];
    const periodBody = periodData.map(p => [
      p.formattedDate,
      String(p.count),
      `${formatNumber(p.liters)} L`,
      `${formatNumber(p.km, 0)} km`,
      p.avgConsumption > 0 ? formatNumber(p.avgConsumption, 2) : '—',
      formatCurrency(p.avgPricePerLiter),
      p.stations,
      formatCurrency(p.cost),
    ]);

    const periodFoot = [[
      'TOTAL DO PERÍODO',
      `${options.stats.count}`,
      `${formatNumber(options.stats.totalLiters)} L`,
      `${formatNumber(options.stats.totalKm, 0)} km`,
      options.stats.avgConsumption > 0 ? formatNumber(options.stats.avgConsumption, 2) : '—',
      formatCurrency(options.stats.avgPricePerLiter || 0),
      `${periodData.length} dias`,
      formatCurrency(options.stats.totalCost),
    ]];

    autoTable(doc, {
      startY: y,
      head: periodHead,
      body: periodBody,
      foot: periodFoot,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 16 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 24 },
        6: { cellWidth: 34 },
        7: { halign: 'right', cellWidth: 24, textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });
  } else {
    // Relatório Analítico / Detalhado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('LANÇAMENTOS INDIVIDUAIS DE ABASTECIMENTO', marginLeft, y);
    y += 2;

    const detailHead = [['Data', 'Veículo', 'Cliente / Obra', 'Combustível', 'Posto', 'Litros', 'R$ / L', 'KM Odômetro', 'Total (R$)']];
    const detailBody = options.fuelRecords.map(r => {
      const fuelName = r.fuelType === 'DIESEL' ? 'Diesel' : r.fuelType === 'GASOLINE' ? 'Gasolina' : r.fuelType === 'ETHANOL' ? 'Etanol' : 'Flex';
      const clientStr = [r.clientName, r.obraName].filter(Boolean).join(' - ') || '—';
      return [
        new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR'),
        r.vehiclePlate,
        clientStr,
        fuelName,
        r.station || '—',
        formatNumber(r.quantity),
        (r.pricePerLiter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        (r.mileage || 0).toLocaleString('pt-BR'),
        formatCurrency(r.cost),
      ];
    });

    const detailFoot = [[
      'TOTAIS',
      `${options.stats.count} reg`,
      '',
      '',
      '',
      `${formatNumber(options.stats.totalLiters)} L`,
      '',
      `${formatNumber(options.stats.totalKm, 0)} km`,
      formatCurrency(options.stats.totalCost),
    ]];

    autoTable(doc, {
      startY: y,
      head: detailHead,
      body: detailBody,
      foot: detailFoot,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 16, fontStyle: 'bold' },
        2: { cellWidth: 42 },
        3: { cellWidth: 16 },
        4: { cellWidth: 32 },
        5: { halign: 'right', cellWidth: 15 },
        6: { halign: 'right', cellWidth: 13 },
        7: { halign: 'right', cellWidth: 17 },
        8: { halign: 'right', cellWidth: 19, textColor: [22, 101, 52], fontStyle: 'bold' },
      },
      margin: { left: marginLeft, right: marginRight },
    });
  }

  // 5. RODAPÉ INSTITUCIONAL COM NUMERAÇÃO DE PÁGINAS (PADRÃO OS)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Linha divisória do rodapé
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 9, pageWidth - marginRight, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);

    // Esquerda: Marca e Sistema
    doc.text('FluxBus • Gestão Integrada de Frotas & Operações', marginLeft, pageHeight - 5);

    // Centro: Validação
    doc.text('Documento corporativo oficial • Emissão automatizada via sistema', pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Direita: Paginação
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, pageHeight - 5, { align: 'right' });
  }

  return doc;
}

/**
 * Dispara o download do PDF gerado.
 */
export async function downloadAbastecimentoExternoPDF(options: AbastecimentoExternoPDFOptions) {
  const doc = await generateAbastecimentoExternoPDFDoc(options);
  const now = new Date();
  const filename = `relatorio-abastecimento-externo-${options.reportType}-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Abre o PDF em uma nova aba do navegador para visualização e impressão.
 */
export async function previewAbastecimentoExternoPDF(options: AbastecimentoExternoPDFOptions) {
  const doc = await generateAbastecimentoExternoPDFDoc(options);
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
