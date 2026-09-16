import { Lead } from '@/services/leadService';
import { Proposal } from '@/services/proposalService';
import { Quote } from '@/services/quoteService';

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
}

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getActiveCompanyInfo = () => {
  try {
    const rawEmpresa = localStorage.getItem('empresa');
    if (rawEmpresa) {
      const parsed = JSON.parse(rawEmpresa);
      return {
        nome: parsed.nome || parsed.name || '',
        cnpj: parsed.cnpj || '',
        sigla: parsed.sigla || '',
        logoUrl: parsed.logoUrl || null
      };
    }
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return {
        nome: parsed.companyName || parsed.company?.name || '',
        cnpj: parsed.company?.cnpj || '',
        sigla: parsed.company?.sigla || '',
        logoUrl: parsed.companyLogo || parsed.company?.logoUrl || null
      };
    }
  } catch {}
  return { nome: 'FluxBus Gestão', cnpj: '', sigla: '', logoUrl: null };
};

export const exportToXLSX = async (
  data: any[],
  filename: string,
  title?: string,
  customCompany?: { nome?: string; cnpj?: string }
): Promise<void> => {
  try {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx');
    const company = customCompany || getActiveCompanyInfo();

    // Criar cabeçalho institucional para o Excel
    const headerRows = [
      [company.nome || 'FluxBus'],
      [`${company.cnpj ? `CNPJ: ${company.cnpj} | ` : ''}Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`],
      [title ? `Relatório: ${title}` : `Arquivo: ${filename}`],
      [] // Linha em branco
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headerRows);

    if (data && data.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A5' });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    throw new Error('Failed to export to XLSX');
  }
};

export const exportToExcel = exportToXLSX;

export const exportToPDF = async (
  data: any[],
  filename: string,
  title: string,
  customCompany?: { nome?: string; cnpj?: string; logoUrl?: string }
): Promise<void> => {
  try {
    // Dynamic import to reduce bundle size
    const jsPDF = await import('jspdf');
    const autoTable = await import('jspdf-autotable');

    const doc = new jsPDF.default();
    const company = customCompany || getActiveCompanyInfo();

    // Cabeçalho Corporativo Institucional
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 24, 'F');

    // Linha de Destaque Vermelha / Primária
    doc.setFillColor(220, 53, 69);
    doc.rect(0, 24, 210, 2, 'F');

    // Nome da Empresa
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nome || 'FluxBus', 14, 11);

    // CNPJ e Data de Emissão
    doc.setFontSize(8);
    doc.setTextColor(210, 210, 210);
    doc.setFont('helvetica', 'normal');
    const metaText = `${company.cnpj ? `CNPJ: ${company.cnpj}  |  ` : ''}Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(metaText, 14, 18);

    // Título do Relatório
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 34);

    // Linha divisória
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 37, 196, 37);

    if (data && data.length > 0) {
      // Prepare table data
      const headers = Object.keys(data[0]).map(key =>
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
      );

      const tableData = data.map(row =>
        Object.values(row).map(value =>
          typeof value === 'object' ? (value ? JSON.stringify(value) : '') : String(value ?? '')
        )
      );

      // Add table
      autoTable.default(doc, {
        head: [headers],
        body: tableData,
        startY: 41,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [220, 53, 69], // seguranca-red
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
      });
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
};

// Lead export functions
export const exportLeads = async (leads: Lead[], options: ExportOptions): Promise<void> => {
  const data = leads.map(lead => ({
    ID: lead.id,
    Nome: lead.name,
    Email: lead.email,
    Telefone: lead.phone,
    Empresa: lead.company,
    Cargo: lead.position,
    Fonte: lead.source,
    Status: lead.status,
    Descrição: lead.description,
    Responsável: lead.assignedTo?.name || '',
    Criado_Por: lead.createdBy.name,
    Data_Criação: new Date(lead.createdAt).toLocaleDateString('pt-BR'),
    Última_Atualização: new Date(lead.updatedAt).toLocaleDateString('pt-BR'),
  }));

  const filename = options.filename || `leads_${new Date().toISOString().split('T')[0]}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'xlsx':
      await exportToXLSX(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename, 'Relatório de Leads');
      break;
  }
};

// Proposal export functions
export const exportProposals = async (proposals: Proposal[], options: ExportOptions): Promise<void> => {
  const data = proposals.map(proposal => ({
    ID: proposal.id,
    Número: proposal.proposalNumber,
    Título: proposal.title,
    Cliente: proposal.client?.name || '',
    Lead: proposal.lead?.name || '',
    Status: proposal.status,
    Valor_Total: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(proposal.totalValue),
    Válida_Até: proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '',
    Descrição: proposal.description,
    Responsável: proposal.assignedTo?.name || '',
    Criado_Por: proposal.createdBy.name,
    Data_Criação: new Date(proposal.createdAt).toLocaleDateString('pt-BR'),
    Última_Atualização: new Date(proposal.updatedAt).toLocaleDateString('pt-BR'),
  }));

  const filename = options.filename || `propostas_${new Date().toISOString().split('T')[0]}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'xlsx':
      await exportToXLSX(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename, 'Relatório de Propostas');
      break;
  }
};

// Quote export functions
export const exportQuotes = async (quotes: Quote[], options: ExportOptions): Promise<void> => {
  const data = quotes.map(quote => ({
    ID: quote.id,
    Número: quote.quoteNumber,
    Título: quote.title,
    Cliente: quote.client?.name || '',
    Lead: quote.lead?.name || '',
    Status: quote.status,
    Valor_Total: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(quote.totalValue),
    Válido_Até: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('pt-BR') : '',
    Duração_Estimada: quote.estimatedDuration,
    Condições_Pagamento: quote.paymentTerms,
    Descrição: quote.description,
    Responsável: quote.assignedTo?.name || '',
    Criado_Por: quote.createdBy.name,
    Data_Criação: new Date(quote.createdAt).toLocaleDateString('pt-BR'),
    Última_Atualização: new Date(quote.updatedAt).toLocaleDateString('pt-BR'),
  }));

  const filename = options.filename || `orcamentos_${new Date().toISOString().split('T')[0]}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'xlsx':
      await exportToXLSX(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename, 'Relatório de Orçamentos');
      break;
  }
};

// Dashboard export functions
export const exportDashboardData = async (
  leads: Lead[], 
  proposals: Proposal[], 
  quotes: Quote[], 
  options: ExportOptions
): Promise<void> => {
  const data = [
    {
      Tipo: 'Leads',
      Total: leads.length,
      Novos: leads.filter(l => l.status === 'NEW').length,
      Contatados: leads.filter(l => l.status === 'CONTACTED').length,
      Qualificados: leads.filter(l => l.status === 'QUALIFIED').length,
      Convertidos: leads.filter(l => l.status === 'WON').length,
    },
    {
      Tipo: 'Propostas',
      Total: proposals.length,
      Rascunho: proposals.filter(p => p.status === 'DRAFT').length,
      Enviadas: proposals.filter(p => p.status === 'SENT').length,
      Em_Análise: proposals.filter(p => p.status === 'UNDER_REVIEW').length,
      Aprovadas: proposals.filter(p => p.status === 'APPROVED').length,
      Convertidas: proposals.filter(p => p.status === 'CONVERTED').length,
    },
    {
      Tipo: 'Orçamentos',
      Total: quotes.length,
      Rascunho: quotes.filter(q => q.status === 'DRAFT').length,
      Enviados: quotes.filter(q => q.status === 'SENT').length,
      Em_Análise: quotes.filter(q => q.status === 'UNDER_REVIEW').length,
      Aprovados: quotes.filter(q => q.status === 'APPROVED').length,
      Convertidos: quotes.filter(q => q.status === 'CONVERTED').length,
    },
  ];

  const filename = options.filename || `dashboard_comercial_${new Date().toISOString().split('T')[0]}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'xlsx':
      await exportToXLSX(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename, 'Dashboard Comercial');
      break;
  }
}; 