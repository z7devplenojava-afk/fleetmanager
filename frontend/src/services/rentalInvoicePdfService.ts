import jsPDF from 'jspdf';
import { RentalInvoice } from './rentalInvoiceService';
import { getActiveCompanyInfo } from '@/utils/exportUtils';
import { getApiUrl } from '@/config/environment';

export interface RentalInvoiceCompany {
  name?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface RentalInvoicePdfOptions {
  company?: RentalInvoiceCompany;
  generatedBy?: string;
}

const DEFAULT_COMPANY: Required<Pick<RentalInvoiceCompany, 'name' | 'cnpj' | 'address' | 'city' | 'state' | 'zipCode'>> = {
  name: 'VIAÇÃO SÃO SILVESTRE LTDA',
  cnpj: '71.055.644/0001-25',
  address: 'Rua Pelegrino de Paula Ferreira, 77 - CENTRO',
  city: 'MOEDA',
  state: 'MG',
  zipCode: '35.470-000',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; rgbText: [number, number, number]; rgbBg: [number, number, number] }> = {
  PENDING: { label: 'Pendente', color: '#b45309', bg: '#fef3c7', rgbText: [180, 83, 9], rgbBg: [254, 243, 199] },
  PAID: { label: 'Paga / Liquidada', color: '#15803d', bg: '#dcfce7', rgbText: [21, 128, 61], rgbBg: [220, 252, 231] },
  OVERDUE: { label: 'Vencida', color: '#b91c1c', bg: '#fee2e2', rgbText: [185, 28, 28], rgbBg: [254, 226, 226] },
  CANCELLED: { label: 'Cancelada', color: '#4b5563', bg: '#f3f4f6', rgbText: [75, 85, 99], rgbBg: [243, 244, 246] },
  PARTIAL: { label: 'Parcialmente Paga', color: '#1d4ed8', bg: '#dbeafe', rgbText: [29, 78, 216], rgbBg: [219, 234, 254] },
};

export class RentalInvoicePdfService {
  private static formatCurrency(value?: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  private static formatDate(dateString?: string): string {
    if (!dateString) return '—';
    try {
      const clean = dateString.substring(0, 10);
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private static resolveCompany(options: RentalInvoicePdfOptions = {}) {
    const activeInfo = getActiveCompanyInfo();
    const company = {
      name: options.company?.name || activeInfo.nome || DEFAULT_COMPANY.name,
      cnpj: options.company?.cnpj || activeInfo.cnpj || DEFAULT_COMPANY.cnpj,
      address: options.company?.address || DEFAULT_COMPANY.address,
      city: options.company?.city || DEFAULT_COMPANY.city,
      state: options.company?.state || DEFAULT_COMPANY.state,
      zipCode: options.company?.zipCode || DEFAULT_COMPANY.zipCode,
      phone: options.company?.phone || '(31) 3574-1234',
      email: options.company?.email || 'contato@viacaosaosilvestre.com.br',
      logoUrl: options.company?.logoUrl || activeInfo.logoUrl || '',
    };

    let logoSrc = '';
    if (company.logoUrl) {
      logoSrc = company.logoUrl.startsWith('http') || company.logoUrl.startsWith('data:')
        ? company.logoUrl
        : `${getApiUrl().replace('/api', '')}${company.logoUrl}`;
    }

    return { company, logoSrc };
  }

  private static loadImageAsDataUrl(url: string): Promise<string | null> {
    if (!url) return Promise.resolve(null);
    if (url.startsWith('data:')) return Promise.resolve(url);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 60;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // ignore CORS canvas taint
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /**
   * Constrói o HTML oficial da Fatura de Locação com espaçamento e alinhamento precisos para impressão.
   */
  public static createHTML(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): string {
    const { company, logoSrc } = this.resolveCompany(options);

    const companyLine1 = `CNPJ: ${company.cnpj} • ${company.address}`;
    const companyLine2 = `${company.city}/${company.state} - CEP: ${company.zipCode} • Tel: ${company.phone}`;

    const statusInfo = STATUS_CONFIG[invoice.status] || {
      label: invoice.status || 'PENDENTE',
      color: '#b45309',
      bg: '#fef3c7',
      rgbText: [180, 83, 9] as [number, number, number],
      rgbBg: [254, 243, 199] as [number, number, number],
    };

    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
      {
        plate: '',
        model: 'Veículo da Frota',
        description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
        amount: invoice.netAmount || invoice.totalAmount || 0,
      }
    ];

    const dataEmissao = this.formatDate(invoice.issueDate || new Date().toISOString());
    const dataVencimento = this.formatDate(invoice.dueDate);
    const periodoInicio = this.formatDate(invoice.periodStart);
    const periodoFim = this.formatDate(invoice.periodEnd);
    const periodoExtenso = (periodoInicio !== '—' && periodoFim !== '—')
      ? `${periodoInicio} A ${periodoFim}`
      : 'CONFORME CONTRATO';

    const subtotal = invoice.totalAmount || invoice.netAmount || 0;
    const desconto = invoice.discount || 0;
    const totalLiquido = invoice.netAmount || (subtotal - desconto);

    const generatedAt = new Date().toLocaleDateString('pt-BR');
    const generatedHour = new Date().toLocaleTimeString('pt-BR');
    const generatedBy = options.generatedBy || 'FluxBus Sistema Integrado';

    const clientAddressFormatted = [
      invoice.clientAddress,
      invoice.clientCity,
      invoice.clientState,
      invoice.clientZipCode ? `CEP ${invoice.clientZipCode}` : null
    ].filter(Boolean).join(' - ') || '—';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Fatura de Locação Nº ${invoice.number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
    }

    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 9px; 
      margin: 0;
      padding: 12px 14px;
      color: #222;
      line-height: 1.35;
      background-color: #fff;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border-bottom: 2px solid #d32f2f;
    }
    
    .header-left {
      width: 54%;
      vertical-align: top;
      text-align: left;
      padding-bottom: 8px;
    }
    
    .header-right {
      width: 46%;
      vertical-align: top;
      text-align: right;
      padding-bottom: 8px;
    }

    .brand-logo {
      height: 34px;
      max-height: 34px;
      max-width: 165px;
      width: auto;
      margin-bottom: 5px;
      display: block;
      object-fit: contain;
    }

    .logo-placeholder {
      display: inline-block;
      border: 1.5px solid #d32f2f;
      border-radius: 4px;
      padding: 4px 10px;
      font-weight: 900;
      color: #d32f2f;
      font-size: 10.5px;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    
    .brand-name {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #1f2937;
      letter-spacing: 0.3px;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    
    .brand-details {
      font-size: 8px;
      color: #4b5563;
      line-height: 1.35;
    }

    .doc-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #d32f2f;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 5px;
      line-height: 1.2;
    }
    
    .type-badge-row {
      margin-bottom: 5px;
    }

    .type-badge {
      display: inline-block;
      padding: 3px 9px;
      font-size: 7.5px;
      font-weight: bold;
      color: #fff;
      background-color: #d32f2f;
      border-radius: 3px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    
    .numero-os-row {
      margin-bottom: 4px;
    }

    .numero-os-badge {
      display: inline-block;
      font-size: 9.5px;
      font-weight: bold;
      color: #d32f2f;
      background-color: #fdf2f2;
      border: 1px solid #d32f2f;
      padding: 2.5px 9px;
      border-radius: 3px;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.2;
    }
    
    .data-emissao-compact {
      font-size: 8px;
      color: #555;
      margin-top: 2px;
      line-height: 1.2;
    }

    .local-manutencao-bar {
      background-color: #f1f8e9;
      border: 1px solid #c8e6c9;
      border-left: 4px solid #2e7d32;
      padding: 5px 8px;
      font-size: 8.5px;
      color: #1b5e20;
      margin-top: 6px;
      margin-bottom: 8px;
      border-radius: 2px;
      text-transform: uppercase;
      font-weight: bold;
      line-height: 1.3;
    }

    .secao { 
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    
    .secao-titulo {
      background-color: #f5f5f5;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 8.5px;
      border-left: 3.5px solid #d32f2f;
      margin-bottom: 4px;
      text-transform: uppercase;
      color: #d32f2f;
      line-height: 1.25;
    }
    
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    
    table.info-table td {
      padding: 4px 6px;
      border: 1px solid #d1d5db;
      background-color: #fafafa;
      vertical-align: middle;
    }
    
    table.info-table td.label {
      font-weight: bold;
      font-size: 7.5px;
      text-transform: uppercase;
      color: #4b5563;
      background-color: #f3f4f6;
      width: 22%;
    }
    
    table.info-table td.valor {
      font-size: 8.5px;
      color: #111827;
      width: 28%;
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 2.5px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 7.5px;
      line-height: 1.2;
      text-align: center;
    }

    table.itens-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    
    table.itens-table th {
      background-color: #27272a;
      color: #fff;
      padding: 5px 6px;
      font-size: 7.5px;
      text-transform: uppercase;
      text-align: left;
      line-height: 1.2;
    }
    
    table.itens-table th.num { width: 6%; text-align: center; }
    table.itens-table th.placa { width: 14%; text-align: center; }
    table.itens-table th.valor { width: 18%; text-align: right; }
    
    table.itens-table td {
      padding: 5px 6px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 8px;
      vertical-align: middle;
    }
    
    table.itens-table td.num { text-align: center; }
    table.itens-table td.placa { text-align: center; }
    table.itens-table td.valor { text-align: right; font-weight: bold; }
    
    table.itens-table tr.alternate td {
      background-color: #f9fafb;
    }

    .plate-badge {
      display: inline-block;
      font-family: monospace;
      font-weight: bold;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 2px 6px;
      border-radius: 3px;
      color: #1d4ed8;
      font-size: 8px;
      line-height: 1.2;
    }

    .resumo {
      width: 46%;
      margin-left: auto;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    
    .resumo table { width: 100%; border-collapse: collapse; }
    .resumo td { padding: 3px 6px; font-size: 8.5px; vertical-align: middle; }
    .resumo td.label { text-align: right; color: #4b5563; }
    .resumo td.valor { text-align: right; font-weight: bold; color: #111827; }
    .resumo tr.divider td {
      padding: 2px 0;
      border-bottom: 1.5px solid #27272a;
    }
    .resumo tr.total td {
      font-size: 10px;
      font-weight: bold;
      color: #d32f2f;
      padding-top: 6px;
    }

    .observacoes-box {
      margin: 4px 0;
      padding: 6px 10px;
      background-color: #fffde7;
      border: 1px solid #fbc02d;
      border-left: 4px solid #fbc02d;
      font-size: 8px;
      color: #374151;
      line-height: 1.4;
      border-radius: 2px;
    }

    .conclusao-box {
      background-color: #f5f5f5;
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
      text-transform: uppercase;
      margin-top: 8px;
      line-height: 1.4;
    }

    .conclusao-sub {
      color: #2e7d32;
      font-size: 8.5px;
      font-weight: 800;
      display: block;
      margin-top: 2px;
    }

    .assinatura-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: avoid;
      border: 1px solid #333;
      border-top: none;
    }
    
    .assinatura-table td {
      text-align: center;
      padding: 18px 14px 8px 14px;
      vertical-align: top;
      width: 50%;
    }
    
    .linha-assinatura {
      border-top: 1.2px solid #333;
      margin: 0 auto 3px auto;
      width: 85%;
      padding-top: 5px;
    }
    
    .assinatura-nome {
      font-weight: bold;
      font-size: 8.5px;
      color: #111827;
      text-transform: uppercase;
    }
    
    .assinatura-info {
      font-size: 7.5px;
      color: #4b5563;
      margin-top: 2px;
      text-transform: uppercase;
    }

    .footer {
      margin-top: 10px;
      padding-top: 5px;
      padding-bottom: 6px;
      text-align: center;
      font-size: 7.5px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      line-height: 1.4;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <!-- ── CABEÇALHO PADRÃO OFICIAL OS ── -->
  <table class="header-table">
    <tr>
      <td class="header-left">
        ${logoSrc ? `<img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'"/>` : `<div class="logo-placeholder">VIAÇÃO SÃO SILVESTRE</div>`}
        <div class="brand-name">${company.name}</div>
        <div class="brand-details">${companyLine1}<br/>${companyLine2}</div>
      </td>
      <td class="header-right">
        <div class="doc-title">FATURA DE LOCAÇÃO — VEÍCULOS</div>
        <div class="type-badge-row">
          <span class="type-badge">LOCAÇÃO DE BENS MÓVEIS (SEM CONDUTOR)</span>
        </div>
        <div class="numero-os-row">
          <span class="numero-os-badge">FATURA Nº ${invoice.number}</span>
        </div>
        <div class="data-emissao-compact"><b>Data de Emissão:</b> ${dataEmissao}</div>
      </td>
    </tr>
  </table>

  <!-- ── SUB-BARRA VERDE DE COMPETÊNCIA & CLIENTE ── -->
  <div class="local-manutencao-bar">
    <b>LOCAÇÃO DE BENS MÓVEIS SEM CESSÃO DE MÃO DE OBRA &bull; PERÍODO:</b> <span>${periodoExtenso} &mdash; CLIENTE: ${(invoice.clientName || 'CLIENTE').toUpperCase()}</span>
  </div>

  <!-- ── SEÇÃO 1: IDENTIFICAÇÃO DO CLIENTE & DADOS DO CONTRATO ── -->
  <div class="secao">
    <div class="secao-titulo">IDENTIFICAÇÃO DO CLIENTE & DADOS DO CONTRATO</div>
    <table class="info-table">
      <tr>
        <td class="label">RAZÃO SOCIAL / CLIENTE:</td>
        <td class="valor"><strong>${invoice.clientName || 'Não informado'}</strong></td>
        <td class="label">CNPJ / CPF:</td>
        <td class="valor"><strong>${invoice.clientCnpj || '—'}</strong></td>
      </tr>
      <tr>
        <td class="label">ENDEREÇO COMPLETO:</td>
        <td class="valor">${clientAddressFormatted}</td>
        <td class="label">MUNICÍPIO / UF:</td>
        <td class="valor">${[invoice.clientCity, invoice.clientState].filter(Boolean).join(' / ') || '—'}</td>
      </tr>
      <tr>
        <td class="label">CONTRATO / PEDIDO:</td>
        <td class="valor"><strong>${invoice.contractNumber || 'Contrato Padrão de Locação'}</strong></td>
        <td class="label">NOTA FISCAL VINCULADA:</td>
        <td class="valor">${invoice.nfeNumber ? `NFS-e Nº ${invoice.nfeNumber}` : `NFS-e Nº ${invoice.number}`}</td>
      </tr>
      <tr>
        <td class="label">INSCRIÇÃO ESTADUAL:</td>
        <td class="valor">${invoice.clientIe || 'ISENTO'}</td>
        <td class="label">STATUS DA FATURA:</td>
        <td class="valor">
          <span class="status-badge" style="background-color: ${statusInfo.bg}; color: ${statusInfo.color};">
            ${statusInfo.label.toUpperCase()}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── SEÇÃO 2: DADOS DA FATURA & LIQUIDAÇÃO FINANCEIRA ── -->
  <div class="secao">
    <div class="secao-titulo">DADOS DA FATURA & CONDIÇÕES DE LIQUIDAÇÃO</div>
    <table class="info-table">
      <tr>
        <td class="label">NÚMERO DA FATURA:</td>
        <td class="valor"><strong>FATURA Nº ${invoice.number}</strong></td>
        <td class="label">DATA DE EMISSÃO:</td>
        <td class="valor">${dataEmissao}</td>
      </tr>
      <tr>
        <td class="label">PERÍODO DA LOCAÇÃO:</td>
        <td class="valor">${periodoExtenso}</td>
        <td class="label">DATA DE VENCIMENTO:</td>
        <td class="valor"><strong style="color: #d32f2f; font-size: 9px;">${dataVencimento}</strong></td>
      </tr>
      <tr>
        <td class="label">FORMA DE PAGAMENTO:</td>
        <td class="valor">${invoice.paymentMethod || 'TRANSFERÊNCIA BANCÁRIA / PIX'}</td>
        <td class="label">INSTITUIÇÃO BANCÁRIA:</td>
        <td class="valor"><strong>${invoice.bankName || 'BANCO DO BRASIL'}</strong></td>
      </tr>
      <tr>
        <td class="label">AGÊNCIA / CONTA:</td>
        <td class="valor">Agência: ${invoice.bankAgency || '—'} &bull; Conta: ${invoice.bankAccount || '—'}</td>
        <td class="label">CHAVE PIX / FAVORECIDO:</td>
        <td class="valor">${company.cnpj} (${company.name})</td>
      </tr>
    </table>
  </div>

  <!-- ── SEÇÃO 3: VEÍCULOS E SERVIÇOS DE LOCAÇÃO (ITENS) ── -->
  <div class="secao">
    <div class="secao-titulo">VEÍCULOS E SERVIÇOS DE LOCAÇÃO (${items.length} ${items.length === 1 ? 'ITEM' : 'ITENS'})</div>
    <table class="itens-table">
      <thead>
        <tr>
          <th class="num">#</th>
          <th class="placa">Placa</th>
          <th style="width: 26%;">Marca / Modelo</th>
          <th>Descrição dos Serviços / Veículos</th>
          <th class="valor">Valor Total (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr class="${idx % 2 === 1 ? 'alternate' : ''}">
            <td class="num">${idx + 1}</td>
            <td class="placa">
              ${item.plate ? `<span class="plate-badge">${item.plate}</span>` : '—'}
            </td>
            <td><strong>${item.model || 'Ônibus Rodoviário / Urbano'}</strong></td>
            <td>${item.description || 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA'}</td>
            <td class="valor">${this.formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ── SEÇÃO 4: RESUMO DE VALORES DA FATURA ── -->
  <div class="secao">
    <div class="resumo">
      <table>
        <tr>
          <td class="label">SUBTOTAL DA LOCAÇÃO:</td>
          <td class="valor">${this.formatCurrency(subtotal)}</td>
        </tr>
        <tr>
          <td class="label">DESCONTOS / RETENÇÕES:</td>
          <td class="valor">${this.formatCurrency(desconto)}</td>
        </tr>
        <tr class="divider">
          <td colspan="2"></td>
        </tr>
        <tr class="total">
          <td class="label" style="color: #d32f2f; font-weight: bold;">TOTAL LÍQUIDO A RECEBER:</td>
          <td class="valor" style="color: #d32f2f;">${this.formatCurrency(totalLiquido)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ── SEÇÃO 5: OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL ── -->
  <div class="secao">
    <div class="secao-titulo">OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL</div>
    <div class="observacoes-box">
      <strong>Fundamentação Tributária:</strong> Operação de locação de bens móveis sem condutor, tributada nos termos da <strong>Lei Complementar nº 116/2003</strong> e em estrita consonância com a <strong>Súmula Vinculante nº 31 do STF</strong> (Não incidência de ISS sobre locação pura de bens móveis).
      ${invoice.notes ? `<div style="margin-top: 4px;"><strong>Observações Complementares:</strong> ${invoice.notes}</div>` : ''}
    </div>
  </div>

  <!-- ── SEÇÃO 6: DECLARAÇÃO DE ACEITE E ASSINATURAS ── -->
  <div class="secao" style="margin-top: 8px; page-break-inside: avoid;">
    <div class="conclusao-box">
      DECLARO QUE OS VEÍCULOS E SERVIÇOS FORAM DISPONIBILIZADOS E UTILIZADOS CONFORME O CONTRATO DE LOCAÇÃO:
      <span class="conclusao-sub">EQUIPAMENTOS ENTREGUES EM CONDIÇÕES OPERACIONAIS PLENAS.</span>
    </div>
    <table class="assinatura-table">
      <tr>
        <td style="border-right: 1px solid #333;">
          <div class="linha-assinatura">
            <div class="assinatura-nome">${company.name}</div>
            <div class="assinatura-info">LOCADOR / GESTÃO FINANCEIRA E OPERACIONAL</div>
            <div class="assinatura-info">Data: _____ / _____ / _________</div>
          </div>
        </td>
        <td>
          <div class="linha-assinatura">
            <div class="assinatura-nome">${invoice.clientName || 'LOCATÁRIO / CLIENTE'}</div>
            <div class="assinatura-info">LOCATÁRIO / REPRESENTANTE LEGAL</div>
            <div class="assinatura-info">Data: _____ / _____ / _________</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── RODAPÉ OFICIAL ── -->
  <div class="footer">
    <p style="margin: 0;">Documento gerado pelo sistema FluxBus em ${generatedAt} às ${generatedHour} &bull; Operador: ${generatedBy}</p>
    <p style="margin: 2px 0 0 0;">Este documento formaliza e certifica a locação de veículos sem cessão de mão de obra e possui plena validade contratual.</p>
  </div>

</body>
</html>`;
  }

  /**
   * Retorna o Blob do HTML oficial para visualização em iframe ou modal.
   */
  public static createHTMLBlob(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): Blob {
    const html = this.createHTML(invoice, options);
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Abre a janela de visualização e impressão direta.
   */
  public static openPrintPreview(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): void {
    const html = this.createHTML(invoice, options);
    const win = window.open('', '_blank', 'width=960,height=840');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
  }

  /**
   * Gera o PDF vetorial nativo (jsPDF) com precisão milimétrica, sem distorções ou sobreposições do html2canvas.
   */
  public static async generatePDF(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): Promise<void> {
    const { company, logoSrc } = this.resolveCompany(options);
    const logoDataUrl = await this.loadImageAsDataUrl(logoSrc);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 210;
    const pageH = 297;
    const marginX = 10;
    const contentW = pageW - marginX * 2; // 190mm

    const statusInfo = STATUS_CONFIG[invoice.status] || {
      label: invoice.status || 'PENDENTE',
      color: '#b45309',
      bg: '#fef3c7',
      rgbText: [180, 83, 9] as [number, number, number],
      rgbBg: [254, 243, 199] as [number, number, number],
    };

    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
      {
        plate: '',
        model: 'Veículo da Frota',
        description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
        amount: invoice.netAmount || invoice.totalAmount || 0,
      }
    ];

    const dataEmissao = this.formatDate(invoice.issueDate || new Date().toISOString());
    const dataVencimento = this.formatDate(invoice.dueDate);
    const periodoInicio = this.formatDate(invoice.periodStart);
    const periodoFim = this.formatDate(invoice.periodEnd);
    const periodoExtenso = (periodoInicio !== '—' && periodoFim !== '—')
      ? `${periodoInicio} A ${periodoFim}`
      : 'CONFORME CONTRATO';

    const subtotal = invoice.totalAmount || invoice.netAmount || 0;
    const desconto = invoice.discount || 0;
    const totalLiquido = invoice.netAmount || (subtotal - desconto);

    const generatedAt = new Date().toLocaleDateString('pt-BR');
    const generatedHour = new Date().toLocaleTimeString('pt-BR');
    const generatedBy = options.generatedBy || 'FluxBus Sistema Integrado';

    const clientAddressFormatted = [
      invoice.clientAddress,
      invoice.clientCity,
      invoice.clientState,
      invoice.clientZipCode ? `CEP ${invoice.clientZipCode}` : null
    ].filter(Boolean).join(' - ') || '—';

    let y = 10;

    // ── 1. CABEÇALHO SUPERIOR (ESQUERDA + DIREITA SEM SOBREPOSIÇÃO) ──
    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'PNG', marginX, y, 42, 11);
      } catch {
        pdf.setDrawColor(211, 47, 47);
        pdf.setLineWidth(0.45);
        pdf.roundedRect(marginX, y, 52, 7.5, 1.2, 1.2, 'S');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(211, 47, 47);
        pdf.text('VIAÇÃO SÃO SILVESTRE', marginX + 26, y + 5.1, { align: 'center' });
      }
    } else {
      pdf.setDrawColor(211, 47, 47);
      pdf.setLineWidth(0.45);
      pdf.roundedRect(marginX, y, 52, 7.5, 1.2, 1.2, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(211, 47, 47);
      pdf.text('VIAÇÃO SÃO SILVESTRE', marginX + 26, y + 5.1, { align: 'center' });
    }

    // Nome da empresa e endereço à esquerda
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(31, 41, 55);
    pdf.text((company.name || DEFAULT_COMPANY.name).toUpperCase(), marginX, y + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(85, 85, 85);
    const addrLine1 = `CNPJ: ${company.cnpj} • ${company.address}`;
    const addrLine2 = `${company.city}/${company.state} - CEP: ${company.zipCode} • Tel: ${company.phone}`;
    pdf.text(addrLine1, marginX, y + 17.2);
    pdf.text(addrLine2, marginX, y + 20.8);

    // Coluna Direita do Cabeçalho
    const rightX = pageW - marginX;

    // Linha 1 Direita: Título Principal
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11.5);
    pdf.setTextColor(211, 47, 47);
    pdf.text('FATURA DE LOCAÇÃO — VEÍCULOS', rightX, y + 4.2, { align: 'right' });

    // Linha 2 Direita: Badge vermelho "LOCAÇÃO DE BENS MÓVEIS (SEM CONDUTOR)"
    const typeBadgeText = 'LOCAÇÃO DE BENS MÓVEIS (SEM CONDUTOR)';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    const typeBadgeW = pdf.getTextWidth(typeBadgeText) + 6;
    const typeBadgeH = 4.8;
    const typeBadgeX = rightX - typeBadgeW;
    const typeBadgeY = y + 6.2;
    pdf.setFillColor(211, 47, 47);
    pdf.roundedRect(typeBadgeX, typeBadgeY, typeBadgeW, typeBadgeH, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(typeBadgeText, rightX - 3, typeBadgeY + 3.35, { align: 'right' });

    // Linha 3 Direita: Caixa "FATURA Nº X"
    const faturaBadgeText = `FATURA Nº ${invoice.number}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    const faturaBadgeW = Math.max(pdf.getTextWidth(faturaBadgeText) + 7, 28);
    const faturaBadgeH = 5.4;
    const faturaBadgeX = rightX - faturaBadgeW;
    const faturaBadgeY = y + 12.2;
    pdf.setFillColor(253, 242, 242);
    pdf.setDrawColor(211, 47, 47);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(faturaBadgeX, faturaBadgeY, faturaBadgeW, faturaBadgeH, 1, 1, 'FD');
    pdf.setTextColor(211, 47, 47);
    pdf.text(faturaBadgeText, faturaBadgeX + faturaBadgeW / 2, faturaBadgeY + 3.8, { align: 'center' });

    // Linha 4 Direita: Data de Emissão
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(85, 85, 85);
    pdf.text(`Data de Emissão: ${dataEmissao}`, rightX, y + 21.2, { align: 'right' });

    // Linha vermelha divisória do cabeçalho
    y += 24;
    pdf.setDrawColor(211, 47, 47);
    pdf.setLineWidth(0.6);
    pdf.line(marginX, y, rightX, y);

    // ── 2. SUB-BARRA VERDE DE COMPETÊNCIA & CLIENTE ──
    y += 3;
    const greenBarH = 6.5;
    pdf.setFillColor(241, 248, 233);
    pdf.setDrawColor(200, 230, 201);
    pdf.setLineWidth(0.25);
    pdf.rect(marginX, y, contentW, greenBarH, 'FD');
    pdf.setFillColor(46, 125, 50);
    pdf.rect(marginX, y, 1.5, greenBarH, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.3);
    pdf.setTextColor(27, 94, 32);
    const greenBarText = `LOCAÇÃO DE BENS MÓVEIS SEM CESSÃO DE MÃO DE OBRA • PERÍODO: ${periodoExtenso} — CLIENTE: ${(invoice.clientName || 'CLIENTE').toUpperCase()}`;
    pdf.text(greenBarText, marginX + 3.5, y + 4.3, { maxWidth: contentW - 5 });

    y += greenBarH + 3.5;

    // Helper para desenhar cabeçalho de seção
    const drawSectionHeader = (title: string, topY: number): number => {
      const h = 5.5;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(marginX, topY, contentW, h, 'F');
      pdf.setFillColor(211, 47, 47);
      pdf.rect(marginX, topY, 1.2, h, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.8);
      pdf.setTextColor(211, 47, 47);
      pdf.text(title, marginX + 3.2, topY + 3.8);
      return topY + h + 1.5;
    };

    // Helper para desenhar linha de 4 colunas nas tabelas de informações
    const drawInfoRow = (
      topY: number,
      label1: string,
      val1: string,
      label2: string,
      val2: string,
      optionsRow?: {
        boldVal1?: boolean;
        boldVal2?: boolean;
        val2Color?: [number, number, number];
        val2Badge?: { bg: [number, number, number]; text: [number, number, number] };
      }
    ): number => {
      const rowH = 6.2;
      const wLabel1 = 41;
      const wVal1 = 54;
      const wLabel2 = 41;
      const wVal2 = contentW - wLabel1 - wVal1 - wLabel2; // 54mm

      const x1 = marginX;
      const x2 = x1 + wLabel1;
      const x3 = x2 + wVal1;
      const x4 = x3 + wLabel2;

      pdf.setDrawColor(215, 218, 222);
      pdf.setLineWidth(0.2);

      // Célula Label 1
      pdf.setFillColor(242, 243, 245);
      pdf.rect(x1, topY, wLabel1, rowH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(80, 85, 95);
      pdf.text(label1, x1 + 2, topY + 4.1);

      // Célula Valor 1
      pdf.setFillColor(250, 250, 250);
      pdf.rect(x2, topY, wVal1, rowH, 'FD');
      pdf.setFont('helvetica', optionsRow?.boldVal1 ? 'bold' : 'normal');
      pdf.setFontSize(7.6);
      pdf.setTextColor(20, 24, 31);
      const v1Clipped = pdf.splitTextToSize(val1 || '—', wVal1 - 4)[0] || '—';
      pdf.text(v1Clipped, x2 + 2, topY + 4.1);

      // Célula Label 2
      pdf.setFillColor(242, 243, 245);
      pdf.rect(x3, topY, wLabel2, rowH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(80, 85, 95);
      pdf.text(label2, x3 + 2, topY + 4.1);

      // Célula Valor 2
      pdf.setFillColor(250, 250, 250);
      pdf.rect(x4, topY, wVal2, rowH, 'FD');

      if (optionsRow?.val2Badge) {
        const badgeText = (val2 || 'PENDENTE').toUpperCase();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.8);
        const bw = pdf.getTextWidth(badgeText) + 5;
        const bh = 4.2;
        const bx = x4 + 2;
        const by = topY + (rowH - bh) / 2;
        pdf.setFillColor(...optionsRow.val2Badge.bg);
        pdf.roundedRect(bx, by, bw, bh, 0.8, 0.8, 'F');
        pdf.setTextColor(...optionsRow.val2Badge.text);
        pdf.text(badgeText, bx + bw / 2, by + 2.95, { align: 'center' });
      } else {
        pdf.setFont('helvetica', optionsRow?.boldVal2 ? 'bold' : 'normal');
        pdf.setFontSize(7.6);
        if (optionsRow?.val2Color) {
          pdf.setTextColor(...optionsRow.val2Color);
        } else {
          pdf.setTextColor(20, 24, 31);
        }
        const v2Clipped = pdf.splitTextToSize(val2 || '—', wVal2 - 4)[0] || '—';
        pdf.text(v2Clipped, x4 + 2, topY + 4.1);
      }

      return topY + rowH;
    };

    // ── 3. SEÇÃO 1: IDENTIFICAÇÃO DO CLIENTE & DADOS DO CONTRATO ──
    y = drawSectionHeader('IDENTIFICAÇÃO DO CLIENTE & DADOS DO CONTRATO', y);
    y = drawInfoRow(
      y,
      'RAZÃO SOCIAL / CLIENTE:',
      invoice.clientName || 'Não informado',
      'CNPJ / CPF:',
      invoice.clientCnpj || '—',
      { boldVal1: true, boldVal2: true }
    );
    y = drawInfoRow(
      y,
      'ENDEREÇO COMPLETO:',
      clientAddressFormatted,
      'MUNICÍPIO / UF:',
      [invoice.clientCity, invoice.clientState].filter(Boolean).join(' / ') || '—'
    );
    y = drawInfoRow(
      y,
      'CONTRATO / PEDIDO:',
      invoice.contractNumber || 'Contrato Padrão de Locação',
      'NOTA FISCAL VINCULADA:',
      invoice.nfeNumber ? `NFS-e Nº ${invoice.nfeNumber}` : `NFS-e Nº ${invoice.number}`,
      { boldVal1: true }
    );
    y = drawInfoRow(
      y,
      'INSCRIÇÃO ESTADUAL:',
      invoice.clientIe || 'ISENTO',
      'STATUS DA FATURA:',
      statusInfo.label.toUpperCase(),
      { val2Badge: { bg: statusInfo.rgbBg, text: statusInfo.rgbText } }
    );

    y += 3.5;

    // ── 4. SEÇÃO 2: DADOS DA FATURA & CONDIÇÕES DE LIQUIDAÇÃO ──
    y = drawSectionHeader('DADOS DA FATURA & CONDIÇÕES DE LIQUIDAÇÃO', y);
    y = drawInfoRow(
      y,
      'NÚMERO DA FATURA:',
      `FATURA Nº ${invoice.number}`,
      'DATA DE EMISSÃO:',
      dataEmissao,
      { boldVal1: true }
    );
    y = drawInfoRow(
      y,
      'PERÍODO DA LOCAÇÃO:',
      periodoExtenso,
      'DATA DE VENCIMENTO:',
      dataVencimento,
      { boldVal2: true, val2Color: [211, 47, 47] }
    );
    y = drawInfoRow(
      y,
      'FORMA DE PAGAMENTO:',
      invoice.paymentMethod || 'TRANSFERÊNCIA BANCÁRIA / PIX',
      'INSTITUIÇÃO BANCÁRIA:',
      invoice.bankName || 'BANCO DO BRASIL',
      { boldVal2: true }
    );
    y = drawInfoRow(
      y,
      'AGÊNCIA / CONTA:',
      `Agência: ${invoice.bankAgency || '—'} • Conta: ${invoice.bankAccount || '—'}`,
      'CHAVE PIX / FAVORECIDO:',
      `${company.cnpj} (${company.name})`
    );

    y += 3.5;

    // ── 5. SEÇÃO 3: VEÍCULOS E SERVIÇOS DE LOCAÇÃO ──
    y = drawSectionHeader(`VEÍCULOS E SERVIÇOS DE LOCAÇÃO (${items.length} ${items.length === 1 ? 'ITEM' : 'ITENS'})`, y);

    const colNumW = 10;
    const colPlacaW = 26;
    const colModeloW = 48;
    const colDescW = 72;
    const colValorW = contentW - colNumW - colPlacaW - colModeloW - colDescW; // 34mm

    const cx1 = marginX;
    const cx2 = cx1 + colNumW;
    const cx3 = cx2 + colPlacaW;
    const cx4 = cx3 + colModeloW;
    const cx5 = cx4 + colDescW;

    // Cabeçalho da Tabela de Itens
    const thH = 6;
    pdf.setFillColor(45, 45, 48);
    pdf.rect(marginX, y, contentW, thH, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text('#', cx1 + colNumW / 2, y + 4.1, { align: 'center' });
    pdf.text('PLACA', cx2 + colPlacaW / 2, y + 4.1, { align: 'center' });
    pdf.text('MARCA / MODELO', cx3 + 2, y + 4.1);
    pdf.text('DESCRIÇÃO DOS SERVIÇOS / VEÍCULOS', cx4 + 2, y + 4.1);
    pdf.text('VALOR TOTAL (R$)', marginX + contentW - 2, y + 4.1, { align: 'right' });

    y += thH;

    // Linhas dos itens
    const itemRowH = 6.8;
    items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(marginX, y, contentW, itemRowH, 'F');
      }
      pdf.setDrawColor(225, 228, 232);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, y + itemRowH, marginX + contentW, y + itemRowH);

      // #
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(35, 35, 35);
      pdf.text(String(idx + 1), cx1 + colNumW / 2, y + 4.5, { align: 'center' });

      // Placa badge perfeitamente centralizado
      if (item.plate) {
        const plateText = item.plate.toUpperCase();
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(7.5);
        const pw = Math.max(pdf.getTextWidth(plateText) + 4.5, 16);
        const ph = 4.4;
        const px = cx2 + (colPlacaW - pw) / 2;
        const py = y + (itemRowH - ph) / 2;
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(191, 219, 254);
        pdf.setLineWidth(0.25);
        pdf.roundedRect(px, py, pw, ph, 0.8, 0.8, 'FD');
        pdf.setTextColor(29, 78, 216);
        pdf.text(plateText, cx2 + colPlacaW / 2, py + 3.1, { align: 'center' });
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 120, 120);
        pdf.text('—', cx2 + colPlacaW / 2, y + 4.5, { align: 'center' });
      }

      // Marca / Modelo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(25, 25, 25);
      const modelStr = pdf.splitTextToSize(item.model || 'Ônibus Rodoviário / Urbano', colModeloW - 3)[0] || '';
      pdf.text(modelStr, cx3 + 2, y + 4.5);

      // Descrição
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.3);
      pdf.setTextColor(45, 45, 45);
      const descStr = pdf.splitTextToSize(item.description || 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA', colDescW - 3)[0] || '';
      pdf.text(descStr, cx4 + 2, y + 4.5);

      // Valor Total
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.8);
      pdf.setTextColor(20, 20, 20);
      pdf.text(this.formatCurrency(item.amount), cx5 + colValorW - 2, y + 4.5, { align: 'right' });

      y += itemRowH;
    });

    // ── 6. SEÇÃO 4: RESUMO DE VALORES (SEM LINHA CORTANDO O TEXTO) ──
    y += 4;
    const summaryLeftX = pageW - marginX - 88;
    const summaryLabelRightX = pageW - marginX - 32;
    const summaryValRightX = pageW - marginX - 2;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(90, 90, 90);
    pdf.text('SUBTOTAL DA LOCAÇÃO:', summaryLabelRightX, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 25, 25);
    pdf.text(this.formatCurrency(subtotal), summaryValRightX, y + 3.5, { align: 'right' });

    y += 5.2;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(90, 90, 90);
    pdf.text('DESCONTOS / RETENÇÕES:', summaryLabelRightX, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 25, 25);
    pdf.text(this.formatCurrency(desconto), summaryValRightX, y + 3.5, { align: 'right' });

    // Linha divisória posicionada ABAIXO do texto de descontos (sem sobrepor)
    y += 5.5;
    pdf.setDrawColor(45, 45, 48);
    pdf.setLineWidth(0.45);
    pdf.line(summaryLeftX, y, pageW - marginX, y);

    y += 5.2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.2);
    pdf.setTextColor(211, 47, 47);
    pdf.text('TOTAL LÍQUIDO A RECEBER:', summaryLabelRightX, y, { align: 'right' });
    pdf.text(this.formatCurrency(totalLiquido), summaryValRightX, y, { align: 'right' });

    y += 4.5;

    // ── 7. SEÇÃO 5: OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL ──
    y = drawSectionHeader('OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL', y);

    const legalText = 'Fundamentação Tributária: Operação de locação de bens móveis sem condutor, tributada nos termos da Lei Complementar nº 116/2003 e em estrita consonância com a Súmula Vinculante nº 31 do STF (Não incidência de ISS sobre locação pura de bens móveis).';
    const notesText = invoice.notes ? `Observações Complementares: ${invoice.notes}` : '';

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.3);
    const legalLines = pdf.splitTextToSize(legalText, contentW - 7);
    const notesLines = notesText ? pdf.splitTextToSize(notesText, contentW - 7) : [];
    const totalObsLines = legalLines.length + (notesLines.length > 0 ? notesLines.length + 0.5 : 0);
    const obsBoxH = Math.max(10.5, totalObsLines * 3.6 + 4);

    pdf.setFillColor(255, 253, 231);
    pdf.setDrawColor(251, 192, 45);
    pdf.setLineWidth(0.25);
    pdf.rect(marginX, y, contentW, obsBoxH, 'FD');
    pdf.setFillColor(251, 192, 45);
    pdf.rect(marginX, y, 1.3, obsBoxH, 'F');

    pdf.setTextColor(60, 60, 60);
    pdf.text(legalLines, marginX + 3.5, y + 3.8);
    if (notesLines.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(notesLines, marginX + 3.5, y + 3.8 + legalLines.length * 3.6 + 1.2);
    }

    y += obsBoxH + 4;

    // ── 8. SEÇÃO 6: DECLARAÇÃO DE ACEITE E ASSINATURAS ──
    const declH = 9.5;
    pdf.setFillColor(245, 245, 245);
    pdf.setDrawColor(51, 51, 51);
    pdf.setLineWidth(0.3);
    pdf.rect(marginX, y, contentW, declH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.3);
    pdf.setTextColor(34, 34, 34);
    pdf.text(
      'DECLARO QUE OS VEÍCULOS E SERVIÇOS FORAM DISPONIBILIZADOS E UTILIZADOS CONFORME O CONTRATO DE LOCAÇÃO:',
      marginX + contentW / 2,
      y + 3.8,
      { align: 'center' }
    );
    pdf.setFontSize(7.8);
    pdf.setTextColor(46, 125, 50);
    pdf.text(
      'EQUIPAMENTOS ENTREGUES EM CONDIÇÕES OPERACIONAIS PLENAS.',
      marginX + contentW / 2,
      y + 7.6,
      { align: 'center' }
    );

    y += declH;

    // Quadro de assinaturas (2 colunas)
    const sigBoxH = 22;
    const halfW = contentW / 2;
    pdf.setDrawColor(51, 51, 51);
    pdf.setLineWidth(0.3);
    pdf.rect(marginX, y, contentW, sigBoxH, 'S');
    pdf.line(marginX + halfW, y, marginX + halfW, y + sigBoxH);

    // Linha de assinatura esquerda
    const sigLineY = y + 9.5;
    pdf.setLineWidth(0.35);
    pdf.line(marginX + 8, sigLineY, marginX + halfW - 8, sigLineY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.6);
    pdf.setTextColor(34, 34, 34);
    pdf.text((company.name || DEFAULT_COMPANY.name).toUpperCase(), marginX + halfW / 2, sigLineY + 3.8, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('LOCADOR / GESTÃO FINANCEIRA E OPERACIONAL', marginX + halfW / 2, sigLineY + 7.2, { align: 'center' });
    pdf.text('DATA: _____ / _____ / _________', marginX + halfW / 2, sigLineY + 10.6, { align: 'center' });

    // Linha de assinatura direita
    pdf.line(marginX + halfW + 8, sigLineY, pageW - marginX - 8, sigLineY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.6);
    pdf.setTextColor(34, 34, 34);
    pdf.text((invoice.clientName || 'LOCATÁRIO / CLIENTE').toUpperCase(), marginX + halfW + halfW / 2, sigLineY + 3.8, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('LOCATÁRIO / REPRESENTANTE LEGAL', marginX + halfW + halfW / 2, sigLineY + 7.2, { align: 'center' });
    pdf.text('DATA: _____ / _____ / _________', marginX + halfW + halfW / 2, sigLineY + 10.6, { align: 'center' });

    y += sigBoxH + 5;

    // ── 9. RODAPÉ OFICIAL (INTEGRALMENTE VISÍVEL DENTRO DA PÁGINA) ──
    const footerY = Math.min(y, pageH - 12);
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.25);
    pdf.line(marginX, footerY, pageW - marginX, footerY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `Documento gerado pelo sistema FluxBus em ${generatedAt} às ${generatedHour} • Operador: ${generatedBy}`,
      pageW / 2,
      footerY + 3.5,
      { align: 'center' }
    );
    pdf.text(
      'Este documento formaliza e certifica a locação de veículos sem cessão de mão de obra e possui plena validade contratual.',
      pageW / 2,
      footerY + 6.8,
      { align: 'center' }
    );

    pdf.save(`fatura-locacao-${invoice.number || 'nova'}.pdf`);
  }
}

