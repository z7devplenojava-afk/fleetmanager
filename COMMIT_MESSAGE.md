# Resumo das Mudanças

## 1. Organização Hierárquica de Documentos Unificados
- Implementada organização por Empresa/Setor/Ano/Mês na aba "Unificados"
- Adicionada estrutura hierárquica similar à aba de Holerites
- Funções de carregamento e renderização da organização

## 2. Seleção em Massa e Ações em Massa
- Adicionados checkboxes para seleção em massa por empresa, setor e período
- Implementados botões de ação em massa (Email, WhatsApp, Excluir)
- Lógica de exibição condicional baseada no estado de expansão
- Checkboxes individuais para cada documento quando período está expandido

## 3. Correção do Health Check no Deploy CI
- Aumentado tempo de espera inicial de 30s para 60s
- Aumentado número de tentativas de 10 para 15
- Aumentado intervalo entre tentativas de 10s para 15s
- Adicionado timeout no curl (--max-time 10 --connect-timeout 5)
- Adicionada verificação prévia do status dos containers
- Adicionado diagnóstico detalhado quando health check falha
- Verificação periódica de logs a cada 3 tentativas
- Melhor tratamento de erros e mensagens informativas

## Arquivos Modificados
- frontend/src/pages/Holerites.tsx
- frontend/src/pages/UnificadosPorSetor.tsx
- .github/workflows/deploy-ci-only.yml
- .github/workflows/deploy-ci-docker.yml

