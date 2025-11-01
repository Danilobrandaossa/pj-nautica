#!/bin/bash

# Script de Deploy Automático - Sistema Embarcações
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do Sistema Embarcações..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se .env.production existe
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
    echo -e "${YELLOW}Copie o arquivo env.production.example para .env.production e configure${NC}"
    exit 1
fi

# Carregar variáveis de ambiente
source .env.production

echo -e "${GREEN}✅ Variáveis de ambiente carregadas${NC}"

# Parar containers antigos
echo -e "${YELLOW}⏸️  Parando containers antigos...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Limpar volumes antigos (opcional - comentar se não quiser perder dados)
# echo -e "${YELLOW}🗑️  Limpando volumes antigos...${NC}"
# docker volume rm $(docker volume ls -q -f name=embarcacoes) || true

# Build das imagens
echo -e "${YELLOW}🔨 Construindo imagens Docker...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Subir banco de dados primeiro
echo -e "${YELLOW}🗄️  Iniciando banco de dados...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres

# Aguardar banco ficar pronto
echo -e "${YELLOW}⏳ Aguardando banco de dados...${NC}"
sleep 10

# Aplicar migrações
echo -e "${YELLOW}📦 Aplicando migrações do banco...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Subir todos os serviços
echo -e "${YELLOW}🚀 Iniciando todos os serviços...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
echo -e "${YELLOW}⏳ Aguardando serviços...${NC}"
sleep 15

# Verificar status dos serviços
echo -e "${GREEN}📊 Status dos serviços:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
echo -e "${GREEN}📝 Últimos logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo -e "${GREEN}🌐 Acesse o sistema em: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}🔧 n8n disponível em: https://${N8N_HOST}${NC}"
echo ""
echo -e "${YELLOW}📊 Monitorar logs em tempo real:${NC}"
echo -e "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo -e "${YELLOW}🔄 Reiniciar serviço específico:${NC}"
echo -e "   docker-compose -f docker-compose.prod.yml restart [service]"
echo ""
echo -e "${YELLOW}⏹️  Parar todos os serviços:${NC}"
echo -e "   docker-compose -f docker-compose.prod.yml down"
echo ""


