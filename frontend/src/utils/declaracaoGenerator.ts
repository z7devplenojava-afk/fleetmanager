import jsPDF from 'jspdf';

export interface DeclaracaoData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    cargo: string;
    empresa: string;
  };
  declaracao: {
    tipo: string;
    conteudo: string;
    finalidade: string;
  };
  dataDeclaracao: string;
  localDeclaracao: string;
  observacoes?: string;
}

export const declaracaoCipaTranspesGenerator = {
  async generatePDF(data: DeclaracaoData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('PARA DESIGNATION DA CIPA - TRANSPES', pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
venho por meio desta declarar que:

${data.declaracao.conteudo}

Esta declaração tem por finalidade: ${data.declaracao.finalidade}

Declaro ainda que as informações prestadas são verdadeiras e estou ciente das 
responsabilidades legais inerentes a esta declaração.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.dataDeclaracao}
Local: ${data.localDeclaracao}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
    `;
    
    // Dividir o texto em linhas
    const lines = doc.splitTextToSize(content, contentWidth);
    
    // Adicionar cada linha ao PDF
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    // Rodapé
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Salvar o PDF
    doc.save(`declaracao-cipa-transpes-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const declaracaoFinsEscolaresGenerator = {
  async generatePDF(data: DeclaracaoData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('FINS ESCOLARES', pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
venho por meio desta declarar que:

${data.declaracao.conteudo}

Esta declaração tem por finalidade: ${data.declaracao.finalidade}

Declaro ainda que as informações prestadas são verdadeiras e estou ciente das 
responsabilidades legais inerentes a esta declaração.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.dataDeclaracao}
Local: ${data.localDeclaracao}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
    `;
    
    // Dividir o texto em linhas
    const lines = doc.splitTextToSize(content, contentWidth);
    
    // Adicionar cada linha ao PDF
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    // Rodapé
    doc.setFontSize(10);
    doc.text('Este documento foi gerado automaticamente pelo sistema Secure Guard', 
             pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Salvar o PDF
    doc.save(`declaracao-fins-escolares-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};