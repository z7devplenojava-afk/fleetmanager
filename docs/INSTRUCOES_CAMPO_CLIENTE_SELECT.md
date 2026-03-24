# Campo Cliente - Select com Dados do Banco

## Problema Identificado
O campo "Cliente" no formulário "Detalhes da Fatura" deve ser um select que busca os clientes cadastrados no banco de dados, em vez de um campo de texto simples.

## Solução Implementada

### 1. Endpoints Criados

#### Endpoint Principal - ClientController
```
GET /api/clients/select
```
- **Descrição**: Retorna lista simplificada de clientes ativos para uso em formulários
- **Resposta**: Lista de `ClientSelectDTO` contendo apenas `id`, `name` e `cnpj`
- **Uso**: Endpoint genérico que pode ser usado em qualquer formulário do sistema

#### Endpoint Específico - InvoiceController  
```
GET /api/invoices/clients
```
- **Descrição**: Retorna lista de clientes ativos especificamente para formulários de faturas
- **Resposta**: Lista de `ClientSelectDTO`
- **Uso**: Endpoint específico para o contexto de faturas
- **Autorização**: Requer `SUPER_ADMIN` ou `FINANCIAL_READ`

### 2. DTO Criado

**ClientSelectDTO** - DTO simplificado para seleção:
```java
{
    "id": "uuid",
    "name": "Nome do Cliente",
    "cnpj": "12.345.678/0001-90"
}
```

### 3. Como Usar no Frontend

#### Exemplo com JavaScript/Fetch
```javascript
// Buscar clientes para popular o select
async function loadClients() {
    try {
        const response = await fetch('/api/clients/select', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const clients = await response.json();
            populateClientSelect(clients);
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Popular o select com os clientes
function populateClientSelect(clients) {
    const select = document.getElementById('clientSelect');
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} - ${client.cnpj}`;
        select.appendChild(option);
    });
}
```

#### Exemplo com React
```jsx
import { useState, useEffect } from 'react';

function ClientSelect({ value, onChange }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await fetch('/api/clients/select', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Carregando clientes...</div>;

    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Selecione um cliente...</option>
            {clients.map(client => (
                <option key={client.id} value={client.id}>
                    {client.name} - {client.cnpj}
                </option>
            ))}
        </select>
    );
}
```

#### Exemplo com Vue.js
```vue
<template>
    <select v-model="selectedClient" @change="$emit('change', selectedClient)">
        <option value="">Selecione um cliente...</option>
        <option 
            v-for="client in clients" 
            :key="client.id" 
            :value="client.id"
        >
            {{ client.name }} - {{ client.cnpj }}
        </option>
    </select>
</template>

<script>
export default {
    data() {
        return {
            clients: [],
            selectedClient: ''
        }
    },
    
    async mounted() {
        await this.loadClients();
    },
    
    methods: {
        async loadClients() {
            try {
                const response = await fetch('/api/clients/select', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    this.clients = await response.json();
                }
            } catch (error) {
                console.error('Erro ao carregar clientes:', error);
            }
        }
    }
}
</script>
```

### 4. Estrutura de Resposta

**Exemplo de resposta do endpoint:**
```json
[
    {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Empresa ABC Ltda",
        "cnpj": "12.345.678/0001-90"
    },
    {
        "id": "987fcdeb-51a2-43d1-b789-123456789abc",
        "name": "Corporação XYZ S.A.",
        "cnpj": "98.765.432/0001-10"
    }
]
```

### 5. Vantagens da Implementação

1. **Performance**: DTO simplificado reduz o tráfego de rede
2. **Segurança**: Apenas clientes ativos são retornados
3. **Flexibilidade**: Dois endpoints para diferentes contextos
4. **Manutenibilidade**: Código organizado e reutilizável
5. **UX**: Interface mais amigável com busca automática

### 6. Próximos Passos

1. Implementar no frontend a substituição do campo texto pelo select
2. Adicionar funcionalidade de busca/filtro no select (opcional)
3. Implementar cache local para melhorar performance (opcional)
4. Adicionar tratamento de erros e estados de loading
5. Testar a integração completa

### 7. Endpoints Relacionados

- `GET /api/clients` - Lista completa de clientes (paginada)
- `GET /api/clients/{id}` - Detalhes de um cliente específico
- `GET /api/clients/status/ACTIVE` - Clientes ativos (paginado)
- `GET /api/invoices/client/{clientId}` - Faturas de um cliente específico

## Conclusão

A implementação está completa e pronta para uso. O campo "Cliente" agora pode ser implementado como um select que busca dados reais do banco, melhorando significativamente a experiência do usuário e a integridade dos dados.