import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: '#b45309', bg: '#fef3c7' },
  PAID: { label: 'Paga / Liquidada', color: '#15803d', bg: '#dcfce7' },
  OVERDUE: { label: 'Vencida', color: '#b91c1c', bg: '#fee2e2' },
  CANCELLED: { label: 'Cancelada', color: '#4b5563', bg: '#f3f4f6' },
  PARTIAL: { label: 'Parcialmente Paga', color: '#1d4ed8', bg: '#dbeafe' },
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

  /**
   * Constrói o HTML oficial da Fatura de Locação seguindo 100% o padrão visual da Ordem de Serviço (OS) FluxBus.
   */
  public static createHTML(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): string {
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

    const companyDetails = `CNPJ: ${company.cnpj} • ${company.address} - ${company.city}/${company.state} - CEP: ${company.zipCode} • Tel: ${company.phone}`;

    const statusInfo = STATUS_CONFIG[invoice.status] || {
      label: invoice.status || 'PENDENTE',
      color: '#b45309',
      bg: '#fef3c7',
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
      margin: 8mm 10mm 8mm 10mm;
    }

    * {
      box-sizing: border-box;
    }

    body { 
      font-family: Arial, sans-serif; 
      font-size: 8.5px; 
      margin: 0;
      padding: 10px;
      color: #222;
      line-height: 1.25;
      background-color: #fff;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
      border-bottom: 2px solid #d32f2f;
      padding-bottom: 4px;
    }
    
    .header-left {
      width: 55%;
      vertical-align: middle;
      text-align: left;
    }
    
    .header-right {
      width: 45%;
      vertical-align: middle;
      text-align: right;
    }

    .brand-logo {
      height: 36px;
      max-height: 36px;
      max-width: 170px;
      width: auto;
      margin-bottom: 3px;
      display: block;
      object-fit: contain;
    }

    .logo-placeholder {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #d32f2f;
      border-radius: 4px;
      padding: 3px 8px;
      font-weight: 900;
      color: #d32f2f;
      font-size: 11px;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    
    .brand-name {
      font-size: 10.5px;
      font-weight: bold;
      text-transform: uppercase;
      color: #222;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }
    
    .brand-details {
      font-size: 7.5px;
      color: #555;
      margin-top: 1px;
      line-height: 1.25;
    }

    .doc-title {
      font-size: 12.5px;
      font-weight: bold;
      color: #d32f2f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    
    .type-badge {
      display: inline-block;
      padding: 1.5px 8px;
      font-size: 8px;
      font-weight: bold;
      color: #fff;
      background-color: #d32f2f;
      border-radius: 3px;
      text-transform: uppercase;
    }
    
    .numero-os-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: bold;
      color: #d32f2f;
      background-color: #fdf2f2;
      border: 1px solid #d32f2f;
      padding: 1px 7px;
      border-radius: 3px;
      margin-top: 3px;
      font-family: monospace;
    }
    
    .data-emissao-compact {
      font-size: 8px;
      color: #666;
      margin-top: 2px;
    }

    .local-manutencao-bar {
      background-color: #f1f8e9;
      border: 1px solid #c8e6c9;
      border-left: 4px solid #2e7d32;
      padding: 3px 6px;
      font-size: 8px;
      color: #1b5e20;
      margin-top: 4px;
      margin-bottom: 5px;
      border-radius: 2px;
      text-transform: uppercase;
      font-weight: bold;
    }

    .secao { 
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
    
    .secao-titulo {
      background-color: #f5f5f5;
      padding: 2.5px 6px;
      font-weight: bold;
      font-size: 8.5px;
      border-left: 3.5px solid #d32f2f;
      margin-bottom: 3px;
      text-transform: uppercase;
      color: #d32f2f;
    }
    
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    
    table.info-table td {
      padding: 2.5px 5px;
      border: 1px solid #ddd;
      background-color: #fafafa;
      vertical-align: middle;
    }
    
    table.info-table td.label {
      font-weight: bold;
      font-size: 7.5px;
      text-transform: uppercase;
      color: #555;
      background-color: #f0f0f0;
      width: 22%;
    }
    
    table.info-table td.valor {
      font-size: 8.5px;
      color: #111;
      width: 28%;
      font-weight: 500;
    }

    table.itens-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    
    table.itens-table th {
      background-color: #333;
      color: #fff;
      padding: 3px 5px;
      font-size: 7.5px;
      text-transform: uppercase;
      text-align: left;
    }
    
    table.itens-table th.num { width: 5%; text-align: center; }
    table.itens-table th.placa { width: 14%; text-align: center; }
    table.itens-table th.valor { width: 18%; text-align: right; }
    
    table.itens-table td {
      padding: 2.5px 5px;
      border-bottom: 1px solid #ddd;
      font-size: 7.5px;
    }
    
    table.itens-table td.num { text-align: center; }
    table.itens-table td.placa { text-align: center; }
    table.itens-table td.valor { text-align: right; font-weight: bold; font-family: monospace; }
    
    table.itens-table tr.alternate td {
      background-color: #f8f8f8;
    }

    .plate-badge {
      display: inline-block;
      font-family: monospace;
      font-weight: bold;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 4px;
      border-radius: 2px;
      color: #1d4ed8;
      font-size: 7.5px;
    }

    .resumo {
      width: 45%;
      margin-left: auto;
      margin-bottom: 6px;
    }
    
    .resumo table { width: 100%; border-collapse: collapse; }
    .resumo td { padding: 1.5px 4px; font-size: 8px; }
    .resumo td.label { text-align: right; color: #555; }
    .resumo td.valor { text-align: right; font-weight: bold; }
    .resumo tr.total td {
      border-top: 1.5px solid #333;
      font-size: 9.5px;
      font-weight: bold;
      color: #d32f2f;
      padding-top: 2px;
    }

    .observacoes-box {
      margin: 3px 0;
      padding: 5px 8px;
      background-color: #fffde7;
      border: 1px solid #fbc02d;
      border-left: 3.5px solid #fbc02d;
      font-size: 8px;
      color: #444;
      line-height: 1.35;
      border-radius: 2px;
    }

    .conclusao-box {
      background-color: #f5f5f5;
      border: 1px solid #333;
      padding: 4px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
      text-transform: uppercase;
      margin-top: 8px;
    }

    .conclusao-sub {
      color: #2e7d32;
      font-size: 8.5px;
      font-weight: 800;
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
      padding: 12px 10px 6px 10px;
      vertical-align: top;
      width: 50%;
    }
    
    .linha-assinatura {
      border-top: 1.2px solid #333;
      margin-bottom: 3px;
      padding-top: 4px;
    }
    
    .assinatura-nome {
      font-weight: bold;
      font-size: 8.5px;
      color: #222;
      text-transform: uppercase;
    }
    
    .assinatura-info {
      font-size: 7.5px;
      color: #666;
      margin-top: 1px;
      text-transform: uppercase;
    }

    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 7px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 3px;
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
        <div class="brand-details">${companyDetails}</div>
      </td>
      <td class="header-right">
        <div class="doc-title">FATURA DE LOCAÇÃO — VEÍCULOS</div>
        <div style="margin: 2px 0;">
          <span class="type-badge">LOCAÇÃO DE BENS MÓVEIS (SEM CONDUTOR)</span>
        </div>
        <div class="numero-os-badge">FATURA Nº ${invoice.number}</div>
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
          <span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: bold; font-size: 7.5px; background-color: ${statusInfo.bg}; color: ${statusInfo.color};">
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
          <th style="width: 25%;">Marca / Modelo</th>
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

  <!-- ── SEÇÃO 4: RESUMO DE VALORES DA FATURA (PADRÃO RESUMO DE CUSTOS OS) ── -->
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
        <tr class="total">
          <td class="label">TOTAL LÍQUIDO A RECEBER:</td>
          <td class="valor">${this.formatCurrency(totalLiquido)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ── SEÇÃO 5: OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL ── -->
  <div class="secao">
    <div class="secao-titulo">OBSERVAÇÕES E FUNDAMENTAÇÃO LEGAL</div>
    <div class="observacoes-box">
      <strong>Fundamentação Tributária:</strong> Operação de locação de bens móveis sem condutor, tributada nos termos da <strong>Lei Complementar nº 116/2003</strong> e em estrita consonância com a <strong>Súmula Vinculante nº 31 do STF</strong> (Não incidência de ISS sobre locação pura de bens móveis).
      ${invoice.notes ? `<div style="margin-top: 3px;"><strong>Observações Complementares:</strong> ${invoice.notes}</div>` : ''}
    </div>
  </div>

  <!-- ── SEÇÃO 6: DECLARAÇÃO DE ACEITE E ASSINATURAS (MODELO OFICIAL OS) ── -->
  <div class="secao" style="margin-top: 8px; page-break-inside: avoid;">
    <div class="conclusao-box">
      DECLARO QUE OS VEÍCULOS E SERVIÇOS FORAM DISPONIBILIZADOS E UTILIZADOS CONFORME O CONTRATO DE LOCAÇÃO: <br/>
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
    const win = window.open('', '_blank', 'width=900,height=800');
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
   * Gera o PDF com o mesmo motor (html2canvas + jsPDF) e layout visual da Ordem de Serviço (OS).
   */
  public static async generatePDF(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): Promise<void> {
    try {
      const html = this.createHTML(invoice, options);

      // Elemento temporário para renderizar o HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Renderizar o canvas a partir do HTML com escala de alta definição
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
      });

      document.body.removeChild(tempDiv);

      // Criar o documento PDF A4 em retrato
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Páginas adicionais se houver transbordo
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`fatura-locacao-${invoice.number || 'nova'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF da Fatura de Locação no layout da OS:', error);
      throw error;
    }
  }
}
