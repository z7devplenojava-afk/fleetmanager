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
      // MODELO PAISAGEM (A4: 297mm x 210mm) - Imagem Oficial com Ônibus
      // =========================================================================
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // 1. Desenhar imagem de fundo oficial
      try {
        const bgImg = await loadImage('/images/sao-silvestre-ficha-modelo.jpg');
        doc.addImage(bgImg, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (err) {
        console.warn('Não foi possível carregar o template de fundo paisagem, desenhando layout alternativo', err);
        // Fallback básico com moldura azul
        doc.setFillColor(240, 244, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // 2. Preencher Dados do Funcionário
      // Baseado nas coordenadas identificadas:
      // Linha 1 (y=54.5mm): Nome Completo (x=45mm), Matrícula (x=160mm)
      // Linha 2 (y=63.8mm): Setor/Função (x=38mm), Garagem/Unidade (x=158mm)
      // Linha 3 (y=73.0mm): CPF (x=24mm), Admissão (x=142mm)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 30, 60);

      // Nome Completo
      doc.text(employee.name || '', 45, 54.5);
      // Matrícula
      doc.text(matricula, 160, 54.5);
      // Setor / Função
      doc.text(cargo, 38, 63.8);
      // Garagem / Unidade
      doc.text(unidade, 158, 63.8);
      // CPF
      doc.text(cpf, 24, 73.0);
      // Admissão
      doc.text(admissao, 142, 73.0);

      // 3. Tabela de Equipamentos de Proteção Individual (EPI)
      // Colunas:
      // ITEM: x ~ 7 a 36 mm (centro ~ 21.5 mm)
      // DESCRIÇÃO: x ~ 36 a 121 mm (início 38 mm)
      // CA: x ~ 121 a 153 mm (centro ~ 137 mm)
      // QUANTIDADE: x ~ 153 a 195 mm (centro ~ 174 mm)
      // DATA ENTREGA: x ~ 195 a 238 mm (centro ~ 216 mm)
      // ASSINATURA: x ~ 238 a 289 mm (centro ~ 263 mm)
      const tableStartY = 107.5; // Primeira linha de itens
      const rowHeight = 5.25;    // Altura de cada linha
      const maxRows = 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      if (!isManual && items.length > 0) {
        items.slice(0, maxRows).forEach((item, index) => {
          const currentY = tableStartY + index * rowHeight;
          const itemNum = String(index + 1).padStart(2, '0');

          // ITEM
          doc.text(itemNum, 21.5, currentY, { align: 'center' });

          // DESCRIÇÃO DO EPI (com corte de segurança se for longo)
          const desc = item.name.length > 45 ? item.name.substring(0, 42) + '...' : item.name;
          doc.text(desc, 38, currentY);

          // CA
          doc.text(item.ca || 'N/A', 137, currentY, { align: 'center' });

          // QUANTIDADE
          doc.text(String(item.quantity || 1), 174, currentY, { align: 'center' });

          // DATA DA ENTREGA
          const dtEntrega = item.deliveryDate || safeDateStr;
          doc.text(dtEntrega, 216, currentY, { align: 'center' });

          // ASSINATURA DO FUNCIONÁRIO NA LINHA
          if (digitalSignature) {
            try {
              // Insere pequena rubrica
              doc.addImage(digitalSignature, 'PNG', 248, currentY - 4.2, 18, 4.8);
            } catch (e) {
              doc.setFontSize(6.5);
              doc.text('Assinado digitalmente', 263, currentY, { align: 'center' });
              doc.setFontSize(8);
            }
          }
        });
      }

      // 4. Declaração do Funcionário e Assinatura Principal
      // Linha de assinatura fica em y ~ 176 mm
      // Data da assinatura fica em y ~ 176 mm, x ~ 116 mm
      if (digitalSignature) {
        try {
          // Estampar assinatura manuscrita desenhada
          doc.addImage(digitalSignature, 'PNG', 40, 163, 48, 12);
        } catch (e) {
          console.warn('Erro ao inserir assinatura:', e);
        }

        // Data preenchida
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(safeDateStr, 118, 175.5);

        // Selo de assinatura digital auditável
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(50, 70, 120);
        doc.text(`[ASSINADO DIGITALMENTE POR ${employee.name.toUpperCase()} EM ${safeDateStr} ÀS ${safeTimeStr}]`, 38, 180.5);
      } else if (!isManual) {
        // Se preenchida mas sem assinatura digital, preenche a data da entrega
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(safeDateStr, 118, 175.5);
      }
      // Se for manual, a linha de assinatura e a data ficam em branco com os traços da imagem para preenchimento físico!

    } else {
      // =========================================================================
      // MODELO RETRATO (A4: 210mm x 297mm) - Papel Timbrado Oficial São Silvestre
      // =========================================================================
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // 1. Desenhar imagem de fundo papel timbrado oficial
      try {
        const bgImg = await loadImage('/images/sao-silvestre-timbre-retrato.png');
        doc.addImage(bgImg, 'PNG', 0, 0, pageWidth, pageHeight);
      } catch (err) {
        console.warn('Não foi possível carregar papel timbrado retrato', err);
      }

      // Margens úteis entre cabeçalho e rodapé do timbre
      const startX = 14;
      const endX = 196;
      const contentWidth = endX - startX;
      let curY = 32;

      // Título da Ficha
      doc.setFillColor(10, 45, 115);
      doc.roundedRect(startX, curY, contentWidth, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('FICHA DE CONTROLE INDIVIDUAL DE EPI', pageWidth / 2, curY + 4.5, { align: 'center' });
      doc.setFontSize(8);
      doc.text('TERMO DE COMPROMISSO E RESPONSABILIDADE', pageWidth / 2, curY + 8.2, { align: 'center' });

      curY += 12;

      // Caixa de Legislação e Compromisso
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

      // Caixa: Dados do Funcionário
      doc.setDrawColor(10, 45, 115);
      doc.setFillColor(235, 242, 252);
      doc.rect(startX, curY, contentWidth, 14, 'FD');

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

      curY += 17;

      // Tabela de Itens (Conforme Modelo da Imagem 5)
      // Colunas:
      // Quant (14mm) | Descrição do Equipamento (62mm) | Nº do CA (20mm) | Data Entrega (26mm) | Rubrica Entrega (24mm) | Data Devolução (20mm) | Rubrica Devolução (16mm)
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

      // Linhas da tabela (14 a 16 linhas para preencher toda a página)
      const rowCount = 15;
      const tableRowHeight = 6.2;

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
          doc.text(String(item.quantity || 1), startX + colWidths[0] / 2, curY + 4.2, { align: 'center' });
          // Descrição
          const desc = item.name.length > 36 ? item.name.substring(0, 34) + '...' : item.name;
          doc.text(desc, startX + colWidths[0] + 2, curY + 4.2);
          // CA
          doc.text(item.ca || 'N/A', startX + colWidths[0] + colWidths[1] + colWidths[2] / 2, curY + 4.2, { align: 'center' });
          // Data Entrega
          doc.text(item.deliveryDate || safeDateStr, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, curY + 4.2, { align: 'center' });

          // Rubrica Entrega
          if (digitalSignature) {
            try {
              const rubricaX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2;
              doc.addImage(digitalSignature, 'PNG', rubricaX, curY + 0.8, colWidths[4] - 4, tableRowHeight - 1.6);
            } catch (e) {
              doc.text('Assinado', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, curY + 4.2, { align: 'center' });
            }
          }
        }

        curY += tableRowHeight;
      }

      // Rodapé da Folha com Carimbo de Autenticação Digital
      if (digitalSignature) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(80, 90, 110);
        doc.text(
          `Documento assinado digitalmente pelo colaborador ${employee.name} em ${safeDateStr} às ${safeTimeStr} - Conforme MP nº 2.200-2/2001 e Portaria MTE`,
          pageWidth / 2,
          268,
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
