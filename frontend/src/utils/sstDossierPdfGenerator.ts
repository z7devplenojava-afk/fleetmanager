import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SstDossierEmployee {
  name: string;
  cpf?: string;
  registrationNumber?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  terminationDate?: string;
  status?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
}

export interface SstDossierExam {
  examType: string;
  examCategory?: string;
  examDate?: string;
  nextExamDate?: string;
  status?: string;
  result?: string;
  clinicName?: string;
  doctorName?: string;
  restrictions?: string;
}

export interface SstDossierTraining {
  trainingName: string;
  hours?: number;
  completionDate?: string;
  expirationDate?: string;
  status?: string;
  instructorName?: string;
}

export interface SstDossierEpi {
  epiName: string;
  ca?: string;
  quantity?: number;
  deliveryDate?: string;
  validityDate?: string;
  responsible?: string;
}

export interface SstDossierDependent {
  name: string;
  relationship?: string;
  birthDate?: string;
  cpf?: string;
}

export interface SstDossierDocument {
  type: string;
  number?: string;
  issueDate?: string;
  expirationDate?: string;
}

export interface SstDossierHistory {
  date: string;
  description: string;
  type?: string;
}

export interface SstDossierData {
  employee: SstDossierEmployee;
  aso?: SstDossierExam | null;
  exams: SstDossierExam[];
  trainings: SstDossierTraining[];
  epis: SstDossierEpi[];
  dependents: SstDossierDependent[];
  documents: SstDossierDocument[];
  history: SstDossierHistory[];
  company?: {
    name?: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
  };
  generatedAt?: string;
}

class SstDossierPdfGenerator {
  private readonly marginX = 40;

  private formatDate(dateString?: string): string {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString.length <= 10 ? `${dateString}T12:00:00` : dateString);
      if (Number.isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private sectionTitle(doc: jsPDF, y: number, title: string): number {
    doc.setFillColor(31, 41, 55);
    doc.rect(this.marginX, y - 12, doc.internal.pageSize.getWidth() - this.marginX * 2, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), this.marginX + 6, y + 2);
    doc.setTextColor(17, 24, 39);
    return y + 16;
  }

  async generatePdf(data: SstDossierData): Promise<Blob> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 50;

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text('PRONTUÁRIO SST DO COLABORADOR', pageWidth / 2, y, { align: 'center' });
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text('Saúde e Segurança do Trabalho (NR-07 / NR-06 / PCMSO)', pageWidth / 2, y, { align: 'center' });
    y += 14;

    if (data.company?.name) {
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      const companyLine = [data.company.name, data.company.cnpj ? `CNPJ: ${data.company.cnpj}` : '']
        .filter(Boolean)
        .join('  |  ');
      doc.text(companyLine, pageWidth / 2, y, { align: 'center' });
      y += 12;
      if (data.company.address || data.company.phone) {
        doc.setTextColor(75, 85, 99);
        doc.text([data.company.address, data.company.phone].filter(Boolean).join('  |  '), pageWidth / 2, y, { align: 'center' });
        y += 12;
      }
    }

    doc.setDrawColor(209, 213, 219);
    doc.line(this.marginX, y, pageWidth - this.marginX, y);
    y += 20;

    // Identificação
    y = this.sectionTitle(doc, y, 'Identificação do Colaborador');
    autoTable(doc, {
      startY: y,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, textColor: [31, 41, 55] },
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
      head: [['Campo', 'Informação']],
      body: [
        ['Nome', data.employee.name || '—'],
        ['CPF', data.employee.cpf || '—'],
        ['Matrícula', data.employee.registrationNumber || '—'],
        ['Cargo / Função', data.employee.position || '—'],
        ['Departamento', data.employee.department || '—'],
        ['Admissão', this.formatDate(data.employee.hireDate)],
        ['Situação', data.employee.status || '—'],
        ['Telefone', data.employee.phone || '—'],
        ['E-mail', data.employee.email || '—'],
      ],
      columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' } },
      didDrawPage: () => {},
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // ASO consolidado
    if (data.aso) {
      if (y > pageHeight - 140) { doc.addPage(); y = 50; }
      y = this.sectionTitle(doc, y, 'ASO — Atestado de Saúde Ocupacional');
      autoTable(doc, {
        startY: y,
        margin: { left: this.marginX, right: this.marginX },
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, textColor: [31, 41, 55] },
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        head: [['Tipo', 'Último Exame', 'Próximo Vencimento', 'Resultado', 'Restrições']],
        body: [[
          data.aso.examType || '—',
          this.formatDate(data.aso.examDate),
          this.formatDate(data.aso.nextExamDate),
          data.aso.result || data.aso.status || '—',
          data.aso.restrictions || '—',
        ]],
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Exames / histórico ASO
    if (y > pageHeight - 120) { doc.addPage(); y = 50; }
    y = this.sectionTitle(doc, y, `Exames Ocupacionais (${data.exams.length})`);
    autoTable(doc, {
      startY: y,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [16, 122, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Tipo de Exame', 'Realização', 'Validade', 'Clínica', 'Resultado']],
      body: data.exams.length > 0
        ? data.exams.map((e) => [
            e.examType || '—',
            this.formatDate(e.examDate),
            this.formatDate(e.nextExamDate),
            e.clinicName || '—',
            e.result || e.status || '—',
          ])
        : [['Nenhum exame registrado', '', '', '', '']],
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Treinamentos
    if (y > pageHeight - 120) { doc.addPage(); y = 50; }
    y = this.sectionTitle(doc, y, `Treinamentos e Certificações (${data.trainings.length})`);
    autoTable(doc, {
      startY: y,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Treinamento / Norma', 'Carga Horária', 'Conclusão', 'Validade', 'Situação']],
      body: data.trainings.length > 0
        ? data.trainings.map((t) => [
            t.trainingName || '—',
            t.hours ? `${t.hours}h` : '—',
            this.formatDate(t.completionDate),
            this.formatDate(t.expirationDate),
            t.status || '—',
          ])
        : [['Nenhum treinamento registrado', '', '', '', '']],
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // EPIs
    if (y > pageHeight - 120) { doc.addPage(); y = 50; }
    y = this.sectionTitle(doc, y, `EPIs Entregues (${data.epis.length})`);
    autoTable(doc, {
      startY: y,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Descrição do EPI', 'C.A.', 'Qtd', 'Entrega', 'Validade CA', 'Responsável']],
      body: data.epis.length > 0
        ? data.epis.map((e) => [
            e.epiName || '—',
            e.ca || '—',
            String(e.quantity ?? '—'),
            this.formatDate(e.deliveryDate),
            this.formatDate(e.validityDate),
            e.responsible || '—',
          ])
        : [['Nenhum EPI entregue registrado', '', '', '', '', '']],
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Dependentes
    if (y > pageHeight - 120) { doc.addPage(); y = 50; }
    y = this.sectionTitle(doc, y, `Dependentes (${data.dependents.length})`);
    autoTable(doc, {
      startY: y,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Nome', 'Parentesco', 'Nascimento', 'CPF']],
      body: data.dependents.length > 0
        ? data.dependents.map((d) => [d.name || '—', d.relationship || '—', this.formatDate(d.birthDate), d.cpf || '—'])
        : [['Nenhum dependente cadastrado', '', '', '']],
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Documentos
    if (data.documents.length > 0) {
      if (y > pageHeight - 120) { doc.addPage(); y = 50; }
      y = this.sectionTitle(doc, y, `Documentos do Prontuário (${data.documents.length})`);
      autoTable(doc, {
        startY: y,
        margin: { left: this.marginX, right: this.marginX },
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold' },
        head: [['Tipo', 'Número', 'Emissão', 'Validade']],
        body: data.documents.map((d) => [
          d.type || '—',
          d.number || '—',
          this.formatDate(d.issueDate),
          this.formatDate(d.expirationDate),
        ]),
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Histórico
    if (data.history.length > 0) {
      if (y > pageHeight - 120) { doc.addPage(); y = 50; }
      y = this.sectionTitle(doc, y, 'Histórico do Colaborador');
      autoTable(doc, {
        startY: y,
        margin: { left: this.marginX, right: this.marginX },
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold' },
        head: [['Data', 'Evento', 'Descrição']],
        body: data.history.map((h) => [this.formatDate(h.date), h.type || '—', h.description || '—']),
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Rodapé / assinaturas
    if (y > pageHeight - 110) { doc.addPage(); y = 60; }
    y += 20;
    doc.setDrawColor(156, 163, 175);
    const colWidth = (pageWidth - this.marginX * 2) / 2;
    doc.line(this.marginX, y, this.marginX + colWidth - 20, y);
    doc.line(this.marginX + colWidth + 10, y, pageWidth - this.marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Responsável SST', this.marginX, y + 12);
    doc.text('Colaborador', this.marginX + colWidth + 10, y + 12);

    // Rodapé paginado
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const generated = data.generatedAt ? new Date(data.generatedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
      doc.text(`Documento gerado em ${generated}`, this.marginX, pageHeight - 20);
      doc.text(`Página ${i} de ${total}`, pageWidth - this.marginX, pageHeight - 20, { align: 'right' });
    }

    return doc.output('blob');
  }

  async generateAndDownload(data: SstDossierData, fileName: string): Promise<void> {
    const blob = await this.generatePdf(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.parentNode?.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async generateAndOpen(data: SstDossierData): Promise<void> {
    const blob = await this.generatePdf(data);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

export const sstDossierPdfGenerator = new SstDossierPdfGenerator();
export default sstDossierPdfGenerator;
