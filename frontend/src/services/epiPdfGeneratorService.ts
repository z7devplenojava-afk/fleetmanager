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
  companyLogo?: string | null;
  companyCnpj?: string | null;
  companyAddress?: string | null;
  formNumber?: string | null;
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
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const epiPdfGeneratorService = {
  /**
   * Gera o PDF da Ficha de EPI padronizado com o layout da Ordem de Serviço (OS):
   * - Quando houver logomarca: exibe a logomarca no cabeçalho esquerdo com dados da empresa.
   * - Quando NÃO houver logomarca: exibe o nome da empresa em negrito maiúsculo e detalhes.
   * - Cabeçalho direito com título em vermelho, badge de tipo, caixa com número e data de emissão.
   * - Linha divisória vermelha e barras de seção com friso vermelho.
   * - Estrutura idêntica em ambos os modos (Paisagem e Retrato).
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

    const matricula = employee.registrationNumber || (employee as any).employeeCode || (employee as any).matricula || 'N/D';
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

    // Resolução dos dados da empresa
    const compName = (
      options.companyName || 
      (employee as any).company?.name || 
      'VIAÇÃO SÃO SILVESTRE S.A.'
    ).toUpperCase();

    const compCnpj = options.companyCnpj || (employee as any).company?.cnpj || '';
    const compAddress = options.companyAddress || (employee as any).company?.address || (employee as any).company?.enderecoRua || '';
    const compLogoUrl = options.companyLogo || (employee as any).company?.logoUrl || null;

    let companyDetails = '';
    if (compCnpj) {
      companyDetails += `CNPJ: ${compCnpj}`;
    }
    if (compAddress) {
      companyDetails += (companyDetails ? ' • ' : '') + compAddress;
    }

    // Carregar imagem de logo se disponível
    let logoImg: HTMLImageElement | null = null;
    if (compLogoUrl) {
      try {
        logoImg = await loadImage(compLogoUrl);
      } catch (err) {
        console.warn('Não foi possível carregar imagem do logo da empresa para o PDF:', err);
      }
    }

    const formNumber = options.formNumber || `OS-EPI-${signedAt.getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;

    let doc: jsPDF;

    if (orientation === 'landscape') {
      // =========================================================================
      // MODELO PAISAGEM (A4: 297mm x 210mm) - Padrão Oficial OS
      // =========================================================================
      doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const startX = 12;
      const endX = 285;
      const contentWidth = endX - startX; // 273mm
      let curY = 10;

      // 1. Cabeçalho Lado a Lado (Padrão OS)
      let leftBottomY = curY;
      if (logoImg) {
        // QUANDO TEM LOGOMARCA: Exibe o Logo + Nome da Empresa + CNPJ/Endereço
        const maxW = 42;
        const maxH = 11;
        const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
        const renderW = logoImg.width * ratio;
        const renderH = logoImg.height * ratio;

        try {
          doc.addImage(logoImg, 'PNG', startX, curY, renderW, renderH);
        } catch (_) {}

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(34, 34, 34);
        doc.text(compName, startX, curY + renderH + 3.5);

        if (companyDetails) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(85, 85, 85);
          const splitDetails = doc.splitTextToSize(companyDetails, 150);
          doc.text(splitDetails, startX, curY + renderH + 7);
          leftBottomY = curY + renderH + 7 + (splitDetails.length - 1) * 3;
        } else {
          leftBottomY = curY + renderH + 4;
        }
      } else {
        // QUANDO NÃO TEM LOGOMARCA: Exibe o Nome da Empresa em destaque + CNPJ/Endereço
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        doc.text(compName, startX, curY + 4.5);

        if (companyDetails) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(85, 85, 85);
          const splitDetails = doc.splitTextToSize(companyDetails, 150);
          doc.text(splitDetails, startX, curY + 8.5);
          leftBottomY = curY + 8.5 + (splitDetails.length - 1) * 3;
        } else {
          leftBottomY = curY + 5;
        }
      }

      // Direita: Título em vermelho, badge de status, caixa número da ficha e data
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(211, 47, 47); // #d32f2f
      doc.text('ORDEM DE FORNECIMENTO — EPI', endX, curY + 3.5, { align: 'right' });

      // Badge de Tipo (Verde: NR-06 / SST)
      const badgeW = 24;
      const badgeH = 4.2;
      doc.setFillColor(46, 125, 50); // #2e7d32
      doc.roundedRect(endX - badgeW, curY + 5.2, badgeW, badgeH, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      doc.text('NR-06 / SST', endX - badgeW / 2, curY + 8.2, { align: 'center' });

      // Caixa Número da OS / Ficha
      const numBoxW = 42;
      const numBoxH = 4.8;
      doc.setFillColor(253, 242, 242); // #fdf2f2
      doc.setDrawColor(211, 47, 47); // #d32f2f
      doc.setLineWidth(0.3);
      doc.roundedRect(endX - numBoxW, curY + 10.8, numBoxW, numBoxH, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(211, 47, 47);
      doc.text(`FICHA Nº ${formNumber}`, endX - numBoxW / 2, curY + 14.3, { align: 'center' });

      // Data de Emissão
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 102, 102);
      doc.text(`Data de Emissão: ${safeDateStr}`, endX, curY + 19, { align: 'right' });

      const rightBottomY = curY + 20;
      curY = Math.max(leftBottomY, rightBottomY) + 2.5;

      // Linha Divisória Vermelha (Horizontal)
      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(0.6);
      doc.line(startX, curY, endX, curY);
      curY += 3;

      // Função Auxiliar para Cabeçalho de Seção com Barra Vermelha
      const drawSectionHeader = (title: string, yPos: number, height = 4.8) => {
        doc.setFillColor(245, 245, 245); // #f5f5f5
        doc.rect(startX, yPos, contentWidth, height, 'F');
        doc.setFillColor(211, 47, 47); // #d32f2f
        doc.rect(startX, yPos, 1.2, height, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(211, 47, 47);
        doc.text(`| ${title}`, startX + 3, yPos + 3.4);
      };

      // 2. Seção 1: Identificação do Colaborador e Empresa
      drawSectionHeader('IDENTIFICAÇÃO DO COLABORADOR E EMPRESA', curY);
      curY += 5.5;

      const infoBoxH = 14;
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(250, 250, 250);
      doc.rect(startX, curY, contentWidth, infoBoxH, 'FD');

      const col1X = startX + 3;
      const col2X = startX + 75;
      const col3X = startX + 145;
      const col4X = startX + 215;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);

      // Linha 1 de dados
      doc.text('COLABORADOR:', col1X, curY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(`${employee.name}`, col1X + 24, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('MATRÍCULA:', col2X, curY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${matricula}`, col2X + 18, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CPF:', col3X, curY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${cpf}`, col3X + 10, curY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('ADMISSÃO:', col4X, curY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${admissao}`, col4X + 17, curY + 4.5);

      // Divisória horizontal interna
      doc.setDrawColor(230, 230, 230);
      doc.line(startX, curY + 7, endX, curY + 7);

      // Linha 2 de dados
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CARGO / FUNÇÃO:', col1X, curY + 11.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${cargo}`, col1X + 26, curY + 11.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('SETOR / UNIDADE:', col2X, curY + 11.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${unidade}`, col2X + 26, curY + 11.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('EMPRESA:', col3X, curY + 11.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      const shortComp = compName.length > 32 ? compName.substring(0, 30) + '...' : compName;
      doc.text(`${shortComp}`, col3X + 16, curY + 11.2);

      curY += infoBoxH + 3;

      // 3. Seção 2: Termo de Compromisso e Legislação Vigente
      drawSectionHeader('TERMO DE COMPROMISSO E RESPONSABILIDADE (NR-06 / NR-01 - PORTARIA 3.214/78)', curY);
      curY += 5.5;

      const termoBoxH = 18;
      const termoHalfW = (contentWidth - 3) / 2;

      // Coluna Esquerda do Termo
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(252, 252, 252);
      doc.rect(startX, curY, termoHalfW, termoBoxH, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(183, 28, 28); // #b71c1c
      doc.text('DECLARAÇÃO DE RECEBIMENTO E ORIENTAÇÃO', startX + 2.5, curY + 3.8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(50, 50, 50);
      const termoEsq = 
        'Declaro ter recebido da empresa, a título de empréstimo gratuito para uso exclusivo nas minhas atividades, ' +
        'os Equipamentos de Proteção Individual (EPIs) listados nesta ficha, em perfeito estado de conservação e funcionamento. ' +
        'Recebi orientação e treinamento sobre o uso correto, higienização, guarda e conservação, conforme Portaria 3.214/78 do MTE (NR-1 e NR-6).';
      const splitTermoEsq = doc.splitTextToSize(termoEsq, termoHalfW - 5);
      doc.text(splitTermoEsq, startX + 2.5, curY + 7);

      // Coluna Direita do Termo
      const termoDirX = startX + termoHalfW + 3;
      doc.rect(termoDirX, curY, termoHalfW, termoBoxH, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(183, 28, 28);
      doc.text('OBRIGAÇÕES E RESPONSABILIDADE LEGAL (ART. 462 CLT)', termoDirX + 2.5, curY + 3.8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(50, 50, 50);
      const termoDir = 
        'Comprometo-me a: a) Usar o EPI apenas para a finalidade destinada; b) Responsabilizar-me pela guarda e conservação; ' +
        'c) Comunicar imediatamente qualquer alteração ou dano; d) Cumprir as normas de segurança. ' +
        'Ciente de que a recusa injustificada constitui ato faltoso (NR-1, 1.8.1) e que o extravio ou dano doloso autoriza o desconto em folha (Art. 462, §1º da CLT).';
      const splitTermoDir = doc.splitTextToSize(termoDir, termoHalfW - 5);
      doc.text(splitTermoDir, termoDirX + 2.5, curY + 7);

      curY += termoBoxH + 3;

      // 4. Seção 3: Registro de Entrega e Devolução de EPI
      drawSectionHeader('REGISTRO DE ENTREGA E DEVOLUÇÃO DE EQUIPAMENTOS (EPI)', curY);
      curY += 5.5;

      // Colunas da Tabela (soma = 273mm = contentWidth)
      const colWidths = [16, 110, 26, 30, 37, 27, 27];
      const colHeaders = [
        'QUANT',
        'DESCRIÇÃO DO EQUIPAMENTO',
        'Nº CA',
        'DATA ENTREGA',
        'RUBRICA EMPREGADO',
        'DATA DEVOL.',
        'RUBRICA'
      ];

      // Cabeçalho da Tabela
      doc.setFillColor(50, 50, 50);
      doc.rect(startX, curY, contentWidth, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);

      let colX = startX;
      colHeaders.forEach((header, i) => {
        doc.text(header, colX + colWidths[i] / 2, curY + 3.8, { align: 'center' });
        colX += colWidths[i];
      });

      curY += 5.5;

      // Linhas da Tabela
      const rowCount = 9;
      const tableRowHeight = 8.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);

      for (let r = 0; r < rowCount; r++) {
        const item = !isManual && items[r] ? items[r] : null;
        const rowBg = r % 2 === 0 ? 255 : 250;
        doc.setFillColor(rowBg, rowBg, rowBg);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'F');

        // Borda da linha
        doc.setDrawColor(220, 220, 220);
        doc.rect(startX, curY, contentWidth, tableRowHeight, 'S');

        // Linhas divisórias de colunas
        let gridX = startX;
        colWidths.forEach((w) => {
          doc.line(gridX, curY, gridX, curY + tableRowHeight);
          gridX += w;
        });

        // Preenchimento de dados
        if (item) {
          doc.text(String(item.quantity || 1), startX + colWidths[0] / 2, curY + 5.2, { align: 'center' });
          const desc = item.name.length > 65 ? item.name.substring(0, 63) + '...' : item.name;
          doc.setFont('helvetica', 'bold');
          doc.text(desc, startX + colWidths[0] + 3, curY + 5.2);
          doc.setFont('helvetica', 'normal');
          doc.text(item.ca || 'N/A', startX + colWidths[0] + colWidths[1] + colWidths[2] / 2, curY + 5.2, { align: 'center' });
          doc.text(item.deliveryDate || safeDateStr, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, curY + 5.2, { align: 'center' });

          if (digitalSignature) {
            try {
              const rubricaX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 3;
              doc.addImage(digitalSignature, 'PNG', rubricaX, curY + 1, colWidths[4] - 6, tableRowHeight - 2);
            } catch (_) {
              doc.text('[Assinado]', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, curY + 5.2, { align: 'center' });
            }
          }
        }

        curY += tableRowHeight;
      }

      curY += 2;

      // 5. Seção 4: Assinaturas
      const signBoxW = (contentWidth - 10) / 2;
      const signY = curY + 10;

      // Assinatura do Colaborador
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.4);
      doc.line(startX + 15, signY, startX + signBoxW - 15, signY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      doc.text(employee.name, startX + signBoxW / 2, signY + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Assinatura do Colaborador (Recebimento)', startX + signBoxW / 2, signY + 6.8, { align: 'center' });

      if (digitalSignature) {
        try {
          doc.addImage(digitalSignature, 'PNG', startX + signBoxW / 2 - 20, signY - 8.5, 40, 7.5);
        } catch (_) {}
      }

      // Assinatura do Responsável SST
      const sign2X = startX + signBoxW + 10;
      doc.line(sign2X + 15, signY, sign2X + signBoxW - 15, signY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      const respName = options.responsibleName || 'Almoxarifado / Segurança do Trabalho';
      doc.text(respName, sign2X + signBoxW / 2, signY + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Responsável pela Entrega / Técnico SST', sign2X + signBoxW / 2, signY + 6.8, { align: 'center' });

      // Rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Ficha de Controle Individual de EPI conforme Norma Regulamentadora NR-06 (Portaria GM nº 3.214/78 do MTE) • Emitido em ${safeDateStr} às ${safeTimeStr}`,
        pageWidth / 2,
        204,
        { align: 'center' }
      );

    } else {
      // =========================================================================
      // MODELO RETRATO (A4: 210mm x 297mm) - Padrão Oficial OS
      // =========================================================================
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const startX = 12;
      const endX = 198;
      const contentWidth = endX - startX; // 186mm
      let curY = 10;

      // 1. Cabeçalho Lado a Lado (Padrão OS)
      let leftBottomY = curY;
      if (logoImg) {
        // QUANDO TEM LOGOMARCA: Exibe o Logo + Nome da Empresa + CNPJ/Endereço
        const maxW = 38;
        const maxH = 10;
        const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
        const renderW = logoImg.width * ratio;
        const renderH = logoImg.height * ratio;

        try {
          doc.addImage(logoImg, 'PNG', startX, curY, renderW, renderH);
        } catch (_) {}

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(34, 34, 34);
        doc.text(compName, startX, curY + renderH + 3.2);

        if (companyDetails) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(85, 85, 85);
          const splitDetails = doc.splitTextToSize(companyDetails, 105);
          doc.text(splitDetails, startX, curY + renderH + 6.5);
          leftBottomY = curY + renderH + 6.5 + (splitDetails.length - 1) * 2.8;
        } else {
          leftBottomY = curY + renderH + 3.5;
        }
      } else {
        // QUANDO NÃO TEM LOGOMARCA: Exibe o Nome da Empresa em destaque + CNPJ/Endereço
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(34, 34, 34);
        doc.text(compName, startX, curY + 4.2);

        if (companyDetails) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(85, 85, 85);
          const splitDetails = doc.splitTextToSize(companyDetails, 105);
          doc.text(splitDetails, startX, curY + 7.8);
          leftBottomY = curY + 7.8 + (splitDetails.length - 1) * 2.8;
        } else {
          leftBottomY = curY + 4.5;
        }
      }

      // Direita: Título em vermelho, badge de status, caixa com número e data
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(211, 47, 47); // #d32f2f
      doc.text('ORDEM DE FORNECIMENTO — EPI', endX, curY + 3.5, { align: 'right' });

      // Badge de Tipo (Verde: NR-06 / SST)
      const badgeW = 22;
      const badgeH = 4;
      doc.setFillColor(46, 125, 50); // #2e7d32
      doc.roundedRect(endX - badgeW, curY + 5, badgeW, badgeH, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('NR-06 / SST', endX - badgeW / 2, curY + 7.8, { align: 'center' });

      // Caixa Número da OS / Ficha
      const numBoxW = 38;
      const numBoxH = 4.5;
      doc.setFillColor(253, 242, 242); // #fdf2f2
      doc.setDrawColor(211, 47, 47); // #d32f2f
      doc.setLineWidth(0.3);
      doc.roundedRect(endX - numBoxW, curY + 10.2, numBoxW, numBoxH, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(211, 47, 47);
      doc.text(`FICHA Nº ${formNumber}`, endX - numBoxW / 2, curY + 13.5, { align: 'center' });

      // Data de Emissão
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(102, 102, 102);
      doc.text(`Data de Emissão: ${safeDateStr}`, endX, curY + 18, { align: 'right' });

      const rightBottomY = curY + 19;
      curY = Math.max(leftBottomY, rightBottomY) + 2;

      // Linha Divisória Vermelha (Horizontal)
      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(0.6);
      doc.line(startX, curY, endX, curY);
      curY += 3;

      // Função Auxiliar para Cabeçalho de Seção com Barra Vermelha
      const drawSectionHeaderRetrato = (title: string, yPos: number, height = 4.6) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, yPos, contentWidth, height, 'F');
        doc.setFillColor(211, 47, 47);
        doc.rect(startX, yPos, 1.2, height, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(211, 47, 47);
        doc.text(`| ${title}`, startX + 3, yPos + 3.2);
      };

      // 2. Seção 1: Identificação do Colaborador e Empresa
      drawSectionHeaderRetrato('IDENTIFICAÇÃO DO COLABORADOR E EMPRESA', curY);
      curY += 5.2;

      const infoBoxH = 15;
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(250, 250, 250);
      doc.rect(startX, curY, contentWidth, infoBoxH, 'FD');

      const rCol1 = startX + 3;
      const rCol2 = startX + 96;

      // Linha 1: Nome e CPF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('COLABORADOR:', rCol1, curY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(`${employee.name}`, rCol1 + 24, curY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CPF:', rCol2, curY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${cpf}`, rCol2 + 10, curY + 4);

      // Linha divisória interna 1
      doc.setDrawColor(230, 230, 230);
      doc.line(startX, curY + 5.5, endX, curY + 5.5);

      // Linha 2: Cargo e Matrícula
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CARGO / FUNÇÃO:', rCol1, curY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${cargo}`, rCol1 + 26, curY + 9);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('MATRÍCULA:', rCol2, curY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${matricula}`, rCol2 + 18, curY + 9);

      // Linha divisória interna 2
      doc.line(startX, curY + 10.5, endX, curY + 10.5);

      // Linha 3: Setor e Admissão
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('SETOR / UNIDADE:', rCol1, curY + 13.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${unidade}`, rCol1 + 26, curY + 13.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('ADMISSÃO:', rCol2, curY + 13.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(`${admissao}`, rCol2 + 17, curY + 13.8);

      curY += infoBoxH + 3;

      // 3. Seção 2: Termo de Compromisso e Legislação Vigente
      drawSectionHeaderRetrato('TERMO DE COMPROMISSO E RESPONSABILIDADE (NR-06 / NR-01 - PORTARIA 3.214/78)', curY);
      curY += 5.2;

      const termoBoxHRetrato = 22;
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(252, 252, 252);
      doc.rect(startX, curY, contentWidth, termoBoxHRetrato, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(183, 28, 28);
      doc.text('DECLARAÇÃO DE RECEBIMENTO, USO E RESPONSABILIDADE LEGAL (NR-1, NR-6 E CLT ART. 462)', startX + 2.5, curY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(50, 50, 50);

      const termoRetratoTexto = 
        'Declaro que recebi da empresa os Equipamentos de Proteção Individual (EPIs) abaixo especificados, em perfeito estado de conservação, ' +
        'para uso exclusivo em serviço. Fui treinado quanto ao uso, guarda e conservação (NR-01 e NR-06). Comprometo-me a: a) Usá-los apenas para a ' +
        'finalidade a que se destinam; b) Responsabilizar-me pela sua conservação e guarda; c) Comunicar qualquer alteração que os torne impróprios; ' +
        'd) Cumprir as ordens de serviço e normas de segurança. Ciente de que a recusa injustificada constitui falta grave (NR-1, 1.8.1) e que o extravio ' +
        'ou dano por negligência/dolo enseja ressarcimento mediante desconto salarial na forma do Art. 462, §1º da Consolidação das Leis do Trabalho (CLT).';

      const splitTermoRetrato = doc.splitTextToSize(termoRetratoTexto, contentWidth - 5);
      doc.text(splitTermoRetrato, startX + 2.5, curY + 7);

      curY += termoBoxHRetrato + 3;

      // 4. Seção 3: Relação de Itens (EPIs Entregues)
      drawSectionHeaderRetrato('REGISTRO DE ENTREGA E DEVOLUÇÃO DE EQUIPAMENTOS (EPI)', curY);
      curY += 5.2;

      // Colunas: soma = 186mm = contentWidth
      const rColWidths = [12, 64, 18, 26, 26, 20, 20];
      const rColHeaders = [
        'QUANT',
        'DESCRIÇÃO DO EQUIPAMENTO',
        'Nº CA',
        'DATA ENTREGA',
        'RUBRICA EMPREGADO',
        'DATA DEVOL.',
        'RUBRICA'
      ];

      doc.setFillColor(50, 50, 50);
      doc.rect(startX, curY, contentWidth, 5.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(255, 255, 255);

      let rColX = startX;
      rColHeaders.forEach((h, i) => {
        doc.text(h, rColX + rColWidths[i] / 2, curY + 3.6, { align: 'center' });
        rColX += rColWidths[i];
      });

      curY += 5.2;

      // Linhas da Tabela
      const rRowCount = 14;
      const rRowH = 7.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 30, 30);

      for (let r = 0; r < rRowCount; r++) {
        const item = !isManual && items[r] ? items[r] : null;
        const rowBg = r % 2 === 0 ? 255 : 250;
        doc.setFillColor(rowBg, rowBg, rowBg);
        doc.rect(startX, curY, contentWidth, rRowH, 'F');

        doc.setDrawColor(220, 220, 220);
        doc.rect(startX, curY, contentWidth, rRowH, 'S');

        let gridX = startX;
        rColWidths.forEach((w) => {
          doc.line(gridX, curY, gridX, curY + rRowH);
          gridX += w;
        });

        if (item) {
          doc.text(String(item.quantity || 1), startX + rColWidths[0] / 2, curY + 4.8, { align: 'center' });
          const desc = item.name.length > 40 ? item.name.substring(0, 38) + '...' : item.name;
          doc.setFont('helvetica', 'bold');
          doc.text(desc, startX + rColWidths[0] + 2.5, curY + 4.8);
          doc.setFont('helvetica', 'normal');
          doc.text(item.ca || 'N/A', startX + rColWidths[0] + rColWidths[1] + rColWidths[2] / 2, curY + 4.8, { align: 'center' });
          doc.text(item.deliveryDate || safeDateStr, startX + rColWidths[0] + rColWidths[1] + rColWidths[2] + rColWidths[3] / 2, curY + 4.8, { align: 'center' });

          if (digitalSignature) {
            try {
              const rubricaX = startX + rColWidths[0] + rColWidths[1] + rColWidths[2] + rColWidths[3] + 2;
              doc.addImage(digitalSignature, 'PNG', rubricaX, curY + 1, rColWidths[4] - 4, rRowH - 2);
            } catch (_) {
              doc.text('[Assinado]', startX + rColWidths[0] + rColWidths[1] + rColWidths[2] + rColWidths[3] + rColWidths[4] / 2, curY + 4.8, { align: 'center' });
            }
          }
        }

        curY += rRowH;
      }

      curY += 4;

      // 5. Seção 4: Assinaturas
      const signBoxWRetrato = (contentWidth - 8) / 2;
      const signYRetrato = curY + 14;

      // Assinatura Colaborador
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.4);
      doc.line(startX + 10, signYRetrato, startX + signBoxWRetrato - 10, signYRetrato);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);
      doc.text(employee.name, startX + signBoxWRetrato / 2, signYRetrato + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 100, 100);
      doc.text('Assinatura do Colaborador (Recebimento)', startX + signBoxWRetrato / 2, signYRetrato + 6.8, { align: 'center' });

      if (digitalSignature) {
        try {
          doc.addImage(digitalSignature, 'PNG', startX + signBoxWRetrato / 2 - 18, signYRetrato - 9, 36, 7.5);
        } catch (_) {}
      }

      // Assinatura Responsável SST
      const sign2XRetrato = startX + signBoxWRetrato + 8;
      doc.line(sign2XRetrato + 10, signYRetrato, sign2XRetrato + signBoxWRetrato - 10, signYRetrato);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);
      const respName = options.responsibleName || 'Almoxarifado / Segurança do Trabalho';
      doc.text(respName, sign2XRetrato + signBoxWRetrato / 2, signYRetrato + 3.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 100, 100);
      doc.text('Responsável pela Entrega / Técnico SST', sign2XRetrato + signBoxWRetrato / 2, signYRetrato + 6.8, { align: 'center' });

      // Rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Ficha de Controle Individual de EPI conforme Norma Regulamentadora NR-06 (Portaria GM nº 3.214/78 do MTE) • Emitido em ${safeDateStr} às ${safeTimeStr}`,
        pageWidth / 2,
        291,
        { align: 'center' }
      );
    }

    const blob = doc.output('blob');
    const filename = `Ficha_EPI_${employee.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${orientation}.pdf`;

    return { doc, blob, filename };
  },

  /**
   * Dispara o download direto do PDF no navegador
   */
  async downloadPdf(options: GenerateEpiPdfOptions): Promise<void> {
    const { doc, filename } = await this.generatePdf(options);
    doc.save(filename);
  },
};
