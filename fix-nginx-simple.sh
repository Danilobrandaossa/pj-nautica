#!/bin/bash
# Versão simplificada - copie e cole diretamente no servidor

echo "🔧 Corrigindo Nginx..."

# Parar Nginx do sistema
echo "1. Parando Nginx do sistema..."
systemctl stop nginx 2>/dev/null && echo "✅ Nginx do sistema parado" || echo "⚠️  Nginx do sistema não estava rodando"
systemctl disable nginx 2>/dev/null

# Ir para diretório
cd /opt/embarcacoes

# Reiniciar container Nginx
echo "2. Reiniciando container Nginx..."
docker-compose -f docker-compose.prod.yml restart nginx

# Aguardar
sleep 5

# Verificar
echo "3. Verificando status..."
docker ps | grep nginx

echo "4. Testando..."
curl -s http://localhost | head -20 || echo "⚠️  Ainda não está funcionando"

echo ""
echo "✅ Correção concluída!"
echo ""
echo "Verifique os logs:"
echo "  docker-compose -f docker-compose.prod.yml logs nginx"


