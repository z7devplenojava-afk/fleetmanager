# Credenciais de Teste - Secure Guard

## Usuários Cadastrados no Sistema

### 1. Administrador
- **Username:** `testuser`
- **Email:** `test@example.com`
- **Senha:** `Password123!`
- **Role:** `ADMIN`
- **Permissões:** Acesso total ao sistema

### 2. Recursos Humanos
- **Username:** `rhuser`
- **Email:** `rh@example.com`
- **Senha:** `Password123!`
- **Role:** `RH`
- **Permissões:** Gestão de colaboradores, holerites, relatórios

### 3. Colaborador
- **Username:** `colaborador`
- **Email:** `colaborador@example.com`
- **Senha:** `Password123!`
- **Role:** `VIGILANTE`
- **Permissões:** Visualizar próprio holerite, editar perfil

## Roles Disponíveis no Sistema

### Roles Oficiais (definidos no backend):
- **ADMIN** - Administrador do sistema
- **RH** - Recursos Humanos  
- **GESTOR** - Gestor/Coordenador
- **SUPERVISOR** - Supervisor de equipe
- **VIGILANTE** - Colaborador operacional

## Como Testar

1. **Inicie o Backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Inicie o Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acesse o Sistema:**
   - Portal público: `http://localhost:8080/`
   - Sistema admin: `http://localhost:8080/admin`
   - Login direto: `http://localhost:8080/login`

4. **Use uma das credenciais acima para fazer login**

## Endpoints da API

- **Backend:** `http://localhost:8081/api`
- **Login:** `POST /api/auth/login`
- **Swagger:** `http://localhost:8081/swagger-ui.html`

## Estrutura de Roles e Permissões

### ADMIN
- Dashboard completo
- Gestão de colaboradores
- Gestão de clientes
- Gestão de contratos
- Financeiro
- Frota
- Documentos
- Relatórios
- Configurações

### RH
- Dashboard
- Gestão de colaboradores
- Holerites
- Relatórios
- Configurações

### GESTOR
- Dashboard
- Gestão de colaboradores
- Gestão de contratos
- Relatórios
- Configurações

### SUPERVISOR
- Dashboard
- Minha equipe
- Relatórios
- Holerites
- Configurações

### VIGILANTE
- Meu holerite
- Meu perfil
- Configurações 