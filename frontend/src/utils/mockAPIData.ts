// Mock data para desenvolvimento - simula respostas da API
export const mockAPIData = {
  positions: [
    { id: '1', name: 'Porteiro' },
    { id: '2', name: 'Vigia' },
    { id: '3', name: 'Auxiliar Administrativo' },
    { id: '4', name: 'ASG' },
    { id: '5', name: 'Recepcionista' },
  ],
  
  employees: [
    { 
      id: '1', 
      name: 'João Silva', 
      document: '123.456.789-00', 
      position: { id: '1', name: 'Porteiro' }, 
      unit: { id: '1', name: 'Unidade Centro', code: 'UC001' } 
    },
    { 
      id: '2', 
      name: 'Maria Santos', 
      document: '987.654.321-00', 
      position: { id: '2', name: 'Vigia' }, 
      unit: { id: '2', name: 'Unidade Norte', code: 'UN001' } 
    },
    { 
      id: '3', 
      name: 'Pedro Costa', 
      document: '456.789.123-00', 
      position: { id: '3', name: 'Auxiliar Administrativo' }, 
      unit: { id: '3', name: 'Unidade Sul', code: 'US001' } 
    },
  ],
  
  clients: [
    { id: '1', name: 'CSN - Companhia Siderúrgica Nacional', document: '33.592.510/0001-54' },
    { id: '2', name: 'ATERPA - Agência de Transporte do Estado do Pará', document: '05.859.397/0001-00' },
    { id: '3', name: 'TRANSPES - Transportadora Pesada Ltda', document: '12.345.678/0001-90' },
  ],
  
  companies: [
    { id: '1', name: 'Promover Vigilância Patrimonial Ltda', document: '43.576.260/0001-12' },
    { id: '2', name: 'Segurança Total Ltda', document: '98.765.432/0001-10' },
  ],
  
  units: [
    { id: '1', name: 'Unidade Centro', code: 'UC001', client: { id: '1', name: 'CSN' } },
    { id: '2', name: 'Unidade Norte', code: 'UN001', client: { id: '2', name: 'ATERPA' } },
    { id: '3', name: 'Unidade Sul', code: 'US001', client: { id: '3', name: 'TRANSPES' } },
  ],
};

// Função para simular delay da API
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para simular chamada da API
export const mockAPICall = async (endpoint: string, delayMs: number = 500) => {
  await delay(delayMs);
  
  switch (endpoint) {
    case '/api/positions':
      return mockAPIData.positions;
    case '/api/employees':
      return mockAPIData.employees;
    case '/api/clients':
      return mockAPIData.clients;
    case '/api/companies':
      return mockAPIData.companies;
    case '/api/units':
      return mockAPIData.units;
    default:
      throw new Error(`Endpoint ${endpoint} não encontrado`);
  }
};
