# 🚀 Guia Final de Deploy

## ✅ **Status Atual**

- ✅ Git inicializado
- ✅ Nenhum arquivo sensível no Git
- ✅ Pronto para commit e push
- ✅ Servidor VPS: 148.230.77.113
- ✅ Usuário GitHub: Danilobrandaossa

---

## 📋 **Passo a Passo**

### **1. Criar repositório no GitHub**

1. Acesse: https://github.com/new
2. Nome: `pj-nautica`
3. **NÃO** marque nenhuma opção de README/gitignore/license
4. Clique em "Create repository"

---

### **2. Push do código**

```bash
git remote add origin https://github.com/Danilobrandaossa/pj-nautica.git
git commit -m "🎉 Deploy inicial"
git push -u origin main
```

---

### **3. Deploy no servidor**

```bash
# Conectar
ssh root@148.230.77.113
# Senha: Zy598859D@n22

# Setup
cd /opt
mv embarcacoes embarcacoes.backup 2>/dev/null || true
mkdir -p embarcacoes && cd embarcacoes
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Config
cp backend/ENV.EXAMPLE .env
nano .env  # Configure (valores com !@#$ entre aspas simples!)
mkdir -p nginx/ssl certbot/conf certbot/www

# Deploy
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
sleep 30
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || true

# Verificar
docker compose -f docker-compose.prod.yml ps
curl http://localhost
```

---

### **4. Testar**

Acesse: http://148.230.77.113

---

## ⚙️ **Deploy Automático (Opcional)**

Para configurar GitHub Actions:

1. Adicione Secrets em: `Settings → Secrets → Actions`
   - `VPS_SSH_PRIVATE_KEY`
   - `VPS_HOST`: 148.230.77.113
   - `VPS_USER`: root
   - `VPS_URL`: http://148.230.77.113

2. Depois, cada `git push` faz deploy automático

---

**✅ Pronto!**

