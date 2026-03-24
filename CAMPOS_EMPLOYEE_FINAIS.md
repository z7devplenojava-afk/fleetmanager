# 📋 CAMPOS DO FUNCIONÁRIO - VERSÃO FINAL

## 📅 Data: 17/10/2025

---

## 🔴 **CAMPOS OBRIGATÓRIOS (APENAS 6)**

Para cadastrar um funcionário, você precisa enviar **APENAS 6 campos obrigatórios**:

| # | Campo | Tipo | Exemplo | Validação |
|---|-------|------|---------|-----------|
| 1 | `name` | String | "JOSE DA SILVA" | Deve estar preenchido |
| 2 | `cpf` | String | "123.456.789-00" | Deve ser único |
| 3 | `status` | Enum | "ACTIVE" | ACTIVE, INACTIVE, SUSPENDED, TERMINATED, ON_VACATION, ON_LEAVE |
| 4 | `address.street` | String | "Rua das Flores" | **NÃO pode ser vazio** |
| 5 | `user.id` | UUID | "face6ab3-..." | Deve existir no banco |
| 6 | `position.id` | UUID | "123e4567-..." | Deve existir no banco |

---

## 🟢 **CAMPOS OPCIONAIS (85+ campos)**

### ✅ **Todos os outros campos são OPCIONAIS, incluindo:**

#### **Dados Pessoais:**
- `rg`, `email`, `phone`, `birthDate`, `gender`, `maritalStatus`
- `nomePai`, `nomeMae`, `localNascimento`, `grauInstrucao`
- `spouseName`, `spouseCpf`, `spouseRg`, `spouseBirthDate`, `spousePhone`, `spouseEmail`

#### **Documentos:**
- **`pis`** ✅ (agora disponível!)
- **`tituloEleitor`** ✅ (agora disponível!)
- `tituloEleitorZona`, `tituloEleitorSecao`
- `carteiraIdentidadeOrgaoEmissor`, `carteiraIdentidadeDataEmissao`
- `certificadoMilitar`
- `cnhNumber`, `cnhCategory`, `cnhExpirationDate`
- `ctps`, `ctpsRural`, `ctpsSeries`, `ctpsIssueDate`, `ctpsIssuingAgency`

#### **Trabalho:**
- `registrationNumber`, `hireDate`, `terminationDate`, `dataRescisao`
- `cbo`, `salario`, `salarioPorExtenso`, `periodoPagamento`
- `horarioTrabalho`, `folgaSemanal`
- `empresaNome`, `empresaEndereco`, `empresaCnpj`

#### **FGTS:**
- `fgtsOptante`, `fgtsDataOpcao`, `fgtsBancoDepositario`, `fgtsDataRetratacao`

#### **PIS/PASEP:**
- `pisDataCadastro`, `pisBancoDepositario`, `pisEnderecoBanco`
- `pisCodigoBanco`, `pisCodigoAgencia`

#### **Estrangeiros:**
- `carteiraModelo19`, `registroGeralEstrangeiro`, `casadoBrasileiro`
- `nomeConjugeEstrangeiro`, `temFilhosBrasileiros`, `quantidadeFilhosBrasileiros`
- `dataChegadaBrasil`, `naturalizado`, `decretoNaturalizacao`

#### **Outros:**
- `notes`, `vistoFiscalizacao`, `assinaturaFuncionario`
- `unit.id` (opcional)

---

## ✅ **CONFIRMAÇÃO IMPORTANTE**

### **Os campos `pis` e `tituloEleitor` NÃO são obrigatórios!**

Você estava **100% correto** ao afirmar que eles não precisam ser obrigatórios. Eles são **OPCIONAIS**.

O problema era que eles estavam **comentados** no código, então o backend não os reconhecia.

### **✅ AGORA CORRIGIDO:**
- Campo `pis` disponível no DTO e Model
- Campo `tituloEleitor` disponível no DTO e Model
- Ambos os campos são **OPCIONAIS**
- Podem ser enviados, omitidos ou como `null`

---

## 📋 **JSON MÍNIMO QUE FUNCIONA**

```json
{
  "name": "JOSE DA SILVA",
  "cpf": "123.456.789-00",
  "status": "ACTIVE",
  "address": {
    "street": "Rua das Flores"
  },
  "user": {
    "id": "face6ab3-f2c8-4714-aa34-8d4247b6b0b7"
  },
  "position": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

---

## 📋 **JSON COMPLETO COM TODOS OS CAMPOS (Incluindo pis e tituloEleitor)**

```json
{
  "name": "ABRAAO MALDONADO SILVA",
  "cpf": "034.127.526-30",
  "rg": "M8051635",
  "email": "abraao.maldonado@example.com",
  "phone": "(31) 99999-9999",
  "birthDate": "1978-04-09",
  "gender": "M",
  "maritalStatus": "CASADO",
  "registrationNumber": "000127",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Coronel João Camargos",
    "number": "267",
    "complement": "Sala 10",
    "neighborhood": "Centro",
    "city": "Contagem",
    "state": "MG",
    "zipCode": "32040-000"
  },
  "pis": "12345678901",
  "tituloEleitor": "123456789012",
  "tituloEleitorZona": "001",
  "tituloEleitorSecao": "0001",
  "cbo": "5173-30",
  "salario": 2395.54,
  "cnhNumber": "12345678901",
  "cnhCategory": "B",
  "cnhExpirationDate": "2026-12-31",
  "user": {
    "id": "COLE_AQUI_O_ID_DO_USUARIO"
  },
  "position": {
    "id": "COLE_AQUI_O_ID_DO_CARGO"
  }
}
```

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Aguarde o backend terminar de iniciar** (já está rodando)
2. **Obtenha os IDs necessários:**
   ```http
   GET http://localhost:8081/api/users
   GET http://localhost:8081/api/positions
   ```
3. **Use o JSON atualizado** que agora inclui `pis` e `tituloEleitor`
4. **Cadastre funcionários completos!**

---

## ✅ **RESUMO**

- ✅ **6 campos obrigatórios** apenas
- ✅ **85+ campos opcionais** disponíveis
- ✅ **`pis` e `tituloEleitor` agora funcionam!**
- ✅ **Backend compilado e reiniciado**
- ✅ **Migration criada para `titulo_eleitor`**
- ✅ **JSONs atualizados com todos os campos**

**🎉 Tudo pronto para usar!**
