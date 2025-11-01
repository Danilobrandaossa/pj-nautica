#!/bin/bash

# 🔍 Script de Verificação do Servidor VPS
# Execute este script no servidor para verificar se está pronto para deploy

set -e

echo "🔍 VERIFICAÇÃO DO SERVIDOR VPS"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

ERRORS=0

echo "1️⃣ VERIFICANDO SISTEMA OPERACIONAL"
echo "-----------------------------------"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "   Sistema: $PRETTY_NAME"
    check 0 "Sistema operacional detectado"
else
    check 1 "Sistema operacional não identificado"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "2️⃣ VERIFICANDO DOCKER"
echo "-----------------------------------"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "   Versão: $DOCKER_VERSION"
    check 0 "Docker instalado"
    
    if systemctl is-active --quiet docker; then
        check 0 "Docker em execução"
    else
        warn "Docker não está rodando. Inicie com: systemctl start docker"
        ERRORS=$((ERRORS + 1))
    fi
    
    if systemctl is-enabled --quiet docker; then
        check 0 "Docker configurado para iniciar automaticamente"
    else
        warn "Docker não está configurado para iniciar automaticamente"
        info "Configure com: systemctl enable docker"
    fi
else
    check 1 "Docker não instalado"
    warn "Instale Docker com: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "3️⃣ VERIFICANDO DOCKER COMPOSE"
echo "-----------------------------------"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "   Versão: $COMPOSE_VERSION"
    check 0 "Docker Compose instalado"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo "   Versão: $COMPOSE_VERSION"
    check 0 "Docker Compose (plugin) instalado"
else
    check 1 "Docker Compose não instalado"
    warn "Instale com: apt install docker-compose -y"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "4️⃣ VERIFICANDO DIRETÓRIO DO PROJETO"
echo "-----------------------------------"
PROJECT_DIR="/opt/embarcacoes"
if [ -d "$PROJECT_DIR" ]; then
    check 0 "Diretório $PROJECT_DIR existe"
    
    cd "$PROJECT_DIR" || exit 1
    
    if [ -f "docker-compose.prod.yml" ]; then
        check 0 "Arquivo docker-compose.prod.yml encontrado"
    else
        check 1 "Arquivo docker-compose.prod.yml não encontrado"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -f ".env" ]; then
        check 0 "Arquivo .env encontrado"
        
        # Verificar variáveis essenciais
        echo ""
        info "Verificando variáveis de ambiente essenciais..."
        
        REQUIRED_VARS=(
            "POSTGRES_PASSWORD"
            "JWT_SECRET"
            "JWT_REFRESH_SECRET"
            "FRONTEND_URL"
            "VITE_API_URL"
        )
        
        MISSING_VARS=0
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^${var}=" .env 2>/dev/null; then
                VALUE=$(grep "^${var}=" .env | cut -d '=' -f2)
                if [ -z "$VALUE" ] || [ "$VALUE" = "" ]; then
                    warn "$var está vazia"
                    MISSING_VARS=$((MISSING_VARS + 1))
                else
                    echo "   ✅ $var configurada"
                fi
            else
                warn "$var não encontrada no .env"
                MISSING_VARS=$((MISSING_VARS + 1))
            fi
        done
        
        if [ $MISSING_VARS -eq 0 ]; then
            check 0 "Todas as variáveis essenciais configuradas"
        else
            check 1 "$MISSING_VARS variável(is) faltando ou vazia(s)"
            ERRORS=$((ERRORS + 1))
        fi
    else
        check 1 "Arquivo .env não encontrado"
        warn "Crie o arquivo .env baseado em env.production.example"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar permissões
    if [ -w "$PROJECT_DIR" ]; then
        check 0 "Permissões de escrita no diretório"
    else
        warn "Sem permissão de escrita. Ajuste com: chown -R \$USER:\$USER $PROJECT_DIR"
        ERRORS=$((ERRORS + 1))
    fi
else
    check 1 "Diretório $PROJECT_DIR não existe"
    warn "Crie com: mkdir -p $PROJECT_DIR && chown -R \$USER:\$USER $PROJECT_DIR"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "5️⃣ VERIFICANDO ESTRUTURA DE DIRETÓRIOS"
echo "-----------------------------------"
cd "$PROJECT_DIR" 2>/dev/null || PROJECT_DIR="."
DIRS=("nginx" "nginx/ssl" "certbot/conf" "certbot/www")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check 0 "Diretório $dir existe"
    else
        warn "Diretório $dir não existe"
        info "Criar com: mkdir -p $dir"
    fi
done
echo ""

echo "6️⃣ VERIFICANDO CONTAINERS EXISTENTES"
echo "-----------------------------------"
if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -E "embarcacoes|postgres" | wc -l)
    if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
        info "Containers em execução: $RUNNING_CONTAINERS"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "embarcacoes|postgres|NAMES" || true
    else
        info "Nenhum container do projeto em execução"
    fi
    
    ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}" 2>/dev/null | grep -E "embarcacoes|postgres" | wc -l)
    if [ "$ALL_CONTAINERS" -gt 0 ]; then
        info "Total de containers do projeto: $ALL_CONTAINERS"
    fi
fi
echo ""

echo "7️⃣ VERIFICANDO PORTAS"
echo "-----------------------------------"
PORTS=(80 443 5432 5678)
for port in "${PORTS[@]}"; do
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "   ✅ Porta $port está em uso"
        else
            echo "   ⚠️  Porta $port não está em uso"
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo "   ✅ Porta $port está em uso"
        else
            echo "   ⚠️  Porta $port não está em uso"
        fi
    else
        info "Ferramentas de verificação de portas não disponíveis"
        break
    fi
done
echo ""

echo "8️⃣ VERIFICANDO FIREWALL"
echo "-----------------------------------"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status 2>/dev/null | head -n 1)
    echo "   Status: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        info "Firewall ativo - Verifique se as portas necessárias estão abertas"
    fi
elif command -v firewall-cmd &> /dev/null; then
    info "firewalld detectado - Verifique configurações manualmente"
else
    info "Firewall não detectado ou não configurado"
fi
echo ""

echo "9️⃣ VERIFICANDO ACESSO SSH PARA GITHUB ACTIONS"
echo "-----------------------------------"
if [ -f ~/.ssh/authorized_keys ]; then
    KEY_COUNT=$(wc -l < ~/.ssh/authorized_keys)
    echo "   Chaves autorizadas: $KEY_COUNT"
    if [ "$KEY_COUNT" -gt 0 ]; then
        check 0 "Arquivo authorized_keys existe e tem chaves"
    else
        warn "Arquivo authorized_keys vazio"
    fi
else
    warn "Arquivo authorized_keys não encontrado"
    info "Crie com: mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
fi

# Verificar permissões do .ssh
if [ -d ~/.ssh ]; then
    SSH_PERMS=$(stat -c "%a" ~/.ssh 2>/dev/null || stat -f "%OLp" ~/.ssh 2>/dev/null)
    if [ "$SSH_PERMS" = "700" ] || [ "$SSH_PERMS" = "755" ]; then
        check 0 "Permissões do diretório .ssh corretas"
    else
        warn "Permissões do diretório .ssh: $SSH_PERMS (recomendado: 700)"
        info "Ajuste com: chmod 700 ~/.ssh"
    fi
fi
echo ""

echo "🔟 VERIFICANDO ESPAÇO EM DISCO"
echo "-----------------------------------"
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
    echo "   Espaço disponível: $DISK_AVAIL"
    echo "   Uso: ${DISK_USAGE}%"
    if [ "$DISK_USAGE" -lt 80 ]; then
        check 0 "Espaço em disco suficiente"
    else
        warn "Espaço em disco abaixo de 20% livre"
        ERRORS=$((ERRORS + 1))
    fi
fi
echo ""

echo "1️⃣1️⃣ VERIFICANDO MEMÓRIA"
echo "-----------------------------------"
if command -v free &> /dev/null; then
    MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
    MEM_AVAIL=$(free -m | awk 'NR==2{print $7}')
    echo "   Total: ${MEM_TOTAL}MB"
    echo "   Disponível: ${MEM_AVAIL}MB"
    if [ "$MEM_AVAIL" -gt 512 ]; then
        check 0 "Memória suficiente disponível"
    else
        warn "Pouca memória disponível (recomendado: >512MB)"
    fi
fi
echo ""

echo "================================"
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Servidor está PRONTO para deploy!${NC}"
    echo ""
    info "Próximos passos:"
    echo "   1. Configure os secrets no GitHub (veja DEPLOY-GITHUB.md)"
    echo "   2. Faça push do código para o repositório"
    echo "   3. O GitHub Actions fará o deploy automaticamente"
    exit 0
else
    echo -e "${RED}❌ Encontrados $ERRORS problema(s) que precisam ser corrigidos${NC}"
    echo ""
    info "Corrija os problemas acima antes de fazer o deploy"
    exit 1
fi


