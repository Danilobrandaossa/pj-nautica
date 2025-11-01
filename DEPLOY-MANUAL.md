# 🚀 Deploy Manual - Sistema de Embarcações

## Resumo do Projeto
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + TypeScript  
- **Banco**: PostgreSQL
- **Automação**: n8n
- **Proxy**: Nginx
- **Deploy**: Docker + Docker Compose

## Passo 1: Preparar o Servidor

Conecte ao servidor e execute:

```bash
ssh root@145.223.93.235
# Senha: Zy598859D@n22
```

No servidor, execute:

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Criar diretório do projeto
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Limpar conteúdo anterior
rm -rf * .*

# Criar estrutura de diretórios
mkdir -p nginx ssl certbot/conf certbot/www
```

## Passo 2: Upload dos Arquivos

### Opção A: Upload Manual via SCP

Do seu computador local, execute:

```bash
# Upload dos diretórios principais
scp -r backend root@145.223.93.235:/opt/embarcacoes/
scp -r frontend root@145.223.93.235:/opt/embarcacoes/
scp -r nginx root@145.223.93.235:/opt/embarcacoes/

# Upload dos arquivos de configuração
scp docker-compose.yml root@145.223.93.235:/opt/embarcacoes/
scp docker-compose.prod.yml root@145.223.93.235:/opt/embarcacoes/
scp env.production root@145.223.93.235:/opt/embarcacoes/.env

# Upload dos scripts
scp prepare-server.sh root@145.223.93.235:/opt/embarcacoes/
scp start-deploy.sh root@145.223.93.235:/opt/embarcacoes/
```

### Opção B: Upload via WinSCP ou FileZilla

1. Conecte ao servidor usando WinSCP ou FileZilla:
   - **Host**: 145.223.93.235
   - **Usuário**: root
   - **Senha**: Zy598859D@n22
   - **Porta**: 22

2. Navegue para `/opt/embarcacoes/`

3. Faça upload das pastas e arquivos:
   - `backend/`
   - `frontend/`
   - `nginx/`
   - `docker-compose.yml`
   - `docker-compose.prod.yml`
   - `env.production` (renomeie para `.env`)
   - `prepare-server.sh`
   - `start-deploy.sh`

## Passo 3: Configurar e Iniciar

No servidor, execute:

```bash
cd /opt/embarcacoes

# Tornar scripts executáveis
chmod +x prepare-server.sh start-deploy.sh

# Verificar se os arquivos estão corretos
ls -la

# Iniciar a aplicação
./start-deploy.sh
```

## Passo 4: Verificar Deploy

```bash
# Verificar containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Testar endpoints
curl http://145.223.93.235/api/health
curl http://145.223.93.235
```

## URLs de Acesso

- **Frontend**: http://145.223.93.235
- **Backend API**: http://145.223.93.235/api
- **n8n**: http://145.223.93.235:5678

## Comandos Úteis

### Parar aplicação:
```bash
docker-compose -f docker-compose.prod.yml down
```

### Reiniciar aplicação:
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Ver logs em tempo real:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Acessar container do backend:
```bash
docker-compose -f docker-compose.prod.yml exec backend bash
```

### Executar migrações do banco:
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

## Estrutura Final no Servidor

```
/opt/embarcacoes/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── Dockerfile.prod
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile.prod
├── nginx/
│   └── nginx.conf
├── docker-compose.prod.yml
├── .env
├── prepare-server.sh
└── start-deploy.sh
```

## Troubleshooting

### Se algum container não subir:
```bash
docker-compose -f docker-compose.prod.yml logs [nome-do-container]
```

### Se o banco não conectar:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U embarcacoes -d embarcacoes_db
```

### Para rebuild completo:
```bash
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d --build
```

### Verificar uso de recursos:
```bash
docker stats
df -h
free -h
```

## Configurações Importantes

### Variáveis de Ambiente (.env)
```bash
# Database
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=Embarcacoes2024!@#
POSTGRES_DB=embarcacoes_db

# Backend
NODE_ENV=production
JWT_SECRET=JWT_Secret_Super_Seguro_2024_Embarcacoes!@#$%^&*()
JWT_REFRESH_SECRET=Refresh_Secret_Super_Seguro_2024_Embarcacoes!@#$%^&*()

# URLs
FRONTEND_URL=http://145.223.93.235
VITE_API_URL=http://145.223.93.235/api

# n8n
N8N_USER=admin
N8N_PASSWORD=AdminN8N2024!@#
N8N_HOST=145.223.93.235
N8N_WEBHOOK_URL=http://145.223.93.235:5678/webhook
```

## Próximos Passos

1. ✅ Preparar servidor
2. ✅ Fazer upload dos arquivos
3. ✅ Configurar variáveis de ambiente
4. ✅ Iniciar aplicação
5. 🔄 Testar funcionalidades
6. 🔄 Configurar domínio (opcional)
7. 🔄 Configurar SSL (opcional)
8. 🔄 Configurar backup automático (opcional)
