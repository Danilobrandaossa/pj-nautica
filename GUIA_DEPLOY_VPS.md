# 🚀 GUIA COMPLETO DE DEPLOY NO VPS

## 📋 **PRÉ-REQUISITOS**

### **No seu computador local:**
- ✅ OpenSSH client instalado
- ✅ rsync disponível
- ✅ Acesso SSH ao VPS
- ✅ Arquivos do projeto prontos

### **No VPS:**
- ✅ Ubuntu 20.04+ ou similar
- ✅ Acesso root ou sudo
- ✅ Conexão com internet

---

## 🎯 **PASSO A PASSO COMPLETO**

### **PASSO 1: PREPARAR O VPS**

```bash
# Conectar ao VPS
ssh root@145.223.93.235

# Executar script de preparação
curl -fsSL https://raw.githubusercontent.com/seu-usuario/embarcacoes/main/deploy-vps.sh | bash
```

**OU** se preferir fazer manualmente:

```bash
# Conectar ao VPS
ssh root@145.223.93.235

# Criar diretório
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Executar script de preparação
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### **PASSO 2: FAZER UPLOAD DOS ARQUIVOS**

**Opção A: Usando o script de upload (Recomendado)**

```bash
# Do seu computador local
chmod +x upload-to-vps.sh
./upload-to-vps.sh
```

**Opção B: Upload manual com SCP**

```bash
# Do seu computador local
scp -r . root@145.223.93.235:/opt/embarcacoes/
```

**Opção C: Upload com rsync**

```bash
# Do seu computador local
rsync -avz --progress --exclude 'node_modules' --exclude '.git' . root@145.223.93.235:/opt/embarcacoes/
```

### **PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE**

```bash
# Conectar ao VPS
ssh root@145.223.93.235

# Navegar para o diretório
cd /opt/embarcacoes

# Editar arquivo .env
nano .env
```

**Configurar as seguintes variáveis:**

```env
# Database Configuration
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SuaSenhaSuperSegura123!@#
POSTGRES_DB=embarcacoes_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=SuaChaveJWTSuperSegura64Caracteres123!@#$%^&*()
JWT_REFRESH_SECRET=SuaChaveRefreshSuperSegura64Caracteres123!@#$%^&*()

# URLs
FRONTEND_URL=http://145.223.93.235
VITE_API_URL=http://145.223.93.235/api

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=SenhaN8NSegura123!@#
N8N_HOST=145.223.93.235
N8N_WEBHOOK_URL=http://145.223.93.235:5678/webhook
```

### **PASSO 4: INICIAR O SISTEMA**

```bash
# Construir e iniciar containers
docker-compose -f docker-compose.prod.yml up -d --build

# Aguardar containers iniciarem
sleep 30

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### **PASSO 5: CONFIGURAR BANCO DE DADOS**

```bash
# Executar migrações
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate

# Executar seed (criar conta admin)
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

### **PASSO 6: VERIFICAR FUNCIONAMENTO**

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Testar endpoints
curl http://145.223.93.235/api/health
curl http://145.223.93.235
```

---

## 🔧 **COMANDOS ÚTEIS**

### **Gerenciar Containers:**
```bash
# Ver status
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Parar
docker-compose -f docker-compose.prod.yml down

# Rebuild completo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### **Banco de Dados:**
```bash
# Acessar banco
docker-compose -f docker-compose.prod.yml exec postgres psql -U embarcacoes -d embarcacoes_db

# Backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U embarcacoes embarcacoes_db > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U embarcacoes embarcacoes_db < backup.sql
```

### **Logs e Monitoramento:**
```bash
# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Uso de recursos
docker stats
```

---

## 🌐 **URLS DE ACESSO**

- **Sistema:** http://145.223.93.235
- **API:** http://145.223.93.235/api
- **n8n:** http://145.223.93.235:5678

---

## 🔑 **CREDENCIAIS DE ACESSO**

### **Sistema:**
- **Email:** contato@danilobrandao.com.br
- **Senha:** Zy598859D@n

### **n8n:**
- **Usuário:** admin
- **Senha:** (configurada no .env)

---

## 🚨 **TROUBLESHOOTING**

### **Se algum container não subir:**
```bash
# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs [nome-do-container]

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### **Se o banco não conectar:**
```bash
# Verificar se o banco está rodando
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U embarcacoes

# Acessar banco
docker-compose -f docker-compose.prod.yml exec postgres psql -U embarcacoes -d embarcacoes_db
```

### **Se o frontend não carregar:**
```bash
# Verificar logs do nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Verificar logs do frontend
docker-compose -f docker-compose.prod.yml logs frontend
```

### **Para rebuild completo:**
```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Limpar volumes (CUIDADO: apaga dados!)
docker volume rm $(docker volume ls -q -f name=embarcacoes) || true

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ **VERIFICAÇÃO FINAL**

Após o deploy, verifique:

- [ ] Sistema acessível em http://145.223.93.235
- [ ] Login funcionando com suas credenciais
- [ ] API respondendo em http://145.223.93.235/api/health
- [ ] n8n acessível em http://145.223.93.235:5678
- [ ] Todos os containers rodando
- [ ] Logs sem erros críticos

---

## 🎉 **DEPLOY CONCLUÍDO!**

Se tudo estiver funcionando, seu sistema estará online e pronto para uso!

**🌐 Acesse:** http://145.223.93.235  
**🔑 Login:** contato@danilobrandao.com.br / Zy598859D@n

