import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TermoResponsabilidadeData } from './termoResponsabilidadeGenerator';
import { DemissaoData } from './demissaoGenerator';
import { 
  CartaApresentacaoData, 
  TermoOpcaoVTData, 
  ValidacaoNR06Data, 
  TermoLGPDData, 
  FormularioAberturaVagaData 
} from './outrosDocumentosGenerator';
import { DeclaracaoData } from './declaracaoGenerator';
import { ContratoExperienciaData } from './contratoExperienciaGenerator';

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

/**
 * Gera PDF e retorna como blob para visualização
 */
export const generatePDFBlob = {
  async termoResponsabilidadeCartaoOtimo(data: TermoResponsabilidadeData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('CARTÃO ÓTIMO VALE-TRANSPORTE', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:\n\nTIPO: ${data.equipamento.tipo}\nMARCA: ${data.equipamento.marca}\nMODELO: ${data.equipamento.modelo}\nNÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}\nVALOR: R$ ${data.equipamento.valor}\n\nCOMPROMISSO:\nDeclaro-me responsável pelo uso adequado e conservação do cartão acima descrito, comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo em perfeitas condições quando solicitado pela empresa.\n\nEm caso de perda, dano ou mau uso do cartão, assumo total responsabilidade pelo pagamento do valor correspondente ou pela reposição do mesmo.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataEntrega}\nLocal: ${data.localEntrega}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async termoResponsabilidadeCartaoBhBus(data: TermoResponsabilidadeData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('CARTÃO BH BUS VALE-TRANSPORTE', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:\n\nTIPO: ${data.equipamento.tipo}\nMARCA: ${data.equipamento.marca}\nMODELO: ${data.equipamento.modelo}\nNÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}\nVALOR: R$ ${data.equipamento.valor}\n\nCOMPROMISSO:\nDeclaro-me responsável pelo uso adequado e conservação do cartão acima descrito, comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo em perfeitas condições quando solicitado pela empresa.\n\nEm caso de perda, dano ou mau uso do cartão, assumo total responsabilidade pelo pagamento do valor correspondente ou pela reposição do mesmo.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataEntrega}\nLocal: ${data.localEntrega}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async termoResponsabilidadeCartaoBetim(data: TermoResponsabilidadeData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('CARTÃO BETIM CARD VALE-TRANSPORTE', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:\n\nTIPO: ${data.equipamento.tipo}\nMARCA: ${data.equipamento.marca}\nMODELO: ${data.equipamento.modelo}\nNÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}\nVALOR: R$ ${data.equipamento.valor}\n\nCOMPROMISSO:\nDeclaro-me responsável pelo uso adequado e conservação do cartão acima descrito, comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo em perfeitas condições quando solicitado pela empresa.\n\nEm caso de perda, dano ou mau uso do cartão, assumo total responsabilidade pelo pagamento do valor correspondente ou pela reposição do mesmo.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataEntrega}\nLocal: ${data.localEntrega}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async termoResponsabilidadeCelular(data: TermoResponsabilidadeData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('APARELHO CELULAR', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, declaro ter recebido em ${data.dataEntrega}, no local ${data.localEntrega}, o seguinte equipamento:\n\nTIPO: ${data.equipamento.tipo}\nMARCA: ${data.equipamento.marca}\nMODELO: ${data.equipamento.modelo}\nNÚMERO DE SÉRIE: ${data.equipamento.numeroSerie}\nVALOR: R$ ${data.equipamento.valor}\n\nCOMPROMISSO:\nDeclaro-me responsável pelo uso adequado e conservação do aparelho celular acima descrito, comprometendo-me a utilizá-lo exclusivamente para fins profissionais e a devolvê-lo em perfeitas condições quando solicitado pela empresa.\n\nEm caso de perda, dano ou mau uso do aparelho, assumo total responsabilidade pelo pagamento do valor correspondente ou pela reposição do mesmo.\n\nO aparelho deve ser utilizado exclusivamente para comunicação profissional e não deve ser utilizado para fins pessoais durante o horário de trabalho.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataEntrega}\nLocal: ${data.localEntrega}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async contratoExperiencia(data: ContratoExperienciaData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE TRABALHO', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`A TÍTULO DE EXPERIÊNCIA - ${data.contrato.periodo} DIAS`, pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `CONTRATANTE: ${data.empresa.razaoSocial}\nCNPJ: ${data.empresa.cnpj}\nENDEREÇO: ${data.empresa.endereco}, ${data.empresa.cidade}/${data.empresa.estado}\nCEP: ${data.empresa.cep}\n\nCONTRATADO: ${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}\nENDEREÇO: ${data.funcionario.endereco}, ${data.funcionario.cidade}/${data.funcionario.estado}\nCEP: ${data.funcionario.cep}\nTELEFONE: ${data.funcionario.telefone}\nE-MAIL: ${data.funcionario.email}\n\nOBJETO DO CONTRATO:\nA empresa ${data.empresa.razaoSocial} contrata ${data.funcionario.nome} para exercer as funções de ${data.contrato.cargo}, por um período de ${data.contrato.periodo} dias, com início em ${data.contrato.dataInicio} e término em ${data.contrato.dataFim}.\n\nCONDIÇÕES DE TRABALHO:\n- Salário: R$ ${data.contrato.salario}\n- Horário de trabalho: ${data.contrato.horarioTrabalho}\n- Local de trabalho: ${data.contrato.localTrabalho}\n\nOBRIGAÇÕES DO CONTRATADO:\n- Cumprir rigorosamente o horário de trabalho estabelecido;\n- Executar com zelo e dedicação as tarefas atribuídas;\n- Manter sigilo sobre informações confidenciais da empresa;\n- Respeitar as normas internas e regulamentos da empresa;\n- Apresentar atestado médico quando necessário.\n\nOBRIGAÇÕES DA CONTRATANTE:\n- Pagar pontualmente o salário acordado;\n- Fornecer condições adequadas de trabalho;\n- Respeitar os direitos trabalhistas do contratado;\n- Orientar o contratado sobre suas funções.\n\nDISPOSIÇÕES GERAIS:\nEste contrato tem por finalidade exclusiva a avaliação do desempenho do contratado para possível contratação definitiva. Ao final do período de experiência, a empresa poderá optar pela contratação definitiva ou pelo término do contrato.\n\nData: ${data.dataContrato}\nLocal: ${data.localContrato}\n\n_________________________________        _________________________________\n${data.empresa.razaoSocial}              ${data.funcionario.nome}\nCNPJ: ${data.empresa.cnpj}              CPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async declaracaoCipaTranspes(data: DeclaracaoData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('PARA DESIGNATION DA CIPA - TRANSPES', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, venho por meio desta declarar que:\n\n${data.declaracao.conteudo}\n\nEsta declaração tem por finalidade: ${data.declaracao.finalidade}\n\nDeclaro ainda que as informações prestadas são verdadeiras e estou ciente das responsabilidades legais inerentes a esta declaração.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataDeclaracao}\nLocal: ${data.localDeclaracao}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}`;
    
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
    
    return doc.output('blob');
  },

  async declaracaoFinsEscolares(data: DeclaracaoData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('FINS ESCOLARES', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, venho por meio desta declarar que:\n\n${data.declaracao.conteudo}\n\nEsta declaração tem por finalidade: ${data.declaracao.finalidade}\n\nDeclaro ainda que as informações prestadas são verdadeiras e estou ciente das responsabilidades legais inerentes a esta declaração.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.dataDeclaracao}\nLocal: ${data.localDeclaracao}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}`;
    
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
    
    return doc.output('blob');
  },

  async demissaoJustaCausa(data: DemissaoData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE DEMISSÃO', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('POR JUSTA CAUSA', pageWidth / 2, 40, { align: 'center' });
    doc.line(margin, 50, pageWidth - margin, 50);
    
    let yPosition = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const content = `A empresa ${data.funcionario.empresa}, inscrita no CNPJ sob o nº [CNPJ], localizada em [ENDEREÇO], vem por meio deste comunicar a DISPENSA POR JUSTA CAUSA do(a) funcionário(a):\n\nNOME: ${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}\nCARGO: ${data.funcionario.cargo}\nDATA DE ADMISSÃO: ${data.funcionario.dataAdmissao}\n\nMOTIVO DA DISPENSA:\n${data.demissao.motivo}\n\nA dispensa por justa causa ocorre em virtude de ato faltoso grave praticado pelo funcionário, conforme previsto na CLT, art. 482, que autoriza a rescisão imediata do contrato de trabalho sem direito a aviso prévio, 13º salário proporcional, férias proporcionais e FGTS.\n\nDATA DA DISPENSA: ${data.demissao.dataDemissao}\nÚLTIMO DIA DE TRABALHO: ${data.demissao.dataUltimoDia}\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nEste termo foi elaborado em conformidade com a legislação trabalhista vigente.\n\nData: ${data.demissao.dataDemissao}\nLocal: [LOCAL]\n\n_________________________________\n${data.funcionario.empresa}\nRepresentante Legal\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async cartaApresentacao(data: CartaApresentacaoData): Promise<Blob> {
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
    const conteudo = data.conteudo || `Venho por meio desta apresentar ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf}, que atualmente ocupa o cargo de ${data.funcionario.cargo} na empresa ${data.funcionario.empresa}.`;
    
    const content = `${destinatario},\n\n${conteudo}\n\nAtenciosamente,\n\n${data.funcionario.empresa}\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\n\nData: ${data.data}`;
    
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
    
    return doc.output('blob');
  },

  async termoOpcaoVT(data: TermoOpcaoVTData): Promise<Blob> {
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
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, venho por meio deste ${opcaoTexto.toLowerCase()} o benefício de Vale-Transporte oferecido pela empresa${valorTexto}.\n\n${data.opcao === 'ACEITA' ? 'Estou ciente de que o valor do Vale-Transporte será descontado do meu salário conforme legislação vigente.' : 'Estou ciente de que, ao recusar o Vale-Transporte, não terei direito a este benefício.'}\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.data}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}`;
    
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
    
    return doc.output('blob');
  },

  async validacaoNR06(data: ValidacaoNR06Data): Promise<Blob> {
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
    
    const content = `FUNCIONÁRIO:\nNome: ${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nCargo: ${data.funcionario.cargo}\nEmpresa: ${data.funcionario.empresa}\n\nEQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL VALIDADOS:\n\n${episList}\nEsta validação foi realizada em conformidade com a Norma Regulamentadora NR-06, que estabelece as diretrizes para o fornecimento e uso de Equipamentos de Proteção Individual (EPIs) no ambiente de trabalho.\n\nRESPONSÁVEL PELA VALIDAÇÃO: ${data.responsavel}\nDATA DA VALIDAÇÃO: ${data.dataValidacao}\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\n_________________________________\n${data.responsavel}\nResponsável pela Validação\n\n_________________________________\n${data.funcionario.nome}\nFuncionário\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async termoLGPD(data: TermoLGPDData): Promise<Blob> {
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
    
    const content = `Eu, ${data.funcionario.nome}, portador do CPF nº ${data.funcionario.cpf} e RG nº ${data.funcionario.rg}, funcionário(a) da empresa ${data.funcionario.empresa}, no cargo de ${data.funcionario.cargo}, venho por meio deste manifestar meu CONSENTIMENTO para o tratamento dos meus dados pessoais pela empresa, conforme disposto na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nCONSENTIMENTOS:\n\n${consentimentosList}\nEstou ciente de que:\n- Os dados serão utilizados exclusivamente para as finalidades descritas acima;\n- Tenho direito de revogar meu consentimento a qualquer momento;\n- Tenho direito de acesso, correção, exclusão e portabilidade dos meus dados;\n- Os dados serão mantidos em segurança e confidencialidade.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.data}\n\n_________________________________\n${data.funcionario.nome}\nCPF: ${data.funcionario.cpf}\nRG: ${data.funcionario.rg}`;
    
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
    
    return doc.output('blob');
  },

  async termoProtecaoDadosLGPD(data: TermoLGPDData): Promise<Blob> {
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
    
    const content = `A empresa ${data.funcionario.empresa} compromete-se a proteger os dados pessoais do(a) funcionário(a) ${data.funcionario.nome}, CPF nº ${data.funcionario.cpf}, RG nº ${data.funcionario.rg}, conforme estabelecido na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nCOMPROMISSOS DA EMPRESA:\n\n${consentimentosList}\nA empresa garante que:\n- Os dados serão tratados com segurança e confidencialidade;\n- Os dados serão utilizados exclusivamente para as finalidades descritas;\n- O funcionário tem direito de acesso, correção e exclusão dos seus dados;\n- Os dados serão mantidos apenas pelo tempo necessário para cumprir as finalidades;\n- Em caso de vazamento, a empresa comunicará imediatamente ao funcionário e à ANPD.\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData: ${data.data}\n\n_________________________________\n${data.funcionario.empresa}\nRepresentante Legal\n\n_________________________________\n${data.funcionario.nome}\nFuncionário\nCPF: ${data.funcionario.cpf}`;
    
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
    
    return doc.output('blob');
  },

  async formularioAberturaVaga(data: FormularioAberturaVagaData): Promise<Blob> {
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
    
    const content = `DADOS DA VAGA:\n\nCargo: ${data.vaga.cargo}\nSetor: ${data.vaga.setor}\nTipo de Contratação: ${tipoVaga}\n${data.vaga.salario ? `Salário: R$ ${data.vaga.salario}` : ''}\n\nREQUISITOS:\n${data.vaga.requisitos}\n\nDESCRIÇÃO DA VAGA:\n${data.vaga.descricao}\n\nSOLICITANTE:\nNome: ${data.solicitante.nome}\nCargo: ${data.solicitante.cargo}\nDepartamento: ${data.solicitante.departamento}\n\n${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ''}\n\nData da Solicitação: ${data.data}\n\n_________________________________\n${data.solicitante.nome}\nSolicitante`;
    
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
    
    return doc.output('blob');
  },

  async ordemServico(data: OrdemServicoData): Promise<Blob> {
    const formatDateExtended = (dateString: string): string => {
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
    };

    const dataInicioFormatada = formatDateExtended(data.ordem.dataInicio);
    const dataFimFormatada = formatDateExtended(data.ordem.dataFim);

    // Determinar qual template usar baseado no modelo
    let htmlContent = '';
    let corPrincipal = '#1e3a8a';
    let logoIcon = 'SG';
    let logoText = 'Secure Guard';
    let titulo = 'ORDEM DE SERVIÇO';

    switch (data.ordem.modelo) {
      case 'CSN':
        corPrincipal = '#1e3a8a';
        logoIcon = 'CSN';
        logoText = 'Companhia Siderúrgica Nacional';
        titulo = 'ORDEM DE SERVIÇO - MODELO CSN';
        break;
      case 'ATERPA':
        corPrincipal = '#059669';
        logoIcon = 'AT';
        logoText = 'Agência de Transporte do Estado do Pará';
        titulo = 'ORDEM DE SERVIÇO - MODELO ATERPA';
        break;
      case 'TRANSPES':
        corPrincipal = '#dc2626';
        logoIcon = 'TP';
        logoText = 'Transportadora Pesada Ltda';
        titulo = 'ORDEM DE SERVIÇO - MODELO TRANSPES';
        break;
      case 'ASG_ATERPA':
        corPrincipal = '#059669';
        logoIcon = 'ASG-AT';
        logoText = 'ASG ATERPA';
        titulo = 'ORDEM DE SERVIÇO - MODELO ASG ATERPA';
        break;
      case 'ASG_TRANSPES':
        corPrincipal = '#dc2626';
        logoIcon = 'ASG-TP';
        logoText = 'ASG TRANSPES';
        titulo = 'ORDEM DE SERVIÇO - MODELO ASG TRANSPES';
        break;
      case 'RECEPCIONISTA':
        corPrincipal = '#7c3aed';
        logoIcon = 'RC';
        logoText = 'Ordem de Serviço Recepcionista';
        titulo = 'ORDEM DE SERVIÇO - RECEPCIONISTA';
        break;
      default:
        titulo = 'ORDEM DE SERVIÇO - MODELO PADRÃO';
    }

    htmlContent = `
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
          <div class="header">
            <div class="logo">
              <div class="logo-icon">${logoIcon}</div>
              <div class="logo-text">
                <div class="logo-main">${logoText}</div>
                ${data.cliente.name ? `<div class="logo-sub">${data.cliente.name}</div>` : ''}
              </div>
            </div>
            ${data.cliente.document ? `<div class="company-info">CNPJ: ${data.cliente.document}</div>` : ''}
            <div class="company-info">Empresa Prestadora: ${data.empresa.name}</div>
            ${data.empresa.document ? `<div class="company-info">CNPJ Prestadora: ${data.empresa.document}</div>` : ''}
          </div>

          <div class="title">${titulo}</div>

          <div class="content">
            <div class="paragraph">
              <strong>Número da Ordem:</strong> ${data.ordem.numero}
            </div>
            
            <div class="paragraph">
              <strong>Período de Execução:</strong> De ${dataInicioFormatada} até ${dataFimFormatada || 'Indefinido'}
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-title">DADOS DO FUNCIONÁRIO</div>
                <div class="info-item"><strong>Nome:</strong> ${data.funcionario.name}</div>
                <div class="info-item"><strong>CPF:</strong> ${data.funcionario.document}</div>
                <div class="info-item"><strong>Cargo:</strong> ${data.cargo.name}</div>
                <div class="info-item"><strong>Unidade:</strong> ${data.unidade.name} ${data.unidade.code ? `(${data.unidade.code})` : ''}</div>
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
              no período de ${dataInicioFormatada} até ${dataFimFormatada || 'indefinido'}.
            </div>

            ${data.ordem.observacoes ? `
            <div class="paragraph">
              <strong>Observações:</strong>
            </div>
            <div class="paragraph">
              ${data.ordem.observacoes}
            </div>
            ` : ''}
          </div>

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

          <div class="footer">
            <div>Documento gerado automaticamente pelo sistema</div>
            <div>Data de emissão: ${formatDateExtended(new Date().toISOString())}</div>
          </div>
        </div>
      </body>
      </html>
    `;

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

    return pdf.output('blob');
  }
};

