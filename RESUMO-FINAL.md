# 🎉 RESUMO - Deploy Infinity Nautica

## ✅ **STATUS ATUAL**

- ✅ Git configurado
- ✅ Repositório criado: https://github.com/Danilobrandaossa/pj-nautica
- ✅ Código commitado e publicado
- ✅ Nginx configurado para: app.infinitynautica.com.br
- ✅ Guias de deploy criados

---

## 📋 **PRÓXIMOS PASSOS**

### **1. Configurar DNS**

No seu registrador de domínio (Registro.br, Hostinger, etc.):

**Registro A:**
- **Nome/Host:** @
- **Tipo:** A  
- **Valor:** 148.230.77.113
- **TTL:** 300

**Ou:**
- **Nome/Host:** app
- **Tipo:** A
- **Valor:** 148.230.77.113
- **TTL:** 300

---

### **2. Deploy no Servidor**

Conecte no servidor:
```bash
ssh root@148.230.77.113
Senha: Zy598859D@n22
```

Execute os comandos do arquivo **`SERVIDOR-COMANDOS-RAPIDOS.txt`** (bloco por bloco)

OU siga o guia completo em **`DEPLOY-INFINITY-NAUTICA.md`**

---

### **3. Principais Comandos**

```bash
# Configurar servidor
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y

# Clonar repositório
cd /opt
git clone https://github.com/Danilobrandaossa/pj-nautica.git embarcacoes
cd embarcacoes

# Configurar .env
cp backend/ENV.EXAMPLE .env
nano .env  # Configure!

# Criar diretórios
mkdir -p nginx/ssl certbot/conf certbot/www

# Deploy
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d postgres backend frontend
sleep 30

# Migrações
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate

# SSL
sudo apt install certbot -y
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d app.infinitynautica.com.br
sudo cp -r /etc/letsencrypt certbot/conf/

# Iniciar nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

---

## 📚 **DOCUMENTAÇÃO**

- **DEPLOY-INFINITY-NAUTICA.md** - Guia completo passo a passo
- **SERVIDOR-COMANDOS-RAPIDOS.txt** - Comandos para copiar e colar
- **COMANDOS-SERVIDOR.txt** - Comandos alternativos

---

## 🔗 **LINKS**

- **Repositório:** https://github.com/Danilobrandaossa/pj-nautica
- **Servidor:** 148.230.77.113
- **Domínio:** app.infinitynautica.com.br
- **Acesso:** http://app.infinitynautica.com.br (após deploy)

---

## ⚠️ **IMPORTANTE**

1. Configure o **DNS primeiro**
2. Depois faça o **deploy no servidor**
3. Configure **SSL/Certbot** depois que os containers estiverem rodando
4. Aguarde **propagação DNS** (pode levar minutos a horas)

---

**🎉 Pronto! Boa sorte com o deploy!**


