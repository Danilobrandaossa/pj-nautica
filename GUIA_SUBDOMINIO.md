# 🌐 DEPLOY EM SUBDOMÍNIO - inffinity.goredirect.com.br

## 📋 **CONFIGURAÇÃO COMPLETA**

### **URLs Configuradas:**
- **Sistema:** https://inffinity.goredirect.com.br
- **API:** https://inffinity.goredirect.com.br/api
- **n8n:** https://n8n.inffinity.goredirect.com.br

---

## 🎯 **PASSO A PASSO COMPLETO**

### **PASSO 1: CONFIGURAR DNS**

**Antes de começar, configure os DNS:**
- `inffinity.goredirect.com.br` → 145.223.93.235
- `n8n.inffinity.goredirect.com.br` → 145.223.93.235

**Testar DNS:**
```bash
ping inffinity.goredirect.com.br
ping n8n.inffinity.goredirect.com.br
```

### **PASSO 2: CONECTAR AO SERVIDOR**

```bash
ssh root@145.223.93.235
```

### **PASSO 3: FAZER UPLOAD DOS ARQUIVOS**

**Do seu computador local:**
```bash
# Upload dos arquivos do projeto
scp -r . root@145.223.93.235:/opt/embarcacoes/

# OU usando rsync (mais eficiente)
rsync -avz --progress --exclude 'node_modules' --exclude '.git' . root@145.223.93.235:/opt/embarcacoes/
```

### **PASSO 4: EXECUTAR DEPLOY**

**No servidor:**
```bash
# Navegar para o diretório
cd /opt/embarcacoes

# Dar permissão ao script
chmod +x deploy-subdominio.sh

# Executar deploy
./deploy-subdominio.sh
```

### **PASSO 5: VERIFICAR FUNCIONAMENTO**

```bash
# Verificar containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Testar URLs
curl https://inffinity.goredirect.com.br/api/health
curl https://inffinity.goredirect.com.br
```

---

## 🔧 **ARQUIVOS CRIADOS**

### **1. docker-compose.subdominio.yml**
- Configuração dos containers
- SSL configurado
- n8n com subdomínio próprio

### **2. nginx.subdominio.conf**
- Configuração do Nginx com SSL
- Redirect HTTP → HTTPS
- Security headers
- Proxy para frontend, backend e n8n

### **3. env.subdominio**
- Variáveis de ambiente
- URLs configuradas para o subdomínio
- Credenciais seguras

### **4. deploy-subdominio.sh**
- Script automatizado de deploy
- Instalação de dependências
- Configuração de SSL
- Inicialização do sistema

---

## 🌐 **URLS DE ACESSO**

- **Sistema:** https://inffinity.goredirect.com.br
- **API:** https://inffinity.goredirect.com.br/api
- **n8n:** https://n8n.inffinity.goredirect.com.br

---

## 🔑 **CREDENCIAIS DE ACESSO**

### **Sistema:**
- **Email:** contato@danilobrandao.com.br
- **Senha:** Zy598859D@n

### **n8n:**
- **Usuário:** admin
- **Senha:** AdminN8N2024!@#Seguro

---

## 🔒 **SEGURANÇA CONFIGURADA**

### **SSL/TLS:**
- ✅ Certificados Let's Encrypt
- ✅ HTTPS obrigatório
- ✅ Security headers
- ✅ TLS 1.2 e 1.3

### **Nginx:**
- ✅ Proxy reverso
- ✅ Load balancing
- ✅ Security headers
- ✅ WebSocket support

---

## 📊 **COMANDOS ÚTEIS**

### **Gerenciar Sistema:**
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

### **SSL:**
```bash
# Renovar certificados
certbot renew

# Ver certificados
certbot certificates

# Testar SSL
openssl s_client -connect inffinity.goredirect.com.br:443
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

---

## ✅ **VERIFICAÇÃO FINAL**

Após o deploy, verifique:

- [ ] Sistema acessível em https://inffinity.goredirect.com.br
- [ ] Login funcionando com suas credenciais
- [ ] API respondendo em https://inffinity.goredirect.com.br/api/health
- [ ] n8n acessível em https://n8n.inffinity.goredirect.com.br
- [ ] SSL funcionando (cadeado verde)
- [ ] Todos os containers rodando
- [ ] Logs sem erros críticos

---

## 🎉 **SISTEMA PRONTO!**

Se tudo estiver funcionando, seu sistema estará online e pronto para uso!

**🌐 Acesse:** https://inffinity.goredirect.com.br  
**🔑 Login:** contato@danilobrandao.com.br / Zy598859D@n

### **📋 PRÓXIMOS PASSOS:**
1. ✅ Fazer login no sistema
2. ✅ Cadastrar suas embarcações
3. ✅ Cadastrar seus usuários
4. ✅ Configurar bloqueios se necessário
5. ✅ Configurar n8n para WhatsApp

**🎯 SISTEMA SEGURO E PRONTO PARA PRODUÇÃO NO SUBDOMÍNIO! 🚀**

