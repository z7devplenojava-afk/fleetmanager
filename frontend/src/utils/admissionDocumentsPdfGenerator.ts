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
  tituloEleitor?: string;
  tituloEleitorZona?: string;
  tituloEleitorSecao?: string;
  certificadoMilitar?: string;
  phone?: string;
  email?: string;
  grauInstrucao?: string;
  localNascimento?: string;
  
  // Empresa
  empresaNome?: string;
  empresaCnpj?: string;
  empresaEndereco?: string;
  empresaCidade?: string;
  empresaEstado?: string;
  companyLogo?: string | null;

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
export const formatCPF = (val?: string) => {
  if (!val) return '___.___.___-__';
  const digits = val.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return val;
};

export const formatCNPJ = (val?: string) => {
  if (!val) return '71.055.644/0006-30';
  const digits = val.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return val;
};

export const formatDateBR = (val?: string) => {
  if (!val) return '__/__/____';
  if (val.includes('/')) return val;
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('pt-BR');
};

export const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
};

// Cache de imagem para logomarca oficial
let cachedLogoImg: HTMLImageElement | null = null;

export const loadOfficialCompanyLogo = async (customUrl?: string | null): Promise<HTMLImageElement | null> => {
  if (cachedLogoImg) return cachedLogoImg;
  if (typeof window === 'undefined') return null;

  const candidateUrls = [
    customUrl,
    '/images/sao-silvestre-timbre-retrato.png',
    '/images/sao-silvestre-timbre.png',
    '/images/sao-silvestre-modelo-tabela.png',
    '/logo.png'
  ].filter(Boolean) as string[];

  for (const url of candidateUrls) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });
      if (img && img.width > 0) {
        cachedLogoImg = img;
        return img;
      }
    } catch (_) {}
  }
  return null;
};

// ============================================================================
// FUNÇÃO PADRÃO OFICIAL: CABEÇALHO IDÊNTICO À FICHA DE EPI (IMAGEM 2)
// ============================================================================
export const drawOfficialDocumentHeader = (
  doc: jsPDF,
  options: {
    title: string;
    normaBadge: string;
    docNumber: string;
    emissionDate?: string;
    companyName?: string;
    companyCnpj?: string;
    companyAddress?: string;
    logoImg?: HTMLImageElement | null;
    startY?: number;
  }
): number => {
  const startX = 10;
  const endX = 200;
  const curY = options.startY || 8;

  const compName = (options.companyName || 'VIAÇÃO SÃO SILVESTRE S.A.').toUpperCase();
  const compCnpj = options.companyCnpj || '71.055.644/0006-30';
  const compAddress = options.companyAddress || 'Garagem Central • Moeda / MG';

  let companyDetails = `CNPJ: ${formatCNPJ(compCnpj)}`;
  if (compAddress) {
    companyDetails += ` • ${compAddress}`;
  }

  let leftBottomY = curY;

  // LADO ESQUERDO: Logomarca + Razão Social + CNPJ e Endereço
  if (options.logoImg) {
    const maxW = 38;
    const maxH = 11;
    const ratio = Math.min(maxW / options.logoImg.width, maxH / options.logoImg.height);
    const renderW = options.logoImg.width * ratio;
    const renderH = options.logoImg.height * ratio;

    try {
      doc.addImage(options.logoImg, 'PNG', startX, curY, renderW, renderH);
    } catch (_) {}

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(34, 34, 34);
    doc.text(compName, startX, curY + renderH + 3.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(85, 85, 85);
    const splitDetails = doc.splitTextToSize(companyDetails, 105);
    doc.text(splitDetails, startX, curY + renderH + 6.5);
    leftBottomY = curY + renderH + 6.5 + (splitDetails.length - 1) * 2.8;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(34, 34, 34);
    doc.text(compName, startX, curY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(85, 85, 85);
    const splitDetails = doc.splitTextToSize(companyDetails, 105);
    doc.text(splitDetails, startX, curY + 7.8);
    leftBottomY = curY + 7.8 + (splitDetails.length - 1) * 2.8;
  }

  // LADO DIREITO: Título do Documento em vermelho, Badge Verde, Box com Número e Data de Emissão
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(211, 47, 47); // #d32f2f
  doc.text(options.title, endX, curY + 3.5, { align: 'right' });

  // Badge da Norma/Categoria (Verde #2e7d32 com cantos arredondados)
  const badgeW = Math.max(22, options.normaBadge.length * 2.1 + 4);
  const badgeH = 4;
  doc.setFillColor(46, 125, 50); // #2e7d32
  doc.roundedRect(endX - badgeW, curY + 5, badgeW, badgeH, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(options.normaBadge, endX - badgeW / 2, curY + 7.8, { align: 'center' });

  // Caixa Número Oficial do Documento (#fdf2f2 com borda #d32f2f)
  const numBoxW = Math.max(38, options.docNumber.length * 2.2 + 8);
  const numBoxH = 4.5;
  doc.setFillColor(253, 242, 242);
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(0.3);
  doc.roundedRect(endX - numBoxW, curY + 10.2, numBoxW, numBoxH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(211, 47, 47);
  doc.text(options.docNumber, endX - numBoxW / 2, curY + 13.5, { align: 'center' });

  // Data de Emissão
  const emissionStr = options.emissionDate || new Date().toLocaleDateString('pt-BR');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(102, 102, 102);
  doc.text(`Data de Emissão: ${emissionStr}`, endX, curY + 18, { align: 'right' });

  const rightBottomY = curY + 19;
  let finalY = Math.max(leftBottomY, rightBottomY) + 2;

  // Linha Divisória Vermelha (Horizontal)
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(0.6);
  doc.line(startX, finalY, endX, finalY);
  finalY += 3;

  return finalY;
};

// ============================================================================
// FUNÇÃO PADRÃO: TÍTULO DE SEÇÃO COM BARRA LATERAL VERMELHA
// ============================================================================
export const drawOfficialSectionHeader = (
  doc: jsPDF,
  title: string,
  yPos: number,
  startX = 10,
  contentWidth = 190,
  height = 4.6
): number => {
  doc.setFillColor(245, 245, 245);
  doc.rect(startX, yPos, contentWidth, height, 'F');
  doc.setFillColor(211, 47, 47);
  doc.rect(startX, yPos, 1.2, height, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(211, 47, 47);
  doc.text(`| ${title}`, startX + 3, yPos + 3.2);
  return yPos + height;
};

// ============================================================================
// FUNÇÃO PADRÃO: CAIXA DE IDENTIFICAÇÃO DO COLABORADOR E EMPRESA (IMAGEM 2)
// ============================================================================
export const drawOfficialEmployeeInfoBox = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  yPos: number,
  startX = 10,
  contentWidth = 190
): number => {
  const infoBoxH = 15;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 250);
  doc.rect(startX, yPos, contentWidth, infoBoxH, 'FD');

  const rCol1 = startX + 3;
  const rCol2 = startX + 96;

  // Linha 1: Colaborador e CPF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('COLABORADOR:', rCol1, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.name || 'NÃO INFORMADO'}`, rCol1 + 24, yPos + 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('CPF:', rCol2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${formatCPF(data.cpf)}`, rCol2 + 10, yPos + 4);

  // Linha 2: Cargo e Matrícula
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('CARGO / FUNÇÃO:', rCol1, yPos + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.cargo || 'Motorista de Onibus Rodoviario'}`, rCol1 + 24, yPos + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('MATRÍCULA:', rCol2, yPos + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.registrationNumber || data.matriculaEsocial || '684'}`, rCol2 + 18, yPos + 8.5);

  // Linha 3: Setor/Unidade e Admissão
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('SETOR / UNIDADE:', rCol1, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.empresaCidade ? data.empresaCidade + ' - Garagem Central' : 'Garagem Central'}`, rCol1 + 24, yPos + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('ADMISSÃO:', rCol2, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${formatDateBR(data.hireDate)}`, rCol2 + 16, yPos + 13);

  return yPos + infoBoxH;
};

// ============================================================================
// FUNÇÃO PADRÃO: ÁREA DE ASSINATURAS E RODAPÉ
// ============================================================================
export const drawOfficialSignatures = (
  doc: jsPDF,
  employeeName: string,
  yPos: number,
  rightLabel = 'Almoxarifado / Recursos Humanos',
  rightSub = 'Responsável / Homologação RH'
) => {
  const startX = 10;
  const endX = 200;
  const w = 68;

  // Colaborador (Esquerda)
  const leftX1 = startX + 15;
  const leftX2 = leftX1 + w;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(leftX1, yPos, leftX2, yPos);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(employeeName, (leftX1 + leftX2) / 2, yPos + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 100, 100);
  doc.text('Assinatura do Colaborador (Recebimento)', (leftX1 + leftX2) / 2, yPos + 7.2, { align: 'center' });

  // Empresa / RH (Direita)
  const rightX1 = endX - 15 - w;
  const rightX2 = endX - 15;
  doc.line(rightX1, yPos, rightX2, yPos);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(rightLabel, (rightX1 + rightX2) / 2, yPos + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 100, 100);
  doc.text(rightSub, (rightX1 + rightX2) / 2, yPos + 7.2, { align: 'center' });
};

export const drawOfficialFooter = (
  doc: jsPDF,
  normaDesc = 'Documento oficial de Recursos Humanos conforme legislação trabalhista vigente'
) => {
  const pageWidth = 210;
  const pageHeight = 297;
  const today = new Date().toLocaleDateString('pt-BR');
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(130, 130, 130);
  doc.text(
    `${normaDesc} • Emitido em ${today} às ${now}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );
};

// ============================================================================
// 1. SOLICITAÇÃO DE VALE - TRANSPORTE (DECRETO Nº 95.247/87)
// ============================================================================
export const buildSolicitacaoValeTransporte = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  // 1. Cabeçalho Oficial
  let curY = drawOfficialDocumentHeader(doc, {
    title: 'SOLICITAÇÃO DE VALE - TRANSPORTE',
    normaBadge: 'DECRETO Nº 95.247/87',
    docNumber: `TERMO Nº VT-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  // 2. Identificação do Colaborador e Empresa
  curY = drawOfficialSectionHeader(doc, 'IDENTIFICAÇÃO DO COLABORADOR E EMPRESA', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 3.5;

  // 3. Opção do Benefício
  curY = drawOfficialSectionHeader(doc, 'TERMO DE OPÇÃO DO VALE-TRANSPORTE', curY);
  curY += 1.5;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(startX, curY, contentWidth, 12, 1, 1, 'FD');

  // Checkbox 1: Opto
  doc.rect(startX + 6, curY + 4, 4, 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('X', startX + 7.2, curY + 7.2);
  doc.text('Opto pela utilização do Vale-Transporte', startX + 13, curY + 7);

  // Checkbox 2: Não Opto
  doc.rect(startX + 105, curY + 4, 4, 4);
  doc.text('Não Opto pela utilização do Vale-Transporte', startX + 112, curY + 7);

  curY += 15;

  // 4. Termo de Compromisso e Legislação
  curY = drawOfficialSectionHeader(doc, 'TERMO DE COMPROMISSO E DECLARAÇÃO LEGAL (DECRETO Nº 95.247/87)', curY);
  curY += 1.5;

  const legalText = `Nos termos do artigo 7º do Decreto nº 95.247 de 17 de novembro de 1987, solicito receber o Vale-Transporte e comprometo-me:
a) A utilizá-lo exclusivamente para meu efetivo deslocamento residência-trabalho e vice-versa;
b) A renovar anualmente ou sempre que ocorrer alteração no meu endereço residencial ou nos serviços de transporte público;
c) Autorizo a descontar até 6% (seis por cento) do meu salário básico mensal para custeio do benefício (art. 9º do Decreto 95.247/87);
d) Declaro estar ciente de que a declaração falsa ou uso indevido do benefício constitui falta grave passível de demissão por justa causa (art. 7º §3º do Decreto 95.247/87 e art. 482 da CLT).`;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(startX, curY, contentWidth, 24, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(50, 50, 50);
  const splitLegal = doc.splitTextToSize(legalText, contentWidth - 8);
  doc.text(splitLegal, startX + 4, curY + 4);

  curY += 27;

  // 5. Residência Atual
  curY = drawOfficialSectionHeader(doc, 'RESIDÊNCIA ATUAL DO COLABORADOR', curY);
  curY += 1.5;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 13, 1, 1, 'FD');

  const rua = data.enderecoRua || data.address || 'Rua Principal dos Trabalhadores';
  const num = data.enderecoNumero || 'S/N';
  const bairro = data.enderecoBairro || 'Centro';
  const cidade = data.enderecoCidade || 'Belo Horizonte';
  const uf = data.enderecoEstado || 'MG';
  const cep = data.enderecoCep || '30000-000';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(90, 90, 90);
  doc.text('LOGRADOURO:', startX + 4, curY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${rua}, Nº ${num}`, startX + 26, curY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(90, 90, 90);
  doc.text('BAIRRO:', startX + 115, curY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(bairro, startX + 130, curY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(90, 90, 90);
  doc.text('MUNICÍPIO / UF:', startX + 4, curY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${cidade} / ${uf}`, startX + 28, curY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(90, 90, 90);
  doc.text('CEP:', startX + 115, curY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(cep, startX + 125, curY + 9.5);

  curY += 16;

  // 6. Quadro de Meios de Transporte
  curY = drawOfficialSectionHeader(doc, 'QUADRO DE MEIOS DE TRANSPORTE UTILIZADOS (LINHAS / ITINERÁRIOS)', curY);
  curY += 1.5;

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: [210, 210, 210], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['ITINERÁRIO / TRAJETO', 'Nº DA LINHA / NOME', 'EMPRESA CONCESSIONÁRIA', 'TARIFA UNIT. (R$)']],
    body: [
      ['RESIDÊNCIA → TRABALHO (Trecho 1)', 'Linha 102 - Direta', 'Viação São Silvestre', 'R$ 5,30'],
      ['RESIDÊNCIA → TRABALHO (Trecho 2)', '—', '—', '—'],
      ['TRABALHO → RESIDÊNCIA (Trecho 1)', 'Linha 102 - Retorno', 'Viação São Silvestre', 'R$ 5,30'],
      ['TRABALHO → RESIDÊNCIA (Trecho 2)', '—', '—', '—'],
    ],
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 12;

  // Assinaturas Oficiais
  drawOfficialSignatures(doc, data.name, curY, 'Recursos Humanos / Vale-Transporte', 'Conferência e Lançamento DP');

  // Rodapé
  drawOfficialFooter(doc, 'Ficha Oficial de Solicitação de Vale-Transporte conforme Decreto Federal nº 95.247/87 e Lei nº 7.418/85');
};

// ============================================================================
// 2. DECLARAÇÃO DE ENCARGOS DE FAMÍLIA (IRPF - IN RFB Nº 1.500/14)
// ============================================================================
export const buildDeclaracaoEncargosIR = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  let curY = drawOfficialDocumentHeader(doc, {
    title: 'DECLARAÇÃO DE ENCARGOS DE FAMÍLIA — IRPF',
    normaBadge: 'IN RFB Nº 1.500/14',
    docNumber: `DECLARAÇÃO Nº IR-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  curY = drawOfficialSectionHeader(doc, 'IDENTIFICAÇÃO DO COLABORADOR E FONTE PAGADORA', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 4;

  curY = drawOfficialSectionHeader(doc, 'TERMO DE DECLARAÇÃO LEGAL (DEDUÇÃO NA FONTE - ART. 90 DA IN RFB 1.500/14)', curY);
  curY += 1.5;

  const declText = `Em obediência à legislação do Imposto de Renda (Instrução Normativa RFB nº 1.500/2014 e Decreto nº 9.580/2018 - RIR), declaro formalmente à fonte pagadora que tenho como dependentes para fins de dedução da base de cálculo do Imposto sobre a Renda Retido na Fonte (IRRF) as pessoas abaixo discriminadas, comprometendo-me a comunicar imediatamente qualquer alteração.`;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 14, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const splitDecl = doc.splitTextToSize(declText, contentWidth - 8);
  doc.text(splitDecl, startX + 4, curY + 4);

  curY += 17;

  curY = drawOfficialSectionHeader(doc, 'RELAÇÃO OFICIAL DE DEPENDENTES CADASTRADOS', curY);
  curY += 1.5;

  const depsBody = (data.dependents || []).map(dep => [
    dep.name,
    dep.relationship || '03 - Filho(a) ou enteado(a) até 21 anos',
    formatDateBR(dep.birthDate),
    formatCPF(dep.cpf)
  ]);

  if (depsBody.length === 0) {
    depsBody.push(['Não há dependentes cadastrados até a presente data', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7.2, cellPadding: 2.2, lineColor: [210, 210, 210], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['NOME COMPLETO DO DEPENDENTE', 'PARENTESCO / CÓDIGO ESOCIAL', 'DATA DE NASCIMENTO', 'CPF DO DEPENDENTE']],
    body: depsBody,
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 8;

  curY = drawOfficialSectionHeader(doc, 'TERMO DE RESPONSABILIDADE E VERACIDADE DAS INFORMAÇÕES', curY);
  curY += 1.5;

  const respText = `Declaro sob as penas da lei que as informações aqui prestadas são expressão da verdade e de minha inteira responsabilidade, estando ciente de que a inserção de dados inverídicos me sujeitará às sanções administrativas, cíveis e penais previstas no art. 299 do Código Penal (crime de falsidade ideológica), isentando a fonte pagadora de responsabilidade.`;

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 14, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(50, 50, 50);
  const splitResp = doc.splitTextToSize(respText, contentWidth - 8);
  doc.text(splitResp, startX + 4, curY + 4);

  curY += 22;

  drawOfficialSignatures(doc, data.name, curY, 'Ciente do Cônjuge / Responsável RH', 'Homologação e Arquivo DP');

  drawOfficialFooter(doc, 'Declaração de Encargos de Família conforme Instrução Normativa RFB nº 1.500/2014 e Decreto nº 9.580/2018');
};

// ============================================================================
// 3. FICHA DE SALÁRIO-FAMÍLIA (LEI Nº 8.213/91)
// ============================================================================
export const buildFichaSalarioFamilia = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  let curY = drawOfficialDocumentHeader(doc, {
    title: 'FICHA OFICIAL DE SALÁRIO-FAMÍLIA',
    normaBadge: 'LEI Nº 8.213/91',
    docNumber: `FICHA Nº SF-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  curY = drawOfficialSectionHeader(doc, 'IDENTIFICAÇÃO DO SEGURADO E EMPRESA BENEFICIADORA', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 4;

  curY = drawOfficialSectionHeader(doc, 'BASE LEGAL E REQUISITOS DO SALÁRIO-FAMÍLIA (ART. 65 A 70 DA LEI 8.213/91)', curY);
  curY += 1.5;

  const sfText = `O salário-família é devido mensalmente ao segurado empregado na proporção do número de filhos ou equiparados até 14 anos de idade ou inválidos de qualquer idade, condicionado à apresentação da certidão de nascimento do filho ou da documentação tutelar, comprovante de vacinação anual e comprovação semestral de frequência escolar.`;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 14, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const splitSf = doc.splitTextToSize(sfText, contentWidth - 8);
  doc.text(splitSf, startX + 4, curY + 4);

  curY += 17;

  curY = drawOfficialSectionHeader(doc, 'RELAÇÃO DE FILHOS / DEPENDENTES E COMPROVAÇÃO CARTORÁRIA', curY);
  curY += 1.5;

  const depsBody = (data.dependents || []).map((dep, idx) => [
    `0${idx + 1}`,
    dep.name,
    formatDateBR(dep.birthDate),
    formatCPF(dep.cpf),
    'Certidão Nasc. Registrada',
    'Conforme Regular'
  ]);

  if (depsBody.length === 0) {
    depsBody.push(['01', 'Nenhum dependente informado para o benefício', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: [210, 210, 210], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['ITEM', 'NOME DO FILHO / DEPENDENTE', 'NASCIMENTO', 'CPF', 'CERTIDÃO / CARTÓRIO', 'VACINAÇÃO / ESCOLA']],
    body: depsBody,
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 14;

  drawOfficialSignatures(doc, data.name, curY, 'Previdência Social / RH', 'Concessão e Visto DP');

  drawOfficialFooter(doc, 'Ficha Oficial de Salário-Família conforme Lei Federal nº 8.213/91 e Decreto nº 3.048/99');
};

// ============================================================================
// 4. TERMO DE RESPONSABILIDADE (SALÁRIO-FAMÍLIA - PORTARIA MPAS Nº 3.040/82)
// ============================================================================
export const buildTermoResponsabilidadeSalarioFamilia = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  let curY = drawOfficialDocumentHeader(doc, {
    title: 'TERMO DE RESPONSABILIDADE — SALÁRIO-FAMÍLIA',
    normaBadge: 'PORTARIA MPAS 3.040/82',
    docNumber: `TERMO Nº TR-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  curY = drawOfficialSectionHeader(doc, 'IDENTIFICAÇÃO DO SEGURADO E FONTE PAGADORA', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 4;

  curY = drawOfficialSectionHeader(doc, 'TERMO DE COMPROMISSO E CAUSAS DE CESSAÇÃO DO BENEFÍCIO', curY);
  curY += 1.5;

  const t1 = `Pelo presente TERMO DE RESPONSABILIDADE, declaro estar ciente de que deverei comunicar de imediato à empresa a ocorrência dos seguintes fatos, que determinam a perda do direito ao salário-família:`;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 26, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(t1, startX + 4, curY + 4.5);

  // Alertas destacados
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47);
  doc.text('• ÓBITO DO FILHO OU EQUIPARADO', startX + 8, curY + 10.5);
  doc.text('• CESSAÇÃO DA INVALIDEZ DE FILHO INVÁLIDO', startX + 8, curY + 15);
  doc.text('• SENTENÇA JUDICIAL DETERMINANDO O PAGAMENTO A OUTREM', startX + 8, curY + 19.5);
  doc.text('• MAIORIDADE DO FILHO (AO COMPLETAR 14 ANOS)', startX + 8, curY + 24);

  curY += 30;

  curY = drawOfficialSectionHeader(doc, 'RELAÇÃO DOS FILHOS ABRANGIDOS POR ESTE TERMO', curY);
  curY += 1.5;

  const depsBody = (data.dependents || []).map(dep => [
    formatDateBR(dep.birthDate),
    dep.name,
    formatCPF(dep.cpf)
  ]);

  if (depsBody.length === 0) {
    depsBody.push(['—', 'Nenhum filho cadastrado', '—']);
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7.2, cellPadding: 2, lineColor: [210, 210, 210], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['DATA DE NASCIMENTO', 'NOME DO FILHO / DEPENDENTE', 'CPF DO FILHO']],
    body: depsBody,
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 8;

  curY = drawOfficialSectionHeader(doc, 'SANÇÕES LEGAIS (ART. 171 DO CÓDIGO PENAL E ART. 482 DA CLT)', curY);
  curY += 1.5;

  const t2 = `Estou ciente, ainda, de que a falta de cumprimento do compromisso ora assumido, além de obrigar à devolução das importâncias recebidas indevidamente com os acréscimos legais cabíveis, sujeitar-me-á às penalidades previstas no art. 171 do Código Penal (crime de estelionato) e à rescisão imediata do contrato de trabalho por justa causa, nos termos do art. 482 da Consolidação das Leis do Trabalho (CLT).`;

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 18, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(40, 40, 40);
  const splitT2 = doc.splitTextToSize(t2, contentWidth - 8);
  doc.text(splitT2, startX + 4, curY + 4);

  curY += 24;

  drawOfficialSignatures(doc, data.name, curY, 'Previdência Social / RH', 'Homologação e Arquivo');

  drawOfficialFooter(doc, 'Termo de Responsabilidade conforme Portaria MPAS nº 3.040/1982 e Legislação Previdenciária Vigente');
};

// ============================================================================
// 5. CONTRATO DE TRABALHO DE EXPERIÊNCIA (CLT ART. 443 §2º "C" E LGPD)
// ============================================================================
export const buildContratoExperiencia = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  // PÁGINA 1
  let curY = drawOfficialDocumentHeader(doc, {
    title: 'CONTRATO DE TRABALHO DE EXPERIÊNCIA',
    normaBadge: 'CLT ART. 443 §2º "C"',
    docNumber: `CONTRATO Nº CT-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  curY = drawOfficialSectionHeader(doc, 'QUALIFICAÇÃO DAS PARTES CONTRATANTES', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 4;

  curY = drawOfficialSectionHeader(doc, 'CLÁUSULAS CONTRATUAIS DO PERÍODO EXPERIMENTAL', curY);
  curY += 1.5;

  const salarioVal = typeof data.salario === 'number' 
    ? data.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
    : (data.salario || '3.656,60');
  const cargoVal = data.cargo || 'Motorista de Onibus Rodoviario';

  const clauses = [
    `1ª) FUNÇÃO E REMUNERAÇÃO: O Empregado é contratado para exercer a função de ${cargoVal}, percebendo a remuneração mensal de R$ ${salarioVal}, mediante depósito em conta salário ou meio admitido em lei.`,
    `2ª) JORNADA DE TRABALHO: O horário de trabalho será de ${data.horarioTrabalho || 'segunda a sexta das 08:00 às 17:48 com 1h de intervalo, com regime de compensação de sábado e descanso semanal remunerado aos domingos'}.`,
    `3ª) PRAZO DETERMINADO: O presente contrato tem início em ${formatDateBR(data.hireDate)} e vigência inicial por 45 dias, podendo ser prorrogado uma única vez por igual período, totalizando o limite máximo de 90 dias previsto no art. 445 da CLT.`,
    `4ª) COMPENSAÇÃO E HORAS EXTRAS: O Empregado compromete-se a prestar serviços em regime de prorrogação e compensação de jornada, inclusive em turnos operacionais, viagens e escala, sempre que a atividade de transporte coletivo assim exigir.`,
    `5ª) NORMAS E DISCIPLINA: O Empregado obriga-se a zelar pelo veículo e equipamentos da frota, cumprir rigorosamente o Código de Trânsito Brasileiro (CTB), as ordens de serviço da administração e o Regulamento Interno da Empregadora.`,
    `6ª) RESCISÃO ANTECIPADA: A rescisão motivada por justa causa reger-se-á pelos arts. 482 e 483 da CLT. Havendo rescisão imotivada antes do termo final, aplicar-se-á o disposto nos artigos 479 e 480 da CLT.`,
    `7ª) CONVERSÃO EM PRAZO INDETERMINADO: Ultrapassado o prazo de experiência sem rescisão expressa, o contrato passará automaticamente a vigorar por prazo indeterminado, preservadas todas as cláusulas e condições pactuadas.`,
    `8ª) ATESTADOS MÉDICOS: O Empregado obriga-se a apresentar atestados médicos de afastamento ao setor de RH em até 48 horas da emissão.`
  ];

  clauses.forEach(c => {
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(225, 225, 225);
    const lines = doc.splitTextToSize(c, contentWidth - 6);
    const boxH = lines.length * 3.4 + 3;
    doc.roundedRect(startX, curY, contentWidth, boxH, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 30, 30);
    doc.text(lines, startX + 3, curY + 3.2);
    curY += boxH + 1.2;
  });

  drawOfficialFooter(doc, 'Contrato Individual de Trabalho a Título de Experiência • Página 1 de 2 • CLT Art. 443 §2º "c"');

  // PÁGINA 2: LGPD, PRORROGAÇÃO E ASSINATURAS
  doc.addPage();

  curY = drawOfficialDocumentHeader(doc, {
    title: 'CONTRATO DE TRABALHO — LGPD E PRORROGAÇÃO',
    normaBadge: 'LEI Nº 13.709/18',
    docNumber: `CONTRATO Nº CT-2026-${regNum} (FL. 02)`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  curY = drawOfficialSectionHeader(doc, 'CLÁUSULA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LEI Nº 13.709/2018 - LGPD)', curY);
  curY += 1.5;

  const lgpdText = `9ª) TRATAMENTO DE DADOS PESSOAIS: A Empregadora, na qualidade de Controladora, realiza o tratamento dos dados pessoais e dados pessoais sensíveis do Empregado estritamente para o cumprimento de obrigações legais, regulatórias (eSocial, CAGED, RAIS, PPRA/PCMSO/LTCAT) e para a fiel execução deste Contrato de Trabalho.
O Empregado declara-se ciente de que a Empregadora adota rigorosas medidas de segurança técnicas e administrativas para salvaguarda de seus dados e que estes poderão ser compartilhados com operadoras de benefícios, instituições bancárias pagadoras e órgãos fiscalizadores federais.`;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 20, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(40, 40, 40);
  const splitLgpd = doc.splitTextToSize(lgpdText, contentWidth - 8);
  doc.text(splitLgpd, startX + 4, curY + 4);

  curY += 24;

  curY = drawOfficialSectionHeader(doc, 'TERMO DE FECHAMENTO E ASSINATURAS DO CONTRATO DE EXPERIÊNCIA', curY);
  curY += 1.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`E por estarem justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.`, startX + 2, curY + 4);
  doc.text(`${data.empresaCidade || 'Moeda'} / MG, ${getTodayFormatted()}.`, endX - 60, curY + 4);

  curY += 14;

  // Assinaturas Contrato Principal
  drawOfficialSignatures(doc, data.name, curY, data.empresaNome || 'VIAÇÃO SÃO SILVESTRE S.A.', 'Empregadora / Representante Legal');

  curY += 18;

  // TERMO DE PRORROGAÇÃO
  curY = drawOfficialSectionHeader(doc, 'TERMO DE PRORROGAÇÃO CONTRATUAL (PARÁGRAFO ÚNICO DO ART. 445 DA CLT)', curY);
  curY += 1.5;

  const prorrogText = `Por mútuo acordo entre as partes, fica o presente Contrato de Trabalho a Título de Experiência devidamente prorrogado por mais 45 (quarenta e cinco) dias, vencendo-se definitivamente ao término do prazo global de 90 dias, mantidas inalteradas todas as demais condições e cláusulas primitivas.`;

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, curY, contentWidth, 14, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 30, 30);
  const splitProrrog = doc.splitTextToSize(prorrogText, contentWidth - 8);
  doc.text(splitProrrog, startX + 4, curY + 4);

  curY += 20;

  drawOfficialSignatures(doc, data.name, curY, data.empresaNome || 'VIAÇÃO SÃO SILVESTRE S.A.', 'Prorrogação Homologada');

  drawOfficialFooter(doc, 'Contrato Individual de Trabalho a Título de Experiência • Página 2 de 2 • CLT e LGPD');
};

// ============================================================================
// 6. FICHA DE REGISTRO DE EMPREGADO (PORTARIA MTP Nº 671/21 E CLT)
// ============================================================================
export const buildFichaRegistroEmpregado = (
  doc: jsPDF,
  data: EmployeeAdmissionData,
  logoImg?: HTMLImageElement | null
): void => {
  const startX = 10;
  const endX = 200;
  const contentWidth = endX - startX;
  const regNum = data.registrationNumber || data.matriculaEsocial || '684';

  let curY = drawOfficialDocumentHeader(doc, {
    title: 'FICHA DE REGISTRO DE EMPREGADO',
    normaBadge: 'PORTARIA MTP Nº 671/21',
    docNumber: `REGISTRO Nº FRE-2026-${regNum}`,
    companyName: data.empresaNome,
    companyCnpj: data.empresaCnpj,
    companyAddress: data.empresaEndereco,
    logoImg: logoImg || cachedLogoImg
  });

  // Seção 1: Identificação
  curY = drawOfficialSectionHeader(doc, 'IDENTIFICAÇÃO GERAL DO EMPREGADO E DA EMPRESA', curY);
  curY = drawOfficialEmployeeInfoBox(doc, data, curY + 1.5);
  curY += 4;

  // Seção 2: Dados Pessoais e Qualificação Civil
  curY = drawOfficialSectionHeader(doc, 'DADOS PESSOAIS E QUALIFICAÇÃO CIVIL', curY);
  curY += 1.5;

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['CAMPO', 'INFORMAÇÃO DECLARADA', 'CAMPO', 'INFORMAÇÃO DECLARADA']],
    body: [
      ['Data de Nascimento:', formatDateBR(data.birthDate), 'Estado Civil:', data.maritalStatus === 'MARRIED' ? 'Casado(a)' : 'Solteiro(a)'],
      ['Nacionalidade:', data.nationality || 'Brasileira', 'Naturalidade:', data.localNascimento || 'Belo Horizonte / MG'],
      ['Sexo / Gênero:', data.sexo || 'Masculino', 'Raça / Cor:', data.racaCor || 'Não declarada'],
      ['Nome da Mãe:', data.nomeMae || 'NÃO INFORMADO', 'Nome do Pai:', data.nomePai || 'NÃO INFORMADO'],
      ['Grau de Instrução:', data.grauInstrucao || 'Ensino Médio Completo', 'Telefone / Celular:', data.phone || '(31) 98888-0000']
    ],
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Seção 3: Documentação Oficial
  curY = drawOfficialSectionHeader(doc, 'DOCUMENTAÇÃO OFICIAL DO TRABALHADOR', curY);
  curY += 1.5;

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['DOCUMENTO', 'NÚMERO / SÉRIE', 'ÓRGÃO EMISSOR / UF', 'DATA EMISSÃO / VALIDADE']],
    body: [
      ['Carteira de Identidade (RG):', data.rg || 'MG-00.000.000', data.carteiraIdentidadeOrgaoEmissor || 'PC/MG', formatDateBR(data.carteiraIdentidadeDataEmissao)],
      ['CPF / MF:', formatCPF(data.cpf), 'Receita Federal', 'Regular'],
      ['CTPS (Carteira de Trabalho):', `${data.ctps || '000000'} / ${data.ctpsSeries || '000'}`, data.ctpsState || 'MG', formatDateBR(data.ctpsIssueDate)],
      ['PIS / PASEP:', data.pis || '000.00000.00-0', 'Caixa Econômica', 'Ativo'],
      ['CNH (Habilitação Profissional):', data.cnhNumber || '00000000000', `Cat: ${data.cnhCategory || 'D'}`, formatDateBR(data.cnhExpirationDate)]
    ],
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Seção 4: Contrato de Trabalho e Remuneração
  curY = drawOfficialSectionHeader(doc, 'DADOS CONTRATUAIS, REMUNERAÇÃO E BENEFÍCIOS', curY);
  curY += 1.5;

  const salFormat = typeof data.salario === 'number' 
    ? `R$ ${data.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
    : `R$ ${data.salario || '3.656,60'}`;

  autoTable(doc, {
    startY: curY,
    margin: { left: startX, right: 10 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['ESPECIFICAÇÃO CONTRATUAL', 'VALOR / CONDIÇÃO PACTUADA', 'ESPECIFICAÇÃO CONTRATUAL', 'VALOR / CONDIÇÃO PACTUADA']],
    body: [
      ['Cargo Efetivo:', data.cargo || 'Motorista de Onibus Rodoviario', 'Código CBO:', data.cbo || '7825-10'],
      ['Data de Admissão:', formatDateBR(data.hireDate), 'Matrícula eSocial:', data.matriculaEsocial || regNum],
      ['Salário Base Mensal:', salFormat, 'Forma de Pagamento:', 'Mensal (Até o 5º dia útil)'],
      ['Horário de Trabalho:', 'Escala Oficial Conforme Escala Operacional', 'Regime de Trabalho:', 'CLT Tempo Integral'],
      ['Endereço Residencial:', `${data.enderecoRua || data.address || 'Rua Principal'}, Nº ${data.enderecoNumero || 'S/N'}`, 'Cidade / UF / CEP:', `${data.enderecoCidade || 'Belo Horizonte'} / ${data.enderecoEstado || 'MG'} - ${data.enderecoCep || '30000-000'}`]
    ],
    theme: 'grid'
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 12;

  drawOfficialSignatures(doc, data.name, curY, 'Recursos Humanos / Departamento Pessoal', 'Responsável pelo Registro e eSocial');

  drawOfficialFooter(doc, 'Ficha Oficial de Registro de Empregado conforme Decreto-Lei nº 5.452/43 (CLT) e Portaria MTP nº 671/21');
};

// ============================================================================
// PACOTE ADMISSIONAL COMPLETO (PDF UNIFICADO COM OS DOCUMENTOS ADMISSIONAIS)
// ============================================================================
export const generatePacoteAdmissionalCompleto = async (data: EmployeeAdmissionData): Promise<jsPDF> => {
  const logo = await loadOfficialCompanyLogo(data.companyLogo);
  const doc = new jsPDF('p', 'mm', 'a4');

  // 1. Solicitação de Vale-Transporte
  buildSolicitacaoValeTransporte(doc, data, logo);

  // 2. Declaração de Encargos IR
  doc.addPage();
  buildDeclaracaoEncargosIR(doc, data, logo);

  // 3. Ficha de Salário-Família
  doc.addPage();
  buildFichaSalarioFamilia(doc, data, logo);

  // 4. Termo de Responsabilidade Salário-Família
  doc.addPage();
  buildTermoResponsabilidadeSalarioFamilia(doc, data, logo);

  // 5. Contrato de Experiência (Gera 2 páginas)
  doc.addPage();
  buildContratoExperiencia(doc, data, logo);

  // 6. Ficha de Registro de Empregado
  doc.addPage();
  buildFichaRegistroEmpregado(doc, data, logo);

  return doc;
};

// ============================================================================
// GERADOR INDIVIDUAL DE DOCUMENTOS ADMISSIONAIS
// ============================================================================
export const generateSingleAdmissionDocumentPdf = async (
  docType: string,
  data: EmployeeAdmissionData
): Promise<jsPDF> => {
  const logo = await loadOfficialCompanyLogo(data.companyLogo);
  const doc = new jsPDF('p', 'mm', 'a4');

  switch (docType) {
    case 'vt':
      buildSolicitacaoValeTransporte(doc, data, logo);
      break;
    case 'ir':
      buildDeclaracaoEncargosIR(doc, data, logo);
      break;
    case 'salario-familia':
      buildFichaSalarioFamilia(doc, data, logo);
      break;
    case 'termo-responsabilidade':
      buildTermoResponsabilidadeSalarioFamilia(doc, data, logo);
      break;
    case 'contrato-experiencia':
      buildContratoExperiencia(doc, data, logo);
      break;
    case 'registro-empregado':
    case 'ficha-registro':
      buildFichaRegistroEmpregado(doc, data, logo);
      break;
    case 'pacote-completo':
    default:
      return generatePacoteAdmissionalCompleto(data);
  }

  return doc;
};
