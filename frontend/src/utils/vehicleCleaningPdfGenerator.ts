import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  VehicleCleaningOrder,
  parseChecklist,
  parseQualityChecklist,
  parseSupplies,
  CLEANING_TYPE_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
  PRIORITY_LABELS,
  CleaningSupplyItem,
} from '@/services/vehicleCleaningService';
import { getActiveCompanyInfo } from '@/utils/exportUtils';
import { getApiUrl } from '@/config/environment';

/**
 * Gera o documento HTML oficial da Ordem de Serviço de Higienização
 * Seguindo rigorosamente a identidade visual e padrão de layout da OS de Manutenção de Frota.
 */
export function generateCleaningDocumentHTML(
  order: VehicleCleaningOrder,
  suppliesList?: CleaningSupplyItem[]
): string {
  const company = getActiveCompanyInfo();
  const companyName = company.nome || 'VIAÇÃO SÃO SILVESTRE LTDA';
  const companyCnpj = company.cnpj ? `CNPJ: ${company.cnpj}` : 'CNPJ: 71.055.644/0001-25';
  const companyAddress = 'Rua Pelegrino de Paula Ferreira, 77 - CENTRO - Moeda - MG - 35.470-000/MG';
  const companyDetails = `${companyCnpj} • ${companyAddress}`;

  let logoSrc = '';
  if (company.logoUrl) {
    logoSrc = company.logoUrl.startsWith('http') || company.logoUrl.startsWith('data:')
      ? company.logoUrl
      : `${getApiUrl().replace('/api', '')}${company.logoUrl}`;
  }

  const osNumberFormatted = order.id
    ? `OS-HIG-${order.id.substring(0, 8).toUpperCase()}`
    : 'OS-HIG-000001';

  const dataEmissao = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  const dataParada = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : '—';
  const horaParada = order.startedAt
    ? new Date(order.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const dataSaida = order.releasedAt
    ? new Date(order.releasedAt).toLocaleDateString('pt-BR')
    : order.completedAt
    ? new Date(order.completedAt).toLocaleDateString('pt-BR')
    : order.releaseDeadline
    ? new Date(order.releaseDeadline).toLocaleDateString('pt-BR')
    : '—';

  const horaSaida = order.releasedAt
    ? new Date(order.releasedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : order.completedAt
    ? new Date(order.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : order.releaseDeadline
    ? new Date(order.releaseDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const cleaningLabel = CLEANING_TYPE_LABELS[order.cleaningType] || 'Higienização Completa';
  const requesterSector = order.requesterSector ? SECTOR_LABELS[order.requesterSector] : 'Operacional';
  const requesterName = order.requestedByName || order.driverName || 'Jose Mario Ramos';
  const phaseLabel = PHASE_LABELS[order.phase || 'AGUARDANDO'] || order.phase || 'Aguardando';

  const checklist = parseChecklist(order.checklistData);
  const qualityItems = parseQualityChecklist(order.qualityChecklist);
  const supplies = suppliesList || parseSupplies(order.checklistData);

  // Divide o checklist em 2 colunas para layout idêntico à OS preventiva/manutenção
  const mid = Math.ceil(checklist.length / 2);
  const leftColChecklist = checklist.slice(0, mid);
  const rightColChecklist = checklist.slice(mid);

  const renderChecklistRow = (item: any, idx: number) => `
    <tr>
      <td style="width: 20px; text-align: center;">
        <span class="badge-status ${item.checked ? 'status-ok' : 'status-na'}">
          ${item.checked ? '✓ OK' : 'PENDENTE'}
        </span>
      </td>
      <td>
        <span class="cat-badge">${item.category === 'INTERNAL' ? 'INTERNA' : 'EXTERNA'}</span>
        <span class="item-desc">${item.title}</span>
      </td>
    </tr>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Ordem de Serviço — Higienização #${osNumberFormatted}</title>
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
      padding: 12px;
      color: #222;
      line-height: 1.25;
      background: #fff;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
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
      font-size: 8.5px;
      font-weight: bold;
      color: #fff;
      background-color: #d32f2f;
      border-radius: 3px;
      text-transform: uppercase;
    }
    
    .numero-os-badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: bold;
      color: #d32f2f;
      background-color: #fdf2f2;
      border: 1.5px solid #d32f2f;
      padding: 1.5px 8px;
      border-radius: 3px;
      margin-top: 3px;
      font-family: monospace;
    }
    
    .data-emissao-compact {
      font-size: 8px;
      color: #666;
      margin-top: 3px;
    }

    .secao { 
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
    
    .secao-titulo {
      background-color: #f9f9f9;
      padding: 3px 6px;
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
      padding: 3px 5px;
      border: 1px solid #ddd;
      background-color: #fafafa;
      vertical-align: middle;
    }
    
    table.info-table td.label {
      font-weight: bold;
      font-size: 7.5px;
      text-transform: uppercase;
      color: #555;
      width: 22%;
      background-color: #f0f0f0;
    }
    
    table.info-table td.valor {
      font-size: 8.5px;
      color: #111;
      width: 28%;
      font-weight: 500;
    }

    .text-box {
      border: 1px solid #ddd;
      background-color: #fafafa;
      padding: 5px 8px;
      font-size: 8px;
      min-height: 28px;
      line-height: 1.35;
      color: #222;
      border-radius: 2px;
    }

    /* Checklist 2 Colunas */
    table.checklist-grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2px;
    }

    table.checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }

    table.checklist-table th {
      background-color: #333;
      color: #fff;
      padding: 3px 4px;
      font-size: 7px;
      text-transform: uppercase;
      text-align: left;
    }

    table.checklist-table td {
      padding: 2px 4px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 7.5px;
      line-height: 1.2;
    }

    .cat-badge {
      font-size: 6.5px;
      color: #555;
      text-transform: uppercase;
      white-space: nowrap;
      display: inline-block;
      background-color: #e5e7eb;
      padding: 0 3px;
      border-radius: 2px;
      font-weight: 600;
      margin-right: 4px;
    }

    .item-desc {
      font-size: 7.5px;
      color: #222;
      font-weight: 500;
    }

    .badge-status {
      display: inline-block;
      font-size: 6.5px;
      font-weight: bold;
      padding: 0.5px 3.5px;
      border-radius: 2px;
      white-space: nowrap;
    }

    .status-ok {
      color: #15803d;
      background-color: #dcfce7;
      border: 1px solid #bbf7d0;
    }

    .status-nok {
      color: #b91c1c;
      background-color: #fee2e2;
      border: 1px solid #fecaca;
    }

    .status-na {
      color: #6b7280;
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
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
    
    table.itens-table th.num { width: 6%; text-align: center; }
    table.itens-table th.qtd { width: 18%; text-align: center; }
    table.itens-table th.status { width: 18%; text-align: center; }
    
    table.itens-table td {
      padding: 2.5px 5px;
      border-bottom: 1px solid #ddd;
      font-size: 7.5px;
    }
    
    table.itens-table td.num { text-align: center; }
    table.itens-table td.qtd { text-align: center; font-weight: bold; }
    table.itens-table td.status { text-align: center; }
    
    table.itens-table tr.alternate td {
      background-color: #f9f9f9;
    }

    .assinaturas-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      page-break-inside: avoid;
    }

    .assinaturas-table td {
      width: 50%;
      padding: 0 15px;
      text-align: center;
      vertical-align: top;
    }

    .linha-assinatura {
      border-top: 1px solid #444;
      margin-bottom: 3px;
    }

    .cargo-assinatura {
      font-size: 7.5px;
      color: #666;
      text-transform: uppercase;
    }

    .nome-assinatura {
      font-size: 8px;
      font-weight: bold;
      color: #222;
    }

    .footer-note {
      font-size: 6.5px;
      color: #888;
      text-align: center;
      margin-top: 10px;
      border-top: 1px solid #eee;
      padding-top: 4px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- ── CABEÇALHO DA ORDEM DE SERVIÇO ── -->
  <table class="header-table">
    <tr>
      <td class="header-left">
        ${logoSrc ? `<img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'"/>` : `<div class="logo-placeholder">VIAÇÃO SÃO SILVESTRE</div>`}
        <div class="brand-name">${companyName}</div>
        <div class="brand-details">${companyDetails}</div>
      </td>
      <td class="header-right">
        <div class="doc-title">ORDEM DE SERVIÇO — HIGIENIZAÇÃO</div>
        <div>
          <span class="type-badge">${cleaningLabel.toUpperCase()}</span>
        </div>
        <div class="numero-os-badge">OS Nº ${osNumberFormatted}</div>
        <div class="data-emissao-compact">Data de Emissão: ${dataEmissao}</div>
      </td>
    </tr>
  </table>

  <!-- ── SEÇÃO 1: IDENTIFICAÇÃO E DADOS DE PARADA ── -->
  <div class="secao">
    <div class="secao-titulo">IDENTIFICAÇÃO E DADOS DE PARADA</div>
    <table class="info-table">
      <tr>
        <td class="label">VEÍCULO / EQUIPAMENTO:</td>
        <td class="valor"><strong>${order.vehiclePlate || '—'}</strong></td>
        <td class="label">MARCA / MODELO:</td>
        <td class="valor">${order.vehicleModel || 'ÔNIBUS URBANO / RODOVIÁRIO'}</td>
      </tr>
      <tr>
        <td class="label">LAVADOR / RESPONSÁVEL:</td>
        <td class="valor">${order.requestedByName || order.driverName || 'Equipe de Higienização'}</td>
        <td class="label">MÃO DE OBRA:</td>
        <td class="valor">Lavajato & Higienização Interna</td>
      </tr>
      <tr>
        <td class="label">DATA / HORA PARADA:</td>
        <td class="valor">${dataParada} ${horaParada}</td>
        <td class="label">DATA / HORA SAÍDA:</td>
        <td class="valor">${dataSaida} ${horaSaida}</td>
      </tr>
      <tr>
        <td class="label">OBRA (CLIENTE) / GARAGEM:</td>
        <td class="valor">${order.vehicleGarageName || 'Garagem Central'}</td>
        <td class="label">STATUS OS / FASE:</td>
        <td class="valor"><strong>${phaseLabel}</strong></td>
      </tr>
      <tr>
        <td class="label">SETOR SOLICITANTE:</td>
        <td class="valor">${requesterSector}</td>
        <td class="label">PRIORIDADE:</td>
        <td class="valor"><strong>${order.priority ? PRIORITY_LABELS[order.priority] : 'NORMAL'}</strong></td>
      </tr>
      <tr>
        <td class="label">INFORMAÇÃO AGREGADO:</td>
        <td class="valor">—</td>
        <td class="label">LOCAL LIBERAÇÃO / VAGA:</td>
        <td class="valor">${order.releaseSpot ? `Vaga ${order.releaseSpot}` : 'Pátio Central'}</td>
      </tr>
    </table>
  </div>

  <!-- ── SEÇÃO 2: DESCRIÇÃO DO SERVIÇO SOLICITADO / ANOMALIAS ── -->
  <div class="secao">
    <div class="secao-titulo">DESCRIÇÃO DO SERVIÇO SOLICITADO / OBSERVAÇÕES</div>
    <div class="text-box">
      <strong>Tipo de Limpeza:</strong> ${cleaningLabel} &nbsp;|&nbsp; <strong>Requerente:</strong> ${requesterName}<br/>
      ${order.observations ? `<strong>Observações:</strong> ${order.observations}` : 'Limpeza e higienização periódica preventiva do veículo conforme procedimento padrão operacional.'}
    </div>
  </div>

  <!-- ── SEÇÃO 3: CHECKLIST DE HIGIENIZAÇÃO REALIZADO ── -->
  <div class="secao">
    <div class="secao-titulo">CHECKLIST DE HIGIENIZAÇÃO E INSPEÇÃO EXECUTADA</div>
    <table class="checklist-grid-table">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 3px;">
          <table class="checklist-table">
            <thead>
              <tr>
                <th style="width: 20px; text-align: center;">Status</th>
                <th>Item / Procedimento de Limpeza</th>
              </tr>
            </thead>
            <tbody>
              ${leftColChecklist.map(renderChecklistRow).join('')}
            </tbody>
          </table>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 3px;">
          <table class="checklist-table">
            <thead>
              <tr>
                <th style="width: 20px; text-align: center;">Status</th>
                <th>Item / Procedimento de Limpeza</th>
              </tr>
            </thead>
            <tbody>
              ${rightColChecklist.map(renderChecklistRow).join('')}
            </tbody>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── SEÇÃO 4: INSPEÇÃO DE QUALIDADE (AUDITORIA) ── -->
  ${qualityItems && qualityItems.length > 0 ? `
  <div class="secao">
    <div class="secao-titulo">INSPEÇÃO DE QUALIDADE (AUDITORIA FINAL)</div>
    <table class="itens-table">
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Critério de Inspeção</th>
          <th class="status">Resultado Auditoria</th>
        </tr>
      </thead>
      <tbody>
        ${qualityItems.map((q, idx) => `
          <tr class="${idx % 2 === 1 ? 'alternate' : ''}">
            <td class="num">${idx + 1}</td>
            <td><strong>${q.title}</strong></td>
            <td class="status">
              <span class="badge-status ${q.checked ? 'status-ok' : 'status-nok'}">
                ${q.checked ? '✓ CONFORME' : 'NÃO CONFORME'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- ── SEÇÃO 5: PRODUTOS E INSUMOS UTILIZADOS ── -->
  <div class="secao">
    <div class="secao-titulo">PRODUTOS E INSUMOS QUÍMICOS APLICADOS</div>
    <table class="itens-table">
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Descrição do Insumo / Produto Químico</th>
          <th class="qtd">Quantidade Aplicada</th>
        </tr>
      </thead>
      <tbody>
        ${(supplies && supplies.length > 0 ? supplies : [
          { name: 'Shampoo Automotivo Concentrado Neutro', quantity: 300, unit: 'ml' },
          { name: 'Pretinho e Silicone Protetor para Pneus', quantity: 150, unit: 'ml' },
          { name: 'Desinfetante Sanitário / Químico Hospitalar', quantity: 200, unit: 'ml' },
          { name: 'Aromatizante Floral Veicular', quantity: 50, unit: 'ml' },
        ]).map((item, idx) => `
          <tr class="${idx % 2 === 1 ? 'alternate' : ''}">
            <td class="num">${idx + 1}</td>
            <td><strong>${item.name}</strong></td>
            <td class="qtd">${item.quantity} ${item.unit}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ── SEÇÃO 6: ASSINATURAS E RESPONSABILIDADES ── -->
  <table class="assinaturas-table">
    <tr>
      <td>
        <div class="linha-assinatura"></div>
        <div class="nome-assinatura">${order.driverName || order.requestedByName || 'Operador de Higienização'}</div>
        <div class="cargo-assinatura">Responsável pela Execução / Lavador</div>
      </td>
      <td>
        <div class="linha-assinatura"></div>
        <div class="nome-assinatura">${order.qualityInspectedBy || 'Gestor de Frota / Qualidade'}</div>
        <div class="cargo-assinatura">Inspetor de Qualidade & Liberação de Pátio</div>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    Documento emitido eletronicamente pelo Sistema FlexBus Fleet Management em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}.
  </div>

</body>
</html>`;
}

/**
 * Cria um Blob HTML carregável em iframe ou nova aba.
 */
export function generateCleaningDocumentHTMLBlob(
  order: VehicleCleaningOrder,
  suppliesList?: CleaningSupplyItem[]
): Blob {
  const html = generateCleaningDocumentHTML(order, suppliesList);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

/**
 * Abre o preview de impressão em uma nova janela com a estilização padronizada.
 */
export function openCleaningReleasePDFPreview(
  order: VehicleCleaningOrder,
  suppliesList?: CleaningSupplyItem[]
): void {
  const html = generateCleaningDocumentHTML(order, suppliesList);
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
 * Gera PDF via jsPDF (mantido para compatibilidade de download).
 */
export function generateCleaningReleasePDF(
  order: VehicleCleaningOrder,
  suppliesList?: CleaningSupplyItem[]
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const company = getActiveCompanyInfo();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // Header Vermelho Oficial
  doc.setFillColor(211, 47, 47); // #d32f2f
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Cabeçalho da Empresa
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 34, 34);
  doc.text(company.nome || 'VIAÇÃO SÃO SILVESTRE LTDA', margin, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const companySub = `${company.cnpj ? `CNPJ: ${company.cnpj}` : 'CNPJ: 71.055.644/0001-25'} • Rua Pelegrino de Paula Ferreira, 77 - Moeda/MG`;
  doc.text(companySub, margin, 21);

  // Título e OS à Direita
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47);
  doc.text('ORDEM DE SERVIÇO — HIGIENIZAÇÃO', pageWidth - margin, 15, { align: 'right' });

  const osNumberFormatted = order.id ? `OS-HIG-${order.id.substring(0, 8).toUpperCase()}` : 'OS-HIG-000001';
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47);
  doc.text(`OS Nº ${osNumberFormatted}`, pageWidth - margin, 21, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Data de Emissão: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 26, { align: 'right' });

  // Linha divisória
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(0.8);
  doc.line(margin, 29, pageWidth - margin, 29);

  let currentY = 35;

  // Seção 1: Identificação
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.setFillColor(211, 47, 47);
  doc.rect(margin, currentY, 3, 6, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47);
  doc.text('IDENTIFICAÇÃO E DADOS DE PARADA', margin + 6, currentY + 4.2);

  currentY += 8;

  const infoTableRows = [
    [
      'VEÍCULO / EQUIPAMENTO:',
      order.vehiclePlate || '—',
      'MARCA / MODELO:',
      order.vehicleModel || 'Ônibus Urbano / Rodoviário',
    ],
    [
      'LAVADOR / RESPONSÁVEL:',
      order.requestedByName || order.driverName || 'Equipe Higienização',
      'MÃO DE OBRA:',
      'Lavajato & Higienização Interna',
    ],
    [
      'DATA / HORA PARADA:',
      `${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '—'} ${order.startedAt ? new Date(order.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}`,
      'DATA / HORA SAÍDA:',
      order.releasedAt ? new Date(order.releasedAt).toLocaleString('pt-BR') : '—',
    ],
    [
      'GARAGEM / PÁTIO:',
      order.vehicleGarageName || 'Garagem Central',
      'STATUS OS / FASE:',
      PHASE_LABELS[order.phase || 'AGUARDANDO'] || order.phase || 'Aguardando',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    body: infoTableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [80, 80, 80] },
      1: { cellWidth: 51, fontStyle: 'bold', textColor: [20, 20, 20] },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [80, 80, 80] },
      3: { cellWidth: 51, fontStyle: 'bold', textColor: [20, 20, 20] },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Seção 2: Checklist
  const checklist = parseChecklist(order.checklistData);
  const checklistRows = checklist.map((item, idx) => [
    (idx + 1).toString(),
    item.category === 'INTERNAL' ? 'INTERNA' : 'EXTERNA',
    item.title,
    item.checked ? '✓ CONCLUÍDO' : 'PENDENTE',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Setor', 'Item de Higienização Executado', 'Status']],
    body: checklistRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Seção 3: Insumos
  const supplies = suppliesList || parseSupplies(order.checklistData);
  if (supplies && supplies.length > 0) {
    const suppliesRows = supplies.map((s, idx) => [
      (idx + 1).toString(),
      s.name,
      `${s.quantity} ${s.unit}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Produto Químico / Insumo Aplicado', 'Quantidade']],
      body: suppliesRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Assinaturas
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 25;
  }

  const signWidth = (pageWidth - margin * 2 - 20) / 2;
  const signY = pageHeight - 20;

  doc.setDrawColor(80, 80, 80);
  doc.line(margin, signY, margin + signWidth, signY);
  doc.line(margin + signWidth + 20, signY, pageWidth - margin, signY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Operador / Lavador Responsável', margin + signWidth / 2, signY + 4, { align: 'center' });
  doc.text('Inspetor de Qualidade / Gestor de Frota', margin + signWidth + 20 + signWidth / 2, signY + 4, { align: 'center' });

  return doc;
}

export function downloadCleaningReleasePDF(order: VehicleCleaningOrder, suppliesList?: CleaningSupplyItem[]): void {
  const doc = generateCleaningReleasePDF(order, suppliesList);
  const safePlate = (order.vehiclePlate || 'veiculo').replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`os-higienizacao-${safePlate}-${order.id.substring(0, 8)}.pdf`);
}
