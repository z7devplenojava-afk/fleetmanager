import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrdemServicoData {
  ordem: {
    numero: string;
    dataInicio: string;
    dataFim: string;
    observacoes: string;
    modelo: string;
    status: string;
  };
  funcionario: {
    name: string;
    document: string;
    position?: { name: string };
    unit?: { name: string; code: string };
  };
  cliente: {
    name: string;
    document: string;
  };
  empresa: {
    name: string;
    document: string;
  };
  unidade: {
    name: string;
    code: string;
  };
  cargo: {
    name: string;
  };
}

class OrdemServicoPDFGenerator {
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
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

  private createCSNHTML(data: OrdemServicoData): string {
    const dataInicioFormatada = this.formatDateExtended(data.ordem.dataInicio);
    const dataFimFormatada = this.formatDateExtended(data.ordem.dataFim);

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
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
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
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-section {
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1e3a8a;
          }
          .info-item {
            margin-bottom: 5px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
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
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">CSN</div>
              <div class="logo-text">
                <div class="logo-main">Companhia Siderúrgica Nacional</div>
                <div class="logo-sub">${data.cliente.name}</div>
              </div>
            </div>
            <div class="company-info">CNPJ: ${data.cliente.document}</div>
            <div class="company-info">Empresa Prestadora: ${data.empresa.name}</div>
            <div class="company-info">CNPJ Prestadora: ${data.empresa.document}</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">ORDEM DE SERVIÇO - MODELO CSN</div>

          <!-- Conteúdo da Ordem -->
          <div class="content">
            <div class="paragraph">
              <strong>Número da Ordem:</strong> ${data.ordem.numero}
            </div>
            
            <div class="paragraph">
              <strong>Período de Execução:</strong> De ${dataInicioFormatada} até ${dataFimFormatada}
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-title">DADOS DO FUNCIONÁRIO</div>
                <div class="info-item"><strong>Nome:</strong> ${data.funcionario.name}</div>
                <div class="info-item"><strong>CPF:</strong> ${data.funcionario.document}</div>
                <div class="info-item"><strong>Cargo:</strong> ${data.cargo.name}</div>
                <div class="info-item"><strong>Unidade:</strong> ${data.unidade.name} (${data.unidade.code})</div>
              </div>
              
              <div class="info-section">
                <div class="info-title">DADOS DO SERVIÇO</div>
                <div class="info-item"><strong>Cliente:</strong> ${data.cliente.name}</div>
                <div class="info-item"><strong>Empresa Prestadora:</strong> ${data.empresa.name}</div>
                <div class="info-item"><strong>Unidade de Trabalho:</strong> ${data.unidade.name}</div>
                <div class="info-item"><strong>Status:</strong> ${data.ordem.status}</div>
              </div>
            </div>

            <div class="paragraph">
              <strong>Descrição dos Serviços:</strong>
            </div>
            <div class="paragraph">
              O funcionário <span class="highlight">${data.funcionario.name}</span>, 
              portador do CPF <span class="highlight">${data.funcionario.document}</span>, 
              exercendo a função de <span class="highlight">${data.cargo.name}</span>, 
              está autorizado a prestar serviços na unidade <span class="highlight">${data.unidade.name}</span> 
              da empresa <span class="highlight">${data.cliente.name}</span>, 
              no período de ${dataInicioFormatada} até ${dataFimFormatada}.
            </div>

            <div class="paragraph">
              <strong>Observações:</strong>
            </div>
            <div class="paragraph">
              ${data.ordem.observacoes || 'Nenhuma observação adicional.'}
            </div>
          </div>

          <!-- Assinaturas -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.name}</div>
              <div class="signature-label">Funcionário</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Representante da Empresa</div>
              <div class="signature-label">${data.empresa.name}</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Documento gerado automaticamente pelo sistema</div>
            <div>Data de emissão: ${this.formatDateExtended(new Date().toISOString())}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createATERPAHTML(data: OrdemServicoData): string {
    const dataInicioFormatada = this.formatDateExtended(data.ordem.dataInicio);
    const dataFimFormatada = this.formatDateExtended(data.ordem.dataFim);

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
            background: linear-gradient(135deg, #059669, #10b981);
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
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-section {
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #059669;
          }
          .info-item {
            margin-bottom: 5px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
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
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">AT</div>
              <div class="logo-text">
                <div class="logo-main">Agência de Transporte do Estado do Pará</div>
                <div class="logo-sub">ATERPA</div>
              </div>
            </div>
            <div class="company-info">CNPJ: ${data.cliente.document}</div>
            <div class="company-info">Empresa Prestadora: ${data.empresa.name}</div>
            <div class="company-info">CNPJ Prestadora: ${data.empresa.document}</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">ORDEM DE SERVIÇO - MODELO ATERPA</div>

          <!-- Conteúdo da Ordem -->
          <div class="content">
            <div class="paragraph">
              <strong>Número da Ordem:</strong> ${data.ordem.numero}
            </div>
            
            <div class="paragraph">
              <strong>Período de Execução:</strong> De ${dataInicioFormatada} até ${dataFimFormatada}
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-title">DADOS DO FUNCIONÁRIO</div>
                <div class="info-item"><strong>Nome:</strong> ${data.funcionario.name}</div>
                <div class="info-item"><strong>CPF:</strong> ${data.funcionario.document}</div>
                <div class="info-item"><strong>Cargo:</strong> ${data.cargo.name}</div>
                <div class="info-item"><strong>Unidade:</strong> ${data.unidade.name} (${data.unidade.code})</div>
              </div>
              
              <div class="info-section">
                <div class="info-title">DADOS DO SERVIÇO</div>
                <div class="info-item"><strong>Cliente:</strong> ${data.cliente.name}</div>
                <div class="info-item"><strong>Empresa Prestadora:</strong> ${data.empresa.name}</div>
                <div class="info-item"><strong>Unidade de Trabalho:</strong> ${data.unidade.name}</div>
                <div class="info-item"><strong>Status:</strong> ${data.ordem.status}</div>
              </div>
            </div>

            <div class="paragraph">
              <strong>Descrição dos Serviços:</strong>
            </div>
            <div class="paragraph">
              O funcionário <span class="highlight">${data.funcionario.name}</span>, 
              portador do CPF <span class="highlight">${data.funcionario.document}</span>, 
              exercendo a função de <span class="highlight">${data.cargo.name}</span>, 
              está autorizado a prestar serviços na unidade <span class="highlight">${data.unidade.name}</span> 
              da empresa <span class="highlight">${data.cliente.name}</span>, 
              no período de ${dataInicioFormatada} até ${dataFimFormatada}.
            </div>

            <div class="paragraph">
              <strong>Observações:</strong>
            </div>
            <div class="paragraph">
              ${data.ordem.observacoes || 'Nenhuma observação adicional.'}
            </div>
          </div>

          <!-- Assinaturas -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.name}</div>
              <div class="signature-label">Funcionário</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Representante da Empresa</div>
              <div class="signature-label">${data.empresa.name}</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Documento gerado automaticamente pelo sistema</div>
            <div>Data de emissão: ${this.formatDateExtended(new Date().toISOString())}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createTRANSPESHTML(data: OrdemServicoData): string {
    const dataInicioFormatada = this.formatDateExtended(data.ordem.dataInicio);
    const dataFimFormatada = this.formatDateExtended(data.ordem.dataFim);

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
            background: linear-gradient(135deg, #dc2626, #ef4444);
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
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-section {
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #dc2626;
          }
          .info-item {
            margin-bottom: 5px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
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
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">TP</div>
              <div class="logo-text">
                <div class="logo-main">Transportadora Pesada Ltda</div>
                <div class="logo-sub">TRANSPES</div>
              </div>
            </div>
            <div class="company-info">CNPJ: ${data.cliente.document}</div>
            <div class="company-info">Empresa Prestadora: ${data.empresa.name}</div>
            <div class="company-info">CNPJ Prestadora: ${data.empresa.document}</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">ORDEM DE SERVIÇO - MODELO TRANSPES</div>

          <!-- Conteúdo da Ordem -->
          <div class="content">
            <div class="paragraph">
              <strong>Número da Ordem:</strong> ${data.ordem.numero}
            </div>
            
            <div class="paragraph">
              <strong>Período de Execução:</strong> De ${dataInicioFormatada} até ${dataFimFormatada}
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-title">DADOS DO FUNCIONÁRIO</div>
                <div class="info-item"><strong>Nome:</strong> ${data.funcionario.name}</div>
                <div class="info-item"><strong>CPF:</strong> ${data.funcionario.document}</div>
                <div class="info-item"><strong>Cargo:</strong> ${data.cargo.name}</div>
                <div class="info-item"><strong>Unidade:</strong> ${data.unidade.name} (${data.unidade.code})</div>
              </div>
              
              <div class="info-section">
                <div class="info-title">DADOS DO SERVIÇO</div>
                <div class="info-item"><strong>Cliente:</strong> ${data.cliente.name}</div>
                <div class="info-item"><strong>Empresa Prestadora:</strong> ${data.empresa.name}</div>
                <div class="info-item"><strong>Unidade de Trabalho:</strong> ${data.unidade.name}</div>
                <div class="info-item"><strong>Status:</strong> ${data.ordem.status}</div>
              </div>
            </div>

            <div class="paragraph">
              <strong>Descrição dos Serviços:</strong>
            </div>
            <div class="paragraph">
              O funcionário <span class="highlight">${data.funcionario.name}</span>, 
              portador do CPF <span class="highlight">${data.funcionario.document}</span>, 
              exercendo a função de <span class="highlight">${data.cargo.name}</span>, 
              está autorizado a prestar serviços na unidade <span class="highlight">${data.unidade.name}</span> 
              da empresa <span class="highlight">${data.cliente.name}</span>, 
              no período de ${dataInicioFormatada} até ${dataFimFormatada}.
            </div>

            <div class="paragraph">
              <strong>Observações:</strong>
            </div>
            <div class="paragraph">
              ${data.ordem.observacoes || 'Nenhuma observação adicional.'}
            </div>
          </div>

          <!-- Assinaturas -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.name}</div>
              <div class="signature-label">Funcionário</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Representante da Empresa</div>
              <div class="signature-label">${data.empresa.name}</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Documento gerado automaticamente pelo sistema</div>
            <div>Data de emissão: ${this.formatDateExtended(new Date().toISOString())}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createASGHTML(data: OrdemServicoData, tipo: 'ATERPA' | 'TRANSPES'): string {
    const dataInicioFormatada = this.formatDateExtended(data.ordem.dataInicio);
    const dataFimFormatada = this.formatDateExtended(data.ordem.dataFim);
    const corPrincipal = tipo === 'ATERPA' ? '#059669' : '#dc2626';
    const logoText = tipo === 'ATERPA' ? 'ASG ATERPA' : 'ASG TRANSPES';
    const logoIcon = tipo === 'ATERPA' ? 'ASG-AT' : 'ASG-TP';

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
            background: linear-gradient(135deg, ${corPrincipal}, ${corPrincipal}cc);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
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
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-section {
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: ${corPrincipal};
          }
          .info-item {
            margin-bottom: 5px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
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
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">${logoIcon}</div>
              <div class="logo-text">
                <div class="logo-main">${logoText}</div>
                <div class="logo-sub">Serviços de Limpeza e Conservação</div>
              </div>
            </div>
            <div class="company-info">CNPJ: ${data.cliente.document}</div>
            <div class="company-info">Empresa Prestadora: ${data.empresa.name}</div>
            <div class="company-info">CNPJ Prestadora: ${data.empresa.document}</div>
          </div>

          <!-- Título do Documento -->
          <div class="title">ORDEM DE SERVIÇO - MODELO ${logoText}</div>

          <!-- Conteúdo da Ordem -->
          <div class="content">
            <div class="paragraph">
              <strong>Número da Ordem:</strong> ${data.ordem.numero}
            </div>
            
            <div class="paragraph">
              <strong>Período de Execução:</strong> De ${dataInicioFormatada} até ${dataFimFormatada}
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-title">DADOS DO FUNCIONÁRIO</div>
                <div class="info-item"><strong>Nome:</strong> ${data.funcionario.name}</div>
                <div class="info-item"><strong>CPF:</strong> ${data.funcionario.document}</div>
                <div class="info-item"><strong>Cargo:</strong> ${data.cargo.name}</div>
                <div class="info-item"><strong>Unidade:</strong> ${data.unidade.name} (${data.unidade.code})</div>
              </div>
              
              <div class="info-section">
                <div class="info-title">DADOS DO SERVIÇO</div>
                <div class="info-item"><strong>Cliente:</strong> ${data.cliente.name}</div>
                <div class="info-item"><strong>Empresa Prestadora:</strong> ${data.empresa.name}</div>
                <div class="info-item"><strong>Unidade de Trabalho:</strong> ${data.unidade.name}</div>
                <div class="info-item"><strong>Status:</strong> ${data.ordem.status}</div>
              </div>
            </div>

            <div class="paragraph">
              <strong>Descrição dos Serviços:</strong>
            </div>
            <div class="paragraph">
              O funcionário <span class="highlight">${data.funcionario.name}</span>, 
              portador do CPF <span class="highlight">${data.funcionario.document}</span>, 
              exercendo a função de <span class="highlight">${data.cargo.name}</span>, 
              está autorizado a prestar serviços de limpeza e conservação na unidade <span class="highlight">${data.unidade.name}</span> 
              da empresa <span class="highlight">${data.cliente.name}</span>, 
              no período de ${dataInicioFormatada} até ${dataFimFormatada}.
            </div>

            <div class="paragraph">
              <strong>Observações:</strong>
            </div>
            <div class="paragraph">
              ${data.ordem.observacoes || 'Nenhuma observação adicional.'}
            </div>
          </div>

          <!-- Assinaturas -->
          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">${data.funcionario.name}</div>
              <div class="signature-label">Funcionário</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Representante da Empresa</div>
              <div class="signature-label">${data.empresa.name}</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <div>Documento gerado automaticamente pelo sistema</div>
            <div>Data de emissão: ${this.formatDateExtended(new Date().toISOString())}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public async generatePDF(data: OrdemServicoData): Promise<void> {
    try {
      let htmlContent = '';

      // Selecionar template baseado no modelo
      switch (data.ordem.modelo) {
        case 'CSN':
          htmlContent = this.createCSNHTML(data);
          break;
        case 'ATERPA':
          htmlContent = this.createATERPAHTML(data);
          break;
        case 'TRANSPES':
          htmlContent = this.createTRANSPESHTML(data);
          break;
        case 'ASG_ATERPA':
          htmlContent = this.createASGHTML(data, 'ATERPA');
          break;
        case 'ASG_TRANSPES':
          htmlContent = this.createASGHTML(data, 'TRANSPES');
          break;
        default:
          htmlContent = this.createCSNHTML(data); // Default para CSN
      }

      // Criar elemento HTML temporário
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
      const fileName = `ordem-servico-${data.ordem.numero}-${data.ordem.modelo}-${data.funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar ordem de serviço:', error);
      throw new Error('Erro ao gerar ordem de serviço');
    }
  }
}

export const ordemServicoPDFGenerator = new OrdemServicoPDFGenerator();
