import api from '@/lib/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { timeRecordService } from '@/services/timeRecordService';
import { employeeService } from '@/services/employeeService';
import { resolveCompanyLogoUrl, getStoredCompanyBranding } from '@/utils/logoUtils';

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface ResolvedEmployeeAndCompany {
  employeeName: string;
  employeeCpf: string;
  employeeRegistration: string;
  employeeRole: string;
  employeeDepartment: string;
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  logoUrl?: string | null;
}

async function resolveEmployeeAndCompanyContext(employeeId: string): Promise<ResolvedEmployeeAndCompany> {
  let employeeName = 'Colaborador';
  let employeeCpf = '-';
  let employeeRegistration = '-';
  let employeeRole = 'Manutenção / Operacional';
  let employeeDepartment = 'Manutenção e Frota';
  let companyName = 'VIAÇÃO SÃO SILVESTRE LTDA';
  let companyCnpj = '33.592.510/0001-54';
  let companyAddress = 'Gestão Integrada de Frotas e Transporte';
  let logoUrl: string | null = null;

  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (
        !employeeId ||
        String(parsedUser?.id) === String(employeeId) ||
        String(parsedUser?.employeeId) === String(employeeId)
      ) {
        employeeName = parsedUser?.name || employeeName;
        employeeCpf = parsedUser?.cpf || parsedUser?.document || employeeCpf;
        employeeRegistration = parsedUser?.registrationNumber || parsedUser?.matricula || employeeRegistration;
        employeeRole = parsedUser?.positionDescription || parsedUser?.role || employeeRole;
      }
    }
  } catch {
    // ignore
  }

  try {
    const emp = await employeeService.getEmployeeById(employeeId);
    if (emp) {
      employeeName = emp.name || employeeName;
      employeeCpf = emp.cpf || emp.document || employeeCpf;
      employeeRegistration = emp.registrationNumber || employeeRegistration;
      employeeRole = emp.position?.name || emp.positionDescription || emp.role || employeeRole;
      employeeDepartment = emp.department?.name || employeeDepartment;
    }
  } catch {
    // ignore
  }

  try {
    const branding = getStoredCompanyBranding();
    if (branding.logoUrl) logoUrl = branding.logoUrl;
    else if (branding.iconUrl) logoUrl = branding.iconUrl;

    const rawEmpresa = localStorage.getItem('empresa') || localStorage.getItem('company');
    if (rawEmpresa) {
      const parsedEmp = JSON.parse(rawEmpresa);
      companyName = parsedEmp?.nome || parsedEmp?.name || parsedEmp?.razaoSocial || companyName;
      companyCnpj = parsedEmp?.cnpj || companyCnpj;
      companyAddress = parsedEmp?.address || parsedEmp?.endereco || companyAddress;
      if (!logoUrl) {
        logoUrl = parsedEmp?.logoUrl || parsedEmp?.iconUrl || parsedEmp?.logo || null;
      }
    }
  } catch {
    // ignore
  }

  return {
    employeeName,
    employeeCpf,
    employeeRegistration,
    employeeRole,
    employeeDepartment,
    companyName,
    companyCnpj,
    companyAddress,
    logoUrl,
  };
}

async function loadLogoDataUrl(rawUrl?: string | null): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const candidates: string[] = [];
  if (rawUrl) candidates.push(rawUrl);
  if (typeof window !== 'undefined') {
    candidates.push(`${window.location.origin}/logo.png`);
  }

  for (const cand of candidates) {
    const resolved =
      cand.startsWith('data:') || cand.startsWith('http')
        ? cand
        : resolveCompanyLogoUrl(cand) || cand;
    if (!resolved) continue;

    const loaded = await new Promise<{ dataUrl: string; width: number; height: number } | null>((resolve) => {
      const img = new Image();
      if (!resolved.startsWith('data:')) img.crossOrigin = 'Anonymous';
      const timer = window.setTimeout(() => resolve(null), 2500);
      img.onload = () => {
        window.clearTimeout(timer);
        try {
          const w = img.naturalWidth || img.width || 240;
          const h = img.naturalHeight || img.height || 100;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        window.clearTimeout(timer);
        resolve(null);
      };
      img.src = resolved;
    });

    if (loaded) return loaded;
  }
  return null;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

class TimeSheetService {
  async downloadTimeSheet(employeeId: string, year?: number, month?: number): Promise<Blob> {
    const now = new Date();
    const resolvedYear = year || now.getFullYear();
    const resolvedMonth = month || now.getMonth() + 1;

    const params: any = { year: resolvedYear, month: resolvedMonth };

    try {
      const response = await api.get(`/api/time-sheets/${employeeId}`, {
        params,
        responseType: 'blob',
      });
      if (response?.data && response.data.size > 0) {
        return response.data as Blob;
      }
    } catch {
      // Fallback para geração local de Excel caso o backend retorne 403/400
    }

    return this.generateClientSideExcel(employeeId, resolvedYear, resolvedMonth);
  }

  async downloadTimeSheetPdf(employeeId: string, year?: number, month?: number): Promise<Blob> {
    const now = new Date();
    const resolvedYear = year || now.getFullYear();
    const resolvedMonth = month || now.getMonth() + 1;

    const params: any = { year: resolvedYear, month: resolvedMonth };

    try {
      const response = await api.get(`/api/time-sheets/${employeeId}/pdf`, {
        params,
        responseType: 'blob',
      });
      if (response?.data && response.data.size > 0) {
        return response.data as Blob;
      }
    } catch {
      // Fallback para geração local de PDF caso o backend retorne 403/400 antes de reiniciar a JVM
    }

    return this.generateClientSidePdf(employeeId, resolvedYear, resolvedMonth);
  }

  private async fetchMonthRecordsMap(employeeId: string, year: number, month: number) {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const res = await timeRecordService.getRecordsByPeriod(employeeId, startStr, endStr);
    const records: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

    const byDate = new Map<string, any[]>();
    records.forEach((r) => {
      if (!r?.recordedAt) return;
      const dKey = String(r.recordedAt).substring(0, 10);
      const list = byDate.get(dKey) || [];
      list.push(r);
      byDate.set(dKey, list);
    });
    return byDate;
  }

  private async generateClientSidePdf(employeeId: string, year: number, month: number): Promise<Blob> {
    const ctx = await resolveEmployeeAndCompanyContext(employeeId);
    const byDate = await this.fetchMonthRecordsMap(employeeId, year, month);
    const logoObj = await loadLogoDataUrl(ctx.logoUrl);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    let headerX = 12;
    if (logoObj && logoObj.dataUrl) {
      try {
        const maxW = 28;
        const maxH = 14;
        const ratio = logoObj.width / Math.max(1, logoObj.height);
        let drawW = maxW;
        let drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }
        doc.addImage(logoObj.dataUrl, 'PNG', 12, 10, drawW, drawH);
        headerX = 12 + drawW + 4;
      } catch {
        // ignore
      }
    }

    // Cabeçalho da Empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(24, 30, 42);
    doc.text(ctx.companyName.toUpperCase(), headerX, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`CNPJ: ${ctx.companyCnpj}`, headerX, 19.5);
    doc.text(ctx.companyAddress, headerX, 23.5);

    // Título à direita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(24, 30, 42);
    doc.text('ESPELHO DE PONTO ELETRÔNICO', pageW - 12, 15, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Conforme Portaria MTP nº 671/2021 e CLT', pageW - 12, 19.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 30, 42);
    doc.text(`Período de Apuração: ${String(month).padStart(2, '0')}/${year}`, pageW - 12, 24, { align: 'right' });

    // Quadro de Identificação do Colaborador
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, 27, pageW - 24, 15, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Empregado: ${ctx.employeeName}`, 15, 32.5);
    doc.text(`CPF / Doc: ${ctx.employeeCpf}`, 110, 32.5);
    doc.text(`Matrícula: ${ctx.employeeRegistration}`, 160, 32.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Função / Cargo: ${ctx.employeeRole}`, 15, 38.5);
    doc.text(`Departamento: ${ctx.employeeDepartment}`, 110, 38.5);

    const days = getDaysInMonth(year, month);
    let totalWorkedMinutesMonth = 0;
    let diasComRegistro = 0;

    const rows = days.map((d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoKey = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayList = (byDate.get(isoKey) || []).sort((a, b) =>
        String(a.recordedAt).localeCompare(String(b.recordedAt))
      );

      const getFmtTime = (type: string) => {
        const rec = dayList.find((r) => r.recordType === type);
        if (!rec?.recordedAt) return '--';
        const dObj = new Date(rec.recordedAt);
        if (Number.isNaN(dObj.getTime())) {
          const match = String(rec.recordedAt).match(/(\d{2}:\d{2})/);
          return match ? match[1] : '--';
        }
        return dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      };

      const ent = getFmtTime('ENTRADA');
      const saiAlm = getFmtTime('SAIDA_ALMOCO');
      const retAlm = getFmtTime('RETORNO_ALMOCO');
      const sai = getFmtTime('SAIDA');

      let minutesToday = 0;
      const entRec = dayList.find((r) => r.recordType === 'ENTRADA');
      const saiRec = dayList.find((r) => r.recordType === 'SAIDA');
      if (entRec?.recordedAt && saiRec?.recordedAt) {
        const t1 = new Date(entRec.recordedAt).getTime();
        const t2 = new Date(saiRec.recordedAt).getTime();
        if (t2 > t1) {
          let totalMin = Math.floor((t2 - t1) / 60000);
          const saRec = dayList.find((r) => r.recordType === 'SAIDA_ALMOCO');
          const raRec = dayList.find((r) => r.recordType === 'RETORNO_ALMOCO');
          if (saRec?.recordedAt && raRec?.recordedAt) {
            const a1 = new Date(saRec.recordedAt).getTime();
            const a2 = new Date(raRec.recordedAt).getTime();
            if (a2 > a1) totalMin -= Math.floor((a2 - a1) / 60000);
          } else if (totalMin > 360) {
            totalMin -= 60;
          }
          minutesToday = Math.max(0, totalMin);
          totalWorkedMinutesMonth += minutesToday;
          diasComRegistro++;
        }
      } else if (dayList.length > 0) {
        diasComRegistro++;
      }

      const horasStr =
        minutesToday > 0
          ? `${String(Math.floor(minutesToday / 60)).padStart(2, '0')}h ${String(minutesToday % 60).padStart(2, '0')}m`
          : dayList.length === 0
          ? isWeekend
            ? 'DSR'
            : '--'
          : 'Em aberto';

      const obs =
        dayList.length === 0
          ? isWeekend
            ? 'Folga Semanal / DSR'
            : 'Sem registro'
          : dayList.some((r) => r.isManual)
          ? '* Ajuste Manual'
          : 'Normal';

      return [`${dd}/${mm}`, DAY_NAMES_SHORT[dayOfWeek], ent, saiAlm, retAlm, sai, horasStr, obs];
    });

    autoTable(doc, {
      startY: 45,
      margin: { left: 12, right: 12 },
      head: [['Data', 'Dia', '1ª Entrada', '1ª Saída', '2ª Entrada', '2ª Saída', 'Horas Trab.', 'Ocorrências / Obs']],
      body: rows,
      styles: {
        fontSize: 6.8,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        7: { halign: 'left' },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 245;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, finalY + 3, pageW - 24, 8, 'FD');

    const totH = Math.floor(totalWorkedMinutesMonth / 60);
    const totM = totalWorkedMinutesMonth % 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(24, 30, 42);
    doc.text(`Total de Dias Trabalhados: ${diasComRegistro} dias`, 15, finalY + 8.2);
    doc.setTextColor(15, 118, 110);
    doc.text(
      `Total de Horas Trabalhadas: ${String(totH).padStart(2, '0')}h ${String(totM).padStart(2, '0')}min`,
      pageW - 15,
      finalY + 8.2,
      { align: 'right' }
    );

    // Assinaturas
    const signY = Math.min(284, finalY + 23);
    doc.setDrawColor(148, 163, 184);
    doc.line(20, signY, 95, signY);
    doc.line(115, signY, pageW - 20, signY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(ctx.employeeName, 57.5, signY + 4, { align: 'center' });
    doc.text(ctx.companyName, (115 + pageW - 20) / 2, signY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Assinatura do Colaborador (CPF: ${ctx.employeeCpf})`, 57.5, signY + 7.5, { align: 'center' });
    doc.text('Visto do Departamento Pessoal / RH', (115 + pageW - 20) / 2, signY + 7.5, { align: 'center' });

    return doc.output('blob');
  }

  private async generateClientSideExcel(employeeId: string, year: number, month: number): Promise<Blob> {
    const ctx = await resolveEmployeeAndCompanyContext(employeeId);
    const byDate = await this.fetchMonthRecordsMap(employeeId, year, month);
    const days = getDaysInMonth(year, month);

    const sheetData: any[][] = [
      [ctx.companyName.toUpperCase()],
      [`CNPJ: ${ctx.companyCnpj}`],
      [`ESPELHO DE PONTO ELETRÔNICO - PERÍODO: ${String(month).padStart(2, '0')}/${year}`],
      [`Funcionário: ${ctx.employeeName}`, `CPF: ${ctx.employeeCpf}`, `Função: ${ctx.employeeRole}`],
      [],
      ['Data', 'Dia da Semana', 'Entrada', 'Saída Almoço', 'Retorno Almoço', 'Saída', 'Observações'],
    ];

    days.forEach((d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoKey = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayList = (byDate.get(isoKey) || []).sort((a, b) =>
        String(a.recordedAt).localeCompare(String(b.recordedAt))
      );

      const getFmtTime = (type: string) => {
        const rec = dayList.find((r) => r.recordType === type);
        if (!rec?.recordedAt) return '';
        const dObj = new Date(rec.recordedAt);
        if (Number.isNaN(dObj.getTime())) return '';
        return dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      };

      sheetData.push([
        `${dd}/${mm}/${yyyy}`,
        DAY_NAMES_FULL[dayOfWeek],
        getFmtTime('ENTRADA'),
        getFmtTime('SAIDA_ALMOCO'),
        getFmtTime('RETORNO_ALMOCO'),
        getFmtTime('SAIDA'),
        dayList.length === 0 && !isWeekend ? 'Sem registros' : isWeekend && dayList.length === 0 ? 'DSR' : '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Folha de Ponto');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}

export const timeSheetService = new TimeSheetService();
