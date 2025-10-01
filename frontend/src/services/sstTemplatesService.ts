import api from '@/lib/axios';

// Tipos para templates SST
export interface SSTTemplate {
  id: string;
  name: string;
  type: 'ASO' | 'PCMSO' | 'PGR' | 'LTCAT' | 'PPRA' | 'CAT' | 'PPP';
  description: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // Para tipo select
  defaultValue?: string;
}

export interface DocumentGenerationRequest {
  templateId: string;
  employeeId?: string;
  variables: Record<string, any>;
  format: 'pdf' | 'docx';
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  employeeId?: string;
  employeeName?: string;
  fileName: string;
  fileUrl: string;
  format: string;
  generatedAt: string;
  generatedBy: string;
}

// Serviço de Templates SST
export const sstTemplatesService = {
  // Templates
  async getTemplates(): Promise<SSTTemplate[]> {
    const response = await api.get('/api/sst/templates');
    return response.data;
  },

  async getTemplateById(id: string): Promise<SSTTemplate> {
    const response = await api.get(`/api/sst/templates/${id}`);
    return response.data;
  },

  async getTemplatesByType(type: string): Promise<SSTTemplate[]> {
    const response = await api.get(`/api/sst/templates/type/${type}`);
    return response.data;
  },

  async createTemplate(template: Partial<SSTTemplate>): Promise<SSTTemplate> {
    const response = await api.post('/api/sst/templates', template);
    return response.data;
  },

  async updateTemplate(id: string, template: Partial<SSTTemplate>): Promise<SSTTemplate> {
    const response = await api.put(`/api/sst/templates/${id}`, template);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/api/sst/templates/${id}`);
  },

  // Geração de Documentos
  async generateDocument(request: DocumentGenerationRequest): Promise<GeneratedDocument> {
    const response = await api.post('/api/sst/templates/generate', request);
    return response.data;
  },

  async getGeneratedDocuments(): Promise<GeneratedDocument[]> {
    const response = await api.get('/api/sst/templates/documents');
    return response.data;
  },

  async getGeneratedDocumentById(id: string): Promise<GeneratedDocument> {
    const response = await api.get(`/api/sst/templates/documents/${id}`);
    return response.data;
  },

  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get(`/api/sst/templates/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async deleteGeneratedDocument(id: string): Promise<void> {
    await api.delete(`/api/sst/templates/documents/${id}`);
  },

  // Templates pré-definidos
  getDefaultTemplates(): Partial<SSTTemplate>[] {
    return [
      {
        name: 'ASO - Atestado de Saúde Ocupacional',
        type: 'ASO',
        description: 'Modelo padrão de ASO conforme NR-7',
        content: `
# ATESTADO DE SAÚDE OCUPACIONAL (ASO)

**Empresa:** {{companyName}}
**CNPJ:** {{companyCnpj}}
**Endereço:** {{companyAddress}}

**Funcionário:** {{employeeName}}
**CPF:** {{employeeCpf}}
**Cargo:** {{employeePosition}}
**Data de Admissão:** {{admissionDate}}

## DADOS DO EXAME

**Data do Exame:** {{examDate}}
**Tipo de Exame:** {{examType}}
**Médico Responsável:** {{doctorName}}
**CRM:** {{doctorCrm}}
**Clínica:** {{clinicName}}

## RESULTADO

**Apto para o cargo:** {{isApt ? 'SIM' : 'NÃO'}}
**Restrições:** {{restrictions}}

## OBSERVAÇÕES

{{observations}}

---
**Data de Emissão:** {{issueDate}}
**Validade:** {{validityDate}}

**Assinatura do Médico:**
{{doctorSignature}}
        `,
        variables: [
          { name: 'companyName', label: 'Nome da Empresa', type: 'text', required: true },
          { name: 'companyCnpj', label: 'CNPJ da Empresa', type: 'text', required: true },
          { name: 'companyAddress', label: 'Endereço da Empresa', type: 'text', required: true },
          { name: 'employeeName', label: 'Nome do Funcionário', type: 'text', required: true },
          { name: 'employeeCpf', label: 'CPF do Funcionário', type: 'text', required: true },
          { name: 'employeePosition', label: 'Cargo do Funcionário', type: 'text', required: true },
          { name: 'admissionDate', label: 'Data de Admissão', type: 'date', required: true },
          { name: 'examDate', label: 'Data do Exame', type: 'date', required: true },
          { name: 'examType', label: 'Tipo de Exame', type: 'select', required: true, options: ['Admissional', 'Periódico', 'Retorno', 'Mudança de Função', 'Demissional'] },
          { name: 'doctorName', label: 'Nome do Médico', type: 'text', required: true },
          { name: 'doctorCrm', label: 'CRM do Médico', type: 'text', required: true },
          { name: 'clinicName', label: 'Nome da Clínica', type: 'text', required: true },
          { name: 'isApt', label: 'Apto para o cargo', type: 'select', required: true, options: ['SIM', 'NÃO'] },
          { name: 'restrictions', label: 'Restrições', type: 'textarea', required: false },
          { name: 'observations', label: 'Observações', type: 'textarea', required: false },
          { name: 'issueDate', label: 'Data de Emissão', type: 'date', required: true },
          { name: 'validityDate', label: 'Data de Validade', type: 'date', required: true },
          { name: 'doctorSignature', label: 'Assinatura do Médico', type: 'text', required: true }
        ],
        isActive: true
      },
      {
        name: 'PCMSO - Programa de Controle Médico de Saúde Ocupacional',
        type: 'PCMSO',
        description: 'Modelo padrão de PCMSO conforme NR-7',
        content: `
# PROGRAMA DE CONTROLE MÉDICO DE SAÚDE OCUPACIONAL (PCMSO)

**Empresa:** {{companyName}}
**CNPJ:** {{companyCnpj}}
**Endereço:** {{companyAddress}}
**Período:** {{periodStart}} a {{periodEnd}}

## 1. IDENTIFICAÇÃO DA EMPRESA

- **Razão Social:** {{companyName}}
- **CNPJ:** {{companyCnpj}}
- **Endereço:** {{companyAddress}}
- **Atividade Principal:** {{mainActivity}}
- **Número de Funcionários:** {{employeeCount}}

## 2. OBJETIVOS DO PCMSO

O PCMSO tem como objetivo a promoção e preservação da saúde dos trabalhadores, através da antecipação, reconhecimento, avaliação e controle dos riscos ocupacionais.

## 3. RISCOS IDENTIFICADOS

{{#each risks}}
- **{{name}}** ({{category}}) - Nível: {{level}}
  - Descrição: {{description}}
  - Medidas de Controle: {{controlMeasures}}
{{/each}}

## 4. EXAMES MÉDICOS

### 4.1 Exames Admissionais
- Realizados em todos os funcionários antes do início das atividades
- Objetivo: Verificar se o candidato está apto para o cargo

### 4.2 Exames Periódicos
- Frequência conforme NR-7
- Objetivo: Monitorar a saúde dos trabalhadores

### 4.3 Exames de Retorno ao Trabalho
- Realizados após afastamento superior a 30 dias
- Objetivo: Verificar aptidão para retorno

### 4.4 Exames de Mudança de Função
- Realizados quando há mudança de função com exposição a riscos diferentes
- Objetivo: Verificar aptidão para nova função

### 4.5 Exames Demissionais
- Realizados na saída do funcionário
- Objetivo: Documentar o estado de saúde na saída

## 5. CRONOGRAMA DE EXAMES

{{#each examSchedule}}
- **{{month}}/{{year}}:** {{examCount}} exames programados
{{/each}}

## 6. RESPONSABILIDADES

- **Empresa:** Fornecer condições para realização dos exames
- **Médico Coordenador:** Coordenar e supervisionar o programa
- **Funcionários:** Participar dos exames conforme programação

## 7. ANEXOS

- Relatório de exames realizados
- Estatísticas de saúde ocupacional
- Cronograma de exames

---
**Elaborado por:** {{coordinatorName}}
**CRM:** {{coordinatorCrm}}
**Data:** {{issueDate}}
        `,
        variables: [
          { name: 'companyName', label: 'Nome da Empresa', type: 'text', required: true },
          { name: 'companyCnpj', label: 'CNPJ da Empresa', type: 'text', required: true },
          { name: 'companyAddress', label: 'Endereço da Empresa', type: 'text', required: true },
          { name: 'periodStart', label: 'Início do Período', type: 'date', required: true },
          { name: 'periodEnd', label: 'Fim do Período', type: 'date', required: true },
          { name: 'mainActivity', label: 'Atividade Principal', type: 'text', required: true },
          { name: 'employeeCount', label: 'Número de Funcionários', type: 'number', required: true },
          { name: 'coordinatorName', label: 'Nome do Coordenador', type: 'text', required: true },
          { name: 'coordinatorCrm', label: 'CRM do Coordenador', type: 'text', required: true },
          { name: 'issueDate', label: 'Data de Elaboração', type: 'date', required: true }
        ],
        isActive: true
      },
      {
        name: 'PGR - Programa de Gerenciamento de Riscos',
        type: 'PGR',
        description: 'Modelo padrão de PGR conforme NR-1',
        content: `
# PROGRAMA DE GERENCIAMENTO DE RISCOS (PGR)

**Empresa:** {{companyName}}
**CNPJ:** {{companyCnpj}}
**Endereço:** {{companyAddress}}
**Período:** {{periodStart}} a {{periodEnd}}

## 1. IDENTIFICAÇÃO DA EMPRESA

- **Razão Social:** {{companyName}}
- **CNPJ:** {{companyCnpj}}
- **Endereço:** {{companyAddress}}
- **Atividade Principal:** {{mainActivity}}
- **Número de Funcionários:** {{employeeCount}}

## 2. OBJETIVOS DO PGR

O PGR tem como objetivo identificar, avaliar e controlar os riscos ocupacionais presentes no ambiente de trabalho, promovendo a saúde e segurança dos trabalhadores.

## 3. METODOLOGIA DE IDENTIFICAÇÃO DE RISCOS

### 3.1 Inspeções de Segurança
- Inspeções mensais em todas as áreas
- Registro de não conformidades
- Plano de ação para correções

### 3.2 Análise de Riscos
- Identificação de perigos
- Avaliação da probabilidade e consequência
- Classificação do nível de risco

## 4. RISCOS IDENTIFICADOS

{{#each risks}}
### {{name}} ({{category}})
- **Nível de Risco:** {{level}}
- **Descrição:** {{description}}
- **Medidas de Controle Existentes:** {{existingControls}}
- **Medidas de Controle Propostas:** {{proposedControls}}
- **Responsável:** {{responsible}}
- **Prazo:** {{deadline}}
{{/each}}

## 5. PLANO DE AÇÃO

### 5.1 Medidas de Controle Imediatas
{{#each immediateActions}}
- **{{description}}** - Responsável: {{responsible}} - Prazo: {{deadline}}
{{/each}}

### 5.2 Medidas de Controle de Médio Prazo
{{#each mediumTermActions}}
- **{{description}}** - Responsável: {{responsible}} - Prazo: {{deadline}}
{{/each}}

### 5.3 Medidas de Controle de Longo Prazo
{{#each longTermActions}}
- **{{description}}** - Responsável: {{responsible}} - Prazo: {{deadline}}
{{/each}}

## 6. MONITORAMENTO E AVALIAÇÃO

- Revisão trimestral do programa
- Acompanhamento das ações implementadas
- Atualização da análise de riscos

## 7. RESPONSABILIDADES

- **Empresa:** Fornecer recursos e condições
- **SESMT:** Coordenar e supervisionar o programa
- **Funcionários:** Participar e colaborar com as ações

---
**Elaborado por:** {{coordinatorName}}
**Cargo:** {{coordinatorPosition}}
**Data:** {{issueDate}}
        `,
        variables: [
          { name: 'companyName', label: 'Nome da Empresa', type: 'text', required: true },
          { name: 'companyCnpj', label: 'CNPJ da Empresa', type: 'text', required: true },
          { name: 'companyAddress', label: 'Endereço da Empresa', type: 'text', required: true },
          { name: 'periodStart', label: 'Início do Período', type: 'date', required: true },
          { name: 'periodEnd', label: 'Fim do Período', type: 'date', required: true },
          { name: 'mainActivity', label: 'Atividade Principal', type: 'text', required: true },
          { name: 'employeeCount', label: 'Número de Funcionários', type: 'number', required: true },
          { name: 'coordinatorName', label: 'Nome do Coordenador', type: 'text', required: true },
          { name: 'coordinatorPosition', label: 'Cargo do Coordenador', type: 'text', required: true },
          { name: 'issueDate', label: 'Data de Elaboração', type: 'date', required: true }
        ],
        isActive: true
      },
      {
        name: 'LTCAT - Laudo Técnico das Condições Ambientais de Trabalho',
        type: 'LTCAT',
        description: 'Modelo padrão de LTCAT conforme NR-15',
        content: `
# LAUDO TÉCNICO DAS CONDIÇÕES AMBIENTAIS DE TRABALHO (LTCAT)

**Empresa:** {{companyName}}
**CNPJ:** {{companyCnpj}}
**Endereço:** {{companyAddress}}
**Data:** {{issueDate}}

## 1. IDENTIFICAÇÃO DA EMPRESA

- **Razão Social:** {{companyName}}
- **CNPJ:** {{companyCnpj}}
- **Endereço:** {{companyAddress}}
- **Atividade Principal:** {{mainActivity}}

## 2. IDENTIFICAÇÃO DO POSTO DE TRABALHO

- **Setor:** {{sector}}
- **Função:** {{position}}
- **Número de Funcionários:** {{employeeCount}}

## 3. AGENTES AMBIENTAIS IDENTIFICADOS

{{#each agents}}
### {{name}}
- **Tipo:** {{type}}
- **Fonte:** {{source}}
- **Intensidade/Concentração:** {{intensity}}
- **Tempo de Exposição:** {{exposureTime}}
- **Limite de Tolerância:** {{toleranceLimit}}
- **Situação:** {{situation}}
{{/each}}

## 4. METODOLOGIA DE AVALIAÇÃO

### 4.1 Instrumentos Utilizados
{{#each instruments}}
- **{{name}}:** {{description}}
{{/each}}

### 4.2 Normas Técnicas Aplicadas
- NR-15 - Atividades e Operações Insalubres
- ABNT NBR 10151 - Acústica
- ABNT NBR 10152 - Acústica

## 5. RESULTADOS DAS AVALIAÇÕES

{{#each evaluations}}
### {{agentName}}
- **Data da Avaliação:** {{evaluationDate}}
- **Resultado:** {{result}}
- **Conclusão:** {{conclusion}}
{{/each}}

## 6. CONCLUSÕES

{{#each conclusions}}
- {{description}}
{{/each}}

## 7. RECOMENDAÇÕES

{{#each recommendations}}
- {{description}}
{{/each}}

## 8. ANEXOS

- Relatórios de medições
- Fotos dos postos de trabalho
- Croquis dos ambientes

---
**Elaborado por:** {{technicianName}}
**CREA:** {{technicianCrea}}
**Data:** {{issueDate}}
        `,
        variables: [
          { name: 'companyName', label: 'Nome da Empresa', type: 'text', required: true },
          { name: 'companyCnpj', label: 'CNPJ da Empresa', type: 'text', required: true },
          { name: 'companyAddress', label: 'Endereço da Empresa', type: 'text', required: true },
          { name: 'mainActivity', label: 'Atividade Principal', type: 'text', required: true },
          { name: 'sector', label: 'Setor', type: 'text', required: true },
          { name: 'position', label: 'Função', type: 'text', required: true },
          { name: 'employeeCount', label: 'Número de Funcionários', type: 'number', required: true },
          { name: 'technicianName', label: 'Nome do Técnico', type: 'text', required: true },
          { name: 'technicianCrea', label: 'CREA do Técnico', type: 'text', required: true },
          { name: 'issueDate', label: 'Data de Elaboração', type: 'date', required: true }
        ],
        isActive: true
      }
    ];
  }
};

