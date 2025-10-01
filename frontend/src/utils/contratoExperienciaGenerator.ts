import jsPDF from 'jspdf';

export interface ContratoExperienciaData {
  funcionario: {
    nome: string;
    cpf: string;
    rg: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    telefone: string;
    email: string;
  };
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  contrato: {
    cargo: string;
    salario: string;
    periodo: number; // 45, 60 ou 90 dias
    dataInicio: string;
    dataFim: string;
    horarioTrabalho: string;
    localTrabalho: string;
  };
  dataContrato: string;
  localContrato: string;
}

export const contratoExperienciaGenerator = {
  async generatePDF(data: ContratoExperienciaData): Promise<void> {
    const doc = new jsPDF();
    
    // Configurações da página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE TRABALHO', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`A TÍTULO DE EXPERIÊNCIA - ${data.contrato.periodo} DIAS`, pageWidth / 2, 40, { align: 'center' });
    
    // Linha separadora
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // Conteúdo principal
    let yPosition = 70;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `
CONTRATANTE: ${data.empresa.razaoSocial}
CNPJ: ${data.empresa.cnpj}
ENDEREÇO: ${data.empresa.endereco}, ${data.empresa.cidade}/${data.empresa.estado}
CEP: ${data.empresa.cep}

CONTRATADO: ${data.funcionario.nome}
CPF: ${data.funcionario.cpf}
RG: ${data.funcionario.rg}
ENDEREÇO: ${data.funcionario.endereco}, ${data.funcionario.cidade}/${data.funcionario.estado}
CEP: ${data.funcionario.cep}
TELEFONE: ${data.funcionario.telefone}
E-MAIL: ${data.funcionario.email}

OBJETO DO CONTRATO:
A empresa ${data.empresa.razaoSocial} contrata ${data.funcionario.nome} para exercer 
as funções de ${data.contrato.cargo}, por um período de ${data.contrato.periodo} dias, 
com início em ${data.contrato.dataInicio} e término em ${data.contrato.dataFim}.

CONDIÇÕES DE TRABALHO:
- Salário: R$ ${data.contrato.salario}
- Horário de trabalho: ${data.contrato.horarioTrabalho}
- Local de trabalho: ${data.contrato.localTrabalho}

OBRIGAÇÕES DO CONTRATADO:
- Cumprir rigorosamente o horário de trabalho estabelecido;
- Executar com zelo e dedicação as tarefas atribuídas;
- Manter sigilo sobre informações confidenciais da empresa;
- Respeitar as normas internas e regulamentos da empresa;
- Apresentar atestado médico quando necessário.

OBRIGAÇÕES DA CONTRATANTE:
- Pagar pontualmente o salário acordado;
- Fornecer condições adequadas de trabalho;
- Respeitar os direitos trabalhistas do contratado;
- Orientar o contratado sobre suas funções.

DISPOSIÇÕES GERAIS:
Este contrato tem por finalidade exclusiva a avaliação do desempenho do contratado 
para possível contratação definitiva. Ao final do período de experiência, 
a empresa poderá optar pela contratação definitiva ou pelo término do contrato.

Data: ${data.dataContrato}
Local: ${data.localContrato}

_________________________________        _________________________________
${data.empresa.razaoSocial}              ${data.funcionario.nome}
CNPJ: ${data.empresa.cnpj}              CPF: ${data.funcionario.cpf}
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
    doc.save(`contrato-experiencia-${data.contrato.periodo}dias-${data.funcionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }
};
