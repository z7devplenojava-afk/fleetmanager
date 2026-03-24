#!/bin/bash

# Script para gerenciar os ambientes separadamente
# Uso: ./manage-environments.sh [ambiente] [ação]
# Exemplo: ./manage-environments.sh prod up
#          ./manage-environments.sh dev restart
#          ./manage-environments.sh ci logs

set -e

ENVIRONMENT=$1
ACTION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$ACTION" ]; then
    echo "Uso: $0 [ambiente] [ação]"
    echo ""
    echo "Ambientes disponíveis:"
    echo "  prod   - Produção (securedguard.z7botsolutions.com.br)"
    echo "  dev    - Desenvolvimento (dev.z7botsolutions.com.br)"
    echo "  ci     - CI/CD (ci.z7botsolutions.com.br)"
    echo "  test   - Testes (test.z7botsolutions.com.br)"
    echo "  all    - Todos os ambientes"
    echo ""
    echo "Ações disponíveis:"
    echo "  up       - Subir o ambiente"
    echo "  down     - Parar o ambiente"
    echo "  restart  - Reiniciar o ambiente"
    echo "  logs     - Ver logs do ambiente"
    echo "  ps       - Status dos containers"
    echo "  rebuild  - Rebuild e reiniciar"
    echo "  clean    - Parar e limpar volumes"
    echo ""
    exit 1
fi

# Função para executar ação em um ambiente específico
run_action() {
    local env=$1
    local action=$2
    local compose_file="docker-compose.env-${env}.yml"
    
    echo "=========================================="
    echo "Executando '${action}' no ambiente '${env}'"
    echo "=========================================="
    
    case $action in
        up)
            docker compose -f "$compose_file" up -d
            ;;
        down)
            docker compose -f "$compose_file" down
            ;;
        restart)
            docker compose -f "$compose_file" restart
            ;;
        logs)
            docker compose -f "$compose_file" logs -f --tail=100
            ;;
        ps)
            docker compose -f "$compose_file" ps
            ;;
        rebuild)
            docker compose -f "$compose_file" down
            docker compose -f "$compose_file" up -d --build
            ;;
        clean)
            echo "⚠️  ATENÇÃO: Isto vai remover os volumes do ambiente ${env}!"
            read -p "Tem certeza? (digite 'yes' para confirmar): " confirm
            if [ "$confirm" = "yes" ]; then
                docker compose -f "$compose_file" down -v
                echo "✅ Ambiente ${env} limpo"
            else
                echo "❌ Operação cancelada"
            fi
            ;;
        *)
            echo "❌ Ação inválida: $action"
            exit 1
            ;;
    esac
}

# Executar ação
cd "$(dirname "$0")"

if [ "$ENVIRONMENT" = "all" ]; then
    for env in prod dev ci test; do
        run_action "$env" "$ACTION"
        echo ""
    done
else
    run_action "$ENVIRONMENT" "$ACTION"
fi

echo ""
echo "✅ Operação concluída!"
