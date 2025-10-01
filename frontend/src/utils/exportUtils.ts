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

export const exportToXLSX = async (data: any[], filename: string): Promise<void> => {
  try {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    throw new Error('Failed to export to XLSX');
  }
};

export const exportToPDF = async (data: any[], filename: string, title: string): Promise<void> => {
  try {
    // Dynamic import to reduce bundle size
    const jsPDF = await import('jspdf');
    const autoTable = await import('jspdf-autotable');
    
    const doc = new jsPDF.default();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Prepare table data
    const headers = Object.keys(data[0]).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    );
    
    const tableData = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : String(value || '')
      )
    );
    
    // Add table
    autoTable.default(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [220, 53, 69], // seguranca-red
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
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