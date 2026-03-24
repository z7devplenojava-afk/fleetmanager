#!/bin/bash

echo "=========================================="
echo "  INSTALANDO NODE.JS NO WSL"
echo "=========================================="
echo ""

# Instalar Node.js via NodeSource
echo "📦 Adicionando repositório NodeSource..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

echo ""
echo "📦 Instalando Node.js..."
sudo apt-get install -y nodejs

echo ""
echo "✅ Node.js instalado:"
node --version
npm --version

echo ""
echo "=========================================="
echo "  INSTALAÇÃO CONCLUÍDA!"
echo "=========================================="


