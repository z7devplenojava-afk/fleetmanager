import * as XLSX from 'xlsx';

export interface ParsedSupplierRow {
  id: string;
  name: string;
  tradeName?: string;
  contactName?: string;
  registrationNumber?: string;
  cnpj?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  notes?: string;
  isValid: boolean;
  validationIssues?: string[];
}

export interface ColumnMappingInfo {
  fileColumn: string;
  dbColumn: string;
  dbFieldLabel: string;
  status: 'MAPPED' | 'OPTIONAL' | 'IGNORED';
  confidence: number;
}

export interface SupplierParseResult {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'csv';
  totalRows: number;
  validRows: number;
  columnsMapping: ColumnMappingInfo[];
  detectedDbColumns: string[];
  rows: ParsedSupplierRow[];
  rawTextPreview?: string;
}

// Helpers de formatação e normalização
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatCpfCnpjString(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  } else if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return raw.trim();
}

export function formatPhoneString(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  return raw.trim();
}

/**
 * Parser de texto de PDF usando pdfjs-dist
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfjsLib = await import('pdfjs-dist');
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
      fullText += `\n--- PÁGINA ${i} ---\n` + pageText;
    }
    return fullText;
  } catch (error) {
    console.warn('Fallback: PDF parser standard error, trying text stream buffer decoder', error);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  }
}

/**
 * Parser de planilhas Excel (.xlsx, .xls, .csv)
 */
async function extractFromExcel(file: File): Promise<{ rows: any[][]; headers: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!jsonData || jsonData.length === 0) {
    return { rows: [], headers: [] };
  }

  // Localizar linha de cabeçalho
  let headerIndex = 0;
  for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row)) continue;
    const rowStr = row.map(c => normalizeText(String(c || ''))).join(' ');
    if (rowStr.includes('nome') || rowStr.includes('nomcad') || rowStr.includes('nomres') || rowStr.includes('cnpj') || rowStr.includes('cpf') || rowStr.includes('fornecedor') || rowStr.includes('razao') || rowStr.includes('endereco') || rowStr.includes('endcad') || rowStr.includes('email')) {
      headerIndex = i;
      break;
    }
  }

  const headers = (jsonData[headerIndex] || []).map(c => String(c || '').trim());
  const dataRows = jsonData.slice(headerIndex + 1).filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''));

  return { rows: dataRows, headers };
}

function isHeaderMatch(norm: string, keys: string[]): boolean {
  return keys.some((k) => norm === k || norm.includes(k));
}

/** Monta endereço completo a partir de logradouro, número, complemento e bairro. */
export function composeSupplierAddress(
  street: string,
  number?: string,
  complement?: string,
  neighborhood?: string
): string {
  const parts = [
    (street || '').trim(),
    (number || '').trim(),
    (complement || '').trim(),
    (neighborhood || '').trim()
  ].filter(Boolean);
  if (parts.length === 0) return '';
  // Evita repetir se o logradouro já contém número/complemento/bairro
  const base = parts[0];
  const rest = parts.slice(1).filter((p) => !normalizeText(base).includes(normalizeText(p)));
  return [base, ...rest].join(', ');
}

/** Preferência de telefone: celular > telefone fixo. */
export function pickSupplierPhone(tel?: string, cel?: string): string {
  const t = (tel || '').trim();
  const c = (cel || '').trim();
  return c || t || '';
}

/**
 * Monta notas com inscrições sem coluna própria dedicada (ex.: IM).
 * Inscrição Estadual vai para registrationNumber (coluna do banco).
 */
export function composeSupplierNotes(
  baseNotes: string,
  municipalRegistration?: string,
  stateRegistration?: string
): string {
  const notes: string[] = [];
  const base = (baseNotes || '').trim();
  if (base) notes.push(base);
  const im = (municipalRegistration || '').trim();
  if (im && !normalizeText(base).includes(normalizeText(im))) {
    notes.push(`Inscrição Municipal: ${im}`);
  }
  const ie = (stateRegistration || '').trim();
  if (ie && !normalizeText(base).includes(normalizeText(ie))) {
    notes.push(`Inscrição Estadual: ${ie}`);
  }
  return notes.join(' | ');
}

export class SupplierImportParser {
  /**
   * Analisa e extrai dados do arquivo enviado (PDF ou Excel)
   */
  static async parseFile(file: File): Promise<SupplierParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = extension === 'pdf';
    const isExcel = extension === 'xlsx' || extension === 'xls' || extension === 'csv';

    if (isPdf) {
      return this.parsePdfFile(file);
    } else if (isExcel) {
      return this.parseExcelFile(file);
    } else {
      throw new Error(`Formato de arquivo não suportado: .${extension}. Envie um arquivo PDF (.pdf) ou Excel (.xlsx, .xls, .csv).`);
    }
  }

  /**
   * Processamento de PDF de fornecedores
   */
  private static async parsePdfFile(file: File): Promise<SupplierParseResult> {
    const rawText = await extractTextFromPdf(file);
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const rows: ParsedSupplierRow[] = [];
    const detectedDbColumns = ['name', 'cnpj', 'address', 'phone', 'city', 'state', 'zipCode'];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (/^--- P[ÁA]GINA/i.test(line)) continue;
      if (/NOME.*CPFCNPJ|FORNECEDOR.*CNPJ|RELAT[ÓO]RIO/i.test(line)) continue;

      // Padrão estruturado de tabela em PDF:
      // [NOME] [CPF/CNPJ (11 a 14 digitos)] [ENDEREÇO opcional] [TELEFONE opcional]
      // Ex: ARAXA TRUCK CENTER (KAMILA FLAVIA RODRIGUES DONADELI) 54426642000186
      // Ex: 040 MOTORS CENTRO AUTOMOTIVO LTDA 66603500000126 3135813532
      // Ex: 1000 MAX PRODUTOS DE LIMPEZA E DESCARTAVEIS LTDA 37414815000127 R BERNARDO MONTEIRO, 946...
      const docMatch = line.match(/\b([0-9]{11,14}|[0-9]{2,3}\.[0-9]{3}\.[0-9]{3}(?:\/[0-9]{4}-[0-9]{2}|-[0-9]{2}))\b/);

      if (docMatch && docMatch.index !== undefined) {
        const rawDoc = docMatch[1];
        const namePart = line.substring(0, docMatch.index).trim();
        const afterDoc = line.substring(docMatch.index + rawDoc.length).trim();

        // Verificar se tem telefone no final
        let phone = '';
        let address = afterDoc;
        const phoneMatch = afterDoc.match(/(\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}|\b\d{8,11}\b)$/);
        if (phoneMatch) {
          phone = phoneMatch[1].trim();
          address = afterDoc.substring(0, phoneMatch.index).trim();
        }

        // Tentar extrair CEP do endereço
        let zipCode = '';
        const cepMatch = address.match(/CEP\.?:?\s*(\d{5}-?\d{3}|\d{8})/i);
        if (cepMatch) {
          zipCode = cepMatch[1].trim();
        }

        // Tentar extrair Cidade e UF
        let city = '';
        let state = '';
        const ufMatch = address.match(/\b([A-Za-z\s]+)\s*[\/-]\s*([A-Z]{2})\b/);
        if (ufMatch) {
          city = ufMatch[1].trim();
          state = ufMatch[2].trim();
        }

        if (namePart && namePart.length >= 2) {
          rows.push({
            id: `row-${rows.length + 1}`,
            name: namePart,
            cnpj: formatCpfCnpjString(rawDoc),
            phone: formatPhoneString(phone),
            address: address || undefined,
            zipCode: zipCode || undefined,
            city: city || undefined,
            state: state || undefined,
            isValid: true
          });
        }
      } else if (line.length > 4 && !line.includes('Página') && !line.includes('Total') && !line.includes('Emitido em')) {
        // Linha com apenas nome
        rows.push({
          id: `row-${rows.length + 1}`,
          name: line,
          isValid: true,
          validationIssues: ['Sem documento CPF/CNPJ identificado (será cadastrado como pendente)']
        });
      }
    }

    const columnsMapping: ColumnMappingInfo[] = [
      { fileColumn: 'Nome / Razão Social', dbColumn: 'name', dbFieldLabel: 'Nome (Obrigatório)', status: 'MAPPED', confidence: 100 },
      { fileColumn: 'CPF / CNPJ', dbColumn: 'cnpj', dbFieldLabel: 'CPF / CNPJ', status: 'MAPPED', confidence: 100 },
      { fileColumn: 'ENDEREÇO + NUMERO + COMPLEMENTO + BAIRRO', dbColumn: 'address', dbFieldLabel: 'Endereço (composto)', status: 'MAPPED', confidence: 95 },
      { fileColumn: 'TEL / CEL', dbColumn: 'phone', dbFieldLabel: 'Telefone (CEL preferido)', status: 'MAPPED', confidence: 95 },
      { fileColumn: 'EMAIL', dbColumn: 'email', dbFieldLabel: 'E-mail', status: 'MAPPED', confidence: 90 },
      { fileColumn: 'INSCRIÇÃO ESTADUAL', dbColumn: 'registration_number', dbFieldLabel: 'Inscrição Estadual', status: 'MAPPED', confidence: 95 },
      { fileColumn: 'INSCRIÇÃO MUNICIPAL', dbColumn: 'notes', dbFieldLabel: 'Inscrição Municipal (Notas)', status: 'MAPPED', confidence: 90 },
      { fileColumn: 'Cidade / Estado', dbColumn: 'city, state', dbFieldLabel: 'Cidade & Estado', status: 'MAPPED', confidence: 85 }
    ];

    return {
      fileName: file.name,
      fileType: 'pdf',
      totalRows: rows.length,
      validRows: rows.filter(r => r.isValid).length,
      columnsMapping,
      detectedDbColumns,
      rows,
      rawTextPreview: lines.slice(0, 15).join('\n')
    };
  }

  /**
   * Processamento de Excel de fornecedores
   */
  private static async parseExcelFile(file: File): Promise<SupplierParseResult> {
    const { rows: dataRows, headers } = await extractFromExcel(file);
    const columnsMapping: ColumnMappingInfo[] = [];

    // Mapeamento dinâmico de colunas
    const colIndexMap: { [key: string]: number } = {};

    headers.forEach((h, idx) => {
      const norm = normalizeText(h);
      if (!norm) return;

      // Ordem importa: colunas mais específicas primeiro
      if (isHeaderMatch(norm, ['inscricao estadual', 'inscricao est', 'insc estadual']) || norm === 'ie') {
        colIndexMap['stateRegistration'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'registration_number', dbFieldLabel: 'Inscrição Estadual', status: 'MAPPED', confidence: 100 });
      } else if (isHeaderMatch(norm, ['inscricao municipal', 'inscricao mun', 'insc municipal']) || norm === 'im') {
        colIndexMap['municipalRegistration'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'notes', dbFieldLabel: 'Inscrição Municipal (gravada em Notas)', status: 'MAPPED', confidence: 95 });
      } else if (isHeaderMatch(norm, ['codigo fornec', 'cod_fornec']) || norm === 'codigo' || norm === 'cod') {
        if (colIndexMap['registrationNumber'] === undefined) {
          colIndexMap['registrationNumber'] = idx;
          columnsMapping.push({ fileColumn: h, dbColumn: 'registration_number', dbFieldLabel: 'Nº Cadastro / Inscrição', status: 'MAPPED', confidence: 95 });
        }
      } else if (norm.includes('cnpj') || norm.includes('cpf') || norm.includes('documento')) {
        if (colIndexMap['cnpj'] === undefined) {
          colIndexMap['cnpj'] = idx;
          columnsMapping.push({ fileColumn: h, dbColumn: 'cnpj', dbFieldLabel: 'CPF / CNPJ', status: 'MAPPED', confidence: 100 });
        }
      } else if (isHeaderMatch(norm, ['celular', 'cell', 'whatsapp']) || norm === 'cel') {
        colIndexMap['mobile'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'phone', dbFieldLabel: 'Celular (preferido no campo Telefone)', status: 'MAPPED', confidence: 100 });
      } else if (isHeaderMatch(norm, ['telefone', 'tel.', 'fone']) || norm === 'tel') {
        if (colIndexMap['phone'] === undefined) {
          colIndexMap['phone'] = idx;
          columnsMapping.push({ fileColumn: h, dbColumn: 'phone', dbFieldLabel: 'Telefone', status: 'MAPPED', confidence: 95 });
        }
      } else if (isHeaderMatch(norm, ['contato', 'representante']) || norm === 'nomcnt') {
        colIndexMap['contactName'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'contact_name', dbFieldLabel: 'Contato', status: 'MAPPED', confidence: 90 });
      } else if (isHeaderMatch(norm, ['complemento', 'compl.']) || norm === 'cmplto') {
        colIndexMap['complement'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'address', dbFieldLabel: 'Complemento (no Endereço)', status: 'MAPPED', confidence: 100 });
      } else if (isHeaderMatch(norm, ['bairro', 'distrito']) || norm === 'bai') {
        colIndexMap['neighborhood'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'address', dbFieldLabel: 'Bairro (no Endereço)', status: 'MAPPED', confidence: 100 });
      } else if (isHeaderMatch(norm, ['numero', 'número', 'nro', 'n°', 'no ']) || norm === 'nº' || norm === 'num' || norm === 'numcad') {
        colIndexMap['number'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'address', dbFieldLabel: 'Número (no Endereço)', status: 'MAPPED', confidence: 100 });
      } else if (isHeaderMatch(norm, ['endereco', 'endereço', 'logradouro', 'rua', 'avenida', 'av.']) || norm === 'endcad') {
        if (colIndexMap['address'] === undefined && colIndexMap['street'] === undefined) {
          colIndexMap['street'] = idx;
          colIndexMap['address'] = idx;
          columnsMapping.push({ fileColumn: h, dbColumn: 'address', dbFieldLabel: 'Endereço', status: 'MAPPED', confidence: 100 });
        }
      } else if (norm.includes('email') || norm.includes('e-mail')) {
        colIndexMap['email'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'email', dbFieldLabel: 'E-mail', status: 'MAPPED', confidence: 100 });
      } else if (norm.includes('cidade') || norm.includes('municipio')) {
        colIndexMap['city'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'city', dbFieldLabel: 'Cidade', status: 'MAPPED', confidence: 95 });
      } else if (norm.includes('uf') || norm.includes('estado')) {
        colIndexMap['state'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'state', dbFieldLabel: 'Estado (UF)', status: 'MAPPED', confidence: 95 });
      } else if (norm.includes('cep')) {
        colIndexMap['zipCode'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'zip_code', dbFieldLabel: 'CEP', status: 'MAPPED', confidence: 95 });
      } else if (norm.includes('observ') || norm.includes('obs') || norm.includes('nota')) {
        colIndexMap['notes'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'notes', dbFieldLabel: 'Observações', status: 'MAPPED', confidence: 80 });
      } else if (norm.includes('fantasia') || isHeaderMatch(norm, ['nome fantasia', 'apelido'])) {
        colIndexMap['tradeName'] = idx;
        columnsMapping.push({ fileColumn: h, dbColumn: 'trade_name', dbFieldLabel: 'Nome Fantasia', status: 'MAPPED', confidence: 95 });
      } else if (norm.includes('razao') || norm === 'nome' || norm.startsWith('nome ') || norm.includes('nome do fornecedor') || norm.includes('fornecedor') || norm === 'nomcad' || norm === 'nomres') {
        // Prioriza "Razão Social" / "Nome" para o campo name (dois-passos abaixo se houver ambos)
        if (colIndexMap['name'] === undefined) {
          colIndexMap['name'] = idx;
          columnsMapping.push({ fileColumn: h, dbColumn: 'name', dbFieldLabel: 'Nome / Razão Social (Obrigatório)', status: 'MAPPED', confidence: 100 });
        } else if (colIndexMap['tradeName'] === undefined && norm.includes('razao')) {
          // Se Nome já mapeado e apareceu Razão Social depois, Razão Social vira name principal e Nome vira trade
          const prevName = colIndexMap['name'];
          colIndexMap['tradeName'] = prevName;
          colIndexMap['name'] = idx;
        }
      } else {
        columnsMapping.push({ fileColumn: h, dbColumn: 'notes', dbFieldLabel: 'Informação Adicional (Armazenado em Notas)', status: 'OPTIONAL', confidence: 50 });
      }
    });

    const rows: ParsedSupplierRow[] = [];

    dataRows.forEach((row, idx) => {
      const getVal = (field: string) => {
        const index = colIndexMap[field];
        if (index === undefined || row[index] === undefined || row[index] === null) return '';
        const s = String(row[index]).trim();
        return s.toLowerCase() === 'null' ? '' : s;
      };

      let name = getVal('name');
      const tradeName = getVal('tradeName');
      const contactName = getVal('contactName');
      const regNumber = getVal('registrationNumber');
      const rawDoc = getVal('cnpj');
      const street = getVal('street') || getVal('address');
      const number = getVal('number');
      const complement = getVal('complement');
      const neighborhood = getVal('neighborhood');
      const tel = getVal('phone');
      const cel = getVal('mobile');
      const phone = pickSupplierPhone(tel, cel);
      const email = getVal('email');
      const city = getVal('city');
      const state = getVal('state');
      const zipCode = getVal('zipCode');
      const notesRaw = getVal('notes');
      const stateRegistration = getVal('stateRegistration');
      const municipalRegistration = getVal('municipalRegistration');

      if (!name && tradeName) {
        name = tradeName;
      }

      const address = composeSupplierAddress(street, number, complement, neighborhood);
      // Inscrição Estadual prioriza registration_number do banco; IM vai para notes
      const registrationNumber = stateRegistration || regNumber || undefined;
      const notes =
        composeSupplierNotes(notesRaw, municipalRegistration, stateRegistration) ||
        (regNumber && !stateRegistration ? `NUMCAD: ${regNumber}` : undefined) ||
        undefined;

      if (name && name.length >= 2) {
        rows.push({
          id: `row-${idx + 1}`,
          name,
          tradeName: tradeName || undefined,
          contactName: contactName || undefined,
          registrationNumber,
          cnpj: formatCpfCnpjString(rawDoc) || undefined,
          address: address || undefined,
          street: street || undefined,
          number: number || undefined,
          complement: complement || undefined,
          neighborhood: neighborhood || undefined,
          phone: formatPhoneString(phone) || undefined,
          mobile: cel ? formatPhoneString(cel) || undefined : undefined,
          email: email || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
          stateRegistration: stateRegistration || undefined,
          municipalRegistration: municipalRegistration || undefined,
          notes: notes || undefined,
          isValid: true
        });
      }
    });

    return {
      fileName: file.name,
      fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
      totalRows: rows.length,
      validRows: rows.filter(r => r.isValid).length,
      columnsMapping,
      detectedDbColumns: Object.keys(colIndexMap),
      rows,
      rawTextPreview: headers.join(' | ') + '\n' + dataRows.slice(0, 5).map(r => r.join(' | ')).join('\n')
    };
  }
}
