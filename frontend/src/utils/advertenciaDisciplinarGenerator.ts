import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AdvertenciaData {
  funcionario: {
    nome: string;
    cpf: string;
    cargo: string;
    dataAdmissao: string;
    endereco: string;
  };
  advertencia: {
    motivo: string;
    dataFaltas: string;
    dataRetorno: string;
    observacoes: string;
    dataEmissao: string;
  };
}

class AdvertenciaDisciplinarGenerator {
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString; // Se não conseguir converter, retorna como está
    }
  }

  private createHTMLContent(data: AdvertenciaData): string {
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
          }
          .recipient {
            margin-bottom: 20px;
          }
          .recipient-label {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .recipient-name {
            font-size: 14px;
            text-decoration: underline;
            font-weight: bold;
          }
          .salutation {
            font-size: 14px;
            margin-bottom: 20px;
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
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 40px;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
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
          .witnesses-section {
            margin-top: 30px;
          }
          .witnesses-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .witnesses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .witness-item {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .witness-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .witness-line {
            border-bottom: 1px solid #000;
            width: 100%;
            height: 30px;
            margin-bottom: 5px;
          }
          .refusal-section {
            margin-top: 20px;
            font-size: 11px;
          }
          .refusal-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .refusal-options {
            display: flex;
            gap: 20px;
            margin-top: 10px;
          }
          .refusal-option {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            display: inline-block;
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
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">P</div>
              <div class="logo-text">
                <div class="logo-main">Promover</div>
                <div class="logo-sub">Terceirização & Serviços</div>
              </div>
            </div>
            <div class="company-info">CNPJ: 36.698.521/0001-01</div>
            <div class="company-info">Tel.: (+55) 31 2559 6834 WhatsApp (+55) 31 99941 1553</div>
            <div class="company-info">Endereço: Rua Pelegrino de Paula Ferreira, 77 - Centro, Contagem - MG, 32017-400</div>
            <div class="company-info">Site: https://alfaservices.com.br/ | E-mail: comercial@forteminasvigilancia.com.br</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">ADVERTÊNCIA DISCIPLINAR</div>

          <!-- Destinatário -->
          <div class="recipient">
            <div class="recipient-label">À</div>
            <div class="recipient-name">${data.funcionario.nome}</div>
          </div>

          <!-- Saudação -->
          <div class="salutation">Prezado(a) Senhor(a):</div>

          <!-- Conteúdo da Advertência -->
          <div class="content">
            <div class="paragraph">
              V.Sa. tem conhecimento das normas da empresa sobre avisar a supervisão com antecedência sobre ausências. 
              No entanto, não o fez nos dias <span class="highlight">${data.advertencia.dataFaltas}</span>, 
              faltando ao trabalho e só retornando no dia <span class="highlight">${data.advertencia.dataRetorno}</span>, 
              sem justificar as ausências.
            </div>
            
            <div class="paragraph">
              A falta de comunicação causou transtorno junto ao cliente, levando à aplicação desta advertência.
            </div>
            
            <div class="paragraph">
              A reincidência desta ou de outras atitudes contrárias <span class="highlight">às normas da empresa poderá</span> 
              ocasionar na suspensão disciplinar.
            </div>
          </div>

          <!-- Data e Local -->
          <div class="date-location">
            Contagem, ${data.advertencia.dataEmissao}.
          </div>

          <!-- Assinaturas -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">PROMOVER TERCEIRIZAÇÃO & SERVIÇOS LTDA</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.nome}</div>
            </div>
          </div>

          <!-- Testemunhas -->
          <div class="witnesses-section">
            <div class="witnesses-title">Testemunhas:</div>
            <div class="witnesses-grid">
              <div class="witness-item">
                <div class="witness-label">Nome:</div>
                <div class="witness-line"></div>
                <div class="witness-label">CI:</div>
                <div class="witness-line"></div>
              </div>
              <div class="witness-item">
                <div class="witness-label">Nome:</div>
                <div class="witness-line"></div>
                <div class="witness-label">CI:</div>
                <div class="witness-line"></div>
              </div>
            </div>
          </div>

          <!-- Recusa de Assinatura -->
          <div class="refusal-section">
            <div class="refusal-title">Obs.: O funcionário recusou-se a assinar o presente documento?</div>
            <div class="refusal-options">
              <div class="refusal-option">
                <div class="checkbox"></div>
                <span>SIM</span>
              </div>
              <div class="refusal-option">
                <div class="checkbox"></div>
                <span>NÃO</span>
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div class="footer-info">PROMOVER TERCEIRIZAÇÃO & SERVIÇOS LTDA</div>
            <div class="footer-info">CNPJ: 36.698.521/0001-01</div>
            <div class="footer-info">Tel.: (+55) 31 2559 6834 WhatsApp (+55) 31 99941 1553</div>
            <div class="footer-info">Endereço: Rua Pelegrino de Paula Ferreira, 77 - Centro, Contagem - MG, 32017-400</div>
            <div class="footer-contact">Site: https://alfaservices.com.br/ | E-mail: comercial@forteminasvigilancia.com.br</div>
            <div style="margin-top: 10px;">Página 1</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(data: AdvertenciaData): Promise<void> {
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
      const fileName = `advertencia-disciplinar-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}-${data.advertencia.dataEmissao.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar advertência disciplinar:', error);
      throw new Error('Erro ao gerar advertência disciplinar');
    }
  }
}

export const advertenciaDisciplinarGenerator = new AdvertenciaDisciplinarGenerator();
