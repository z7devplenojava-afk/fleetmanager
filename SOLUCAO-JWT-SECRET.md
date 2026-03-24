# 🔧 Solução para Erro 500 no Login - JWT_SECRET muito curta

## Problema Identificado

O erro 500 no login está sendo causado porque a chave JWT (`JWT_SECRET`) tem apenas **18 bytes**, mas o algoritmo HS512 requer pelo menos **64 bytes (512 bits)**.

## Causa

A variável de ambiente `JWT_SECRET` no host pode estar definida com um valor curto, sobrescrevendo o valor padrão do `docker-compose.ci.yml`.

## Solução

### Opção 1: Verificar e corrigir a variável no host (RECOMENDADO)

Execute na VPS:

```bash
# 1. Verificar se JWT_SECRET está definida no host
echo $JWT_SECRET

# 2. Se estiver definida com valor curto, removê-la ou definir com valor correto
unset JWT_SECRET

# OU definir com valor correto (pelo menos 64 caracteres)
export JWT_SECRET='jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key'

# 3. Reiniciar o container backend
docker-compose -f docker-compose.ci.yml restart backend-ci

# 4. Verificar se a chave está correta no container
docker exec secured-guard-backend-ci printenv | grep JWT_SECRET
```

### Opção 2: Usar o script de diagnóstico

```bash
chmod +x fix-jwt-secret.sh
bash fix-jwt-secret.sh
```

### Opção 3: Forçar o valor padrão no docker-compose

O `docker-compose.ci.yml` já tem um valor padrão correto (80 caracteres). Se a variável no host estiver sobrescrevendo, você pode:

1. Remover a variável do host: `unset JWT_SECRET`
2. Ou editar o docker-compose para usar um valor fixo (não recomendado para produção)

## Verificação

Após corrigir, verifique os logs:

```bash
docker logs --tail=50 secured-guard-backend-ci | grep -i jwt
```

Você deve ver uma mensagem como:
```
🔑 Configurando chave JWT: tamanho = 80 bytes (primeiros 10 caracteres: jwt_secret...)
```

## Valor Mínimo Requerido

- **Algoritmo**: HS512
- **Tamanho mínimo**: 64 bytes (512 bits)
- **Recomendado**: 80+ bytes para maior segurança

## Nota

O valor padrão no `docker-compose.ci.yml` já está correto (80 caracteres). O problema é que uma variável de ambiente no host está sobrescrevendo esse valor.

