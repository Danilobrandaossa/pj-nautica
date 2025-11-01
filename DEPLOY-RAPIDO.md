# 🚀 Deploy Rápido - 5 Minutos

## ⚡ Guia Ultra-Rápido para Colocar no Ar

### **1. Preparar Servidor (2 min)**
```bash
# Conectar ao servidor
ssh root@SEU_IP

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Abrir portas
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### **2. Upload do Projeto (1 min)**
```bash
# Criar diretório
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Via Git (recomendado)
git clone https://seu-repo.git .

# OU via SCP (do seu PC)
scp -r * root@SEU_IP:/opt/embarcacoes/
```

### **3. Configurar (1 min)**
```bash
# Copiar e editar .env
cp env.production.example .env.production
nano .env.production

# Mínimo necessário:
# - POSTGRES_PASSWORD (criar senha)
# - JWT_SECRET (criar senha)
# - JWT_REFRESH_SECRET (criar senha)
# - FRONTEND_URL (seu domínio)
# - VITE_API_URL (seu domínio + /api)
```

### **4. Configurar SSL (30 seg)**
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh seudominio.com.br
```

### **5. Deploy! (30 seg)**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Pronto!

Acesse: **https://seudominio.com.br**

**Login padrão:**
- Email: `admin@embarcacoes.com`
- Senha: `admin123`

**⚠️ MUDE A SENHA IMEDIATAMENTE!**

---

## 📱 Comandos Rápidos

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Parar
docker-compose -f docker-compose.prod.yml down

# Backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U embarcacoes embarcacoes_db > backup.sql
```

---

## ❓ Problemas?

1. **Não carrega:** Verifique DNS e SSL
2. **Erro 500:** Veja logs com `docker-compose logs backend`
3. **Lento:** Aumente recursos do servidor (RAM/CPU)

**Documentação completa:** Ver `DEPLOY.md`


