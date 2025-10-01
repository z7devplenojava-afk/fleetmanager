import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface TermoResponsabilidadeData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    cargo: string;
    empresa: string;
  };
  equipamento: {
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    valor: string;
  };
  dataEntrega: string;
  localEntrega: string;
  observacoes?: string;
}

export const termoResponsabilidadeCartaoOtimoGenerator = {
  async generatePDF(data: TermoResponsabilidadeData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('CARTÃO ÓTIMO VALE-TRANSPORTE', pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:

TIPO: ${data.equipamento.tipo}
MARCA: ${data.equipamento.marca}
MODELO: ${data.equipamento.modelo}
NÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}
VALOR: R$ ${data.equipamento.valor}

COMPROMISSO:
Declaro-me responsável pelo uso adequado e conservação do equipamento acima descrito, 
comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo 
em perfeitas condições quando solicitado pela empresa.

Em caso de perda, dano ou mau uso do equipamento, assumo total responsabilidade 
pelo pagamento do valor correspondente ou pela reposição do mesmo.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.dataEntrega}
Local: ${data.localEntrega}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
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
    doc.save(`termo-responsabilidade-cartao-otimo-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};

export const termoResponsabilidadeCelularGenerator = {
  async generatePDF(data: TermoResponsabilidadeData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('APARELHO CELULAR', pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, 
funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, 
declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:

TIPO: ${data.equipamento.tipo}
MARCA: ${data.equipamento.marca}
MODELO: ${data.equipamento.modelo}
NÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}
VALOR: R$ ${data.equipamento.valor}

COMPROMISSO:
Declaro-me responsável pelo uso adequado e conservação do aparelho celular acima descrito, 
comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo 
em perfeitas condições quando solicitado pela empresa.

Em caso de perda, dano ou mau uso do aparelho, assumo total responsabilidade 
pelo pagamento do valor correspondente ou pela reposição do mesmo.

O aparelho deve ser utilizado exclusivamente para comunicação profissional e 
não deve ser utilizado para fins pessoais durante o horário de trabalho.

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Data: ${data.dataEntrega}
Local: ${data.localEntrega}

_________________________________
${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
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
    doc.save(`termo-responsabilidade-celular-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};
