#!/bin/bash
# Deploy rápido no servidor - execute no VPS

set -e

echo "🚀 Iniciando deploy..."

# Bloco 1: Preparação
cd /opt
mv embarcacoes embarcacoes.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
mkdir -p embarcacoes && cd embarcacoes

# Bloco 2: Clonar
echo "📥 Clonando repositório..."
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Bloco 3: Verificar .env
if [ ! -f ".env" ]; then
    echo "⚠️  Criando .env a partir do exemplo..."
    cp backend/ENV.EXAMPLE .env
    echo "📝 EDITE O ARQUIVO .env COM SUAS CONFIGURAÇÕES!"
    echo "Pressione Enter para continuar..."
    read
    nano .env
fi

# Bloco 4: Diretórios
echo "📁 Criando diretórios..."
mkdir -p nginx/ssl certbot/conf certbot/www

# Bloco 5: Verificar Docker
echo "🐳 Verificando Docker..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose não encontrado!"
    exit 1
fi

echo "✅ Usando: $COMPOSE_CMD"

# Bloco 6: Deploy
echo "🏗️  Construindo containers..."
$COMPOSE_CMD -f docker-compose.prod.yml build --no-cache

echo "🚀 Iniciando containers..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d

echo "⏳ Aguardando 30 segundos..."
sleep 30

echo "🗄️  Executando migrações..."
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || true

echo "🧹 Limpando órfãos..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d --remove-orphans

# Bloco 7: Verificar
echo "✅ Verificando status..."
$COMPOSE_CMD -f docker-compose.prod.yml ps

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "✅ DEPLOY CONCLUÍDO!"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Acesse: http://148.230.77.113"
echo ""
echo "📋 Ver logs:"
echo "   $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo ""


