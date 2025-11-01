#!/bin/bash
# Versão compacta do script de verificação - copie e cole diretamente no servidor
# Execute: bash <(curl -s https://raw.githubusercontent.com/SEU-REPO/main/check-server.sh)
# OU copie e cole o conteúdo deste arquivo no servidor

echo "🔍 VERIFICAÇÃO RÁPIDA DO SERVIDOR"
echo "=================================="

# Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
    systemctl is-active --quiet docker && echo "✅ Docker rodando" || echo "❌ Docker parado"
else
    echo "❌ Docker não instalado"
fi

# Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "✅ Docker Compose instalado"
else
    echo "❌ Docker Compose não instalado"
fi

# Diretório
if [ -d "/opt/embarcacoes" ]; then
    echo "✅ Diretório /opt/embarcacoes existe"
    cd /opt/embarcacoes
    
    [ -f "docker-compose.prod.yml" ] && echo "✅ docker-compose.prod.yml existe" || echo "❌ docker-compose.prod.yml não existe"
    [ -f ".env" ] && echo "✅ Arquivo .env existe" || echo "❌ Arquivo .env não existe"
    
    if [ -f ".env" ]; then
        echo ""
        echo "📋 Variáveis no .env:"
        grep -E "^POSTGRES_PASSWORD=|^JWT_SECRET=|^JWT_REFRESH_SECRET=|^FRONTEND_URL=|^VITE_API_URL=" .env | sed 's/=.*/=***/' || echo "   Algumas variáveis podem estar faltando"
    fi
else
    echo "❌ Diretório /opt/embarcacoes não existe"
fi

# Containers
echo ""
echo "📦 Containers:"
docker ps --format "{{.Names}} - {{.Status}}" 2>/dev/null | grep -E "embarcacoes|postgres" || echo "   Nenhum container do projeto rodando"

# Espaço e memória
echo ""
echo "💾 Recursos:"
df -h / | awk 'NR==2 {print "   Disco: " $4 " disponível (" $5 " usado)"}'
free -h | awk 'NR==2 {print "   RAM: " $7 " disponível de " $2}'

echo ""
echo "=================================="


