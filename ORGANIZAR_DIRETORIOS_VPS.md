# 📁 Organizar Diretórios na VPS

## Situação Atual

Existem dois diretórios na VPS:

1. **`~/secured-guard`** (`/root/secured-guard`)
   - ❌ **NÃO é usado pelo deploy automatizado**
   - Provavelmente um clone manual ou antigo
   - Pode ser removido ou mantido como backup

2. **`/var/www/secured_guard/ci`** ✅
   - ✅ **Este é o diretório OFICIAL usado pelo GitHub Actions**
   - É onde o workflow `deploy-ci-docker.yml` faz deploy
   - É onde os containers Docker estão rodando
   - É onde o arquivo `.env` é criado pelo workflow

## Qual Usar?

**SEMPRE use `/var/www/secured_guard/ci`** para:
- Fazer `git pull`
- Executar `docker-compose`
- Verificar logs
- Fazer qualquer manutenção

## Recomendação: Limpar Diretório Duplicado

### Opção 1: Remover o diretório antigo (Recomendado)

```bash
# 1. Verificar se não há nada importante no diretório antigo
ls -la ~/secured-guard

# 2. Se não houver nada importante, remover
rm -rf ~/secured-guard

# 3. Confirmar que o diretório correto está sendo usado
cd /var/www/secured_guard/ci
git status
```

### Opção 2: Manter como backup (Se houver dados importantes)

```bash
# 1. Renomear o diretório antigo para backup
mv ~/secured-guard ~/secured-guard-backup-$(date +%Y%m%d)

# 2. Criar um link simbólico se necessário (opcional)
# ln -s /var/www/secured_guard/ci ~/secured-guard
```

## Verificar Qual Diretório Está Sendo Usado

```bash
# Verificar onde os containers estão rodando
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Verificar volumes Docker
docker volume ls | grep secured-guard

# Verificar qual diretório tem o docker-compose.ci.yml
find / -name "docker-compose.ci.yml" 2>/dev/null

# Verificar qual diretório tem o .env
find / -name ".env" -path "*/ci/*" 2>/dev/null
```

## Estrutura Correta Esperada

```
/var/www/secured_guard/ci/
├── .git/                    # Repositório Git (branch ci)
├── .env                     # Variáveis de ambiente (criado pelo workflow)
├── docker-compose.ci.yml    # Docker Compose para CI
├── nginx/
│   └── ci.conf             # Configuração Nginx
├── backend/                 # Código do backend (se build local)
├── frontend/                # Código do frontend (se build local)
├── uploads/                 # Uploads de arquivos
├── logs/                    # Logs da aplicação
└── ...                      # Outros arquivos do projeto
```

## Comandos Corretos para Usar

```bash
# ✅ SEMPRE use este diretório
cd /var/www/secured_guard/ci

# Fazer pull
git pull origin ci

# Verificar status
git status

# Executar docker-compose
docker-compose -f docker-compose.ci.yml ps
docker-compose -f docker-compose.ci.yml up -d
docker-compose -f docker-compose.ci.yml logs -f

# Verificar logs
docker logs secured-guard-backend-ci --tail 50
```

## Por Que Dois Diretórios?

1. **`~/secured-guard`** - Provavelmente criado manualmente durante setup inicial ou testes
2. **`/var/www/secured_guard/ci`** - Criado pelo workflow do GitHub Actions, seguindo padrão Linux para aplicações web (`/var/www/`)

## Próximos Passos

1. ✅ **Use sempre `/var/www/secured_guard/ci`**
2. ✅ **Remova ou renomeie `~/secured-guard` se não for necessário**
3. ✅ **Configure um alias no `.bashrc` para facilitar acesso:**

```bash
# Adicionar ao ~/.bashrc
alias secured-ci='cd /var/www/secured_guard/ci'

# Depois executar
source ~/.bashrc

# Agora pode usar apenas:
secured-ci
```
