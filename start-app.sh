#!/bin/bash

# Script para iniciar o app Prime Capital Trade
# Subdomínio: app.primecapitaltrade.com.br

echo "🚀 Iniciando Prime Capital Trade App..."

# 1. Navegar para o diretório do projeto
cd /caminho/para/seu/projeto  # Ajuste este caminho

# 2. Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --legacy-peer-deps
fi

# 3. Fazer build para produção
echo "🔨 Fazendo build para produção..."
npm run build

# 4. Iniciar o servidor
echo "🌐 Iniciando servidor na porta 8080..."
echo "📍 App estará disponível em: http://app.primecapitaltrade.com.br"

# Opção 1: Usar PM2 (recomendado para produção)
if command -v pm2 &> /dev/null; then
    echo "✅ Usando PM2 para gerenciar o processo..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
else
    echo "⚠️  PM2 não encontrado. Iniciando diretamente..."
    echo "💡 Para produção, instale PM2: npm install -g pm2"
    npm run dev -- --host 0.0.0.0 --port 8080
fi

echo ""
echo "✅ App iniciado com sucesso!"
echo "🌍 Acesse: http://app.primecapitaltrade.com.br"

