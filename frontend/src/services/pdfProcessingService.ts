/**
 * Serviço para processamento de PDFs relacionados a funcionários
 * Extrai dados de documentos como carteira de trabalho, documentos pessoais, etc.
 */

export interface EmployeeDataFromPDF {
  name?: string;
  cpf?: string;
  rg?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  position?: string;
  admissionDate?: string;
  hireDate?: string;
  salary?: string;
  contractType?: string;
  workHours?: string; // horário de trabalho
  observations?: string; // observações
  notes?: string;
  nationality?: string;
  maritalStatus?: string;
  city?: string;
  cep?: string;
  tituloEleitor?: string;
  tituloEleitorZona?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  cnhNumber?: string;
  certificadoMilitar?: string;
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  grauInstrucao?: string;
  cbo?: string;
  salarioPorExtenso?: string;
  periodoPagamento?: string;
  horarioTrabalho?: string;
  folgaSemanal?: string;
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  pis?: string;
  pisDataCadastro?: string;
  pisBancoDepositario?: string;
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  vistoFiscalizacao?: string;
  spouseName?: string;
  spouseCpf?: string;
  spouseRg?: string;
  spouseBirthDate?: string;
  spouseProfession?: string;
  spousePhone?: string;
  dependents?: Array<{ name: string; relationship: string; birthDate: string; cpf?: string; rg?: string }>; 
  extractedFields: Record<string, any>;
}

export interface PDFProcessingResult {
  success: boolean;
  data?: EmployeeDataFromPDF;
  error?: string;
  confidence?: number;
  processingTime?: number;
}

class PDFProcessingService {
  
  /**
   * Processa um arquivo PDF e extrai dados do funcionário
   */
  async processEmployeePDF(file: File): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Simular processamento de PDF (implementação real usaria bibliotecas como pdf-parse ou Tesseract.js)
      const extractedData = await this.extractTextFromPDF(file);
      const employeeData = this.parseEmployeeData(extractedData);
      // Normalizações adicionais esperadas pelo formulário
      employeeData.hireDate = employeeData.admissionDate || employeeData.hireDate;
      employeeData.notes = employeeData.observations || employeeData.notes;
      employeeData.horarioTrabalho = employeeData.workHours || employeeData.horarioTrabalho;
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: employeeData,
        confidence: this.calculateConfidence(employeeData),
        processingTime
      };
      
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Compat: usado pelo modal de Novo Funcionário
   * Mantém a mesma assinatura esperada e reaproveita o processamento base
   */
  async processEmployeeRegistrationPDF(file: File): Promise<PDFProcessingResult> {
    return this.processEmployeePDF(file);
  }

  /**
   * Extrai texto do PDF (simulação)
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    // Em uma implementação real, aqui usaria bibliotecas como:
    // - pdf-parse para extrair texto
    // - Tesseract.js para OCR em PDFs com imagens
    // - PDF.js para renderização e extração
    
    return new Promise((resolve) => {
      // Simular delay de processamento
      setTimeout(() => {
        // Texto simulado baseado em documentos típicos
        const simulatedText = `
        FICHA DE REGISTRO DOS EMPREGADOS - Frente
        Da firma: PROMOVER TERCEIRIZACAO & SERVICOS LTDA
        Endereço: Rua Pelegrino de Paula Ferreira, 77
        CNPJ / CEI : 36.888.521/0001-01
        VISTO DA FISCALIZAÇÃO: ----
        
        Nome: João Silva Santos
        C.T.P.S. n.: 70055848 00082
        C.T.P.S (Rural) n.: 
        C.P.F. / C.I.C n.: 123.456.789-00
        Título de Eleitor n.: 2211936552030 zona: 319 seção: 020
        C. Identidade n.: MG21178043 Órgão Emissor: SSP  Data: 01/01/2003
        foi admitido em: 16 de maio de 2025 para exercer a função de: Porteiro
        CBO: 517410
        com o salário de: R$ 2.134,80 (Dois Mil, Cento e Trinta e Quatro Reais e Oitenta Centavos)
        Por: Mês  no seguinte horário de trabalho: 44 horas semanais
        FOLGA SEMANAL: Domingo
        
        SITUAÇÃO PERANTE O FGTS
        É optante? Sim  Data da opção: 16/05/2025  Data da retratação:  
        Banco depositário: Banco do Brasil
        
        Nacionalidade: Brasil
        Filho de: JOAO BATISTA PEREIRA RODRIGUES e de: SHIRLEY FERREIRA GONCALVES
        nascido em: Betim  a 13/12/1998  Estado civil: Solteiro
        Residência: BECO CRISTIALIA, 98 - SANTO ANTONIO  CEP: 32684-102
        Cart. Nac. Habilitação n.º: 00000000000  Cat.: B  Validade: 10/10/2030
        
        PROGRAMA DE INTEGRAÇÃO SOCIAL (PIS)
        Cadastrado em: 10/01/2020  sob n°: 154474923339  dep. no Banco: 001
        Nome do Banco: Banco do Brasil
        Endereço: Av. Brasil, 1000
        Código Banco: 001  Código agência: 1234
        
        Carteira modelo 19 n.º:  
        Nº Registro Geral:  
        Casado(a) c/ bras.?  
        Nome do Cônjuge:  
        Tem filhos brasileiros?  
        Quantos:  
        Data de chegada ao Brasil:  
        Naturalizado:  
        Decreto:  
        Observações: Funcionário contratado para reforço da equipe de segurança.
        `;
        resolve(simulatedText);
      }, 2000); // 2 segundos de simulação
    });
  }

  /**
   * Parseia os dados extraídos do texto
   */
  private parseEmployeeData(text: string): EmployeeDataFromPDF {
    const extractedFields: Record<string, any> = {};
    
    // Regex patterns para extrair dados
    const patterns = {
      name: /Nome[:\s]+([^\n\r]+)/i,
      cpf: /CPF[:\s]+([\d.-]+)/i,
      rg: /RG[:\s]+([\d.-]+)/i,
      email: /Email[:\s]+([^\n\r\s]+@[^\n\r\s]+)/i,
      phone: /Telefone[:\s]+([^\n\r]+)/i,
      birthDate: /Data de Nascimento[:\s]+([^\n\r]+)/i,
      address: /Endere[çc]o[:\s]+([^\n\r]+)/i,
      position: /Cargo[:\s]+([^\n\r]+)/i,
      admissionDate: /Data de Admiss[aã]o[:\s]+([^\n\r]+)/i,
      salary: /Sal[aá]rio[:\s]+([^\n\r]+)/i,
      contractType: /Tipo de Contrato[:\s]+([^\n\r]+)/i,
      workHours: /(Jornada de Trabalho|hor[áa]rio de trabalho)[:\s]+([^\n\r]+)/i,
      observations: /Observa[çc][õo]es[:\s]+([^\n\r]+)/i,
      cbo: /CBO[:\s]+([\d.]+)/i,
      fgtsOptante: /[ÉE]\s*optante\?\s*(Sim|N[aã]o)/i,
      fgtsDataOpcao: /Data da op[cç][aã]o[:\s]+([^\n\r]+)/i,
      fgtsDataRetratacao: /Data da retrata[cç][aã]o[:\s]+([^\n\r]+)/i,
      fgtsBancoDepositario: /Banco deposit[aá]rio[:\s]+([^\n\r]+)/i,
      empresaNome: /Da firma[:\s]+([^\n\r]+)/i,
      empresaEndereco: /Endere[çc]o[:\s]+([^\n\r]+)/i,
      empresaCnpj: /CNPJ\s*\/\s*CEI\s*[:\s]+([^\n\r]+)/i,
      tituloEleitor: /T[íi]tulo de Eleitor n\.?[:\s]+([^\n\r]+)/i,
      tituloEleitorZona: /zona\s*[:\s]+([^\n\r]+)/i,
      tituloEleitorSecao: /se[cç][aã]o\s*[:\s]+([^\n\r]+)/i,
      carteiraIdentidade: /C\.\s*Identidade\s*n\.?[:\s]+([^\n\r]+)/i,
      carteiraIdentidadeOrgaoEmissor: /[ÓO]rg[ãa]o\s*Emissor[:\s]+([^\n\r]+)/i,
      carteiraIdentidadeDataEmissao: /C\.\s*Identidade.*?Data[:\s]+([^\n\r]+)/i,
      cnhNumber: /Cart\.\s*Nac\.\s*Habilita[çc][aã]o.*?n[ºo]\.?:\s*([^\n\r]+)/i,
      cnhCategory: /Cat\.?:\s*([^\n\r]+)/i,
      cnhExpirationDate: /Validade[:\s]+([^\n\r]+)/i,
      folgaSemanal: /FOLGA\s+SEMANAL[:\s]+([^\n\r]+)/i,
      cep: /CEP[:\s]+([^\n\r]+)/i,
      pisDataCadastro: /Cadastrado\s*em[:\s]+([^\n\r]+)/i,
      pis: /sob\s*n[ºo]\s*[:\s]+([^\n\r]+)/i,
      pisBancoDepositario: /dep\.\s*no\s*Banco[:\s]+([^\n\r]+)/i,
      pisEnderecoBanco: /Endere[çc]o[:\s]+([^\n\r]+)/i,
      pisCodigoBanco: /C[óo]digo\s*Banco[:\s]+([^\n\r]+)/i,
      pisCodigoAgencia: /C[óo]digo\s*ag[êe]ncia[:\s]+([^\n\r]+)/i,
    } as const;

    // Extrair cada campo
    Object.entries(patterns).forEach(([field, pattern]) => {
      const match = text.match(pattern as RegExp);
      if (match && match[1]) {
        // workHours usa grupo 2 quando a regex tem duas alternativas
        const value = match[2] ? match[2] : match[1];
        extractedFields[field] = value.trim();
      }
    });

    return {
      name: extractedFields.name,
      cpf: extractedFields.cpf,
      rg: extractedFields.rg,
      email: extractedFields.email,
      phone: extractedFields.phone,
      birthDate: extractedFields.birthDate,
      address: extractedFields.address,
      position: extractedFields.position,
      admissionDate: extractedFields.admissionDate,
      hireDate: extractedFields.admissionDate,
      salary: extractedFields.salary,
      contractType: extractedFields.contractType,
      workHours: extractedFields.workHours,
      horarioTrabalho: extractedFields.workHours,
      observations: extractedFields.observations,
      notes: extractedFields.observations,
      // Campos adicionais mapeados
      cbo: extractedFields.cbo,
      fgtsOptante: ((): boolean | undefined => {
        if (!extractedFields.fgtsOptante) return undefined;
        const v = String(extractedFields.fgtsOptante).toLowerCase();
        return v.includes('sim') ? true : v.includes('n') ? false : undefined;
      })(),
      fgtsDataOpcao: extractedFields.fgtsDataOpcao,
      fgtsDataRetratacao: extractedFields.fgtsDataRetratacao,
      fgtsBancoDepositario: extractedFields.fgtsBancoDepositario,
      empresaNome: extractedFields.empresaNome,
      empresaEndereco: extractedFields.empresaEndereco,
      empresaCnpj: extractedFields.empresaCnpj,
      tituloEleitor: extractedFields.tituloEleitor,
      tituloEleitorZona: extractedFields.tituloEleitorZona,
      tituloEleitorSecao: extractedFields.tituloEleitorSecao,
      carteiraIdentidade: extractedFields.carteiraIdentidade,
      carteiraIdentidadeOrgaoEmissor: extractedFields.carteiraIdentidadeOrgaoEmissor,
      carteiraIdentidadeDataEmissao: extractedFields.carteiraIdentidadeDataEmissao,
      cnhNumber: extractedFields.cnhNumber,
      cnhCategory: extractedFields.cnhCategory,
      cnhExpirationDate: extractedFields.cnhExpirationDate,
      folgaSemanal: extractedFields.folgaSemanal,
      cep: extractedFields.cep,
      pisDataCadastro: extractedFields.pisDataCadastro,
      pis: extractedFields.pis,
      pisBancoDepositario: extractedFields.pisBancoDepositario,
      pisEnderecoBanco: extractedFields.pisEnderecoBanco,
      pisCodigoBanco: extractedFields.pisCodigoBanco,
      pisCodigoAgencia: extractedFields.pisCodigoAgencia,
      extractedFields
    };
  }

  /**
   * Calcula a confiança na extração baseada na quantidade de campos encontrados
   */
  private calculateConfidence(data: EmployeeDataFromPDF): number {
    const totalFields = 13; // Total de campos esperados
    const foundFields = Object.values(data).filter(value => 
      value && typeof value === 'string' && value.trim().length > 0
    ).length;
    
    return Math.round((foundFields / totalFields) * 100);
  }

  /**
   * Valida se os dados extraídos são válidos
   */
  validateExtractedData(data: EmployeeDataFromPDF): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar CPF
    if (data.cpf && !this.isValidCPF(data.cpf)) {
      errors.push('CPF inválido');
    }

    // Validar email
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email inválido');
    }

    // Validar telefone
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Telefone inválido');
    }

    // Validar campos obrigatórios
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida CPF
   */
  private isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Algoritmo de validação do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida telefone
   */
  private isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  /**
   * Formata dados extraídos para uso no formulário
   */
  formatForForm(data: EmployeeDataFromPDF): Record<string, any> {
    return {
      name: data.name || '',
      cpf: data.cpf || '',
      rg: data.rg || '',
      email: data.email || '',
      phone: data.phone || '',
      birthDate: data.birthDate ? this.formatDate(data.birthDate) : '',
      address: data.address || '',
      position: data.position || '',
      admissionDate: data.admissionDate ? this.formatDate(data.admissionDate) : '',
      salary: data.salary || '',
      contractType: data.contractType || '',
      workHours: data.workHours || '',
      observations: data.observations || ''
    };
  }

  /**
   * Formata data para o formato esperado pelo formulário
   */
  private formatDate(dateString: string): string {
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
  }

  /**
   * Limpa e formata CPF
   */
  formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Limpa e formata telefone
   */
  formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }
}

export const pdfProcessingService = new PDFProcessingService();
