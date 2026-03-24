# Health Check Script - CI Environment

## Melhorias Implementadas

### 1. **Melhor Tratamento de Erros**
- Uso de `set -euo pipefail` para capturar erros imediatamente
- Exit codes apropriados (0 para sucesso, 1 para falha)
- Tratamento específico para diferentes códigos HTTP

### 2. **Verificação em Duas Etapas**
- **Health Check Interno**: Verifica se a aplicação está funcionando no servidor (via SSH)
- **Health Check Externo**: Verifica se a aplicação está acessível via Cloudflare

### 3. **Verificação Automática do Traefik**
- Verifica se o Traefik está rodando a cada 3 tentativas
- Tenta iniciar o Traefik automaticamente se não estiver rodando
- HTTP 521 do Cloudflare geralmente indica que o Traefik não está rodando

### 4. **Logging Melhorado**
- Timestamps em todas as mensagens
- Mensagens mais descritivas
- Separação clara entre tentativas

### 5. **Diagnóstico Automático**
- Coleta informações de diagnóstico quando falha
- Verifica status de containers, Traefik, e conectividade interna
- Mostra logs relevantes para debug

## Como Usar

### Variáveis de Ambiente Necessárias

O script precisa das seguintes variáveis de ambiente:

```bash
SSH_USER=seu_usuario
SSH_HOST=seu_servidor
SSH_PASSWORD=sua_senha  # Ou use chave SSH
```

### Execução

```bash
chmod +x scripts/health-check-ci.sh
./scripts/health-check-ci.sh
```

### No GitHub Actions

```yaml
- name: Health Check CI
  env:
    SSH_USER: ${{ secrets.SSH_USER }}
    SSH_HOST: ${{ secrets.SSH_HOST }}
    SSH_PASSWORD: ${{ secrets.SSH_PASSWORD }}
  run: |
    chmod +x scripts/health-check-ci.sh
    ./scripts/health-check-ci.sh
```

## Troubleshooting

### HTTP 521 (Cloudflare)
- **Causa**: Cloudflare não consegue conectar ao servidor de origem
- **Solução**: Verificar se o Traefik está rodando
  ```bash
  docker ps | grep traefik
  docker-compose -f docker-compose.traefik.yml up -d
  ```

### Health Check Interno Falha
- **Causa**: Backend não está respondendo
- **Solução**: Verificar logs do backend
  ```bash
  docker logs secured-guard-backend-ci
  ```

### Timeout (HTTP 000)
- **Causa**: Aplicação ainda está inicializando ou há problema de rede
- **Solução**: Aguardar mais tempo ou verificar conectividade

## Exit Codes

- `0`: Health check passou com sucesso
- `1`: Health check falhou após todas as tentativas

## Configurações Ajustáveis

No início do script, você pode ajustar:

```bash
MAX_ATTEMPTS=15          # Número máximo de tentativas
HEALTH_CHECK_URL="..."   # URL do health check externo
INTERNAL_HEALTH_CHECK="..." # URL do health check interno
```

