# Módulo de Dependentes

## Visão Geral

Este módulo implementa a funcionalidade de gerenciamento de dependentes de funcionários no sistema Secure Guard. Ele permite listar, adicionar, editar e excluir dependentes associados a um funcionário específico.

## Componentes

### 1. DependentesList
Componente para exibir a lista de dependentes de um funcionário.

### 2. DependenteForm
Formulário para adicionar ou editar um dependente.

### 3. DependenteModal
Modal que integra a lista e o formulário em uma interface completa de gerenciamento de dependentes.

## Tipos

- `Dependent`: Interface que representa um dependente no sistema
- `CreateDependentDTO`: Interface para criação de um novo dependente
- `UpdateDependentDTO`: Interface para atualização de um dependente existente
- `RELATIONSHIP_TYPES`: Constante que define os tipos de relacionamento disponíveis

## Serviço

O `dependentService` fornece métodos para interagir com a API de dependentes:

- `getDependentsByEmployeeId`: Busca todos os dependentes de um funcionário
- `getDependentById`: Busca um dependente específico por ID
- `getDependentByCpf`: Busca dependentes por CPF
- `getDependentsByRelationship`: Busca dependentes por tipo de relacionamento
- `createDependent`: Cria um novo dependente
- `updateDependent`: Atualiza um dependente existente
- `deleteDependent`: Exclui um dependente
- `checkCpfExists`: Verifica se um CPF já está cadastrado

## Exemplo de Uso

```tsx
import { useState } from 'react';
import DependenteModal from '@/components/dependentes/DependenteModal';

const EmployeeDetailsPage = () => {
  const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
  const employeeId = '123e4567-e89b-12d3-a456-426614174000'; // ID do funcionário atual
  const employeeName = 'João Silva'; // Nome do funcionário atual

  return (
    <div>
      <h1>Detalhes do Funcionário</h1>
      
      {/* Outros detalhes do funcionário */}
      
      <button 
        onClick={() => setIsDependentModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Gerenciar Dependentes
      </button>
      
      {isDependentModalOpen && (
        <DependenteModal
          isOpen={isDependentModalOpen}
          onClose={() => setIsDependentModalOpen(false)}
          employeeId={employeeId}
          employeeName={employeeName}
        />
      )}
    </div>
  );
};
```

## Integração com o Backend

O serviço de dependentes está integrado com os seguintes endpoints da API:

- `GET /api/dependents/employee/{employeeId}` - Lista dependentes de um funcionário
- `GET /api/dependents/{id}` - Obtém um dependente específico
- `GET /api/dependents/cpf/{cpf}` - Busca dependentes por CPF
- `GET /api/dependents/relationship/{relationship}` - Busca dependentes por relacionamento
- `POST /api/dependents` - Cria um novo dependente
- `PUT /api/dependents/{id}` - Atualiza um dependente existente
- `DELETE /api/dependents/{id}` - Exclui um dependente