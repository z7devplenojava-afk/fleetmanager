# Integração Frontend-Backend - Secured Guard

Este documento descreve a integração completa entre o frontend React/Vite e o backend Spring Boot para o sistema Secured Guard.

## 🚀 Início Rápido

### Opção 1: Script Automático (Recomendado)
```bash
# Windows
start-integration.bat

# Linux/Mac
./start-integration.sh
```

### Opção 2: Manual
```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run -DskipTests

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📋 Pré-requisitos

### Backend
- Java 17+
- Maven 3.6+
- PostgreSQL 15+
- Tesseract OCR (para processamento de PDFs)

### Frontend
- Node.js 18+
- npm ou yarn

## 🔧 Configuração

### Backend (Porta 8081)
- **URL Base**: `http://localhost:8081/api`
- **Swagger UI**: `http://localhost:8081/swagger-ui/index.html`
- **Banco de Dados**: PostgreSQL na porta 5433

### Frontend (Porta 5173)
- **URL**: `http://localhost:5173`
- **API Base**: Configurada automaticamente para `http://localhost:8081/api`

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação:

1. **Login**: `POST /api/auth/login`
2. **Refresh Token**: `POST /api/auth/refresh-token`
3. **Logout**: Limpeza automática dos tokens

### Credenciais de Teste
```
Username: josemario.ramos
Password: Admin1234
```

## 📄 Funcionalidades de Holerites

### Upload de PDFs
- **Endpoint**: `POST /api/payslips/upload`
- **Funcionalidade**: Processa PDFs com múltiplas páginas de holerites
- **Extração**: Nome, CPF/Código, período automaticamente
- **Saída**: PDFs individuais salvos no servidor

### Listagem
- **Endpoint**: `GET /api/payslips`
- **Funcionalidade**: Lista todos os holerites processados
- **Filtros**: Busca por nome ou CPF

### Download
- **Endpoint**: `GET /api/payslips/download/{fileName}`
- **Funcionalidade**: Download de PDFs individuais

### Debug
- **Endpoint**: `POST /api/payslips/debug`
- **Funcionalidade**: Análise detalhada do conteúdo do PDF

## 🏗️ Estrutura da Integração

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── HoleriteUpload.tsx      # Upload de PDFs
│   │   └── holerites/
│   │       ├── HoleriteViewModal.tsx
│   │       └── HoleriteEmailModal.tsx
│   ├── pages/
│   │   └── Holerites.tsx           # Página principal
│   ├── lib/
│   │   └── axios.ts               # Configuração da API
│   └── contexts/
│       └── AuthContext.tsx        # Contexto de autenticação
```

### Backend
```
backend/
├── src/main/java/com/z7design/secured_guard/
│   ├── controller/
│   │   └── PayslipController.java  # Endpoints REST
│   ├── service/
│   │   └── PayslipService.java     # Lógica de negócio
│   ├── model/
│   │   └── Payslip.java           # Entidade JPA
│   └── config/
│       ├── SecurityConfig.java     # Configuração de segurança
│       └── WebConfig.java          # Configuração CORS
```

## 🔄 Fluxo de Dados

### Upload de Holerite
1. **Frontend**: Usuário seleciona arquivo PDF
2. **Frontend**: Envia via `FormData` para `/api/payslips/upload`
3. **Backend**: Processa PDF com PDFBox + Tesseract OCR
4. **Backend**: Extrai dados de cada página
5. **Backend**: Salva no banco de dados
6. **Backend**: Gera PDFs individuais
7. **Frontend**: Exibe resultados e permite download

### Listagem
1. **Frontend**: Chama `GET /api/payslips`
2. **Backend**: Retorna lista de holerites processados
3. **Frontend**: Exibe em tabela com filtros

## 🛠️ Tecnologias Utilizadas

### Backend
- **Spring Boot 3.2.2**: Framework principal
- **Spring Security**: Autenticação e autorização
- **Spring Data JPA**: Persistência de dados
- **PostgreSQL**: Banco de dados
- **PDFBox**: Extração de texto de PDFs
- **Tess4J**: OCR para PDFs escaneados
- **Flyway**: Migração de banco de dados
- **JWT**: Tokens de autenticação

### Frontend
- **React 18**: Framework principal
- **Vite**: Build tool e dev server
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Shadcn/ui**: Componentes UI
- **Axios**: Cliente HTTP
- **React Router**: Navegação
- **React Hook Form**: Formulários

## 🔧 Configurações de Ambiente

### Backend (.env ou application.properties)
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5433/secured_guard
spring.datasource.username=postgres
spring.datasource.password=1234567

# Server
server.port=8081

# JWT
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration=604800000

# CORS
# Configurado para permitir localhost:5173 (Vite)
```

### Frontend (env.config.ts)
```typescript
export const config = {
  API_URL: 'http://localhost:8081/api',
  TOKEN_KEY: 'token',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',
};
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. CORS Errors
```bash
# Verificar se o backend está rodando na porta 8081
curl http://localhost:8081/api/payslips

# Verificar configuração CORS no SecurityConfig.java
```

#### 2. Autenticação Falhando
```bash
# Verificar se o banco está rodando
psql -h localhost -p 5433 -U postgres -d secured_guard

# Verificar logs do backend
tail -f backend/logs/application.log
```

#### 3. Upload de PDF Falhando
```bash
# Verificar se Tesseract está instalado
tesseract --version

# Verificar arquivo de treinamento
ls backend/src/main/resources/tessdata/por.traineddata
```

#### 4. Frontend não carrega
```bash
# Verificar dependências
cd frontend && npm install

# Verificar se Vite está rodando
curl http://localhost:5173
```

### Logs Úteis

#### Backend
```bash
# Logs de processamento de PDF
grep "PayslipService" backend/logs/application.log

# Logs de autenticação
grep "JwtAuthenticationFilter" backend/logs/application.log
```

#### Frontend
```bash
# Console do navegador (F12)
# Network tab para ver requisições
# Console tab para erros JavaScript
```

## 📊 Monitoramento

### Health Checks
- **Backend**: `http://localhost:8081/actuator/health`
- **Frontend**: `http://localhost:5173`

### Métricas
- **Backend**: `http://localhost:8081/actuator/metrics`
- **Swagger**: `http://localhost:8081/swagger-ui/index.html`

## 🔄 Deploy

### Desenvolvimento
```bash
# Backend
cd backend && mvn spring-boot:run

# Frontend
cd frontend && npm run dev
```

### Produção
```bash
# Backend
cd backend && mvn clean package
java -jar target/secured-guard-1.0.0.jar

# Frontend
cd frontend && npm run build
# Servir pasta dist com nginx/apache
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do backend e frontend
2. Consultar documentação da API (Swagger)
3. Verificar configurações de ambiente
4. Testar endpoints individualmente

---

**Última atualização**: Junho 2025
**Versão**: 1.0.0 