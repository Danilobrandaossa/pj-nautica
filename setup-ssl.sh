#!/bin/bash

# Script para configurar SSL com Let's Encrypt
# Uso: ./setup-ssl.sh seu-dominio.com.br

set -e

if [ -z "$1" ]; then
    echo "❌ Erro: Domínio não fornecido"
    echo "Uso: ./setup-ssl.sh seu-dominio.com.br"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

echo "🔐 Configurando SSL para: ${DOMAIN}"
echo "📧 Email: ${EMAIL}"

# Criar diretórios necessários
mkdir -p nginx/ssl
mkdir -p certbot/conf
mkdir -p certbot/www

# Atualizar nginx.conf com o domínio
echo "📝 Atualizando configuração do Nginx..."
sed -i "s/embarcacoes.seudominio.com.br/${DOMAIN}/g" nginx/nginx.conf
sed -i "s/n8n.seudominio.com.br/n8n.${DOMAIN}/g" nginx/nginx.conf

# Subir apenas o Nginx temporariamente para validação
echo "🚀 Iniciando Nginx temporariamente..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Aguardar Nginx iniciar
sleep 5

# Obter certificado SSL
echo "🔐 Obtendo certificado SSL..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

# Obter certificado para n8n
echo "🔐 Obtendo certificado SSL para n8n..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d n8n.${DOMAIN}

# Reiniciar Nginx com SSL
echo "🔄 Reiniciando Nginx com SSL..."
docker-compose -f docker-compose.prod.yml restart nginx

echo ""
echo "✅ SSL configurado com sucesso!"
echo "🌐 Seu site agora está disponível em: https://${DOMAIN}"
echo "🔧 n8n disponível em: https://n8n.${DOMAIN}"
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Apontar o DNS do domínio para o IP do servidor"
echo "   2. Liberar as portas 80 e 443 no firewall"
echo ""


