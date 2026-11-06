import * as XLSX from 'xlsx';
import {
  ClientContractMock,
  ContractExtraTripItem,
  ContractExcessKmItem,
  ContractDeductionItem,
} from '../data/measurementContractMockData';
import { ParteDiaria } from '../types/measurement';

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
  statusLabel?: string;
  elaboratedBy?: string;
  validatedBy?: string;
}

const formatCurrency = (val: number): string =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

export class ContractMeasurementPdfService {
  /**
   * Gera e abre a janela de impressão/PDF formatada da Medição Completa por Contrato de Cliente
   * Contém: Cabeçalho, Resumo Financeiro, Veículos Locados, Partes Diárias Lançadas,
   * Viagens Extras, KM Excedente, Débitos/Descontos e Dados da NFS-e.
   */
  static generateMeasurementPDF(options: GenerateMeasurementPdfOptions): void {
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

    const printWindow = window.open('', '_blank', 'width=1180,height=860');
    if (!printWindow) {
      alert('Permita pop-ups no navegador para visualizar e salvar o PDF da medição.');
      return;
    }

    const leasedRows =
      client.leasedVehicles.length > 0
        ? client.leasedVehicles
            .map(
              (v, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="mono bold">${v.plate}</td>
            <td>${v.description}</td>
            <td>${v.route || '-'}</td>
            <td class="center">${v.workingDays}d / ${v.stoppedDays || 0}d</td>
            <td class="right mono">${formatCurrency(v.dailyRate || 0)}</td>
            <td class="right mono bold">${formatCurrency(v.periodValue || 0)}</td>
          </tr>
        `
            )
            .join('')
        : `<tr><td colspan="7" class="empty">Nenhum veículo fixo locado registrado neste período.</td></tr>`;

    const partesDiariasRows =
      partesDiarias.length > 0
        ? partesDiarias
            .map((pd, idx) => {
              const tripsSummary =
                pd.trips && pd.trips.length > 0
                  ? pd.trips
                      .map(
                        (t) =>
                          `${t.startTime || ''}-${t.endTime || ''}: ${t.itinerary || t.activityCode || ''}`
                      )
                      .join(' | ')
                  : pd.notes || 'Operação contratual normal';
              const statusMap: Record<string, string> = {
                APPROVED: 'APROVADA',
                PENDING: 'EM ANÁLISE',
                REJECTED: 'GLOSADA',
              };
              return `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="mono bold">#${pd.number}</td>
            <td class="center mono">${formatDateBR(pd.date)}</td>
            <td class="mono bold">${pd.vehiclePlate}${pd.vehicleModel ? ` (${pd.vehicleModel})` : ''}</td>
            <td>${pd.driverName || '-'}</td>
            <td class="center mono">${pd.startTime || '-'} às ${pd.endTime || '-'}</td>
            <td class="right mono">${(pd.kmInitial || 0).toLocaleString('pt-BR')} → ${(pd.kmFinal || 0).toLocaleString('pt-BR')}</td>
            <td class="right mono">${(pd.kmDriven || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono bold">${(pd.kmConsidered ?? pd.kmDriven ?? 0).toLocaleString('pt-BR')} km</td>
            <td>${tripsSummary}</td>
            <td class="center bold">${statusMap[pd.status] || pd.status || 'APROVADA'}</td>
          </tr>
        `;
            })
            .join('')
        : `<tr><td colspan="11" class="empty">Nenhuma parte diária vinculada ao período.</td></tr>`;

    const totalKmDrivenPartes = partesDiarias.reduce((acc, pd) => acc + (pd.kmDriven || 0), 0);
    const totalKmConsideredPartes = partesDiarias.reduce(
      (acc, pd) => acc + (pd.kmConsidered ?? pd.kmDriven ?? 0),
      0
    );

    const extraTripsRows =
      extraTrips.length > 0
        ? extraTrips
            .map(
              (et, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="center mono">${formatDateBR(et.date)}</td>
            <td class="mono bold">${et.plate}</td>
            <td>${et.route}</td>
            <td>${et.vehicleType || '-'}</td>
            <td class="right mono bold">${formatCurrency(et.tripCost || 0)}</td>
          </tr>
        `
            )
            .join('')
        : `<tr><td colspan="6" class="empty">Nenhuma viagem extra registrada no período.</td></tr>`;

    const excessKmRows =
      excessKmItems.length > 0
        ? excessKmItems
            .map(
              (ek, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="center bold">${ek.periodMonth || '-'}</td>
            <td class="mono bold">${ek.plate}</td>
            <td class="right mono">${(ek.franchiseKm || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono">${(ek.totalKmDriven || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono">${(ek.disregardedKm || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono">${(ek.consideredKm || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono bold">${(ek.excessKm || 0).toLocaleString('pt-BR')} km</td>
            <td class="right mono">${formatCurrency(ek.excessKmRate || 0)}</td>
            <td class="right mono bold">${formatCurrency(ek.totalValue || 0)}</td>
          </tr>
        `
            )
            .join('')
        : `<tr><td colspan="10" class="empty">Nenhuma apuração de KM excedente registrada no período.</td></tr>`;

    const deductionRows =
      deductions.length > 0
        ? deductions
            .map(
              (d, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="center mono">${formatDateBR(d.date)}</td>
            <td class="mono bold">${d.plate || 'CONTRATO'}</td>
            <td>${d.description}</td>
            <td class="center">${d.type === 'CREDIT' ? 'CRÉDITO (+)' : 'DÉBITO (-)'}</td>
            <td class="right mono bold ${d.type === 'CREDIT' ? 'green' : 'red'}">
              ${d.type === 'CREDIT' ? '+' : '-'}${formatCurrency(d.value || 0)}
            </td>
          </tr>
        `
            )
            .join('')
        : `<tr><td colspan="6" class="empty">Nenhuma dedução ou desconto registrado no período.</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Boletim de Medição #${client.measurementNumber} - ${client.clientName}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
          body { margin: 0; padding: 14px; color: #18181b; background: #fff; font-size: 10.5px; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand h1 { margin: 0; font-size: 17px; color: #09090b; text-transform: uppercase; letter-spacing: 0.5px; }
          .brand p { margin: 2px 0; color: #52525b; font-size: 10.5px; }
          .doc-badge {
            text-align: right;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 8px 12px;
            border-radius: 8px;
          }
          .doc-badge h2 { margin: 0; font-size: 13px; color: #b45309; }
          .doc-badge p { margin: 2px 0 0; font-size: 10px; color: #78350f; font-weight: 600; }
          .status-pill {
            display: inline-block;
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 999px;
            background: #059669;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.4px;
          }
          .client-box {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 9px 12px;
            margin-bottom: 12px;
          }
          .client-box div span { display: block; font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .client-box div strong { font-size: 11px; color: #0f172a; }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }
          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 7px 10px;
            background: #fff;
          }
          .summary-card.highlight {
            background: #ecfdf5;
            border-color: #10b981;
          }
          .summary-card span { display: block; font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .summary-card strong { font-size: 13px; color: #0f172a; font-family: Consolas, monospace; }
          .summary-card.highlight strong { color: #047857; font-size: 14px; }
          h3 {
            margin: 12px 0 5px;
            font-size: 11px;
            text-transform: uppercase;
            color: #1e293b;
            border-left: 3px solid #f59e0b;
            padding-left: 7px;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 9.8px; }
          th { background: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 9px; text-align: left; }
          .center { text-align: center; }
          .right { text-align: right; }
          .mono { font-family: Consolas, monospace; }
          .bold { font-weight: 700; }
          .red { color: #dc2626; }
          .green { color: #059669; }
          .empty { text-align: center; color: #94a3b8; font-style: italic; padding: 8px; }
          .nf-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 8px;
            padding: 9px 12px;
            margin-top: 8px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .nf-box div span { display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; }
          .nf-box div strong { font-size: 10.5px; color: #0f172a; }
          .signatures {
            margin-top: 26px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #334155;
            padding-top: 5px;
            font-size: 10px;
            color: #334155;
          }
          .no-print {
            margin-bottom: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .btn {
            background: #059669;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            font-size: 12px;
          }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
        </div>

        <div class="header">
          <div class="brand">
            <h1>VIAÇÃO SÃO SILVESTRE LTDA</h1>
            <p>Gestão Integrada de Frotas, Fretamento Contínuo & Medições Contratuais</p>
            <p>Relatório Analítico Completo de Medição do Período (Frota, Partes Diárias, Viagens Extras e Faturamento)</p>
          </div>
          <div class="doc-badge">
            <h2>BOLETIM DE MEDIÇÃO Nº ${client.measurementNumber}</h2>
            <p>Contrato: ${client.contractNumber}</p>
            <span class="status-pill">${statusLabel}</span>
          </div>
        </div>

        <div class="client-box">
          <div>
            <span>Cliente / Contratante</span>
            <strong>${client.clientName}</strong>
          </div>
          <div>
            <span>CNPJ</span>
            <strong class="mono">${client.cnpj}</strong>
          </div>
          <div>
            <span>Período de Apuração</span>
            <strong class="mono">${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}</strong>
          </div>
          <div>
            <span>Vencimento Fatura / NF</span>
            <strong class="mono">${formatDateBR(inv.nfDueDate || client.dueDate)}</strong>
          </div>
          <div>
            <span>Partes Diárias / Extras</span>
            <strong class="mono">${partesDiarias.length} boletim(ns) / ${extraTrips.length} viagem(ns)</strong>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span>1. Veículos Locados (${client.leasedVehicles.length})</span>
            <strong>${formatCurrency(totals.leasedTotal)}</strong>
          </div>
          <div class="summary-card">
            <span>2. Viagens Extras (${extraTrips.length})</span>
            <strong>${formatCurrency(totals.extraTripsTotal)}</strong>
          </div>
          <div class="summary-card">
            <span>3. KM Excedente (${excessKmItems.length})</span>
            <strong>${formatCurrency(totals.excessKmTotal)}</strong>
          </div>
          <div class="summary-card">
            <span>4. Deduções / Descontos (${deductions.length})</span>
            <strong class="red">-${formatCurrency(totals.deductionsTotal)}</strong>
          </div>
          <div class="summary-card highlight">
            <span>5. Total Líquido Medição</span>
            <strong>${formatCurrency(totals.grandTotal)}</strong>
          </div>
        </div>

        <h3>1. Veículos Locados sob Contrato Fixo (${client.leasedVehicles.length})</h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 32px">#</th>
              <th style="width: 85px">Placa</th>
              <th>Descrição do Veículo / Serviço</th>
              <th>Rota / Alocação</th>
              <th class="center" style="width: 85px">Trab. / Parado</th>
              <th class="right" style="width: 105px">Diária (R$)</th>
              <th class="right" style="width: 115px">Valor Período</th>
            </tr>
          </thead>
          <tbody>
            ${leasedRows}
          </tbody>
        </table>

        <h3>2. Partes Diárias Lançadas no Período (${partesDiarias.length} boletins — KM Rodado: ${totalKmDrivenPartes.toLocaleString('pt-BR')} km | Considerado: ${totalKmConsideredPartes.toLocaleString('pt-BR')} km)</h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 28px">#</th>
              <th style="width: 65px">Boletim</th>
              <th class="center" style="width: 75px">Data</th>
              <th style="width: 120px">Placa / Veículo</th>
              <th style="width: 135px">Motorista</th>
              <th class="center" style="width: 85px">Horário</th>
              <th class="right" style="width: 110px">Hodômetro</th>
              <th class="right" style="width: 75px">KM Rod.</th>
              <th class="right" style="width: 75px">KM Cons.</th>
              <th>Trajetos / Atividades Executadas</th>
              <th class="center" style="width: 75px">Status</th>
            </tr>
          </thead>
          <tbody>
            ${partesDiariasRows}
          </tbody>
        </table>

        <h3>3. Viagens Extras & Turnos Adicionais (${extraTrips.length})</h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 32px">#</th>
              <th class="center" style="width: 85px">Data</th>
              <th style="width: 90px">Placa</th>
              <th>Trajeto / Descrição da Viagem Extra</th>
              <th style="width: 140px">Tipo de Veículo</th>
              <th class="right" style="width: 115px">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${extraTripsRows}
          </tbody>
        </table>

        <h3>4. Apuração de Quilometragem Excedente (${excessKmItems.length})</h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 28px">#</th>
              <th class="center" style="width: 80px">Mês/Ref.</th>
              <th style="width: 85px">Placa</th>
              <th class="right">Franquia</th>
              <th class="right">KM Rodado</th>
              <th class="right">Desconsid.</th>
              <th class="right">Considerado</th>
              <th class="right">KM Excedido</th>
              <th class="right">R$ / KM</th>
              <th class="right">Total Exc.</th>
            </tr>
          </thead>
          <tbody>
            ${excessKmRows}
          </tbody>
        </table>

        <h3>5. Deduções, Seguros & Descontos Contratuais (${deductions.length})</h3>
        <table>
          <thead>
            <tr>
              <th class="center" style="width: 32px">#</th>
              <th class="center" style="width: 85px">Data</th>
              <th style="width: 90px">Placa</th>
              <th>Descrição do Lançamento</th>
              <th class="center" style="width: 95px">Natureza</th>
              <th class="right" style="width: 115px">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${deductionRows}
          </tbody>
        </table>

        <h3>6. Espelho para Faturamento ao Cliente & Emissão da Nota Fiscal (NFS-e) / Fatura de Locação</h3>
        <div class="nf-box" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 8px;">
          <div>
            <span>Nº Fatura de Locação</span>
            <strong class="mono">FAT-LOC-${client.measurementNumber}/2026</strong>
          </div>
          <div>
            <span>Número da NFS-e</span>
            <strong class="mono">${inv.nfNumber || 'A EMITIR PELO FATURAMENTO'}</strong>
          </div>
          <div>
            <span>Emissão / Vencimento</span>
            <strong class="mono">${formatDateBR(inv.nfIssueDate || client.periodEnd)} → ${formatDateBR(inv.nfDueDate || client.dueDate)}</strong>
          </div>
          <div>
            <span>Valor Bruto da Fatura</span>
            <strong class="mono">${formatCurrency(totals.grandTotal)}</strong>
          </div>
          <div>
            <span>Valor Líquido a Receber (Financeiro)</span>
            <strong class="mono green">${formatCurrency(inv.netValue || totals.grandTotal)}</strong>
          </div>
        </div>

        <table style="margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="width: 24%">Emitente / Prestadora (Locadora)</th>
              <th style="width: 26%">Tomador / Cliente (Faturado)</th>
              <th style="width: 25%">Retenções Fiscais & Impostos</th>
              <th style="width: 25%">Integração Contas a Receber / Bancário</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${invoiceOverride?.providerCompany || 'VIAÇÃO SÃO SILVESTRE LTDA'}</strong><br/>
                CNPJ: <span class="mono">${invoiceOverride?.providerCnpj || '19.876.543/0001-10'}</span><br/>
                Cód. Serviço / CNAE: <span class="mono">16.01 / 7711-0/00</span><br/>
                Natureza: Locação de Veículos & Fretamento
              </td>
              <td>
                <strong>${client.clientName}</strong><br/>
                CNPJ: <span class="mono">${client.cnpj}</span><br/>
                Contrato: <span class="mono">${client.contractNumber}</span><br/>
                Competência: <span class="mono">${formatDateBR(client.periodStart)} a ${formatDateBR(client.periodEnd)}</span>
              </td>
              <td class="mono">
                PIS (0,65%): ${formatCurrency(invoiceOverride?.retentionPIS || 0)}<br/>
                COFINS (3,00%): ${formatCurrency(invoiceOverride?.retentionCOFINS || 0)}<br/>
                CSLL (1,00%): ${formatCurrency(invoiceOverride?.retentionCSLL || 0)}<br/>
                ISS / INSS / IR: ${formatCurrency((inv.retentionISS || 0) + (inv.retentionINSS || 0) + (inv.retentionIR || 0))}
              </td>
              <td>
                <strong>Status Contas a Receber:</strong> DISPONÍVEL NO FINANCEIRO<br/>
                <strong>Forma de Cobrança:</strong> Boleto / PIX / TED<br/>
                <strong>Dados Bancários:</strong> ${invoiceOverride?.bankDetails || 'Banco Itaú (341) Ag. 3150 C/C 44890-2 · PIX CNPJ'}
              </td>
            </tr>
          </tbody>
        </table>

        <div style="border: 1px solid #cbd5e1; background: #fffbeb; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px;">
          <span style="display:block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #b45309; margin-bottom: 3px;">
            Discriminação Sugerida dos Serviços para Emissão da Nota Fiscal (NFS-e) / Fatura de Locação de Veículos:
          </span>
          <div class="mono" style="font-size: 9.5px; color: #1e293b; line-height: 1.45;">
            FATURAMENTO REFERENTE À LOCAÇÃO DE VEÍCULOS E PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE — CONTRATO Nº ${client.contractNumber} — BOLETIM DE MEDIÇÃO Nº ${client.measurementNumber} — PERÍODO DE COMPETÊNCIA: ${formatDateBR(client.periodStart)} A ${formatDateBR(client.periodEnd)}.
            VEÍCULOS ALOCADOS (${client.leasedVehicles.length}): ${
              client.leasedVehicles.length > 0
                ? client.leasedVehicles
                    .map(
                      (v) =>
                        `[${v.plate} - ${v.description} - ${v.workingDays} DIAS - ${formatCurrency(v.periodValue || 0)}]`
                    )
                    .join('; ')
                : 'N/A'
            }.
            PARTES DIÁRIAS APURADAS: ${partesDiarias.length} BOLETIM(NS) (${totalKmConsideredPartes.toLocaleString('pt-BR')} KM CONSIDERADOS).
            VIAGENS EXTRAS: ${formatCurrency(totals.extraTripsTotal)} | KM EXCEDENTE: ${formatCurrency(totals.excessKmTotal)} | DEDUÇÕES: -${formatCurrency(totals.deductionsTotal)}.
            VALOR BRUTO DA FATURA: ${formatCurrency(totals.grandTotal)} | VALOR LÍQUIDO A RECEBER: ${formatCurrency(inv.netValue || totals.grandTotal)} — VENCIMENTO: ${formatDateBR(inv.nfDueDate || client.dueDate)}.
          </div>
        </div>

        <div class="signatures">
          <div class="sig-line">Elaborado por: ${elaboratedBy}</div>
          <div class="sig-line">Revisado / Liberado por: ${validatedBy}</div>
          <div class="sig-line">De Acordo (${client.clientName})</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Gera e faz o download do arquivo Excel (.xlsx) completo com todas as abas da medição do período:
   * 1. Resumo da Medição
   * 2. Veículos Locados
   * 3. Partes Diárias Lançadas (com detalhamento de trajetos/atividades)
   * 4. Viagens Extras
   * 5. KM Excedente
   * 6. Débitos e Descontos
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
