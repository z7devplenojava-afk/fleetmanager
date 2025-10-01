import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TermoCienciaData {
  funcionario: {
    nome: string;
    cpf: string;
    cargo: string;
    endereco: string;
  };
  termo: {
    cidadeEmissao: string;
    dataEmissao: string;
    observacoes: string;
  };
}

class TermoCienciaPrestadorGenerator {
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString; // Se não conseguir converter, retorna como está
    }
  }

  private formatDateExtended(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} de ${month} de ${year}`;
    } catch {
      return dateString;
    }
  }

  private createHTMLContent(data: TermoCienciaData): string {
    const dataFormatada = this.formatDateExtended(data.termo.dataEmissao);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000;
            line-height: 1.4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 15px;
          }
          .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #f39c12, #e74c3c);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          }
          .logo-text {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .logo-main {
            font-size: 18px;
            font-weight: bold;
            color: #000;
          }
          .logo-sub {
            font-size: 12px;
            color: #666;
          }
          .company-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border: 1px solid #000;
            text-transform: uppercase;
            text-decoration: underline;
          }
          .content {
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 20px;
            text-align: justify;
          }
          .paragraph {
            margin-bottom: 15px;
          }
          .highlight {
            font-weight: bold;
            text-decoration: underline;
          }
          .date-location {
            font-size: 12px;
            margin-bottom: 30px;
            text-align: right;
          }
          .signature-section {
            display: flex;
            justify-content: center;
            margin: 30px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 300px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 100%;
            height: 40px;
            margin-bottom: 10px;
          }
          .signature-label {
            font-size: 11px;
            text-align: center;
            font-weight: bold;
          }
          .signature-subtitle {
            font-size: 10px;
            text-align: center;
            margin-top: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
          .footer-info {
            margin-bottom: 5px;
          }
          .footer-contact {
            font-weight: bold;
            color: #000;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 200px;
            color: rgba(0, 0, 0, 0.03);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">P</div>
          
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">P</div>
              <div class="logo-text">
                <div class="logo-main">Promover</div>
                <div class="logo-sub">Vigilância & Serviços</div>
              </div>
            </div>
            <div class="company-info">CNPJ: 43.576.260/0001-12</div>
            <div class="company-info">Tel.: (31) 2559-1245</div>
            <div class="company-info">Endereço: R. Coronel João Camargos, n° 267 - Centro - Contagem/MG</div>
            <div class="company-info">E-mail: comercial@promovervigilancia.com.br</div>
            <div class="company-info">Site: www.promovervigilancia.com.br</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">TERMO DE CIÊNCIA DO PRESTADOR DE SERVIÇOS</div>

          <!-- Conteúdo do Termo -->
          <div class="content">
            <div class="paragraph">
              Eu, <span class="highlight">${data.funcionario.nome}</span>, inscrito no CPF sob o nº <span class="highlight">${data.funcionario.cpf}</span>, 
              prestador de serviços e funcionário da empresa PROMOVER VIGILÂNCIA PATRIMONIAL LTDA, 
              inscrita no CNPJ sob o nº <span class="highlight">43.576.260/0001-12</span>.
            </div>
            
            <div class="paragraph">
              DECLARO estar ciente da Diretriz de Prevenção e Controle do Uso Indevido de Álcool e/ou de Outras Drogas, 
              cuja finalidade é a preservação da saúde e segurança de todos os colaboradores e prestadores de serviços, 
              e que recebi e li o material explicativo sobre o referido programa.
            </div>
          </div>

          <!-- Data e Local -->
          <div class="date-location">
            Local: ${data.termo.cidadeEmissao}<br>
            Data: ${dataFormatada}.
          </div>

          <!-- Assinatura -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.nome}</div>
              <div class="signature-subtitle">Assinatura do prestador de serviços</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div class="footer-info">Promover Vigilância Patrimonial Ltda</div>
            <div class="footer-info">R. Coronel João Camargos, n° 267 - Centro - Contagem/MG</div>
            <div class="footer-info">(31) 2559-1245</div>
            <div class="footer-contact">comercial@promovervigilancia.com.br</div>
            <div class="footer-contact">www.promovervigilancia.com.br</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(data: TermoCienciaData): Promise<void> {
    try {
      // Criar elemento HTML temporário
      const htmlContent = this.createHTMLContent(data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '15mm';
      document.body.appendChild(tempDiv);

      // Converter para canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remover elemento temporário
      document.body.removeChild(tempDiv);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download do PDF
      const fileName = `termo-ciencia-prestador-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}-${data.termo.dataEmissao.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar termo de ciência:', error);
      throw new Error('Erro ao gerar termo de ciência');
    }
  }
}

export const termoCienciaPrestadorGenerator = new TermoCienciaPrestadorGenerator();
