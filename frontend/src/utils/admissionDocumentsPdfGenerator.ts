import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface EmployeeAdmissionData {
  id?: string;
  name: string;
  cpf?: string;
  rg?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  carteiraIdentidadeDataEmissao?: string;
  birthDate?: string;
  maritalStatus?: string;
  nationality?: string;
  sexo?: string;
  racaCor?: string;
  nomePai?: string;
  nomeMae?: string;
  registrationNumber?: string;
  matriculaEsocial?: string;
  hireDate?: string;
  salario?: number | string;
  salarioPorExtenso?: string;
  horarioTrabalho?: string;
  cargo?: string;
  cbo?: string;
  
  // Endereço Empregado
  enderecoRua?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoEstado?: string;
  enderecoCep?: string;
  address?: string;

  // Documentos Empregado
  ctps?: string;
  ctpsSeries?: string;
  ctpsState?: string;
  ctpsIssueDate?: string;
  pis?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpirationDate?: string;
  
  // Empresa
  empresaNome?: string;
  empresaCnpj?: string;
  empresaEndereco?: string;
  empresaCidade?: string;
  empresaEstado?: string;

  // Cônjuge
  spouseName?: string;
  spouseCpf?: string;

  // Dependentes
  dependents?: Array<{
    name: string;
    relationship?: string;
    birthDate?: string;
    cpf?: string;
    rg?: string;
  }>;
}

// Helpers de formatação
const formatCPF = (val?: string) => {
  if (!val) return '___.___.___-__';
  const digits = val.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return val;
};

const formatCNPJ = (val?: string) => {
  if (!val) return '__.___.___/____-__';
  const digits = val.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return val;
};

const formatDateBR = (val?: string) => {
  if (!val) return '__/__/____';
  if (val.includes('/')) return val;
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('pt-BR');
};

const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
};

/**
 * 1. SOLICITAÇÃO DE VALE - TRANSPORTE
 */
export const buildSolicitacaoValeTransporte = (doc: jsPDF, data: EmployeeAdmissionData, startY = 10): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Moldura externa
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 270);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SOLICITAÇÃO DE VALE - TRANSPORTE', pageWidth / 2, startY + 8, { align: 'center' });

  // Linha horizontal
  doc.line(margin, startY + 12, margin + contentWidth, startY + 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let y = startY + 17;

  // Empregado
  doc.setFont('helvetica', 'bold');
  doc.text(`Nome do Empregado: `, margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.name || ''}`, margin + 38, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº Reg.: `, margin + 140, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.registrationNumber || data.matriculaEsocial || ''}`, margin + 155, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`CTPS Nº: `, margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.ctps || ''} ${data.ctpsSeries || ''} / ${data.ctpsState || 'MG'}`, margin + 20, y);

  y += 5;
  doc.line(margin, y, margin + contentWidth, y);

  // Empresa
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`À`, margin + 3, y);
  y += 5;
  doc.text(`Empresa: `, margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaNome || 'VIACAO SAO SILVESTRE LTDA'}`, margin + 22, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Endereço: `, margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaEndereco || 'Rua DOS ESPORTES, 45'}`, margin + 22, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cidade: `, margin + 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaCidade || 'Moeda'}`, margin + 125, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`UF: `, margin + 160, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaEstado || 'MG'}`, margin + 168, y);

  y += 5;
  doc.line(margin, y, margin + contentWidth, y);

  // Opção Checkbox
  y += 7;
  doc.rect(margin + 5, y - 4, 4, 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Opto pela utilização do Vale - Transporte', margin + 12, y);

  doc.rect(margin + 100, y - 4, 4, 4);
  doc.text('Não Opto pela utilização do Vale - Transporte', margin + 107, y);

  y += 7;
  doc.line(margin, y, margin + contentWidth, y);

  // Termos Legais
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const legalText = `Nos termos do artigo 7º do Decreto Nº 95.247 de 17 de novembro de 1987, solicito receber Vale-Transporte e comprometo-me:
a) a utilizá-lo exclusivamente para meu efetivo deslocamento residência-trabalho e vice-versa;
b) a renovar anualmente ou sempre que ocorrer alteração no meu endereço residential ou dos serviços e meios de transporte mais adequados ao meu deslocamento residência/trabalho e vice-versa;
c) autorizo a descontar até 6% (seis por cento) do meu salário básico mensal para concorrer ao custeio do Vale - Transporte (conforme artigo 9º do Decreto Nº 95.247/87);
d) declaro estar ciente de que a declaração falsa ou uso indevido do Vale - Transporte constituem falta grave (conforme o § 3º do artigo 7º do Decreto Nº 95.247/87).`;

  const lines = doc.splitTextToSize(legalText, contentWidth - 6);
  doc.text(lines, margin + 3, y);
  y += lines.length * 3.8 + 2;

  doc.line(margin, y, margin + contentWidth, y);

  // Residência Atual
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Minha Residência Atual:', margin + 3, y);
  y += 6;
  doc.text('Rua/AV: ', margin + 3, y);
  doc.setFont('helvetica', 'normal');
  const rua = data.enderecoRua || data.address || '';
  const num = data.enderecoNumero || '';
  doc.text(`${rua}`, margin + 18, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Nº: ', margin + 150, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${num}`, margin + 158, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Bairro: ', margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.enderecoBairro || ''}`, margin + 16, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Cidade: ', margin + 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.enderecoCidade || ''}`, margin + 95, y);
  doc.setFont('helvetica', 'bold');
  doc.text('UF: ', margin + 150, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.enderecoEstado || 'MG'}`, margin + 158, y);

  y += 5;
  doc.line(margin, y, margin + contentWidth, y);

  // Tabela Meio de Transporte
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MEIO DE TRANSPORTE', pageWidth / 2, y, { align: 'center' });
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin + 2, right: margin + 2 },
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    head: [['TIPO', 'NOME E Nº DA LINHA', 'EMPRESA TRANSPORTADORA', 'TARIFA R$']],
    body: [
      ['RESIDÊNCIA - TRABALHO (1)', '', '', ''],
      ['RESIDÊNCIA - TRABALHO (2)', '', '', ''],
      ['TRABALHO - RESIDÊNCIA (1)', '', '', ''],
      ['TRABALHO - RESIDÊNCIA (2)', '', '', ''],
    ]
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  // À Rogo / Assinaturas
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('À ROGO', margin + 3, y);

  // Tabela/Campos para assinaturas à rogo e impressão digital
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('1- _______________________________________________', margin + 3, y);
  doc.text(`${data.empresaCidade || 'Moeda'}, ${getTodayFormatted()}`, margin + 105, y);

  y += 10;
  doc.text('Assinatura do Empregado:', margin + 3, y);
  doc.line(margin + 40, y, margin + 120, y);

  // Quadrado de Impressão Digital
  doc.rect(margin + 140, y - 10, 30, 30);
  doc.setFontSize(7);
  doc.text('Impressão Digital', margin + 142, y + 23);

  return startY + 270;
};

/**
 * 2. Declaração De Encargos De Família Para Fins De Imposto De Renda
 */
export const buildDeclaracaoEncargosIR = (doc: jsPDF, data: EmployeeAdmissionData, startY = 10): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Moldura externa
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 270);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Declaração De Encargos De Família Para Fins De Imposto De Renda', pageWidth / 2, startY + 8, { align: 'center' });
  doc.line(margin, startY + 12, margin + contentWidth, startY + 12);

  let y = startY + 17;
  // Box Dados da Empresa
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFontSize(9);
  doc.text('Dados da Empresa', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Empresa: ${data.empresaNome || 'VIACAO SAO SILVESTRE LTDA'}`, margin + 5, y);
  y += 5;
  doc.text(`Endereço: ${data.empresaEndereco || 'Rua DOS ESPORTES, 45 - CENTRO'}`, margin + 5, y);
  y += 5;
  doc.text(`CNPJ: ${formatCNPJ(data.empresaCnpj || '71.055.644/0001-25')}`, margin + 5, y);
  y += 5;

  doc.line(margin, y, margin + contentWidth, y);

  // Box Dados do Empregado
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Empregado', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Contrato do Empregado: ${data.name}`, margin + 5, y);
  y += 5;
  doc.text(`CPF: ${formatCPF(data.cpf)}`, margin + 5, y);
  y += 5;
  doc.text(`CTPS: ${data.ctps || ''} ${data.ctpsSeries || ''} ${data.ctpsState || 'MG'}`, margin + 5, y);
  y += 5;
  doc.text(`Estado Civil: ${data.maritalStatus === 'MARRIED' ? 'Casado(a)' : 'Solteiro(a)'}`, margin + 5, y);
  y += 5;
  doc.text(`Endereço: ${data.enderecoRua || data.address || ''}, ${data.enderecoNumero || ''}`, margin + 5, y);
  y += 5;
  doc.text(`Cidade: ${data.enderecoCidade || ''} - ${data.enderecoEstado || 'MG'}`, margin + 5, y);
  y += 7;

  doc.line(margin, y, margin + contentWidth, y);

  // Declaracao legal
  y += 6;
  doc.setFontSize(8.5);
  const stmt = 'Em obediência à legislação do Imposto de Renda, declaro pela presente que tenho como encargo de família, as pessoas abaixo relacionadas:';
  doc.text(stmt, margin + 5, y);
  y += 6;

  // Tabela de dependentes
  const depsBody = (data.dependents || []).map(dep => [
    dep.name,
    '03 - Filho(a) ou enteado(a) até 21',
    formatDateBR(dep.birthDate),
    formatCPF(dep.cpf)
  ]);

  if (depsBody.length === 0) {
    depsBody.push(['Nenhum dependente informado', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin + 2, right: margin + 2 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
    head: [['Nome', 'Código eSocial', 'Data de Nascimento', 'CPF']],
    body: depsBody
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 10;

  const legalNote = 'Declaro sob as penas da lei, que as informações aqui prestadas são verdadeiras e de minha inteira responsabilidade, não cabendo a V.Sa.(s) (fonte pagadora) qualquer responsabilidade perante a fiscalização.';
  const noteLines = doc.splitTextToSize(legalNote, contentWidth - 10);
  doc.text(noteLines, margin + 5, y);
  y += noteLines.length * 4 + 15;

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaCidade || 'Moeda'}, ${getTodayFormatted()}`, margin + 100, y);
  y += 20;

  // Assinaturas
  doc.line(margin + 30, y, margin + 150, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.name}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${formatCPF(data.cpf)}`, pageWidth / 2, y, { align: 'center' });

  y += 18;
  doc.line(margin + 30, y, margin + 150, y);
  y += 5;
  doc.text('Ciente do Cônjuge (*)', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(7.5);
  doc.text('* o ciente do cônjuge é obrigatório no caso de dependentes em comum - IN RFB 1.500/14 artigo 90, VI.', pageWidth / 2, y, { align: 'center' });

  return startY + 270;
};

/**
 * 3. Ficha de Salário-Família
 */
export const buildFichaSalarioFamilia = (doc: jsPDF, data: EmployeeAdmissionData, startY = 10): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Moldura externa
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 270);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Ficha de Salário-Família', pageWidth / 2, startY + 8, { align: 'center' });
  doc.line(margin, startY + 12, margin + contentWidth, startY + 12);

  let y = startY + 17;
  // Empresa
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFontSize(9);
  doc.text('Empresa', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.empresaNome || 'VIACAO SAO SILVESTRE LTDA'}`, margin + 5, y);
  y += 5;
  doc.text(`${data.empresaEndereco || 'Rua DOS ESPORTES, 45 - CENTRO'}`, margin + 5, y);
  y += 5;
  doc.text(`CNPJ: ${formatCNPJ(data.empresaCnpj || '71.055.644/0001-25')}`, margin + 5, y);
  y += 5;

  doc.line(margin, y, margin + contentWidth, y);

  // Empregado
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Empregado', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Contrato: ${data.name}`, margin + 5, y);
  y += 5;
  doc.text(`CTPS: ${data.ctps || ''} - ${data.ctpsSeries || ''} ${data.ctpsState || 'MG'}`, margin + 5, y);
  y += 5;
  doc.text(`Admissão: ${formatDateBR(data.hireDate)}`, margin + 5, y);
  y += 5;

  doc.line(margin, y, margin + contentWidth, y);

  // Dependentes
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Dependentes', margin + 3, y);
  y += 6;

  const deps = data.dependents || [];
  if (deps.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhum dependente cadastrado.', margin + 5, y);
    y += 10;
  } else {
    deps.forEach((dep, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`Nome do Dependente: ${dep.name}`, margin + 5, y);
      doc.text(`Nascimento: ${formatDateBR(dep.birthDate)}`, margin + 110, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Registro | Livro | Folha | Cartório | Entrega | Baixa | Visto | Num. Declar. Nascido Vivo', margin + 5, y);
      y += 4;
      doc.text(`_____ | _____ | _____ | ________ | ${formatDateBR(data.hireDate)} | __/__/____ | _____ | ___________`, margin + 5, y);
      y += 8;
    });
  }

  y = Math.max(y + 20, startY + 220);

  doc.setFontSize(9);
  doc.text(`${data.empresaCidade || 'Moeda'}, ${getTodayFormatted()}`, margin + 100, y);
  y += 20;

  doc.line(margin + 30, y, margin + 150, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.name}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${formatCPF(data.cpf)}`, pageWidth / 2, y, { align: 'center' });

  return startY + 270;
};

/**
 * 4. Termo de Responsabilidade (Concessão de Salário Família - Portaria nº MPAS-3.040/1982)
 */
export const buildTermoResponsabilidadeSalarioFamilia = (doc: jsPDF, data: EmployeeAdmissionData, startY = 10): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Moldura externa
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 270);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Termo de Responsabilidade', pageWidth / 2, startY + 8, { align: 'center' });
  doc.setFontSize(9);
  doc.text('(Concessão de Salário Família - Portaria nº MPAS-3.040/1982)', pageWidth / 2, startY + 13, { align: 'center' });
  doc.line(margin, startY + 16, margin + contentWidth, startY + 16);

  let y = startY + 21;

  // Box Dados da Empresa
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFontSize(9);
  doc.text('Dados da Empresa', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Empresa: ${data.empresaNome || 'VIACAO SAO SILVESTRE LTDA'}`, margin + 5, y);
  y += 5;
  doc.text(`Endereço: ${data.empresaEndereco || 'Rua DOS ESPORTES, 45'}`, margin + 5, y);
  y += 5;
  doc.text(`Cidade/UF: ${data.empresaCidade || 'Moeda'} - ${data.empresaEstado || 'MG'} - CEP 35.470-000`, margin + 5, y);
  y += 5;
  doc.text(`CNPJ: ${formatCNPJ(data.empresaCnpj || '71.055.644/0001-25')}`, margin + 5, y);
  y += 5;

  doc.line(margin, y, margin + contentWidth, y);

  // Box Dados do Segurado
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Segurado', margin + 3, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Segurado: ${data.name}`, margin + 5, y);
  y += 5;
  doc.text(`R.G.: ${data.rg || ''} - ${data.carteiraIdentidadeOrgaoEmissor || 'PC'} - ${data.carteiraIdentidadeDataEmissao || ''}`, margin + 5, y);
  y += 5;
  doc.text(`CTPS: ${data.ctps || ''} ${data.ctpsSeries || ''} ${data.ctpsState || 'MG'}`, margin + 5, y);
  y += 5;

  doc.line(margin, y, margin + contentWidth, y);

  // Tabela Filhos
  y += 5;
  const depsBody = (data.dependents || []).map(dep => [
    formatDateBR(dep.birthDate),
    dep.name
  ]);

  if (depsBody.length === 0) {
    depsBody.push(['- ', 'Nenhum filho cadastrado']);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin + 2, right: margin + 2 },
    styles: { fontSize: 8.5, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
    head: [['Data de nascimento', 'Nome do filho']],
    body: depsBody
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const text1 = 'Pelo presente TERMO DE RESPONSABILIDADE, declaro estar ciente de que deverei comunicar de imediato a ocorrência dos seguintes fatos, que determinam a perda do direito ao salário família:';
  const lines1 = doc.splitTextToSize(text1, contentWidth - 10);
  doc.text(lines1, margin + 5, y);
  y += lines1.length * 4 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('ÓBITO DE FILHO', margin + 8, y); y += 4.5;
  doc.text('CESSAÇÃO INVALIDEZ DE FILHO INVÁLIDO', margin + 8, y); y += 4.5;
  doc.text('SENTENÇA JUDICIAL PARA PAGAMENTO A OUTREM', margin + 8, y); y += 7;

  doc.setFont('helvetica', 'normal');
  const text2 = 'Estou ciente, ainda, de que a falta de cumprimento do compromisso ora assumido, além de obrigar a devolução das importâncias recebidas indevidamente, sujeitar-me-á às penalidades previstas no art. 171 do código penal e à rescisão do contrato de trabalho, por justa causa, nos termos do art. 482 da CLT.';
  const lines2 = doc.splitTextToSize(text2, contentWidth - 10);
  doc.text(lines2, margin + 5, y);
  y += lines2.length * 4 + 15;

  doc.text(`${data.empresaCidade || 'Moeda'} - ${data.empresaEstado || 'MG'}, ${getTodayFormatted()}`, margin + 95, y);
  y += 20;

  doc.line(margin + 30, y, margin + 150, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.name}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${formatCPF(data.cpf)}`, pageWidth / 2, y, { align: 'center' });

  return startY + 270;
};

/**
 * 5. CONTRATO DE TRABALHO A TÍTULO DE EXPERIÊNCIA
 */
export const buildContratoExperiencia = (doc: jsPDF, data: EmployeeAdmissionData, startY = 10): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Page 1
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, 270);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONTRATO DE TRABALHO A TÍTULO DE EXPERIÊNCIA', pageWidth / 2, startY + 8, { align: 'center' });
  doc.line(margin, startY + 12, margin + contentWidth, startY + 12);

  let y = startY + 18;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const intro = `Por este instrumento particular, que entre si fazem a empresa ${data.empresaNome || 'VIACAO SAO SILVESTRE LTDA'} inscrita no CNPJ/CPF sob nº ${formatCNPJ(data.empresaCnpj || '71.055.644/0001-25')} com sede neste município de ${data.empresaCidade || 'Moeda'}, à ${data.empresaEndereco || 'Rua DOS ESPORTES, 45'}, bairro CENTRO, neste ato denominada "Empregadora", e o Sr.(a) ${data.name}, portador(a) da Carteira Profissional nº ${data.ctps || '______'}, série ${data.ctpsSeries || '____'} - ${data.ctpsState || 'MG'}, inscrito no CPF sob nº ${formatCPF(data.cpf)} e cadastrado no PIS-PASEP sob nº ${data.pis || '___________'}, doravante, chamado, simplesmente, "Empregado", firmam o presente contrato individual de trabalho, em caráter de experiência, conforme a letra "c", parágrafo 2º do Artigo 443 da Consolidação das Leis do Trabalho, mediante as seguintes condições:`;

  const introLines = doc.splitTextToSize(intro, contentWidth - 10);
  doc.text(introLines, margin + 5, y);
  y += introLines.length * 3.5 + 4;

  const salarioVal = typeof data.salario === 'number' ? data.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : (data.salario || '3.656,60');
  const cargoVal = data.cargo || 'Motorista de Onibus Rodoviario';

  const clauses = [
    `1) Empregado trabalhará para a empregadora, exercendo a função de ${cargoVal} na seção GERAL, percebendo o salário de R$ ${salarioVal} por mês, pagável de forma Mensal.`,
    `2) O horário a ser obedecido será o seguinte:\n${data.horarioTrabalho || 'segunda-feira à sexta-feira das 08:00 às 11:48 e das 13:00 às 18:00, sábado compensado e domingo DSR.'}`,
    `3) Este contrato tem início a partir de ${formatDateBR(data.hireDate)}, vencendo-se em 90 dias, podendo ser prorrogado, obedecendo o disposto no Parágrafo Único do Artigo 445 da CLT.`,
    `4) O Empregado se compromete a trabalhar em regime de compensação e de prorrogação de horas, inclusive em período noturno, sempre que as necessidades assim exigirem, observadas as formalidades legais.`,
    `5) Obriga-se o Empregado, além de executar com dedicação e legalidade o seu serviço, a cumprir o Regulamento Interno da Empregadora, as instruções de sua administração e as ordens de seus chefes e superiores hierárquicos, relativos às peculiaridades dos serviços que lhe forem confiados.`,
    `6) Aplicam-se a este contrato todas as normas em vigor, relativas aos contratos a prazo determinado, devendo sua rescisão antecipada, por justa causa, obedecer ao disposto nos artigos 482 e 483 da CLT, conforme o caso.`,
    `7) Vencido o período experimental e continuando o empregado a prestar serviços à Empregadora, por tempo indeterminado, ficam prorrogadas todas as cláusulas aqui estabelecidas, enquanto não se rescindir o contrato de trabalho.`,
    `8) O presente contrato poderá ser rescindido antes de seu término, por qualquer das partes, nos termos do Art. 479 e 480 da CLT.`,
    `9) Atestados médicos deverão ser encaminhados ao setor responsável em até 48 horas.`,
    `10) A Empregadora, ciente da necessidade de proteger direitos fundamentais de liberdade e de privacidade e o livre desenvolvimento da personalidade da pessoa natural, assume o compromisso de implementar as disposições previstas na Lei Federal nº 13.709/2018 ("Lei Geral de Proteção de Dados" ou "LGPD").`
  ];

  clauses.forEach(c => {
    const lines = doc.splitTextToSize(c, contentWidth - 10);
    doc.text(lines, margin + 5, y);
    y += lines.length * 3.5 + 2.5;
  });

  // Page 2 - Prorrogação & Assinaturas
  doc.addPage();
  const page2StartY = 10;
  doc.setLineWidth(0.5);
  doc.rect(margin, page2StartY, contentWidth, 270);

  let y2 = page2StartY + 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const lgpdMore = `§1º. Para fins do presente instrumento, os termos "Controlador", "Dado Pessoal", "Operador", "Titular" e "Tratamento" deverão ser lidos e interpretados de acordo com a aludida Lei Federal nº 13.709/2018.
§2º. A Empregadora declara que cumpre toda a legislação aplicável sobre privacidade e proteção de dados, inclusive a LGPD, assegurando que todas suas instruções decorrentes do Contrato são lícitas.
§3º. Os Dados Pessoais recebidos serão tratados com a devida aplicação de medidas técnicas e administrativas aptas a protegê-los de acessos não autorizados.
§4º. Fica o Empregado desde já ciente de que a Empregadora poderá envolver terceiros nas atividades de Tratamento de Dados Pessoais decorrentes deste Contrato.

E por estarem de pleno acordo, assinam ambas as partes, em duas vias de igual teor, na presença de duas testemunhas.`;

  const lgpdLines = doc.splitTextToSize(lgpdMore, contentWidth - 10);
  doc.text(lgpdLines, margin + 5, y2);
  y2 += lgpdLines.length * 3.5 + 15;

  doc.text(`${data.empresaCidade || 'Moeda'}, ${getTodayFormatted()}.`, margin + 100, y2);
  y2 += 20;

  // Linhas de assinatura
  doc.line(margin + 10, y2, margin + 80, y2);
  doc.line(margin + 100, y2, margin + 170, y2);
  y2 += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Empresa', margin + 45, y2, { align: 'center' });
  doc.text('Empregado', margin + 135, y2, { align: 'center' });

  y2 += 25;

  // Box Termo de Prorrogação
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y2, contentWidth, 8, 'F');
  doc.setFontSize(10);
  doc.text('TERMO DE PRORROGAÇÃO', pageWidth / 2, y2 + 6, { align: 'center' });
  y2 += 14;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const prorrogText = `Por mútuo acordo das partes, fica o presente contrato de experiência, que deveria vencer nesta data, prorrogado até ___ / ___ / ____.`;
  doc.text(prorrogText, margin + 5, y2);
  y2 += 12;

  doc.text(`${data.empresaCidade || 'Moeda'}, ___ / ___ / ____.`, margin + 100, y2);
  y2 += 25;

  doc.line(margin + 10, y2, margin + 80, y2);
  doc.line(margin + 100, y2, margin + 170, y2);
  y2 += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Empresa', margin + 45, y2, { align: 'center' });
  doc.text('Empregado', margin + 135, y2, { align: 'center' });
  y2 += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${formatCNPJ(data.empresaCnpj || '')}`, margin + 45, y2, { align: 'center' });
  doc.text(`CPF: ${formatCPF(data.cpf)}`, margin + 135, y2, { align: 'center' });

  return page2StartY + 270;
};

/**
 * 6. PACOTE ADMISSIONAL COMPLETO (PDF único contendo todos os 5 documentos admissionais!)
 */
export const generatePacoteAdmissionalCompleto = (data: EmployeeAdmissionData): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Doc 1: Solicitação de Vale-Transporte
  buildSolicitacaoValeTransporte(doc, data);

  // Doc 2: Declaração de Encargos IR
  doc.addPage();
  buildDeclaracaoEncargosIR(doc, data);

  // Doc 3: Ficha de Salário-Família
  doc.addPage();
  buildFichaSalarioFamilia(doc, data);

  // Doc 4: Termo de Responsabilidade
  doc.addPage();
  buildTermoResponsabilidadeSalarioFamilia(doc, data);

  // Doc 5: Contrato de Experiência (Gera 2 páginas)
  doc.addPage();
  buildContratoExperiencia(doc, data);

  return doc;
};

export const generateSingleAdmissionDocumentPdf = (docType: string, data: EmployeeAdmissionData): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');

  switch (docType) {
    case 'vt':
      buildSolicitacaoValeTransporte(doc, data);
      break;
    case 'ir':
      buildDeclaracaoEncargosIR(doc, data);
      break;
    case 'salario-familia':
      buildFichaSalarioFamilia(doc, data);
      break;
    case 'termo-responsabilidade':
      buildTermoResponsabilidadeSalarioFamilia(doc, data);
      break;
    case 'contrato-experiencia':
      buildContratoExperiencia(doc, data);
      break;
    case 'pacote-completo':
    default:
      return generatePacoteAdmissionalCompleto(data);
  }

  return doc;
};
