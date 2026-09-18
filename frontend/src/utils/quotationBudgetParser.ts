import * as XLSX from 'xlsx';

export interface BudgetHeader {
  documentTitle: string;
  budgetNumber: string;
  issueDateTime: string;
  pageNumber: string;
}

export interface BudgetSupplier {
  name: string;
  tradeName?: string;
  cnpj?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  fullAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  salesRepresentative?: string;
}

export interface BudgetClient {
  name: string;
  cnpjCpf?: string;
  stateRegistration?: string; // IE
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  fullAddress?: string;
  phone?: string;
  email?: string;
}

export interface BudgetItem {
  id: string;
  code: string;
  description: string;
  technicalSpecs?: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface BudgetFinancialTotals {
  freightValue: number;
  freightType?: string;
  otherExpenses: number;
  totalItemsQuantity: number;
  totalAmount: number;
  paymentTerms: string;
}

export interface BudgetCommercialTerms {
  validity: string;
  deliveryTime?: string;
  unavailableItemsSummary: string[];
  generalNotes: string;
  warranty?: string;
}

export interface ParsedBudgetData {
  rawText: string;
  fileName: string;
  fileType: 'pdf' | 'excel' | 'text' | 'image';
  fileBase64?: string;
  header: BudgetHeader;
  supplier: BudgetSupplier;
  client: BudgetClient;
  items: BudgetItem[];
  totals: BudgetFinancialTotals;
  commercial: BudgetCommercialTerms;
}

// Helpers para normalização numérica PT-BR
export function parsePtBrNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let s = String(val).trim();
  // Remove R$, espaços
  s = s.replace(/^R\$\s*/i, '').replace(/\s+/g, '');
  // Verifica formato brasileiro com ponto de milhar e vírgula decimal (ex: 1.250,50)
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Extrair texto de PDF usando pdfjs-dist dinamicamente
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Configurar worker do CDN se não configurado
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
    }
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items as Array<{ str?: string; hasEOL?: boolean }>;
      const pageText = pageItems.map(item => item.str || '').join(' ');
      fullText += `\n--- PÁGINA ${i} de ${pdf.numPages} ---\n` + pageText;
    }
    return fullText;
  } catch (error) {
    console.warn('Fallback: PDF parser standard error, trying text stream buffer decoder', error);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  }
}

// Extrair texto de Excel (.xlsx, .xls, .csv)
async function extractTextFromExcel(file: File): Promise<{ rawText: string; sheetRows: any[][] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  let allRows: any[][] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    fullText += `\n--- ABA ${sheetName} (Página ${index + 1}) ---\n`;
    jsonData.forEach(row => {
      if (Array.isArray(row) && row.length > 0) {
        allRows.push(row);
        fullText += row.filter(cell => cell !== null && cell !== undefined).join(' | ') + '\n';
      }
    });
  });

  return { rawText: fullText, sheetRows: allRows };
}

// Conhecidos fabricantes de autopeças a diesel
const KNOWN_BRANDS = [
  'KS', 'KOLBENSCHMIDT', 'MAHLE', 'RIOSULENSE', 'ELRING', 'SABÓ', 'SUSPENSYS', 
  'EATON', 'ZF', 'BOSCH', 'WABCO', 'KNORR', 'KNORR-BREMSE', 'SPICER', 'DANA', 
  'FRAS-LE', 'LONAFLEX', 'DAYCO', 'GATES', 'CONTINENTAL', 'CONTITECH', 'MONROE', 
  'COFAP', 'NAKATA', 'URBA', 'VALEO', 'DELPHI', 'CUMMINS', 'MERCEDES-BENZ', 
  'MERCEDES', 'SCANIA', 'VOLVO', 'VOLKSWAGEN', 'VW', 'IVECO', 'MAN', 'FPT', 
  'MWM', 'SCHADECK', 'CORTECO', 'METAL LEVE', 'MASTER', 'JOST', 'RANDON', 'TARANTO'
];

export class QuotationBudgetParser {
  /**
   * Processa o arquivo (PDF, Excel ou Texto) e retorna a estrutura com os 6 blocos completos
   */
  static async parseFile(file: File): Promise<ParsedBudgetData> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    let rawText = '';
    let excelRows: any[][] = [];
    let fileType: 'pdf' | 'excel' | 'text' | 'image' = 'text';

    // Converter para base64 para armazenamento de anexo se necessário
    const fileBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    if (extension === 'pdf') {
      fileType = 'pdf';
      rawText = await extractTextFromPdf(file);
    } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
      fileType = 'excel';
      const res = await extractTextFromExcel(file);
      rawText = res.rawText;
      excelRows = res.sheetRows;
    } else {
      rawText = await file.text();
    }

    return this.parseText(rawText, file.name, fileType, fileBase64, excelRows);
  }

  /**
   * Analisa texto puro extraído e extrai os 6 blocos organizados
   */
  static parseText(
    text: string, 
    fileName = 'Orcamento.txt', 
    fileType: 'pdf' | 'excel' | 'text' | 'image' = 'text',
    fileBase64?: string,
    excelRows?: any[][]
  ): ParsedBudgetData {
    const header = this.extractHeader(text);
    const supplier = this.extractSupplier(text);
    const client = this.extractClient(text);
    const items = this.extractItems(text, excelRows);
    const totals = this.extractTotals(text, items);
    const commercial = this.extractCommercial(text, items);

    return {
      rawText: text,
      fileName,
      fileType,
      fileBase64,
      header,
      supplier,
      client,
      items,
      totals,
      commercial
    };
  }

  // 1. Dados do Cabeçalho e do Documento
  private static extractHeader(text: string): BudgetHeader {
    // Título
    let documentTitle = 'Orçamento / Proposta Comercial';
    if (/PROPOSTA\s+COMERCIAL/i.test(text)) documentTitle = 'Proposta Comercial';
    else if (/COTA[ÇC][ÃA]O/i.test(text)) documentTitle = 'Cotação de Preços';
    else if (/OR[ÇC]AMENTO/i.test(text)) documentTitle = 'Orçamento';

    // Número do Orçamento (ex: 0104/017453, 677370, Nº 12345, Orçamento: 98765)
    let budgetNumber = '';
    const numMatch = text.match(/(?:Or[çc]amento|N[ºo]\.?|Proposta|Cota[çc][ãa]o|N[uú]mero)[\s:]*([0-9]{2,8}(?:\/[0-9]{2,8})?)/i) 
      || text.match(/\b([0-9]{3,6}\/[0-9]{4,8})\b/)
      || text.match(/\b(?:ORC|COT|PED)[\s#-]*([0-9]{4,10})\b/i);

    if (numMatch) {
      budgetNumber = numMatch[1].trim();
    }

    // Data e Hora de Emissão (ex: 18/09/2024 14:35, 18/09/2024, 18-09-2024)
    let issueDateTime = '';
    const dateMatch = text.match(/(?:Emiss[ãa]o|Data|Gerado\s+em|Data\/Hora)[\s:]*([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4}(?:\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)?)/i)
      || text.match(/\b([0-9]{2}\/[0-9]{2}\/[0-9]{4}(?:\s+[0-9]{2}:[0-9]{2})?)\b/);

    if (dateMatch) {
      issueDateTime = dateMatch[1].trim();
    } else {
      const now = new Date();
      issueDateTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }

    // Paginação (ex: Página 1 de 1, Pág. 1/2)
    let pageNumber = 'Página 1 de 1';
    const pageMatch = text.match(/(?:P[áa]gina|P[áa]g\.?)[\s:]*([0-9]+\s*(?:de|\/)\s*[0-9]+)/i);
    if (pageMatch) {
      pageNumber = `Página ${pageMatch[1].trim()}`;
    }

    return {
      documentTitle,
      budgetNumber,
      issueDateTime,
      pageNumber
    };
  }

  // 2. Dados do Fornecedor / Emitente
  private static extractSupplier(text: string): BudgetSupplier {
    let name = '';
    let tradeName = '';
    let cnpj = '';
    let phone = '';
    let email = '';
    let website = '';
    let salesRepresentative = '';
    let fullAddress = '';
    let street = '';
    let number = '';
    let neighborhood = '';
    let zipCode = '';
    let city = '';
    let state = '';

    // CNPJ do Fornecedor
    const cnpjMatch = text.match(/(?:CNPJ|C\.N\.P\.J\.?)[\s:]*([0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}-?[0-9]{2})/i);
    if (cnpjMatch) {
      cnpj = cnpjMatch[1].trim();
    }

    // Telefone
    const phoneMatch = text.match(/(?:Fone|Tel(?:efone)?|Celular|WhatsApp|Contato)[\s:]*(\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4})/i)
      || text.match(/\((\d{2})\)\s*([9]?\d{4}[-\s]?\d{4})/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/^(?:Fone|Tel(?:efone)?|Celular|WhatsApp|Contato)[\s:]*/i, '').trim();
    }

    // E-mail
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }

    // Website
    const siteMatch = text.match(/(?:www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[a-zA-Z0-9.-]+)/i);
    if (siteMatch) {
      website = siteMatch[0].trim();
    }

    // Vendedor / Atendente
    const repMatch = text.match(/(?:Vendedor|Atendente|Consultor|Representante|Emitido\s+por|Resp)[\s:]*([A-Za-zÀ-ÿ\s]{3,40})/i);
    if (repMatch) {
      salesRepresentative = repMatch[1].trim();
    }

    // Razão Social / Fornecedores conhecidos (ex: Rocha Peças Diesel, BHM Diesel)
    if (/Rocha\s+(?:Distribuidora|Pe[çc]as|Comercial)/i.test(text)) {
      name = 'Rocha Distribuidora e Comercial Ltda';
      tradeName = 'Rocha Peças Diesel';
    } else if (/BHM\s+Diesel/i.test(text)) {
      name = 'BHM Diesel Limitada';
      tradeName = 'BHM Diesel';
    } else {
      // Tentar capturar primeiras linhas que costumam conter o nome da empresa
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && !l.startsWith('---'));
      for (const line of lines.slice(0, 8)) {
        if (/LTDA|S\/A|S\.A\.|ME|EPP|DISTRIBUIDORA|AUTO\s*PE[ÇC]AS|DIESEL|COMERCIO|COMERCIAL/i.test(line) && !/CLIENTE|DESTINAT/i.test(line)) {
          name = line.replace(/(?:Raz[ãa]o\s+Social|Empresa|Emitente)[\s:]*/i, '').trim();
          break;
        }
      }
      if (!name && lines.length > 0) {
        name = lines[0].replace(/^(?:OR[ÇC]AMENTO|COTA[ÇC][ÃA]O|PROPOSTA)[\s-]*/i, '').trim();
      }
    }

    // Endereço / CEP / Cidade
    const cepMatch = text.match(/(?:CEP)[\s:]*([0-9]{5}-?[0-9]{3})/i);
    if (cepMatch) zipCode = cepMatch[1].trim();

    const ufMatch = text.match(/(?:[A-Za-zÀ-ÿ\s]+)\s*[\/-]\s*([A-Z]{2})\b/);
    if (ufMatch) state = ufMatch[1].trim();

    const addrMatch = text.match(/(?:End(?:ere[çc]o)?|Rua|Av(?:enida)?|Rod(?:ovia)?)[\s:]*([^,\n\r]+(?:,\s*[\w\sºª\.-]+)*)/i);
    if (addrMatch) {
      fullAddress = addrMatch[0].trim();
    }

    return {
      name: name || 'Fornecedor Identificado no Orçamento',
      tradeName: tradeName || name,
      cnpj,
      phone,
      email,
      website,
      salesRepresentative,
      fullAddress,
      street,
      number,
      neighborhood,
      zipCode,
      city,
      state
    };
  }

  // 3. Dados do Cliente / Destinatário
  private static extractClient(text: string): BudgetClient {
    let name = '';
    let cnpjCpf = '';
    let stateRegistration = '';
    let phone = '';
    let email = '';
    let fullAddress = '';

    // Bloco cliente / destinatário
    const clientBlockMatch = text.match(/(?:CLIENTE|DESTINAT[ÁA]RIO|DADOS\s+DO\s+CLIENTE|FATURAR\s+PARA)[\s\S]{1,500}?(?=(?:ITENS|PRODUTOS|TABELA|VALOR|C[ÓO]DIGO|OBS|$))/i);
    const clientText = clientBlockMatch ? clientBlockMatch[0] : text;

    // Razão Social / Nome do Cliente
    const clientNameMatch = clientText.match(/(?:Raz[ãa]o\s+Social|Nome|Cliente)[\s:]*([A-Za-z0-9À-ÿ\s\.\-&]{4,60})/i);
    if (clientNameMatch && !/CNPJ|ENDERECO|TELEFONE/i.test(clientNameMatch[1])) {
      name = clientNameMatch[1].trim();
    }

    // CNPJ ou CPF do Cliente
    const clientCnpjMatch = clientText.match(/(?:CNPJ|CPF|Inscri[çc][ãa]o)[\s:]*([0-9]{2,3}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}-?[0-9]{2}|[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2})/i);
    if (clientCnpjMatch) {
      cnpjCpf = clientCnpjMatch[1].trim();
    }

    // Inscrição Estadual (IE)
    const ieMatch = clientText.match(/(?:I\.?E\.?|Inscr(?:i[çc][ãa]o)?\s+Estadual)[\s:]*([0-9\.\-\s]{7,18}|ISENTO)/i);
    if (ieMatch) {
      stateRegistration = ieMatch[1].trim();
    }

    // Endereço do Cliente
    const clientAddrMatch = clientText.match(/(?:End(?:ere[çc]o)?|Logradouro)[\s:]*([^,\n\r]+(?:,\s*[\w\sºª\.-]+)*)/i);
    if (clientAddrMatch) {
      fullAddress = clientAddrMatch[1].trim();
    }

    // Telefone e E-mail do cliente
    const clientEmailMatch = clientText.match(/(?:Email|E-mail)[\s:]*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/i);
    if (clientEmailMatch) email = clientEmailMatch[1].trim();

    return {
      name: name || 'Empresa Compradora / Cliente',
      cnpjCpf,
      stateRegistration,
      fullAddress,
      phone,
      email
    };
  }

  // 4. Itens / Produtos Cotados (Tabela de Produtos & Detecção de "NÃO TEMOS")
  private static extractItems(text: string, excelRows?: any[][]): BudgetItem[] {
    const items: BudgetItem[] = [];

    // Se temos linhas estruturadas de Excel
    if (excelRows && excelRows.length > 0) {
      let headerIndex = -1;
      // Localizar linha de cabeçalho de produtos
      for (let i = 0; i < Math.min(excelRows.length, 25); i++) {
        const rowStr = excelRows[i].join(' ').toUpperCase();
        if ((rowStr.includes('DESCRI') || rowStr.includes('PRODUTO') || rowStr.includes('PECA') || rowStr.includes('PEÇA')) && 
            (rowStr.includes('QTD') || rowStr.includes('QUANT') || rowStr.includes('VALOR') || rowStr.includes('PREÇO') || rowStr.includes('PRECO'))) {
          headerIndex = i;
          break;
        }
      }

      const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;
      for (let i = startRow; i < excelRows.length; i++) {
        const row = excelRows[i];
        if (!row || row.length === 0) continue;
        const rowText = row.join(' ');
        if (/TOTAL|SUBTOTAL|CONDIC|PAGAMENTO|OBSERV/i.test(rowText) && items.length > 0) {
          break; // Chegou aos totais
        }

        const isUnavailable = /N[ÃA]O\s+TEMOS|SEM\s+ESTOQUE|INDISPON[IÍ]VEL|FALTA/i.test(rowText);
        const description = row.find(c => typeof c === 'string' && c.length > 4 && !/^\d+$/.test(c)) || `Item ${items.length + 1}`;
        const code = row.find(c => String(c).length >= 3 && /^[A-Za-z0-9\-\.\/]+$/.test(String(c).trim())) || '';
        
        // Encontrar quantidades e preços numéricos
        const numbers = row
          .map(c => parsePtBrNumber(c))
          .filter(n => n > 0);

        let quantity = 1;
        let unitPrice = 0;
        let totalPrice = 0;

        if (numbers.length >= 2) {
          quantity = numbers[0];
          unitPrice = numbers[1];
          totalPrice = numbers.length >= 3 ? numbers[2] : quantity * unitPrice;
        } else if (numbers.length === 1) {
          unitPrice = numbers[0];
          totalPrice = unitPrice;
        }

        const brand = KNOWN_BRANDS.find(b => new RegExp(`\\b${b}\\b`, 'i').test(String(description) + ' ' + rowText)) || '';
        const specsMatch = String(description).match(/\b(STD|0\.25|0\.50|0\.75|1\.00|6\s*CIL|4\s*CIL|DIANT|TRAS|LE|LD)\b/i);

        items.push({
          id: `item-${items.length + 1}`,
          code: String(code).trim(),
          description: String(description).trim(),
          technicalSpecs: specsMatch ? specsMatch[0] : undefined,
          brand,
          quantity: quantity || 1,
          unit: 'UN',
          unitPrice: isUnavailable ? 0 : unitPrice,
          totalPrice: isUnavailable ? 0 : (totalPrice || quantity * unitPrice),
          isAvailable: !isUnavailable,
          unavailableReason: isUnavailable ? 'NÃO TEMOS NO ESTOQUE' : undefined
        });
      }

      if (items.length > 0) return items;
    }

    // Parser baseado em Linhas de Texto (Padrão Rocha Peças / BHM Diesel / outros)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let inItemTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detectar início da tabela
      if (/C[ÓO]DIGO.*DESCRI[ÇC][ÃA]O|DESCRI[ÇC][ÃA]O.*QTD|ITENS\s+COTADOS|PRODUTOS/i.test(line)) {
        inItemTable = true;
        continue;
      }

      // Detectar fim da tabela
      if (inItemTable && /(?:VALOR\s+TOTAL|SUBTOTAL|TOTAL\s+GERAL|CONDI[ÇC][ÕO]ES\s+DE\s+PAGAMENTO|FORMA\s+DE\s+PAGAMENTO|VALIDADE\s+DA\s+PROPOSTA)/i.test(line)) {
        inItemTable = false;
        break;
      }

      // Linha de item com padrão: [Cód] [Descrição] [Marca] [Qtd] [Vl. Unit] [Vl. Total]
      // Ou linha contendo "NÃO TEMOS"
      const isUnavailable = /N[ÃA]O\s+TEMOS|SEM\s+ESTOQUE|INDISPON[IÍ]VEL|EM\s+FALTA/i.test(line);

      // Regex para linha de produto com valores em reais
      // Ex: 014789 JOGO DE PISTAO COM ANEIS STD KS 1,00 850,00 850,00
      // Ex: BR-9874 BUCHA SUSPENSAO DIANTEIRA SUSPENSYS 4 PC 45,50 182,00
      const itemPattern = /(?:^|\s)([A-Za-z0-9\.\-\/]{3,15})\s+([A-Za-zÀ-ÿ0-9\s\/\.\-\+,%]{5,80}?)\s+([0-9]+(?:,[0-9]{1,3})?)\s*(UN|PC|JG|CX|PÇ|M|PAR)?\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i;
      const match = line.match(itemPattern);

      if (match) {
        const code = match[1].trim();
        let desc = match[2].trim();
        const qtd = parsePtBrNumber(match[3]) || 1;
        const unit = match[4] || 'UN';
        const unitPrice = parsePtBrNumber(match[5]);
        const totalPrice = parsePtBrNumber(match[6]);

        // Detectar marca
        const brand = KNOWN_BRANDS.find(b => new RegExp(`\\b${b}\\b`, 'i').test(desc)) || '';
        
        // Detectar especificações (STD, 0.25, etc.)
        const specsMatch = desc.match(/\b(STD|0\.25|0\.50|0\.75|1\.00|6\s*CIL|4\s*CIL|DIANT|TRAS|LE|LD|24V|12V)\b/i);

        items.push({
          id: `item-${items.length + 1}`,
          code,
          description: desc,
          technicalSpecs: specsMatch ? specsMatch[0] : undefined,
          brand,
          quantity: qtd,
          unit,
          unitPrice,
          totalPrice,
          isAvailable: true
        });
      } else if (isUnavailable) {
        // Item indisponível listado
        const cleanDesc = line.replace(/N[ÃA]O\s+TEMOS|SEM\s+ESTOQUE|INDISPON[IÍ]VEL|EM\s+FALTA/gi, '').trim();
        const codeMatch = cleanDesc.match(/^([A-Za-z0-9\.\-\/]{3,15})\s+(.*)/);
        
        items.push({
          id: `item-${items.length + 1}`,
          code: codeMatch ? codeMatch[1] : `IND-${items.length + 1}`,
          description: codeMatch ? codeMatch[2].trim() : (cleanDesc || 'Item Solicitado - Indisponível'),
          quantity: 1,
          unit: 'UN',
          unitPrice: 0,
          totalPrice: 0,
          isAvailable: false,
          unavailableReason: 'NÃO TEMOS (Sem Estoque no Fornecedor)'
        });
      }
    }

    // Se nenhum item foi capturado pelo regex estrito, buscar linhas com valores monetários
    if (items.length === 0) {
      const moneyLines = lines.filter(l => /R\$\s*\d+|\d+,\d{2}/.test(l) && !/TOTAL|SUBTOTAL|DESCONTO|FRETE/i.test(l));
      moneyLines.forEach((l, idx) => {
        const prices = l.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g) || [];
        const isUnav = /N[ÃA]O\s+TEMOS|INDISPON[IÍ]VEL/i.test(l);
        const uPrice = prices.length > 0 ? parsePtBrNumber(prices[0]) : 0;
        const tPrice = prices.length > 1 ? parsePtBrNumber(prices[prices.length - 1]) : uPrice;
        const brand = KNOWN_BRANDS.find(b => new RegExp(`\\b${b}\\b`, 'i').test(l)) || '';

        items.push({
          id: `item-${idx + 1}`,
          code: `PECA-${idx + 1}`,
          description: l.replace(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, '').replace(/R\$/g, '').trim(),
          brand,
          quantity: 1,
          unit: 'UN',
          unitPrice: isUnav ? 0 : uPrice,
          totalPrice: isUnav ? 0 : tPrice,
          isAvailable: !isUnav,
          unavailableReason: isUnav ? 'NÃO TEMOS' : undefined
        });
      });
    }

    return items;
  }

  // 5. Totais e Informações Financeiras
  private static extractTotals(text: string, items: BudgetItem[]): BudgetFinancialTotals {
    let freightValue = 0;
    let freightType = 'CIF_INCLUSO';
    let otherExpenses = 0;
    let totalAmount = 0;
    let paymentTerms = 'BOL 30,60,90 DIAS';

    // Frete
    const freightMatch = text.match(/(?:Frete|Valor\s+do\s+Frete)[\s:]*(?:R\$\s*)?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|CIF|FOB|GR[ÁA]TIS|ISENTO|0(?:,00)?)/i);
    if (freightMatch) {
      const valStr = freightMatch[1].toUpperCase();
      if (valStr.includes('FOB')) freightType = 'FOB_POR_CONTA_CLIENTE';
      else if (valStr.includes('CIF') || valStr.includes('GRÁTIS') || valStr.includes('ISENTO')) freightType = 'CIF_INCLUSO';
      else {
        freightValue = parsePtBrNumber(valStr);
      }
    }

    // Outras despesas / Acréscimos
    const expensesMatch = text.match(/(?:Outras\s+Despesas|Acr[ée]scimos|IPI|ST|Impostos|Taxas)[\s:]*(?:R\$\s*)?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i);
    if (expensesMatch) {
      otherExpenses = parsePtBrNumber(expensesMatch[1]);
    }

    // Valor Total Geral
    const totalMatch = text.match(/(?:Valor\s+Total\s+Geral|Total\s+Geral|Total\s+do\s+Or[çc]amento|Valor\s+L[íi]quido|Total)[\s:]*(?:R\$\s*)?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i);
    if (totalMatch) {
      totalAmount = parsePtBrNumber(totalMatch[1]);
    } else {
      // Calcular soma dos itens disponíveis
      totalAmount = items.reduce((acc, it) => acc + (it.isAvailable ? it.totalPrice : 0), 0) + freightValue + otherExpenses;
    }

    // Condição / Forma de Pagamento (ex: BOL 30,60,90,120,150 ou À VISTA, 28 DDL, etc.)
    const termsMatch = text.match(/(?:Condi[çc][ãa]o\s+(?:de\s+)?Pagamento|Forma\s+de\s+Pagamento|Cond\.\s*Pagto|Pagamento)[\s:]*([A-Za-z0-9\s,\/\+–-]+?)(?=(?:\n|\r|Validade|Prazo|Obs|$))/i)
      || text.match(/\b(BOL\s+[0-9,\s\/]+|BOLETO\s+[0-9,\s\/]+|FATURADO\s+[0-9\s]+DIAS|[ÀA]\s*VISTA|PIX|30\/60\/90|28\s*DDL)\b/i);

    if (termsMatch) {
      paymentTerms = termsMatch[1].trim();
    }

    const totalItemsQuantity = items.reduce((acc, it) => acc + (it.isAvailable ? it.quantity : 0), 0);

    return {
      freightValue,
      freightType,
      otherExpenses,
      totalItemsQuantity,
      totalAmount,
      paymentTerms
    };
  }

  // 6. Observações e Condições Comerciais
  private static extractCommercial(text: string, items: BudgetItem[]): BudgetCommercialTerms {
    let validity = 'Válido por 24 horas';
    let deliveryTime = 'Imediato / Pronta Entrega';
    let generalNotes = '';
    let warranty = 'Garantia legal de 90 dias / Fabricante';

    // Validade da proposta
    const validityMatch = text.match(/(?:Validade(?:\s+da\s+Proposta|\s+do\s+Or[çc]amento)?|V[áa]lido\s+por|Prazo\s+de\s+Validade)[\s:]*([^\n\r,;]{3,60})/i)
      || text.match(/\b(V[áa]lido\s+por\s+\d+\s*(?:horas|dias)|Enquanto\s+durarem\s+nossos\s+estoques|24\s*horas|48\s*horas)\b/i);

    if (validityMatch) {
      validity = validityMatch[1].trim();
    }

    // Prazo de Entrega
    const deliveryMatch = text.match(/(?:Prazo\s+de\s+Entrega|Entrega|Previs[ãa]o)[\s:]*([^\n\r,;]{3,50})/i);
    if (deliveryMatch) {
      deliveryTime = deliveryMatch[1].trim();
    }

    // Garantia
    const warrantyMatch = text.match(/(?:Garantia)[\s:]*([^\n\r,;]{3,50})/i);
    if (warrantyMatch) {
      warranty = warrantyMatch[1].trim();
    }

    // Itens Indisponíveis / "NÃO TEMOS"
    const unavailableItemsSummary = items
      .filter(it => !it.isAvailable)
      .map(it => `${it.code ? `[${it.code}] ` : ''}${it.description} (${it.unavailableReason || 'NÃO TEMOS'})`);

    // Observações Gerais
    const obsMatch = text.match(/(?:Observa[çc][õo]es|OBS\.?|Condi[çc][õo]es\s+Gerais)[\s:]*([\s\S]{1,400}?)(?=(?:TOTAL|VALOR|$))/i);
    if (obsMatch) {
      generalNotes = obsMatch[1].trim();
    }

    return {
      validity,
      deliveryTime,
      unavailableItemsSummary,
      generalNotes,
      warranty
    };
  }
}
