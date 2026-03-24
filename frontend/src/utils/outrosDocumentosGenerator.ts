import jsPDF from 'jspdf';

export interface CartaApresentacaoData {
  funcionario: {
    nome: string;
    cpf: string;
    cargo: string;
    empresa: string;
  };
  destinatario?: string;
  data: string;
  conteudo?: string;
}

export interface TermoOpcaoVTData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    cargo: string;
    empresa: string;
  };
  opcao: 'ACEITA' | 'RECUSA';
  valorVT?: string;
  data: string;
  observacoes?: string;
}

export interface ValidacaoNR06Data {
  funcionario: {
    nome: string;
    cpf: string;
    cargo: string;
    empresa: string;
  };
  epis: Array<{
    nome: string;
    ca: string;
    validade: string;
  }>;
  dataValidacao: string;
  responsavel: string;
  observacoes?: string;
}

export interface TermoLGPDData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    cargo: string;
    empresa: string;
  };
  consentimentos: string[];
  data: string;
  observacoes?: string;
}

export interface FormularioAberturaVagaData {
  vaga: {
    cargo: string;
    setor: string;
    tipo: 'CLT' | 'PJ' | 'ESTAGIO' | 'TEMPORARIO';
    salario?: string;
    requisitos: string;
    descricao: string;
  };
  solicitante: {
    nome: string;
    cargo: string;
    departamento: string;
  };
  data: string;
  observacoes?: string;
}

export const cartaApresentacaoGenerator = {
  async generatePDF(data: CartaApresentacaoData): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CARTA DE APRESENTAÇÃO', pageWidth / 2, 30, { align: 'center' });
    
    doc.line(margin, 40, pageWidth - margin, 40);
    
    let yPosition = 60;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const destinatario = data.destinatario || 'Prezado(a) Senhor(a)';
    const conteudo = data.conteudo || `Venho por meio desta apresentar ${data.funcionario.nome}, 
portador do CPF nº ${data.funcionario.cpf}, que atualmente ocupa o cargo de ${data.funcionario.cargo} 
na empresa ${data.funcionario.empresa}.`;
    
    const content = `
${destinatario},

${conteudo}

Atenciosamente,

${data.funcionario.empresa}
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}

Data: ${data.data}
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`carta-apresentacao-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const termoOpcaoVTPromoverGenerator = {
  async generatePDF(data: TermoOpcaoVTData): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE OPÇÃO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('VALE-TRANSPORTE - PROMOVER VIGILÂNCIA', pageWidth / 2, 40, { align: 'center' });
    
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const opcaoTexto = data.opcao === 'ACEITA' ? 'ACEITO' : 'RECUSO';
    const valorTexto = data.valorVT ? ` no valor de R$ ${data.valorVT}` : '';
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
venho por meio deste ${opcaoTexto.toLowerCase()} o benefício de Vale-Transporte oferecido pela empresa${valorTexto}.

${data.opcao === 'ACEITA' 
  ? 'Estou ciente de que o valor do Vale-Transporte será descontado do meu salário conforme legislação vigente.'
  : 'Estou ciente de que, ao recusar o Vale-Transporte, não terei direito a este benefício.'}

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.data}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`termo-opcao-vt-promover-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const validacaoNR06Generator = {
  async generatePDF(data: ValidacaoNR06Data): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('VALIDAÇÃO NR-06', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL', pageWidth / 2, 40, { align: 'center' });
    
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let episList = '';
    data.epis.forEach((epi, index) => {
      episList += `${index + 1}. ${epi.nome}\n   CA: ${epi.ca}\n   Validade: ${epi.validade}\n\n`;
    });
    
    const content = `
FUNCIONÁRIO:
Nome: ${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
Cargo: ${data.funcionario.cargo}
Empresa: ${data.funcionario.empresa}

EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL VALIDADOS:

${episList}

Esta validação foi realizada em conformidade com a Norma Regulamentadora NR-06, 
que estabelece as diretrizes para o fornecimento e uso de Equipamentos de Proteção 
Individual (EPIs) no ambiente de trabalho.

RESPONSÁVEL PELA VALIDAÇÃO: ${data.responsavel}
DATA DA VALIDAÇÃO: ${data.dataValidacao}

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

_________________________________
${data.responsavel}
Responsável pela Validação

_________________________________
${data.funcionario.nome}
Funcionário
CPF: ${data.funcionario.cpf}
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`validacao-nr06-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const termoLGPDGenerator = {
  async generatePDF(data: TermoLGPDData): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE CONSENTIMENTO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)', pageWidth / 2, 40, { align: 'center' });
    
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let consentimentosList = '';
    data.consentimentos.forEach((consent, index) => {
      consentimentosList += `${index + 1}. ${consent}\n`;
    });
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
venho por meio deste manifestar meu CONSENTIMENTO para o tratamento dos meus dados pessoais 
pela empresa, conforme disposto na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

CONSENTIMENTOS:

${consentimentosList}

Estou ciente de que:
- Os dados serão utilizados exclusivamente para as finalidades descritas acima;
- Tenho direito de revogar meu consentimento a qualquer momento;
- Tenho direito de acesso, correção, exclusão e portabilidade dos meus dados;
- Os dados serão mantidos em segurança e confidencialidade.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.data}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`termo-lgpd-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const termoProtecaoDadosLGPDGenerator = {
  async generatePDF(data: TermoLGPDData): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE PROTEÇÃO DE DADOS', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)', pageWidth / 2, 40, { align: 'center' });
    
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let consentimentosList = '';
    data.consentimentos.forEach((consent, index) => {
      consentimentosList += `${index + 1}. ${consent}\n`;
    });
    
    const content = `
A empresa ${data.funcionario.empresa} compromete-se a proteger os dados pessoais do(a) 
funcionário(a) ${data.funcionario.nome}, CPF nº ${data.funcionario.cpf}, RG nº ${data.funcionario.rg}, 
conforme estabelecido na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

COMPROMISSOS DA EMPRESA:

${consentimentosList}

A empresa garante que:
- Os dados serão tratados com segurança e confidencialidade;
- Os dados serão utilizados exclusivamente para as finalidades descritas;
- O funcionário tem direito de acesso, correção e exclusão dos seus dados;
- Os dados serão mantidos apenas pelo tempo necessário para cumprir as finalidades;
- Em caso de vazamento, a empresa comunicará imediatamente ao funcionário e à ANPD.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.data}

_________________________________
${data.funcionario.empresa}
Representante Legal

_________________________________
${data.funcionario.nome}
Funcionário
CPF: ${data.funcionario.cpf}
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`termo-protecao-dados-lgpd-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const formularioAberturaVagaGenerator = {
  async generatePDF(data: FormularioAberturaVagaData): Promise<void> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULÁRIO PARA ABERTURA DE VAGA', pageWidth / 2, 30, { align: 'center' });
    
    doc.line(margin, 40, pageWidth - margin, 40);
    
    let yPosition = 60;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const tipoVaga = {
      'CLT': 'CLT (Consolidação das Leis do Trabalho)',
      'PJ': 'Pessoa Jurídica',
      'ESTAGIO': 'Estágio',
      'TEMPORARIO': 'Temporário'
    }[data.vaga.tipo] || data.vaga.tipo;
    
    const content = `
DADOS DA VAGA:

Cargo: ${data.vaga.cargo}
Setor: ${data.vaga.setor}
Tipo de Contratação: ${tipoVaga}
${data.vaga.salario ? `Salário: R$ ${data.vaga.salario}` : ''}

REQUISITOS:
${data.vaga.requisitos}

DESCRIÇÃO DA VAGA:
${data.vaga.descricao}

SOLICITANTE:
Nome: ${data.solicitante.nome}
Cargo: ${data.solicitante.cargo}
Departamento: ${data.solicitante.departamento}

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data da Solicitação: ${data.data}

_________________________________
${data.solicitante.nome}
Solicitante
    `;
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    doc.save(`formulario-abertura-vaga-${data.vaga.cargo.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};


































