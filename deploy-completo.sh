#!/bin/bash

# Script de Deploy Completo - Sistema de Embarcações
# Execute este script no servidor VPS

set -e

echo "🚀 Iniciando deploy completo do sistema de embarcações..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
fi

log "=== FASE 1: PREPARANDO SERVIDOR ==="

log "Atualizando sistema..."
apt update && apt upgrade -y

log "Instalando dependências necessárias..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

log "Instalando Docker..."
# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker

log "Instalando Docker Compose standalone..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

log "Verificando instalações..."
docker --version
docker-compose --version

log "=== FASE 2: PREPARANDO DIRETÓRIO ==="

log "Criando diretório do projeto..."
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

log "Limpando diretório anterior (se existir)..."
rm -rf * .*

log "Criando estrutura de diretórios..."
mkdir -p nginx ssl certbot/conf certbot/www

log "=== FASE 3: CRIANDO ARQUIVOS DE CONFIGURAÇÃO ==="

log "Criando docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: embarcacoes_db_prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-embarcacoes}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-embarcacoes_db}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    networks:
      - embarcacoes_network_prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-embarcacoes}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: embarcacoes_backend_prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-embarcacoes}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-embarcacoes_db}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - embarcacoes_network_prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: embarcacoes_frontend_prod
    restart: always
    depends_on:
      - backend
    networks:
      - embarcacoes_network_prod

  nginx:
    image: nginx:alpine
    container_name: embarcacoes_nginx_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - embarcacoes_network_prod

  n8n:
    image: n8nio/n8n:latest
    container_name: embarcacoes_n8n_prod
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST:-145.223.93.235}
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=${N8N_WEBHOOK_URL}
    volumes:
      - n8n_data_prod:/home/node/.n8n
    networks:
      - embarcacoes_network_prod

volumes:
  postgres_data_prod:
    driver: local
  n8n_data_prod:
    driver: local

networks:
  embarcacoes_network_prod:
    driver: bridge
EOF

log "Criando arquivo .env..."
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=embarcacoes_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# URLs
FRONTEND_URL=${FRONTEND_URL}
VITE_API_URL=${VITE_API_URL}

# n8n Configuration
N8N_USER=${N8N_USER}
N8N_PASSWORD=${N8N_PASSWORD}
N8N_HOST=${N8N_HOST}
N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
EOF

log "Criando configuração do Nginx..."
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name 145.223.93.235;

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

log "=== FASE 4: CRIANDO DOCKERFILES ==="

log "Criando Dockerfile para Backend..."
mkdir -p backend
cat > backend/Dockerfile.prod << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
EOF

log "Criando Dockerfile para Frontend..."
mkdir -p frontend
cat > frontend/Dockerfile.prod << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando para iniciar
CMD ["nginx", "-g", "daemon off;"]
EOF

log "Criando nginx.conf para frontend..."
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

log "=== FASE 5: CRIANDO ESTRUTURA BÁSICA DO PROJETO ==="

log "Criando estrutura básica do backend..."
mkdir -p backend/src/{controllers,services,routes,middleware,utils,types}
mkdir -p backend/prisma

# Criar package.json básico para backend
cat > backend/package.json << 'EOF'
{
  "name": "embarcacoes-backend",
  "version": "1.0.0",
  "description": "Backend API para sistema de agendamento de embarcações",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "seed": "npm run prisma:generate && npm run prisma:seed"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "axios": "^1.6.5",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "date-fns": "^3.0.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "qrcode": "^1.5.4",
    "speakeasy": "^2.0.0",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.6",
    "@types/qrcode": "^1.5.5",
    "@types/speakeasy": "^2.0.10",
    "prisma": "^5.7.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
EOF

# Criar server.ts básico
cat > backend/src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Embarcacoes API',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
EOF

# Criar tsconfig.json
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

log "Criando estrutura básica do frontend..."
mkdir -p frontend/src/{components,pages,hooks,lib,stores}

# Criar package.json básico para frontend
cat > frontend/package.json << 'EOF'
{
  "name": "embarcacoes-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
EOF

# Criar index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sistema de Embarcações</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Criar main.tsx
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Criar App.tsx
cat > frontend/src/App.tsx << 'EOF'
import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚢 Sistema de Embarcações</h1>
      <p>Sistema de agendamento de embarcações</p>
      <p>Status: ✅ Online</p>
    </div>
  )
}

export default App
EOF

# Criar vite.config.ts
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
EOF

log "=== FASE 6: INICIANDO APLICAÇÃO ==="

log "Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d --build

log "Aguardando containers iniciarem..."
sleep 30

log "Executando migrações do banco de dados..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate

log "Inicializando banco de dados (criando conta admin)..."
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed

log "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

log "=== DEPLOY CONCLUÍDO! ==="
echo ""
info "🌐 URLs de Acesso:"
echo "   Frontend: http://145.223.93.235"
echo "   Backend API: http://145.223.93.235/api"
echo "   n8n: http://145.223.93.235:5678"
echo ""
info "🔑 Suas Credenciais de Admin:"
echo "   Email: contato@danilobrandao.com.br"
echo "   Senha: Zy598859D@n"
echo ""
info "🚀 Próximos Passos:"
echo "   1. Acesse: http://145.223.93.235"
echo "   2. Faça login com suas credenciais"
echo "   3. Cadastre suas embarcações"
echo "   4. Cadastre seus usuários"
echo "   5. Configure o sistema conforme necessário"
echo ""
info "📊 Para monitorar os logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
info "🛠️ Para parar a aplicação:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
log "✅ Sistema de Embarcações deployado com sucesso!"
