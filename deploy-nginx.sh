#!/bin/bash

# Script de Deploy para Prime Capital Trade App
# Subdomínio: app.primecapitaltrade.com.br

echo "🚀 Configurando Nginx para app.primecapitaltrade.com.br..."

# 1. Parar Nginx se estiver rodando
sudo systemctl stop nginx

# 2. Backup da configuração atual (se existir)
if [ -f "/etc/nginx/sites-enabled/trader-app" ]; then
    sudo cp /etc/nginx/sites-enabled/trader-app /etc/nginx/sites-enabled/trader-app.backup
    echo "✅ Backup da configuração anterior criado"
fi

# 3. Copiar nova configuração
sudo cp nginx-proxy.conf /etc/nginx/sites-available/trader-app
sudo ln -sf /etc/nginx/sites-available/trader-app /etc/nginx/sites-enabled/

echo "✅ Configuração copiada para sites-available"

# 4. Testar configuração
echo "🔍 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração do Nginx está válida"
    
    # 5. Recarregar Nginx
    sudo systemctl reload nginx
    sudo systemctl start nginx
    
    echo "✅ Nginx recarregado e iniciado"
    echo ""
    echo "🎉 Deploy concluído!"
    echo "📍 Seu app estará disponível em: http://app.primecapitaltrade.com.br"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Certifique-se de que o app está rodando na porta 8080"
    echo "2. Verifique se o DNS está apontando para este servidor"
    echo "3. Configure SSL/HTTPS se necessário"
    
else
    echo "❌ Erro na configuração do Nginx!"
    echo "Verifique o arquivo nginx-proxy.conf"
    exit 1
fi

# 6. Verificar status
echo ""
echo "📊 Status do Nginx:"
sudo systemctl status nginx --no-pager -l

