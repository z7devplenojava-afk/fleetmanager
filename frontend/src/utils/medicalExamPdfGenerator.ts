import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface MedicalExamPDFData {
  exam: {
    id: string;
    employeeName: string;
    employeeRegistrationNumber?: string;
    employeeCpf?: string;
    employeeRole?: string;
    employeeDepartment?: string;
    examType: string;
    examCategory: string; // ADMISSIONAL, PERIODICO, etc.
    scheduledDate: string;
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    clinicCnpj?: string;
    doctorName?: string;
    doctorCrm?: string;
    notes?: string;
    additionalExams?: string[];
  };
  company?: {
    name: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  issuedAt?: string;
}

class MedicalExamPDFGenerator {
  private formatDate(dateString?: string): string {
    if (!dateString) return 'A definir';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private formatTime(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  private formatDateTime(dateString?: string): string {
    if (!dateString) return 'A definir';
    const d = this.formatDate(dateString);
    const t = this.formatTime(dateString);
    return t && t !== '00:00' ? `${d} às ${t}` : d;
  }

  private getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      ADMISSIONAL: 'Exame Admissional',
      PERIODICO: 'Exame Periódico',
      RETORNO: 'Retorno ao Trabalho',
      MUDANCA_FUNCAO: 'Mudança de Riscos Ocupacionais / Função',
      DEMISSIONAL: 'Exame Demissional',
      RECICLAGEM: 'Reciclagem / Treinamento Operacional',
      RENOVACAO_CNH: 'Renovação de CNH / Aptidão Motorista',
      AVALIACAO_PSICOSSOCIAL: 'Avaliação Psicossocial (NR-20 / NR-35)',
      MONITORAMENTO: 'Monitoramento / Reavaliação de Saúde',
      TOXICOLOGICO_SORTEIO: 'Exame Toxicológico Periódico (Sorteio Lei 13.103)',
      REABILITACAO: 'Reabilitação Profissional (INSS)',
    };
    return map[category] || category;
  }

  private createHTMLContent(data: MedicalExamPDFData): string {
    const { exam, company } = data;
    const emissionDate = data.issuedAt ? this.formatDateTime(data.issuedAt) : new Date().toLocaleString('pt-BR');
    const scheduledDateTime = this.formatDateTime(exam.scheduledDate);
    const categoryTitle = this.getCategoryLabel(exam.examCategory);

    // Lista de procedimentos a realizar sem duplicidades
    const rawList = exam.additionalExams && exam.additionalExams.length > 0
      ? exam.additionalExams
      : [exam.examType || `Exame Clínico Ocupacional (ASO)`];
    
    const procedures = Array.from(new Set(rawList.filter(Boolean)));

    const hasAudiometria = procedures.some(p => p.toLowerCase().includes('audiometria'));
    const hasLaboratorial = procedures.some(p => p.toLowerCase().includes('laborat') || p.toLowerCase().includes('glicemia') || p.toLowerCase().includes('sangue'));
    const hasToxicologico = procedures.some(p => p.toLowerCase().includes('toxicol'));
    const hasVisual = procedures.some(p => p.toLowerCase().includes('visual') || p.toLowerCase().includes('campimetria'));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            color: #1f2937;
            line-height: 1.4;
            font-size: 13px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #d1d5db;
            padding: 28px;
            background: #ffffff;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .company-info h2 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #1e3a8a;
            text-transform: uppercase;
          }
          .company-info p {
            margin: 2px 0;
            font-size: 11px;
            color: #4b5563;
          }
          .doc-badge {
            text-align: right;
          }
          .badge-title {
            background-color: #2563eb;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            padding: 6px 12px;
            border-radius: 4px;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-code {
            font-size: 11px;
            color: #6b7280;
            margin-top: 4px;
          }
          .main-title {
            text-align: center;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          .main-title h1 {
            margin: 0;
            font-size: 15px;
            color: #111827;
            text-transform: uppercase;
            font-weight: bold;
          }
          .section {
            margin-bottom: 18px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
          }
          .section-header {
            background-color: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
            padding: 8px 14px;
            font-weight: bold;
            font-size: 12px;
            color: #1e40af;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .section-body {
            padding: 12px 14px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
          }
          .field {
            margin-bottom: 6px;
          }
          .field-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #6b7280;
            display: block;
            margin-bottom: 2px;
          }
          .field-value {
            font-size: 13px;
            color: #111827;
            font-weight: 500;
          }
          .highlight-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 10px 14px;
            margin-bottom: 16px;
            border-radius: 0 4px 4px 0;
          }
          .highlight-title {
            font-size: 11px;
            font-weight: bold;
            color: #1d4ed8;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .procedures-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
          }
          .procedures-list li {
            padding: 6px 10px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 6px;
            font-weight: 600;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .notice-box {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 0 4px 4px 0;
            font-size: 11px;
            color: #92400e;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .notice-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .signatures {
            margin-top: 36px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #9ca3af;
            padding-top: 6px;
            font-size: 11px;
            color: #374151;
          }
          .footer {
            margin-top: 28px;
            border-top: 1px dashed #d1d5db;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho -->
          <div class="header">
            <div class="company-info">
              <h2>${company?.name || 'EMPRESA CONTRATANTE'}</h2>
              <p><strong>CNPJ:</strong> ${company?.cnpj || 'Não informado'}</p>
              ${company?.address ? `<p>${company.address}</p>` : ''}
              ${company?.phone ? `<p><strong>Telefone:</strong> ${company.phone}</p>` : ''}
            </div>
            <div class="doc-badge">
              <div class="badge-title">SST / Medicina Ocupacional</div>
              <div class="badge-code">Protocolo: #${exam.id ? exam.id.slice(0, 8).toUpperCase() : 'NOVO'}</div>
              <div class="badge-code">Emissão: ${emissionDate}</div>
            </div>
          </div>

          <!-- Título Principal -->
          <div class="main-title">
            <h1>Guia de Encaminhamento para Exame Ocupacional</h1>
          </div>

          <!-- Destaque do Agendamento -->
          <div class="highlight-box">
            <div class="highlight-title">Dados do Agendamento</div>
            <div class="grid-3">
              <div>
                <span class="field-label">Finalidade (ASO)</span>
                <span class="field-value" style="color: #1d4ed8; font-weight: bold;">${categoryTitle}</span>
              </div>
              <div>
                <span class="field-label">Data e Horário</span>
                <span class="field-value" style="color: #1d4ed8; font-weight: bold;">${scheduledDateTime}</span>
              </div>
              <div>
                <span class="field-label">Médico Coordenador / CRM</span>
                <span class="field-value">${exam.doctorName ? `${exam.doctorName} ${exam.doctorCrm ? `(CRM: ${exam.doctorCrm})` : ''}` : 'A definir na clínica'}</span>
              </div>
            </div>
          </div>

          <!-- Dados do Colaborador -->
          <div class="section">
            <div class="section-header">
              1. Identificação do Trabalhador
            </div>
            <div class="section-body">
              <div class="grid-2">
                <div class="field">
                  <span class="field-label">Nome Completo</span>
                  <span class="field-value" style="font-size: 14px; font-weight: bold;">${exam.employeeName}</span>
                </div>
                <div class="field">
                  <span class="field-label">CPF</span>
                  <span class="field-value">${exam.employeeCpf || 'Não informado'}</span>
                </div>
              </div>
              <div class="grid-2" style="margin-top: 8px;">
                <div class="field">
                  <span class="field-label">Função / Cargo</span>
                  <span class="field-value">${exam.employeeRole || 'Geral'}</span>
                </div>
                <div class="field">
                  <span class="field-label">Matrícula / Registro</span>
                  <span class="field-value">${exam.employeeRegistrationNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Local de Atendimento (Clínica) -->
          <div class="section">
            <div class="section-header">
              2. Clínica Conveniada / Local de Atendimento
            </div>
            <div class="section-body">
              <div class="grid-2">
                <div class="field">
                  <span class="field-label">Nome da Clínica / Prestador</span>
                  <span class="field-value" style="font-weight: bold; color: #1e3a8a;">${exam.clinicName || 'Clínica Ocupacional Credenciada'}</span>
                </div>
                <div class="field">
                  <span class="field-label">CNPJ do Prestador</span>
                  <span class="field-value">${exam.clinicCnpj || 'Consulte o prestador'}</span>
                </div>
              </div>
              <div class="grid-2" style="margin-top: 8px;">
                <div class="field">
                  <span class="field-label">Endereço de Atendimento</span>
                  <span class="field-value">${exam.clinicAddress || 'Conforme agendamento'}</span>
                </div>
                <div class="field">
                  <span class="field-label">Telefone / Contato</span>
                  <span class="field-value">${exam.clinicPhone || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Exames Solicitados -->
          <div class="section">
            <div class="section-header">
              3. Procedimentos e Exames Solicitados (PCMSO - NR 07)
            </div>
            <div class="section-body">
              <ul class="procedures-list">
                ${procedures.map(p => `<li><span style="color: #2563eb;">✔</span> ${p}</li>`).join('')}
              </ul>
              ${exam.notes ? `
                <div style="margin-top: 10px; font-size: 11px; background: #f3f4f6; padding: 8px; border-radius: 4px;">
                  <strong>Observações Especiais:</strong> ${exam.notes}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Orientações -->
          <div class="notice-box">
            <div class="notice-title">⚠ Orientações Obrigatórias ao Trabalhador</div>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li>Apresente esta <strong>Guia de Encaminhamento impressa</strong> e um <strong>documento oficial com foto</strong> (RG ou CNH).</li>
              <li>Chegue com pelo menos <strong>15 minutos de antecedência</strong> ao horário agendado.</li>
              ${hasAudiometria ? `<li>Para <strong>Audiometria</strong>: permaneça em <strong>repouso auditivo de no mínimo 14 horas</strong> (evitar fones de ouvido e locais com ruído elevado).</li>` : ''}
              ${hasLaboratorial ? `<li>Para <strong>Exames Laboratoriais (Glicemia / Sangue)</strong>: realizar jejum de <strong>8 a 12 horas</strong>, salvo orientação médica contrária.</li>` : ''}
              ${hasToxicologico ? `<li>Para <strong>Exame Toxicológico de Larga Janela</strong>: não é necessário jejum; não raspar ou depilar cabelos/pelos do corpo nos 5 dias anteriores à coleta.</li>` : ''}
              ${hasVisual ? `<li>Para <strong>Acuidade Visual / Exame Oftalmológico</strong>: caso utilize óculos de grau ou lentes de contato, leve-os obrigatoriamente.</li>` : ''}
            </ul>
          </div>

          <!-- Assinaturas -->
          <div class="signatures">
            <div>
              <div class="sig-line">
                <strong>Assinatura do Colaborador</strong><br>
                <span>Ciente do agendamento e orientações</span>
              </div>
            </div>
            <div>
              <div class="sig-line">
                <strong>Carimbo e Assinatura da Clínica / Médico</strong><br>
                <span>Médico Examinador / CRM</span>
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <span>FleetManager - Módulo de Segurança e Saúde no Trabalho (SST)</span>
            <span>Documento emitido eletronicamente em conformidade com as NRs do MTE</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(data: MedicalExamPDFData): Promise<Blob> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '1150px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Não foi possível criar o documento para o PDF');
      }

      doc.open();
      doc.write(this.createHTMLContent(data));
      doc.close();

      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas = await html2canvas(doc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      return pdf.output('blob');
    } finally {
      document.body.removeChild(iframe);
    }
  }

  async generateAndDownloadPDF(data: MedicalExamPDFData): Promise<void> {
    try {
      const blob = await this.generatePDF(data);
      const cleanName = (data.exam.employeeName || 'funcionario').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `guia-encaminhamento-aso-${cleanName}-${new Date().toISOString().split('T')[0]}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar Guia de Encaminhamento:', error);
      throw error;
    }
  }

  async generateAndOpenPDF(data: MedicalExamPDFData): Promise<string> {
    try {
      const blob = await this.generatePDF(data);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return url;
    } catch (error) {
      console.error('Erro ao abrir Guia de Encaminhamento:', error);
      throw error;
    }
  }
}

export const medicalExamPDFGenerator = new MedicalExamPDFGenerator();
