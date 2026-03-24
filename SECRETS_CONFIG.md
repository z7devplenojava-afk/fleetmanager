# 🔐 Configuração de Secrets para Deploy CI

## Secrets Necessários no GitHub

Para que o workflow de deploy funcione corretamente, você precisa configurar os seguintes secrets no GitHub:

### Como configurar:
1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret abaixo com o nome e valor exatos

### Lista de Secrets:

| Nome do Secret | Valor | Descrição |
|---------------|-------|-----------|
| `DOCKER_USERNAME` | `z7design` | Usuário do Docker Hub |
| `DOCKER_PASSWORD` | `M@rio335544` | Senha do Docker Hub |
| `VPS_HOST_CI` | `185.225.233.18` | Endereço IP do servidor VPS |
| `VPS_USER_CI` | `root` | Usuário SSH do servidor |
| `VPS_PASSWORD_CI` | `4KaCiJc6an@7sg@2026` | Senha SSH do servidor |
| `POSTGRES_PASSWORD_CI` | `4KaCiJc6an@7sgbdcid2025` | Senha do banco de dados PostgreSQL |
| `REDIS_PASSWORD_CI` | `redis_ci_2025` | Senha do Redis |
| `JWT_SECRET_CI` | `jwt_secret_ci_2025` | Secret para JWT (deve ter pelo menos 64 caracteres) |

### ⚠️ IMPORTANTE:
- Os nomes dos secrets são **case-sensitive** (sensíveis a maiúsculas/minúsculas)
- Use exatamente os nomes listados acima
- Os secrets com sufixo `_CI` são específicos para o ambiente CI
- Não compartilhe esses valores publicamente

### Verificação:
Após configurar os secrets, o workflow `deploy-ci-docker.yml` deve executar automaticamente quando houver push na branch `ci`.

