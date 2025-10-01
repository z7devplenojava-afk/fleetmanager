export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: any, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    return 'Este campo é obrigatório';
  }

  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }

  const stringValue = value.toString();

  // Min length validation
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Mínimo de ${rules.minLength} caracteres`;
  }

  // Max length validation
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Máximo de ${rules.maxLength} caracteres`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Formato inválido';
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (data: any, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Validation rules for commercial forms
export const leadValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email inválido';
      }
      return null;
    }
  },
  phone: {
    pattern: /^[\d\s\-\(\)\+]+$/,
    custom: (value) => {
      if (value && !/^[\d\s\-\(\)\+]+$/.test(value)) {
        return 'Telefone inválido';
      }
      return null;
    }
  },
  company: {
    minLength: 2,
    maxLength: 100
  },
  source: {
    required: true
  },
  description: {
    maxLength: 500
  }
};

export const proposalValidationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 200
  },
  totalValue: {
    required: true,
    custom: (value) => {
      if (value <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    }
  },
  validUntil: {
    custom: (value) => {
      if (value) {
        const date = new Date(value);
        const today = new Date();
        if (date <= today) {
          return 'Data de validade deve ser futura';
        }
      }
      return null;
    }
  },
  description: {
    maxLength: 1000
  }
};

export const quoteValidationRules: ValidationRules = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 200
  },
  totalValue: {
    required: true,
    custom: (value) => {
      if (value <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    }
  },
  validUntil: {
    custom: (value) => {
      if (value) {
        const date = new Date(value);
        const today = new Date();
        if (date <= today) {
          return 'Data de validade deve ser futura';
        }
      }
      return null;
    }
  },
  estimatedDuration: {
    required: true
  },
  paymentTerms: {
    required: true
  },
  description: {
    maxLength: 1000
  }
};

// Utility functions for specific validations
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone);
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validate first digit
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Validate second digit
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
};

export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Validation rules for candidate forms
export const candidateValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value) => {
      if (value && /[<>\"']/.test(value)) {
        return 'Nome contém caracteres inválidos';
      }
      return null;
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email inválido';
      }
      return null;
    }
  },
  phone: {
    pattern: /^[\d\s\-\(\)\+]+$/,
    custom: (value) => {
      if (value && !/^[\d\s\-\(\)\+]+$/.test(value)) {
        return 'Telefone inválido';
      }
      return null;
    }
  },
  cpf: {
    required: true,
    custom: (value) => {
      if (!value) return 'CPF é obrigatório';
      
      // Remove caracteres não numéricos
      const numbers = value.replace(/\D/g, '');
      if (numbers.length !== 11) return 'CPF deve ter 11 dígitos';
      
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1{10}$/.test(numbers)) return 'CPF inválido';
      
      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * (10 - i);
      }
      let remainder = sum % 11;
      let digit1 = remainder < 2 ? 0 : 11 - remainder;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers[i]) * (11 - i);
      }
      remainder = sum % 11;
      let digit2 = remainder < 2 ? 0 : 11 - remainder;
      
      if (parseInt(numbers[9]) !== digit1 || parseInt(numbers[10]) !== digit2) {
        return 'CPF inválido';
      }
      
      return null;
    }
  },
  address: {
    maxLength: 500,
    custom: (value) => {
      if (value && /[<>\"']/.test(value)) {
        return 'Endereço contém caracteres inválidos';
      }
      return null;
    }
  },
  city: {
    maxLength: 100,
    custom: (value) => {
      if (value && /[<>\"']/.test(value)) {
        return 'Cidade contém caracteres inválidos';
      }
      return null;
    }
  },
  currentPosition: {
    maxLength: 255,
    custom: (value) => {
      if (value && /[<>\"']/.test(value)) {
        return 'Cargo atual contém caracteres inválidos';
      }
      return null;
    }
  },
  currentCompany: {
    maxLength: 255,
    custom: (value) => {
      if (value && /[<>\"']/.test(value)) {
        return 'Empresa atual contém caracteres inválidos';
      }
      return null;
    }
  },
  expectedSalary: {
    custom: (value) => {
      if (value && value < 0) {
        return 'Salário deve ser maior ou igual a zero';
      }
      return null;
    }
  },
  experienceYears: {
    custom: (value) => {
      if (value && value < 0) {
        return 'Anos de experiência devem ser maiores ou iguais a zero';
      }
      if (value && value > 50) {
        return 'Anos de experiência não podem ser maiores que 50';
      }
      return null;
    }
  }
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (!input) return input;
  return input
    .replace(/[<>\"']/g, '')
    .trim();
};

// Validate file upload
export const validateFile = (file: File): string | null => {
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Apenas arquivos PDF e Word são aceitos';
  }
  
  // Check file size (2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return 'Arquivo muito grande. Tamanho máximo: 2MB';
  }
  
  // Check file name
  if (file.name.length > 255) {
    return 'Nome do arquivo muito longo';
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|war|ear|apk|dmg|deb|rpm|msi)$/i,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i,
    /[<>:"|?*]/g
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return 'Nome do arquivo inválido';
    }
  }
  
  return null;
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 3, windowMs: number = 3600000) { // 1 hour default
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canAttempt(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    return Math.max(0, attempt.resetTime - Date.now());
  }
} 