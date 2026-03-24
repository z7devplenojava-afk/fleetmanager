import jsPDF from 'jspdf';

export interface DemissaoData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    cargo: string;
    empresa: string;
    dataAdmissao: string;
  };
  demissao: {
    tipo: 'JUSTA_CAUSA' | 'SEM_JUSTA_CAUSA' | 'PEDIDO_DEMISSAO';
    motivo: string;
    dataDemissao: string;
    dataUltimoDia: string;
    avisoPrevio: boolean;
    diasAvisoPrevio?: number;
  };
  observacoes?: string;
}

export const demissaoJustaCausaGenerator = {
  async generatePDF(data: DemissaoData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE DEMISSÃO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('POR JUSTA CAUSA', pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
A empresa ${data.funcionario.empresa}, inscrita no CNPJ sob o nº [CNPJ], 
localizada em [ENDEREÇO], vem por meio deste comunicar a DISPENSA POR JUSTA CAUSA 
do(a) funcionário(a):

NOME: ${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
CARGO: ${data.funcionario.cargo}
DATA DE ADMISSÃO: ${data.funcionario.dataAdmissao}

MOTIVO DA DISPENSA:
${data.demissao.motivo}

A dispensa por justa causa ocorre em virtude de ato faltoso grave praticado pelo 
funcionário, conforme previsto na CLT, art. 482, que autoriza a rescisão imediata 
do contrato de trabalho sem direito a aviso prévio, 13º salário proporcional, 
férias proporcionais e FGTS.

DATA DA DISPENSA: ${data.demissao.dataDemissao}
ÚLTIMO DIA DE TRABALHO: ${data.demissao.dataUltimoDia}

${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}

Este termo foi elaborado em conformidade com a legislação trabalhista vigente.

Data: ${data.demissao.dataDemissao}
Local: [LOCAL]

_________________________________
${data.funcionario.empresa}
Representante Legal

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
    doc.save(`demissao-justa-causa-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};


































