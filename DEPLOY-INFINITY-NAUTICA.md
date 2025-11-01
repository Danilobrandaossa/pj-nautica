# 🚀 Deploy Infinity Nautica - app.infinitynautica.com.br

## 📋 **Informações do Servidor**

- **Domínio:** app.infinitynautica.com.br
- **IP VPS:** 148.230.77.113
- **Sistema:** Ubuntu 22.04.5 LTS
- **Banco:** PostgreSQL (via Docker)
- **Proxy:** Nginx (via Docker)

---

## 🎯 **Passo 1: Configurações Básicas do Servidor**

Execute no servidor:

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker e Docker Compose
sudo apt install docker.io docker-compose git -y
sudo systemctl enable docker
sudo systemctl start docker

# 3. Configurar timezone (Brasília)
sudo timedatectl set-timezone America/Sao_Paulo

# 4. Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🎯 **Passo 2: Git e Docker**

Já está instalado acima. Continue:

```bash
# Verificar versões
docker --version
docker compose version
git --version
```

---

## 🎯 **Passo 3: Clonar Repositório**

```bash
cd /opt
mv embarcacoes embarcacoes.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
mkdir -p embarcacoes && cd embarcacoes
git clone https://github.com/Danilobrandaossa/pj-nautica.git .
```

---

## 🎯 **Passo 4: Configurar .env**

```bash
# Copiar exemplo
cp backend/ENV.EXAMPLE .env

# Editar
nano .env
```

**Configure as variáveis abaixo (valores com caracteres especiais entre aspas simples!):**

```bash
# Database
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD='sua_senha_forte_aqui'
POSTGRES_DB=embarcacoes_db
DATABASE_URL='postgresql://embarcacoes:sua_senha_forte_aqui@postgres:5432/embarcacoes_db?schema=public'

# JWT
JWT_SECRET='JWT_Secret_Super_Seguro_2024_Embarcacoes!@#$%^&*()'
JWT_REFRESH_SECRET='Refresh_Secret_Mega_Seguro!@#$%^&*()'

# URLs
FRONTEND_URL='https://app.infinitynautica.com.br'
VITE_API_URL='https://app.infinitynautica.com.br/api'

# N8N (opcional)
N8N_USER=admin
N8N_PASSWORD='senha_admin_aqui'
N8N_HOST='n8n.infinitynautica.com.br'
N8N_WEBHOOK_URL='https://webhook.infinitynautica.com.br'

# Disable CSRF em produção (se necessário)
DISABLE_CSRF=false

# Node Environment
NODE_ENV=production
```

Salve: `Ctrl+X`, `Y`, `Enter`

---

## 🎯 **Passo 5: Atualizar Configuração do Nginx**

Edite o `nginx/nginx.conf` para usar o domínio correto:

```bash
nano nginx/nginx.conf
```

**Altere linha 61:**
```nginx
server_name embarcacoes.seudominio.com.br;
```

**Para:**
```nginx
server_name app.infinitynautica.com.br;
```

**Altere linhas 64-65:**
```nginx
ssl_certificate /etc/letsencrypt/live/embarcacoes.seudominio.com.br/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/embarcacoes.seudominio.com.br/privkey.pem;
```

**Para:**
```nginx
ssl_certificate /etc/letsencrypt/live/app.infinitynautica.com.br/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/app.infinitynautica.com.br/privkey.pem;
```

**Altere linha 123 (se usar n8n):**
```nginx
server_name n8n.seudominio.com.br;
```

**Para:**
```nginx
server_name n8n.infinitynautica.com.br;
```

**Altere linhas 126-127 (se usar n8n):**
```nginx
ssl_certificate /etc/letsencrypt/live/n8n.seudominio.com.br/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.seudominio.com.br/privkey.pem;
```

**Para:**
```nginx
ssl_certificate /etc/letsencrypt/live/n8n.infinitynautica.com.br/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.infinitynautica.com.br/privkey.pem;
```

Salve: `Ctrl+X`, `Y`, `Enter`

---

## 🎯 **Passo 6: Criar Diretórios**

```bash
mkdir -p nginx/ssl certbot/conf certbot/www
```

---

## 🎯 **Passo 7: Deploy Docker**

```bash
# Build
docker compose -f docker-compose.prod.yml build --no-cache

# Iniciar (sem SSL primeiro, para gerar certificados)
# Vamos temporariamente desabilitar HTTPS

# Editar docker-compose.prod.yml para comentar HTTPS
nano docker-compose.prod.yml

# Na seção nginx, comente temporariamente as linhas 70 (certbot volumes)
# Ou simplesmente inicie apenas os serviços essenciais:
```

**Iniciar sem Nginx primeiro:**
```bash
docker compose -f docker-compose.prod.yml up -d postgres backend frontend
sleep 30
```

**Executar migrações:**
```bash
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || true
```

---

## 🎯 **Passo 8: Configurar SSL com Certbot**

**IMPORTANTE:** Para usar HTTPS, você precisa configurar SSL primeiro.

**Opção A: Desabilite HTTPS temporariamente** (para testar)
- Use HTTP na porta 80 primeiro
- Configure SSL depois

**Opção B: Configure SSL agora:**
```bash
# Instalar certbot
sudo apt install certbot -y

# Parar containers nginx primeiro
docker compose -f docker-compose.prod.yml stop nginx

# Gerar certificado (certbot precisa rodar no host, não no container)
sudo certbot certonly --standalone -d app.infinitynautica.com.br

# Copiar certificados para o volume do Docker
sudo cp -r /etc/letsencrypt certbot/conf/

# Iniciar nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

---

## 🎯 **Passo 9: Configurar DNS**

No seu registrador de domínio, configure:

**Registro A:**
- **Nome/Host:** @ (ou app)
- **Tipo:** A
- **Valor:** 148.230.77.113
- **TTL:** 300

**Registro A (www - opcional):**
- **Nome/Host:** www
- **Tipo:** A
- **Valor:** 148.230.77.113
- **TTL:** 300

Aguarde propagação DNS (pode levar alguns minutos a 24 horas).

---

## 🎯 **Passo 10: Verificar Deploy**

```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs --tail=50

# Testar acesso
curl http://localhost
curl https://app.infinitynautica.com.br
```

---

## 🎯 **Passo 11: Reiniciar Container Nginx**

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🔧 **Troubleshooting**

### **Porta 80 já em uso**

```bash
# Verificar o que está usando a porta 80
sudo netstat -tuln | grep 80

# Parar nginx do sistema se existir
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### **Certificado SSL não encontrado**

```bash
# Gerar certificado manualmente
sudo certbot certonly --standalone -d app.infinitynautica.com.br

# Copiar para container
sudo cp -r /etc/letsencrypt certbot/conf/
```

### **PostgreSQL connection refused**

```bash
# Verificar se postgres está rodando
docker compose -f docker-compose.prod.yml ps postgres

# Ver logs
docker compose -f docker-compose.prod.yml logs postgres

# Aguardar mais tempo
sleep 60
```

### **Build falha**

```bash
# Limpar cache
docker compose -f docker-compose.prod.yml down
docker system prune -af

# Rebuild
docker compose -f docker-compose.prod.yml build --no-cache
```

---

## 📞 **Comandos Úteis**

```bash
# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar serviço específico
docker compose -f docker-compose.prod.yml restart backend

# Entrar em container
docker exec -it embarcacoes_backend_prod sh

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Recriar tudo
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## ✅ **Checklist Final**

- [ ] Sistema atualizado
- [ ] Docker instalado e funcionando
- [ ] Repositório clonado
- [ ] .env configurado corretamente
- [ ] nginx.conf atualizado com domínio correto
- [ ] Containers rodando (postgres, backend, frontend)
- [ ] Migrações executadas
- [ ] DNS configurado e propagado
- [ ] SSL configurado (se usando HTTPS)
- [ ] Acesso funcionando em http://app.infinitynautica.com.br

---

**🎉 Pronto! Sistema no ar!**


