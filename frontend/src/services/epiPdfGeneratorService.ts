import jsPDF from 'jspdf';
import { Employee } from '@/services/employeeService';

export interface EpiFormItemData {
  itemNumber?: number | string;
  name: string;
  ca?: string;
  quantity: number | string;
  deliveryDate?: string;
  returnDate?: string;
  observations?: string;
}

export interface GenerateEpiPdfOptions {
  employee: Employee;
  companyName?: string;
  unitName?: string;
  roleName?: string;
  orientation: 'landscape' | 'portrait';
  isManual: boolean;
  items?: EpiFormItemData[];
  digitalSignature?: string | null; // dataURL base64 PNG
  signedAt?: Date;
  responsibleName?: string;
}

/**
 * Carrega uma imagem a partir de uma URL ou caminho relativo
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const epiPdfGeneratorService = {
  /**
   * Gera o PDF da Ficha de EPI em conformidade com o modelo oficial da Viação São Silvestre
   */
  async generatePdf(options: GenerateEpiPdfOptions): Promise<{ doc: jsPDF; blob: Blob; filename: string }> {
    const {
      employee,
      orientation,
      isManual,
      items = [],
      digitalSignature,
      signedAt = new Date(),
    } = options;

    const matricula = employee.registrationNumber || employee.employeeCode || (employee as any).matricula || 'N/D';
    const cargo = options.roleName || (employee as any).position?.name || employee.role || (employee as any).cargo || 'N/D';
    const unidade = options.unitName || (employee as any).unit?.name || (employee as any).department || 'Garagem Central';
    const cpf = employee.cpf || employee.document || 'N/D';
    const admissao = employee.hireDate 
      ? new Date(employee.hireDate).toLocaleDateString('pt-BR') 
      : (employee as any).admissionDate 
        ? new Date((employee as any).admissionDate).toLocaleDateString('pt-BR')
        : '__/__/____';

    const safeDateStr = signedAt.toLocaleDateString('pt-BR');
    const safeTimeStr = signedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let doc: jsPDF;

    if (orientation === 'landscape') {
      // =========================================================================
      // MODELO PAISAGEM (A4: 297mm x 210mm) - Estrutura Idêntica ao Retrato
      // =========================================================================
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // Margens
      const startX = 14;
      const endX = 283;
      const contentWidth = endX - startX; // 269mm
      let curY = 12;

      // 1. Título da Ficha
      doc.setFillColor(10, 45, 115);
      doc.roundedRect(startX, curY, contentWidth, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('FICHA DE CONTROLE INDIVIDUAL DE EPI', pageWidth / 2, curY + 4.5, { align: 'center' });
      doc.setFontSize(8);
      doc.text('TERMO DE COMPROMISSO E RESPONSABILIDADE (NR-06 / NR-01 - PORTARIA 3.214/78)', pageWidth / 2, curY + 8.2, { align: 'center' });

      curY += 12;

      // 2. Seção Superior: Dados do Empregado (Esquerda) e Termo de Compromisso (Direita)
      const colWidthLeft = 130;
      const colWidthRight = 135;
      const gap = 4;
      const topSectionHeight = 35;

      // Caixa Esquerda: Dados do Empregado e Empresa
      doc.setDrawColor(10, 45, 115);
      doc.setFillColor(235, 242, 252);
      doc.rect(startX, curY, colWidthLeft, topSectionHeight, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(10, 30, 80);
      doc.text('DADOS DO EMPREGADO E DA EMPRESA', startX + 3, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('Nome: ', startX + 3, curY + 9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${employee.name} (Matrícula: ${matricula})`, startX + 16, curY + 9.5);

      doc.setFont('helvetica', 'bold');
      doc.text('Cargo/Função: ', startX + 3, curY + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cargo}`, startX + 26, curY + 14.5);

      doc.setFont('helvetica', 'bold');
      doc.text('Setor/Unidade: ', startX + 3, curY + 19.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${unidade}`, startX + 26, curY + 19.5);

      doc.setFont('helvetica', 'bold');
      doc.text('CPF: ', startX + 3, curY + 24.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cpf}`, startX + 12, curY + 24.5);

      doc.setFont('helvetica', 'bold');
      doc.text('Admissão: ', startX + 68, curY + 24.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${admissao}`, startX + 85, curY + 24.5);

      doc.setFont('helvetica', 'bold');
      doc.text('Empresa: ', startX + 3, curY + 29.5);
      doc.setFont('helvetica', 'normal');
      const compDisplay = options.companyName || (employee as any).company?.name || 'Viação São Silvestre S.A.';
      doc.text(`${compDisplay}`, startX + 18, curY + 29.5);

      // Caixa Direita: Termo de Compromisso (Portaria 3.214/78 MTE - NR-1 e NR-6)
      const rightX = startX + colWidthLeft + gap;
      doc.setDrawColor(180, 195, 220);
      doc.setFillColor(248, 250, 254);
      doc.rect(rightX, curY, colWidthRight, topSectionHeight, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 30, 80);
      doc.text('TERMO DE COMPROMISSO (Portaria 3.214/78 MTE - NR-1 e NR-6)', rightX + 2, curY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(40, 45, 60);

      const termoTextoLandscape = 
        'Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e estou ciente da legislação ' +
        'Port. Nº 3214/78, NR-1 item 1.8 e NR-6. Comprometo-me a: a) Usar o EPI apenas para a finalidade destinada; ' +
        'b) Responsabilizar-me pela sua guarda e conservação; c) Comunicar qualquer alteração ou dano; ' +
        'd) Cumprir as determinações de segurança. Ciente do Art. 462 §1º da CLT em caso de extravio ou dolo.';
      
      const splitTermoLandscape = doc.splitTextToSize(termoTextoLandscape, colWidthRight - 4);
      doc.text(splitTermoLandscape, rightX + 2, curY + 7.5);

      // Linhas de Assinatura do Termo na Caixa Direita
      doc.setDrawColor(150, 150, 150);
      doc.line(rightX + 5, curY + 27, rightX + 65, curY + 27);
      doc.setFontSize(5.5);
      doc.text('Assinatura do Empregado', rightX + 18, curY + 30);

      doc.line(rightX + 72, curY + 27, rightX + 128, curY + 27);
      doc.text('Rubrica do Empregado', rightX + 88, curY + 30);

      if (digitalSignature) {
        try {
          doc.addImage(digitalSignature, 'PNG', rightX + 12, curY + 20, 32, 6.5);
          doc.addImage(digitalSignature, 'PNG', rightX + 82, curY + 20, 24, 6.5);
        } catch (e) {}
      }

      curY += topSectionHeight + 4;

      // 3. Tabela de Equipamentos de Proteção Individual (EPI)
      // Colunas:
      // Quant (16mm) | Descrição do Equipamento (105mm) | Número do CA (28mm) | Data Entrega (32mm) | Rubrica Empregado (36mm) | Data Devol. (26mm) | Rubrica (26mm)
      const colWidths = [16, 105, 28, 32, 36, 26, 26]; // soma = 269mm = contentWidth
      const colHeaders = [
        'Quant',
        'Descrição do Equipamento',
        'Número do CA',
        'Data Entrega',
        'Rubrica Empregado',
        'Data Devol.',
        'Rubrica'
      ];

      // Cabeçalho da Tabela
      doc.setFillColor(15, 50, 120);
      doc.rect(startX, curY, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);

      let colX = startX;
      colHeaders.forEach((header, i) => {
        doc.text(header, colX + colWidths[i] / 2, curY + 4.5, { align: 'center' });
        colX += colWidths[i];
      });

      curY += 6.5;

      // Linhas da tabela (10 a 11 linhas para preencher toda a página paisagem)
      const rowCount = 10;
      const tableRowHeight = 9.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);

      for (let r = 0; r < rowCount; r++) {
        const item = !isManual && items[r] ? items[r] : null;
        const rowBg = r % 2 === 0 ? 255 : 248;
        doc.setFillColor(rowBg, rowBg, rowBg);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'F');

        // Borda da linha
        doc.setDrawColor(200, 210, 225);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'S');

        // Linhas verticais
        let gridX = startX;
        colWidths.forEach((w) => {
          doc.line(gridX, curY, gridX, curY + tableRowHeight);
          gridX += w;
        });

        // Preenchimento dos dados do item
        if (item) {
          // Quantidade
          doc.text(String(item.quantity || 1), startX + colWidths[0] / 2, curY + 6, { align: 'center' });
          // Descrição
          const desc = item.name.length > 60 ? item.name.substring(0, 58) + '...' : item.name;
          doc.text(desc, startX + colWidths[0] + 3, curY + 6);
          // CA
          doc.text(item.ca || 'N/A', startX + colWidths[0] + colWidths[1] + colWidths[2] / 2, curY + 6, { align: 'center' });
          // Data Entrega
          doc.text(item.deliveryDate || safeDateStr, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, curY + 6, { align: 'center' });

          // Rubrica Entrega
          if (digitalSignature) {
            try {
              const rubricaX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 3;
              doc.addImage(digitalSignature, 'PNG', rubricaX, curY + 1.2, colWidths[4] - 6, tableRowHeight - 2.4);
            } catch (e) {
              doc.text('Assinado', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, curY + 6, { align: 'center' });
            }
          }
        }

        curY += tableRowHeight;
      }

      // Rodapé da Folha com Carimbo de Autenticação Digital
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(80, 90, 110);
      if (digitalSignature) {
        doc.text(
          `Documento assinado digitalmente pelo colaborador ${employee.name} em ${safeDateStr} às ${safeTimeStr} - Conforme MP nº 2.200-2/2001 e Portaria MTE`,
          pageWidth / 2,
          198,
          { align: 'center' }
        );
      } else {
        doc.text(
          `Ficha de Controle e Fornecimento de EPI - Emitida em ${safeDateStr} - Assinatura do Responsável pela Entrega: _______________________________`,
          pageWidth / 2,
          198,
          { align: 'center' }
        );
      }

    } else {
      // =========================================================================
      // MODELO RETRATO (A4: 210mm x 297mm) - Mesma Estrutura Oficial
      // =========================================================================
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Margens úteis entre cabeçalho e rodapé
      const startX = 14;
      const endX = 196;
      const contentWidth = endX - startX; // 182mm
      let curY = 16;

      // 1. Título da Ficha
      doc.setFillColor(10, 45, 115);
      doc.roundedRect(startX, curY, contentWidth, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('FICHA DE CONTROLE INDIVIDUAL DE EPI', pageWidth / 2, curY + 4.5, { align: 'center' });
      doc.setFontSize(8);
      doc.text('TERMO DE COMPROMISSO E RESPONSABILIDADE (NR-06 / NR-01 - PORTARIA 3.214/78)', pageWidth / 2, curY + 8.2, { align: 'center' });

      curY += 12;

      // 2. Caixa de Legislação e Compromisso
      doc.setDrawColor(180, 195, 220);
      doc.setFillColor(248, 250, 254);
      doc.rect(startX, curY, contentWidth, 34, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 30, 80);
      doc.text('TERMO DE COMPROMISSO (Portaria 3.214/78 MTE - NR-1 e NR-6)', startX + 2, curY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(40, 45, 60);

      const termoTexto = 
        'Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e estou ciente da legislação ' +
        'Port. Nº 3214/78, NR-1 item 1.8 e NR-6. Comprometo-me a: a) Usar o EPI apenas para a finalidade destinada; ' +
        'b) Responsabilizar-me pela sua guarda e conservação; c) Comunicar qualquer alteração ou dano; ' +
        'd) Cumprir as determinações de segurança. Ciente do Art. 462 §1º da CLT em caso de extravio ou dolo.';
      
      const splitTermo = doc.splitTextToSize(termoTexto, contentWidth - 4);
      doc.text(splitTermo, startX + 2, curY + 7);

      // Linha de Assinatura do Termo
      curY += 25;
      doc.setDrawColor(150, 150, 150);
      doc.line(startX + 10, curY + 5, startX + 90, curY + 5);
      doc.text('Assinatura do Empregado', startX + 35, curY + 8);

      doc.line(startX + 105, curY + 5, startX + 175, curY + 5);
      doc.text('Rubrica do Empregado', startX + 128, curY + 8);

      if (digitalSignature) {
        try {
          doc.addImage(digitalSignature, 'PNG', startX + 25, curY - 3, 35, 7.5);
          doc.addImage(digitalSignature, 'PNG', startX + 120, curY - 3, 25, 7.5);
        } catch (e) {}
      }

      curY += 12;

      // 3. Caixa: Dados do Funcionário e Empresa
      doc.setDrawColor(10, 45, 115);
      doc.setFillColor(235, 242, 252);
      doc.rect(startX, curY, contentWidth, 18, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(10, 30, 80);
      doc.text(`Nome do Empregado: `, startX + 2, curY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${employee.name} (Matrícula: ${matricula})`, startX + 33, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Cargo / Função: `, startX + 2, curY + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cargo}`, startX + 25, curY + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Admissão: `, startX + 125, curY + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${admissao}`, startX + 142, curY + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Setor / Garagem: `, startX + 2, curY + 12.2);
      doc.setFont('helvetica', 'normal');
      doc.text(`${unidade}  |  CPF: ${cpf}`, startX + 27, curY + 12.2);

      doc.setFont('helvetica', 'bold');
      doc.text(`Empresa: `, startX + 2, curY + 15.8);
      doc.setFont('helvetica', 'normal');
      const compDisplayRetrato = options.companyName || (employee as any).company?.name || 'Viação São Silvestre S.A.';
      doc.text(`${compDisplayRetrato}`, startX + 18, curY + 15.8);

      curY += 21;

      // 4. Tabela de Itens (Mesmas colunas que Paisagem)
      // Colunas:
      // Quant (12mm) | Descrição do Equipamento (60mm) | Nº do CA (20mm) | Data Entrega (26mm) | Rubrica Entrega (26mm) | Data Devolução (20mm) | Rubrica Devolução (18mm)
      const colWidths = [12, 60, 20, 26, 26, 20, 18]; // soma = 182 = contentWidth
      const colHeaders = [
        'Quant',
        'Descrição do Equipamento',
        'Número do CA',
        'Data Entrega',
        'Rubrica Empregado',
        'Data Devol.',
        'Rubrica'
      ];

      // Cabeçalho da Tabela
      doc.setFillColor(15, 50, 120);
      doc.rect(startX, curY, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);

      let colX = startX;
      colHeaders.forEach((header, i) => {
        doc.text(header, colX + colWidths[i] / 2, curY + 4.5, { align: 'center' });
        colX += colWidths[i];
      });

      curY += 6.5;

      // Linhas da tabela (14 a 15 linhas para preencher toda a página retrato)
      const rowCount = 14;
      const tableRowHeight = 7.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 30, 30);

      for (let r = 0; r < rowCount; r++) {
        const item = !isManual && items[r] ? items[r] : null;
        const rowBg = r % 2 === 0 ? 255 : 248;
        doc.setFillColor(rowBg, rowBg, rowBg);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'F');

        // Borda da linha
        doc.setDrawColor(200, 210, 225);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'S');

        // Linhas verticais
        let gridX = startX;
        colWidths.forEach((w) => {
          doc.line(gridX, curY, gridX, curY + tableRowHeight);
          gridX += w;
        });

        // Preenchimento dos dados do item
        if (item) {
          // Quantidade
          doc.text(String(item.quantity || 1), startX + colWidths[0] / 2, curY + 4.8, { align: 'center' });
          // Descrição
          const desc = item.name.length > 36 ? item.name.substring(0, 34) + '...' : item.name;
          doc.text(desc, startX + colWidths[0] + 2, curY + 4.8);
          // CA
          doc.text(item.ca || 'N/A', startX + colWidths[0] + colWidths[1] + colWidths[2] / 2, curY + 4.8, { align: 'center' });
          // Data Entrega
          doc.text(item.deliveryDate || safeDateStr, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, curY + 4.8, { align: 'center' });

          // Rubrica Entrega
          if (digitalSignature) {
            try {
              const rubricaX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2;
              doc.addImage(digitalSignature, 'PNG', rubricaX, curY + 0.8, colWidths[4] - 4, tableRowHeight - 1.6);
            } catch (e) {
              doc.text('Assinado', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, curY + 4.8, { align: 'center' });
            }
          }
        }

        curY += tableRowHeight;
      }

      // Rodapé da Folha com Carimbo de Autenticação Digital
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(80, 90, 110);
      if (digitalSignature) {
        doc.text(
          `Documento assinado digitalmente pelo colaborador ${employee.name} em ${safeDateStr} às ${safeTimeStr} - Conforme MP nº 2.200-2/2001 e Portaria MTE`,
          pageWidth / 2,
          286,
          { align: 'center' }
        );
      } else {
        doc.text(
          `Ficha de Controle e Fornecimento de EPI - Emitida em ${safeDateStr} - Assinatura do Responsável: _______________________________`,
          pageWidth / 2,
          286,
          { align: 'center' }
        );
      }
    }

    const safeFilename = `Ficha_EPI_${employee.name.replace(/\s+/g, '_')}_${orientation}_${isManual ? 'Manual' : 'Preenchida'}.pdf`;
    const blob = doc.output('blob');

    return { doc, blob, filename: safeFilename };
  },

  /**
   * Dispara o download imediato do PDF no navegador
   */
  async downloadPdf(options: GenerateEpiPdfOptions): Promise<string> {
    const { doc, filename } = await this.generatePdf(options);
    doc.save(filename);
    return filename;
  }
};
