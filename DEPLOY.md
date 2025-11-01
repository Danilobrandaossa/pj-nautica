# 🚀 Guia Completo de Deploy - Sistema Embarcações

## 📋 Pré-requisitos

### **Servidor:**
- Ubuntu 20.04 LTS ou superior
- Mínimo 2 CPU cores
- Mínimo 4GB RAM
- 20GB de espaço em disco
- Acesso root ou sudo

### **Domínio:**
- Domínio registrado (ex: `embarcacoes.com.br`)
- DNS apontando para o IP do servidor
- Subdomínio para n8n (ex: `n8n.embarcacoes.com.br`)

---

## 🛠️ Passo 1: Preparar o Servidor

### **1.1 Conectar ao Servidor via SSH**
```bash
ssh root@SEU_IP_SERVIDOR
```

### **1.2 Atualizar o Sistema**
```bash
apt update && apt upgrade -y
```

### **1.3 Instalar Docker**
```bash
# Instalar dependências
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar repositório do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Verificar instalação
docker --version
```

### **1.4 Instalar Docker Compose**
```bash
# Download
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Permissão de execução
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version
```

### **1.5 Configurar Firewall**
```bash
# Instalar UFW
apt install -y ufw

# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar firewall
ufw enable
ufw status
```

---

## 📦 Passo 2: Fazer Upload do Projeto

### **2.1 Criar Diretório**
```bash
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes
```

### **2.2 Transferir Arquivos**

**Opção A: Via Git (Recomendado)**
```bash
git clone https://seu-repositorio.git .
```

**Opção B: Via SCP (do seu computador)**
```bash
# Do seu computador local
scp -r * root@SEU_IP:/opt/embarcacoes/
```

**Opção C: Via FTP**
Use um cliente FTP como FileZilla para transferir os arquivos

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### **3.1 Criar arquivo .env.production**
```bash
cd /opt/embarcacoes
cp env.production.example .env.production
nano .env.production
```

### **3.2 Configurar Variáveis**
```env
# IMPORTANTE: Altere TODOS os valores!

# Database
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SuaSenhaSuperSegura123!@#
POSTGRES_DB=embarcacoes_db

# Backend
JWT_SECRET=GereUmHashAleatorioMuitoSeguro123!@#$%^
JWT_REFRESH_SECRET=OutroHashAleatorioMuitoSeguro123!@#$%^

# URLs (substitua pelo seu domínio)
FRONTEND_URL=https://embarcacoes.seudominio.com.br
VITE_API_URL=https://embarcacoes.seudominio.com.br/api

# n8n
N8N_USER=admin
N8N_PASSWORD=SenhaSeguraN8N123!
N8N_HOST=n8n.seudominio.com.br
N8N_WEBHOOK_URL=https://n8n.seudominio.com.br/webhook
```

**💡 Dica: Gerar senhas seguras:**
```bash
# Gerar senha aleatória
openssl rand -base64 32
```

---

## 🔐 Passo 4: Configurar SSL (HTTPS)

### **4.1 Verificar DNS**
Antes de continuar, certifique-se que o DNS está apontando para o servidor:
```bash
ping embarcacoes.seudominio.com.br
ping n8n.seudominio.com.br
```

### **4.2 Executar Script de SSL**
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh seudominio.com.br
```

Este script irá:
- Configurar Let's Encrypt
- Obter certificados SSL
- Configurar renovação automática

---

## 🚀 Passo 5: Deploy da Aplicação

### **5.1 Dar Permissão aos Scripts**
```bash
chmod +x deploy.sh
```

### **5.2 Executar Deploy**
```bash
./deploy.sh
```

O script irá:
- 🔨 Construir as imagens Docker
- 🗄️ Inicializar o banco de dados
- 📦 Aplicar migrações
- 🚀 Subir todos os serviços
- ✅ Verificar status

### **5.3 Aguardar Inicialização**
```bash
# Monitorar logs
docker-compose -f docker-compose.prod.yml logs -f
```

Aguarde até ver:
```
✅ Servidor rodando na porta 3001
✅ Frontend compilado
✅ Nginx iniciado
```

---

## 🔍 Passo 6: Verificar Instalação

### **6.1 Verificar Serviços**
```bash
docker-compose -f docker-compose.prod.yml ps
```

Todos os serviços devem estar com status "Up"

### **6.2 Testar Acesso**
```bash
# Testar backend
curl https://embarcacoes.seudominio.com.br/api/health

# Testar frontend
curl https://embarcacoes.seudominio.com.br
```

### **6.3 Acessar pelo Navegador**
- **Frontend**: https://embarcacoes.seudominio.com.br
- **n8n**: https://n8n.seudominio.com.br

---

## 👤 Passo 7: Criar Primeiro Usuário Admin

### **7.1 Acessar o Sistema**
https://embarcacoes.seudominio.com.br

### **7.2 Usar Credenciais Padrão**
- **Email**: admin@embarcacoes.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha imediatamente após primeiro login!

---

## 🔧 Comandos Úteis

### **Ver Logs**
```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### **Reiniciar Serviços**
```bash
# Todos
docker-compose -f docker-compose.prod.yml restart

# Específico
docker-compose -f docker-compose.prod.yml restart backend
```

### **Parar/Iniciar**
```bash
# Parar todos
docker-compose -f docker-compose.prod.yml down

# Iniciar todos
docker-compose -f docker-compose.prod.yml up -d
```

### **Backup do Banco**
```bash
# Criar backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U embarcacoes embarcacoes_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_YYYYMMDD.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U embarcacoes embarcacoes_db
```

### **Atualizar Aplicação**
```bash
# Pull das alterações
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔒 Segurança Pós-Deploy

### **1. Alterar Senhas Padrão**
- [ ] Senha do admin do sistema
- [ ] Senha do n8n
- [ ] Senha do PostgreSQL (se não alterou no .env)

### **2. Configurar Backup Automático**
```bash
# Criar script de backup
nano /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup banco
docker-compose -f /opt/embarcacoes/docker-compose.prod.yml exec -T postgres \
  pg_dump -U embarcacoes embarcacoes_db > $BACKUP_DIR/db_${DATE}.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup concluído: ${DATE}"
```

```bash
# Dar permissão
chmod +x /root/backup.sh

# Agendar no cron (diariamente às 2h)
crontab -e
# Adicionar: 0 2 * * * /root/backup.sh
```

### **3. Monitoramento**
Configurar alertas para:
- Uso de CPU/RAM
- Espaço em disco
- Status dos containers
- Logs de erro

---

## ❓ Troubleshooting

### **Problema: Container não inicia**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs [service]

# Verificar recursos
docker stats

# Reiniciar container específico
docker-compose -f docker-compose.prod.yml restart [service]
```

### **Problema: SSL não funciona**
```bash
# Verificar certificados
docker-compose -f docker-compose.prod.yml exec certbot certbot certificates

# Renovar manualmente
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### **Problema: Banco de dados não conecta**
```bash
# Verificar se está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.prod.yml exec postgres psql -U embarcacoes -d embarcacoes_db

# Ver logs
docker-compose -f docker-compose.prod.yml logs postgres
```

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verificar status: `docker-compose -f docker-compose.prod.yml ps`
3. Verificar recursos: `docker stats`
4. Consultar documentação do Docker

---

## ✅ Checklist Final

- [ ] Servidor configurado com Docker
- [ ] DNS apontando para o servidor
- [ ] SSL configurado (HTTPS funcionando)
- [ ] Aplicação rodando
- [ ] Primeiro login realizado
- [ ] Senha padrão alterada
- [ ] Backup automático configurado
- [ ] Firewall configurado
- [ ] Monitoramento básico ativo

**Parabéns! Seu sistema está no ar! 🎉**


