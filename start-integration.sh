#!/bin/bash

echo "========================================"
echo "   Iniciando FluxBus Integration"
echo "========================================"
echo

echo "[1/3] Verificando se o backend esta rodando..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "Backend ja esta rodando na porta 8081"
else
    echo "Iniciando backend..."
    cd backend && mvn spring-boot:run -DskipTests &
    sleep 5
fi

echo
echo "[2/3] Verificando se o frontend esta rodando..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "Frontend ja esta rodando na porta 5173"
else
    echo "Iniciando frontend..."
    cd frontend && npm run dev &
    sleep 3
fi

echo
echo "[3/3] Verificando status dos servicos..."
echo
echo "Backend:  http://localhost:8081"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8081/swagger-ui/index.html"
echo
echo "========================================"
echo "    Servicos iniciados com sucesso!"
echo "========================================"
echo
echo "Pressione qualquer tecla para abrir o frontend no navegador..."
read -n 1 -s

# Abrir navegador (funciona no Linux/Mac)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
else
    echo "Navegador nao pode ser aberto automaticamente."
    echo "Acesse: http://localhost:5173"
fi 