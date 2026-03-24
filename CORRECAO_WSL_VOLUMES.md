# 🔧 Correção: Volumes Docker no WSL

## ❌ Problema

Ao tentar subir os containers no WSL, o erro ocorria porque `/var/www` é um sistema de arquivos somente leitura:

```
ERROR: Cannot start service postgres-ci: error while creating mount source path '/var/www/secured_guard/ci/postgres_data': mkdir /var/www: read-only file system
```

## ✅ Solução Aplicada

O arquivo `docker-compose.ci.yml` foi modificado para usar **volumes nomeados do Docker** ao invés de **bind mounts** (mapeamento direto de diretórios do host).

### Antes (Bind Mounts - Problema):
```yaml
volumes:
  - /var/www/secured_guard/ci/postgres_data:/var/lib/postgresql/data
```

### Depois (Volumes Nomeados - Solução):
```yaml
volumes:
  - postgres_data_ci:/var/lib/postgresql/data

# No final do arquivo:
volumes:
  postgres_data_ci:
    driver: local
```

## 📋 Mudanças Realizadas

1. **PostgreSQL**: `postgres_data_ci` volume
2. **Redis**: `redis_data_ci` volume  
3. **Backend uploads**: `uploads_ci` volume
4. **Backend logs**: `logs_ci` volume
5. **WhatsApp sessions**: `whatsapp_sessions_ci` volume

## 🚀 Como Usar Agora

1. **Parar containers existentes (se houver):**
   ```bash
   docker-compose -f docker-compose.ci.yml down
   ```

2. **Subir os containers:**
   ```bash
   docker-compose -f docker-compose.ci.yml up -d
   ```

3. **Os volumes serão criados automaticamente pelo Docker** no diretório padrão:
   - Linux: `/var/lib/docker/volumes/`
   - WSL: Dentro do sistema de arquivos do WSL

## 📍 Localização dos Dados

Os dados agora são armazenados em volumes gerenciados pelo Docker. Para verificar:

```bash
# Listar volumes
docker volume ls | grep ci

# Inspecionar volume
docker volume inspect secured-guard_postgres_data_ci

# Ver localização física (no WSL)
docker volume inspect secured-guard_postgres_data_ci | grep Mountpoint
```

## 🗑️ Limpar Volumes (Opcional)

Se quiser limpar todos os dados e começar do zero:

```bash
# Parar e remover containers + volumes
docker-compose -f docker-compose.ci.yml down -v

# Ou remover volumes específicos
docker volume rm secured-guard_postgres_data_ci
docker volume rm secured-guard_redis_data_ci
docker volume rm secured-guard_uploads_ci
docker volume rm secured-guard_logs_ci
docker volume rm secured-guard_whatsapp_sessions_ci
```

## 🔍 Vantagens dos Volumes Nomeados

1. ✅ **Funciona em qualquer ambiente** (WSL, Linux, Docker Desktop)
2. ✅ **Não precisa de permissões especiais** no sistema de arquivos
3. ✅ **Gerenciados pelo Docker** - backup e restauração mais fáceis
4. ✅ **Melhor performance** em alguns casos

## ⚠️ Observações

- Os dados ainda são **persistentes** - ficam salvos mesmo após `docker-compose down`
- Para limpar completamente, use `docker-compose down -v`
- A rede `z7network` foi configurada como não-externa (será criada automaticamente se não existir)





