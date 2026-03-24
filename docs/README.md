# Secure Guard

Sistema de gestão para vigilantes e segurança patrimonial.

## Configuração do Ambiente

### Backend (Spring Boot)
- Porta padrão: 8081
- URL base: http://localhost:8081
- Endpoint da API: http://localhost:8081/api

### Frontend (React + Vite)
- Porta padrão: 8080
- URL base: http://localhost:8080

### Configuração do Frontend (.env)
Crie um arquivo `.env` na raiz do diretório `frontend` com as seguintes variáveis:

```env
# API Configuration
VITE_API_URL=http://localhost:8081/api

# Frontend Configuration
VITE_FRONTEND_URL=http://localhost:8080

# Authentication
VITE_TOKEN_KEY=token
VITE_REFRESH_TOKEN_KEY=refreshToken
VITE_USER_KEY=user
```

## Configuração de CORS
O backend está configurado para aceitar requisições dos seguintes origins:
- http://localhost:8080 (Frontend)
- http://localhost:3000 (Frontend alternativo)

## Iniciando o Projeto

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Estrutura do Projeto

### Backend
- `src/main/java/com/z7design/secured_guard/`
  - `config/` - Configurações do Spring Boot
  - `controller/` - Controladores REST
  - `service/` - Lógica de negócio
  - `repository/` - Acesso a dados
  - `model/` - Entidades
  - `dto/` - Objetos de transferência de dados
  - `security/` - Configurações de segurança

### Frontend
- `src/`
  - `components/` - Componentes React
  - `pages/` - Páginas da aplicação
  - `contexts/` - Contextos React
  - `lib/` - Utilitários e configurações
  - `hooks/` - Hooks personalizados
  - `types/` - Definições de tipos TypeScript

## Autenticação
O sistema utiliza JWT (JSON Web Tokens) para autenticação:
1. Login: POST /api/auth/login
2. Refresh Token: POST /api/auth/refresh-token
3. Logout: Limpa os tokens do localStorage

## Contribuição
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 