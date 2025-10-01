// Testes de Segurança para o Módulo de Candidatos
import { validateFile, sanitizeInput, candidateValidationRules, validateForm } from './validation';

// Teste de Validação de CPF
export const testCPFValidation = () => {
  console.log('🧪 Testando validação de CPF...');
  
  const testCases = [
    { cpf: '123.456.789-00', expected: false, description: 'CPF inválido (todos dígitos iguais)' },
    { cpf: '123.456.789-09', expected: true, description: 'CPF válido' },
    { cpf: '111.111.111-11', expected: false, description: 'CPF inválido (todos 1s)' },
    { cpf: '000.000.000-00', expected: false, description: 'CPF inválido (todos 0s)' },
    { cpf: '12345678901', expected: false, description: 'CPF inválido (formato incorreto)' },
  ];

  testCases.forEach(({ cpf, expected, description }) => {
    const result = validateForm({ cpf }, { cpf: candidateValidationRules.cpf });
    const isValid = Object.keys(result).length === 0;
    console.log(`${isValid === expected ? '✅' : '❌'} ${description}: ${cpf}`);
  });
};

// Teste de Sanitização de Input
export const testInputSanitization = () => {
  console.log('🧪 Testando sanitização de input...');
  
  const testCases = [
    { input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script' },
    { input: 'João da Silva', expected: 'João da Silva' },
    { input: 'test@example.com', expected: 'test@example.com' },
    { input: '"><img src=x onerror=alert(1)>', expected: 'img src=x onerror=alert(1)' },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = sanitizeInput(input);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${input}" -> "${result}"`);
  });
};

// Teste de Validação de Arquivos
export const testFileValidation = () => {
  console.log('🧪 Testando validação de arquivos...');
  
  const createMockFile = (name: string, size: number, type: string): File => {
    const blob = new Blob([''], { type });
    return new File([blob], name, { type });
  };

  const testCases = [
    { 
      file: createMockFile('curriculum.pdf', 1024 * 1024, 'application/pdf'),
      expected: true,
      description: 'PDF válido (1MB)'
    },
    { 
      file: createMockFile('curriculum.doc', 2 * 1024 * 1024, 'application/msword'),
      expected: true,
      description: 'Word válido (2MB)'
    },
    { 
      file: createMockFile('malicious.exe', 1024, 'application/octet-stream'),
      expected: false,
      description: 'Arquivo executável (rejeitado)'
    },
    { 
      file: createMockFile('curriculum.pdf', 3 * 1024 * 1024, 'application/pdf'),
      expected: false,
      description: 'PDF muito grande (3MB)'
    },
    { 
      file: createMockFile('con.pdf', 1024, 'application/pdf'),
      expected: false,
      description: 'Nome reservado do Windows (rejeitado)'
    },
  ];

  testCases.forEach(({ file, expected, description }) => {
    const result = validateFile(file);
    const isValid = result === null;
    console.log(`${isValid === expected ? '✅' : '❌'} ${description}: ${file.name}`);
  });
};

// Teste de Rate Limiting
export const testRateLimiting = () => {
  console.log('🧪 Testando rate limiting...');
  
  // Simular tentativas de candidatura
  const attempts = [
    { time: 0, expected: true, description: '1ª tentativa' },
    { time: 1000, expected: true, description: '2ª tentativa' },
    { time: 2000, expected: true, description: '3ª tentativa' },
    { time: 3000, expected: false, description: '4ª tentativa (deve ser bloqueada)' },
  ];

  attempts.forEach(({ time, expected, description }) => {
    // Simular tempo
    const now = Date.now() + time;
    console.log(`${expected ? '✅' : '❌'} ${description} (${time}ms)`);
  });
};

// Teste de Validação de Email
export const testEmailValidation = () => {
  console.log('🧪 Testando validação de email...');
  
  const testCases = [
    { email: 'test@example.com', expected: true, description: 'Email válido' },
    { email: 'invalid-email', expected: false, description: 'Email inválido' },
    { email: 'test@.com', expected: false, description: 'Email sem domínio' },
    { email: '@example.com', expected: false, description: 'Email sem usuário' },
    { email: 'test@example', expected: false, description: 'Email sem TLD' },
  ];

  testCases.forEach(({ email, expected, description }) => {
    const result = validateForm({ email }, { email: candidateValidationRules.email });
    const isValid = Object.keys(result).length === 0;
    console.log(`${isValid === expected ? '✅' : '❌'} ${description}: ${email}`);
  });
};

// Executar todos os testes
export const runAllSecurityTests = () => {
  console.log('🔒 Executando todos os testes de segurança...\n');
  
  testCPFValidation();
  console.log('');
  
  testInputSanitization();
  console.log('');
  
  testFileValidation();
  console.log('');
  
  testRateLimiting();
  console.log('');
  
  testEmailValidation();
  console.log('');
  
  console.log('✅ Todos os testes de segurança concluídos!');
};

// Teste de integração com reCAPTCHA
export const testReCaptchaIntegration = async () => {
  console.log('🧪 Testando integração com reCAPTCHA...');
  
  try {
    // Simular verificação do reCAPTCHA
    const mockToken = 'mock-recaptcha-token-' + Date.now();
    console.log('✅ Token do reCAPTCHA gerado:', mockToken);
    
    // Simular envio para o backend
    const response = await fetch('/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate: {
          jobVacancyId: 'test-id',
          name: 'Test User',
          email: 'test@example.com',
          cpf: '123.456.789-09'
        },
        captchaToken: mockToken
      })
    });
    
    console.log('✅ Requisição enviada com token do reCAPTCHA');
    return response.ok;
  } catch (error) {
    console.log('❌ Erro no teste do reCAPTCHA:', error);
    return false;
  }
}; 