# 🐧 Deploy em Servidor Ubuntu com VPN

Guia completo para deploy em produção em servidor Ubuntu.

## 📋 Pré-requisitos no Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl git docker.io docker-compose nginx certbot python3-certbot-nginx

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

## 🚀 Instalação do Sistema

### 1. Clonar o projeto

```bash
cd /var/www
sudo git clone <seu-repositorio> embarcacoes
cd embarcacoes
sudo chown -R $USER:$USER /var/www/embarcacoes
```

### 2. Configurar variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Configure as variáveis de produção:

```env
NODE_ENV=production
DATABASE_URL="postgresql://embarcacoes:SENHA_SEGURA@postgres:5432/embarcacoes_db"
JWT_SECRET="gere-uma-chave-super-segura-com-64-caracteres-no-minimo-aqui"
JWT_REFRESH_SECRET="gere-outra-chave-super-segura-diferente-com-64-caracteres"
FRONTEND_URL=https://seudominio.com
N8N_WEBHOOK_URL=http://n8n:5678/webhook/agendamentos
N8N_WEBHOOK_TOKEN="seu-token-secreto"
```

**⚠️ IMPORTANTE:** Gere senhas seguras:
```bash
# Gerar senha aleatória
openssl rand -base64 48
```

### 3. Configurar arquivo de produção

Crie `.env` na raiz:

```bash
nano .env
```

```env
# PostgreSQL
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SUA_SENHA_SUPER_SEGURA_AQUI
POSTGRES_DB=embarcacoes_db

# Backend
DATABASE_URL=postgresql://embarcacoes:SUA_SENHA_SUPER_SEGURA_AQUI@postgres:5432/embarcacoes_db
JWT_SECRET=SUA_CHAVE_JWT_64_CARACTERES
JWT_REFRESH_SECRET=SUA_CHAVE_REFRESH_64_CARACTERES
FRONTEND_URL=https://seudominio.com
N8N_WEBHOOK_URL=http://n8n:5678/webhook/agendamentos
N8N_WEBHOOK_TOKEN=seu-webhook-token

# Frontend
VITE_API_URL=https://seudominio.com/api

# n8n
N8N_USER=admin
N8N_PASSWORD=SUA_SENHA_N8N_SEGURA
```

### 4. Iniciar containers

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Rodar migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

## 🌐 Configurar Nginx

### 1. Criar configuração

```bash
sudo nano /etc/nginx/sites-available/embarcacoes
```

```nginx
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Ativar site

```bash
sudo ln -s /etc/nginx/sites-available/embarcacoes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configurar SSL com Let's Encrypt

```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

Siga as instruções e escolha redirect HTTP para HTTPS.

## 🔧 Configurar Firewall

```bash
# Permitir portas
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Ativar firewall
sudo ufw enable
```

## 📱 Configurar n8n para WhatsApp

1. Acesse: https://seudominio.com:5678
2. Faça login com credenciais do .env
3. Importe o workflow: `n8n-workflow.json`
4. Configure credenciais da API do WhatsApp
5. Anote a URL do webhook
6. Atualize no backend/.env

## 🔄 Atualizar Sistema

```bash
cd /var/www/embarcacoes
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
```

## 📊 Monitoramento

### Ver logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Ver status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Reiniciar serviços
```bash
docker-compose -f docker-compose.prod.yml restart
```

## 🗄️ Backup do Banco

### Backup manual
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U embarcacoes embarcacoes_db > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U embarcacoes embarcacoes_db < backup_20250101.sql
```

### Backup automático (cron)
```bash
crontab -e
```

Adicione:
```
0 2 * * * cd /var/www/embarcacoes && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U embarcacoes embarcacoes_db > /var/backups/embarcacoes/backup_$(date +\%Y\%m\%d).sql
```

## 🔐 Segurança

### 1. Alterar senhas padrão
- Admin do sistema
- PostgreSQL
- n8n

### 2. Configurar renovação SSL automática
```bash
sudo certbot renew --dry-run
```

### 3. Manter sistema atualizado
```bash
sudo apt update && sudo apt upgrade -y
```

## 🌐 VPN (Opcional)

Se o servidor está em VPN, configure:

```bash
# No servidor
sudo apt install wireguard

# Configure conforme sua VPN
```

## ✅ Checklist Final

- [ ] Docker rodando
- [ ] Containers iniciados
- [ ] Migrations executadas
- [ ] Nginx configurado
- [ ] SSL ativo
- [ ] Firewall configurado
- [ ] Senhas alteradas
- [ ] Backup configurado
- [ ] n8n funcionando
- [ ] WhatsApp testado

## 🎉 Sistema em Produção!

Acesse: https://seudominio.com

Login admin:
- Email: admin@embarcacoes.com
- Senha: (a que você definiu no seed)

**⚠️ Lembre-se de alterar TODAS as senhas padrão em produção!**



