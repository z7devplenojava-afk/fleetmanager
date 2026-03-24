import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { VacationCoverage, Absence, WorkPostAssignment, SpecificActivity } from '@/services/operationalService';
import { Remanejamento } from '@/services/remanejamentoService';

class OperationalReportGenerator {
  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private formatTime(timeString?: string): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // HH:mm
  }

  private formatShift(shift: string): string {
    const shifts: { [key: string]: string } = {
      'DAY': 'Diurno',
      'NIGHT': 'Noturno',
      'MIXED': 'Misto'
    };
    return shifts[shift] || shift;
  }

  private formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'NO_COVERAGE': 'Sem Cobertura',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'CANCELLED': 'Cancelado',
      'SCHEDULED': 'Agendado',
      'IN_PROGRESS': 'Em Progresso',
      'COMPLETED': 'Concluído',
      'POSTPONED': 'Adiado',
      'OVERDUE': 'Atrasado'
    };
    return statusMap[status] || status;
  }

  private formatAbsenceType(type: string): string {
    const types: { [key: string]: string } = {
      'SICK_LEAVE': 'Atestado Médico',
      'PERSONAL_LEAVE': 'Falta Pessoal',
      'UNAUTHORIZED': 'Falta Não Autorizada',
      'MEDICAL_APPOINTMENT': 'Consulta Médica',
      'FAMILY_EMERGENCY': 'Emergência Familiar',
      'WEDDING': 'Casamento',
      'OTHER': 'Outro'
    };
    return types[type] || type;
  }

  private formatActivityType(type: string): string {
    const types: { [key: string]: string } = {
      'CLEANING': 'Limpeza',
      'GLASS_CLEANING': 'Limpeza de Vidros',
      'LAWN_MOWING': 'Corte de Grama',
      'RECYCLING': 'Reciclagem',
      'MAINTENANCE': 'Manutenção',
      'SECURITY_PATROL': 'Ronda de Segurança',
      'EQUIPMENT_CHECK': 'Verificação de Equipamentos',
      'SPECIAL_EVENT': 'Evento Especial',
      'TRAINING': 'Treinamento',
      'MEETING': 'Reunião',
      'OTHER': 'Outro'
    };
    return types[type] || type;
  }

  private formatRemanejamentoType(type: string): string {
    const types: { [key: string]: string } = {
      'TRANSFERENCIA_UNIDADE': 'Transferência de Unidade',
      'TRANSFERENCIA_POSTO_TRABALHO': 'Transferência de Posto',
      'TROCA_FUNCAO': 'Troca de Função',
      'PROMOCAO': 'Promoção',
      'COBRIR_FERIAS': 'Cobrir Férias',
      'COBRIR_FALTA': 'Cobrir Falta',
      'PLANTAO': 'Plantão',
      'OUTROS': 'Outros'
    };
    return types[type] || type;
  }

  async generateVacationCoverageReport(data: VacationCoverage[]): Promise<Blob> {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Cobertura de Férias', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
    doc.text(`Total de registros: ${data.length}`, margin, yPos + 5);
    yPos += 15;

    // Tabela
    const tableTop = yPos;
    const colWidths = [60, 60, 40, 40, 30, 30];
    const headers = ['Funcionário', 'Substituto', 'Período', 'Local', 'Turno', 'Status'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.forEach((item, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }

      const rows = [
        item.employee?.name || '-',
        item.substituteEmployee?.name || 'Sem substituto',
        `${this.formatDate(item.startDate)} a ${this.formatDate(item.endDate)}`,
        item.location?.name || '-',
        this.formatShift(item.shift),
        this.formatStatus(item.status)
      ];

      xPos = margin;
      rows.forEach((text, i) => {
        const cellText = doc.splitTextToSize(text || '-', colWidths[i] - 2);
        doc.text(cellText, xPos + 1, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;
    });

    return doc.output('blob');
  }

  async generateAbsenceReport(data: Absence[]): Promise<Blob> {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Controle de Faltas', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
    doc.text(`Total de registros: ${data.length}`, margin, yPos + 5);
    yPos += 15;

    // Tabela
    const colWidths = [50, 30, 40, 50, 30, 30];
    const headers = ['Funcionário', 'Data', 'Tipo', 'Motivo', 'Cobertura', 'Status'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.forEach((item) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }

      const rows = [
        item.employee?.name || '-',
        this.formatDate(item.absenceDate),
        this.formatAbsenceType(item.absenceType),
        doc.splitTextToSize(item.reason || '-', colWidths[3] - 2)[0],
        item.coverageEmployee?.name || '-',
        this.formatStatus(item.status)
      ];

      xPos = margin;
      rows.forEach((text, i) => {
        const cellText = Array.isArray(text) ? text : [text];
        doc.text(cellText, xPos + 1, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;
    });

    return doc.output('blob');
  }

  async generateWorkPostAssignmentReport(data: WorkPostAssignment[]): Promise<Blob> {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Atribuições de Posto', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
    doc.text(`Total de registros: ${data.length}`, margin, yPos + 5);
    yPos += 15;

    // Tabela
    const colWidths = [50, 50, 30, 30, 30, 30];
    const headers = ['Funcionário', 'Posto', 'Data', 'Turno', 'Horário', 'Status'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.forEach((item) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }

      const timeRange = item.startTime && item.endTime 
        ? `${this.formatTime(item.startTime)} - ${this.formatTime(item.endTime)}`
        : '-';

      const rows = [
        item.employee?.name || '-',
        item.workPost?.name || '-',
        this.formatDate(item.assignmentDate),
        this.formatShift(item.shift),
        timeRange,
        this.formatStatus(item.status)
      ];

      xPos = margin;
      rows.forEach((text, i) => {
        const cellText = doc.splitTextToSize(text || '-', colWidths[i] - 2);
        doc.text(cellText, xPos + 1, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;
    });

    return doc.output('blob');
  }

  async generateSpecificActivityReport(data: SpecificActivity[]): Promise<Blob> {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Atividades Específicas', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
    doc.text(`Total de registros: ${data.length}`, margin, yPos + 5);
    yPos += 15;

    // Tabela
    const colWidths = [40, 50, 30, 30, 40, 30];
    const headers = ['Funcionário', 'Tipo', 'Data', 'Horário', 'Local', 'Status'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.forEach((item) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }

      const timeRange = item.startTime && item.endTime 
        ? `${this.formatTime(item.startTime)} - ${this.formatTime(item.endTime)}`
        : item.startTime ? this.formatTime(item.startTime) : '-';

      const rows = [
        item.employee?.name || '-',
        this.formatActivityType(item.activityType),
        this.formatDate(item.activityDate),
        timeRange,
        item.location?.name || '-',
        this.formatStatus(item.status)
      ];

      xPos = margin;
      rows.forEach((text, i) => {
        const cellText = doc.splitTextToSize(text || '-', colWidths[i] - 2);
        doc.text(cellText, xPos + 1, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;
    });

    return doc.output('blob');
  }

  async generateRemanejamentoReport(data: Remanejamento[]): Promise<Blob> {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Remanejamentos', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
    doc.text(`Total de registros: ${data.length}`, margin, yPos + 5);
    yPos += 15;

    // Tabela
    const colWidths = [50, 40, 50, 50, 30];
    const headers = ['Funcionário', 'Tipo', 'Origem', 'Destino', 'Data'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.forEach((item) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }

      const rows = [
        item.employeeName || '-',
        this.formatRemanejamentoType(item.tipo),
        item.origem,
        item.destino,
        this.formatDate(item.dataRemanejamento)
      ];

      xPos = margin;
      rows.forEach((text, i) => {
        const cellText = doc.splitTextToSize(text || '-', colWidths[i] - 2);
        doc.text(cellText, xPos + 1, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;
    });

    return doc.output('blob');
  }
}

const operationalReportGenerator = new OperationalReportGenerator();
export default operationalReportGenerator;












