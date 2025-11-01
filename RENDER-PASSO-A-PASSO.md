# 🎯 Deploy no Render - Passo a Passo Completo

## ⏱️ Tempo Estimado: 15 minutos

---

## 📝 **FASE 1: PREPARAR CÓDIGO (5 min)**

### **1. Instalar Git (se não tiver)**
```bash
# Windows: Download do site
https://git-scm.com/download/win

# Verificar instalação
git --version
```

### **2. Criar Repositório GitHub**
1. Acesse: https://github.com
2. Clique em "New repository"
3. Nome: `embarcacoes`
4. Público ou Privado (tanto faz)
5. NÃO marque "Initialize with README"
6. Clique em "Create repository"

### **3. Fazer Upload do Código**
```bash
# No seu projeto (onde está o código)
cd C:\Users\ueles\OneDrive\Área de Trabalho\Inffinity

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Deploy inicial"

# Conectar com GitHub (substitua seu-usuario e seu-repo)
git remote add origin https://github.com/seu-usuario/embarcacoes.git

# Fazer push
git branch -M main
git push -u origin main
```

**✅ Código agora está no GitHub!**

---

## 🗄️ **FASE 2: CRIAR BANCO DE DADOS (3 min)**

### **1. Criar Conta no Render**
1. Acesse: https://render.com
2. Clique em "Get Started"
3. "Sign up with GitHub" (mais fácil)
4. Autorize o Render

### **2. Criar PostgreSQL**
1. No Dashboard, clique em "New +" (canto superior direito)
2. Selecione "PostgreSQL"
3. Preencha:
   ```
   Name: embarcacoes-db
   Database: embarcacoes_db
   User: embarcacoes
   Region: Oregon (US West)
   PostgreSQL Version: 15
   Plan: Free
   ```
4. Clique em "Create Database"
5. **AGUARDE 2 MINUTOS** até status ficar "Available"

### **3. Copiar URL de Conexão**
1. Na página do banco, procure "Connections"
2. Copie "Internal Database URL"
3. Deve ser algo como:
   ```
   postgresql://embarcacoes:senha@dpg-xyz.oregon-postgres.render.com/embarcacoes_db
   ```
4. **GUARDE ESSA URL!** Você vai precisar

**✅ Banco de dados criado!**

---

## 🔧 **FASE 3: DEPLOY DO BACKEND (5 min)**

### **1. Criar Web Service**
1. No Dashboard, clique em "New +"
2. Selecione "Web Service"
3. Clique em "Connect account" se necessário
4. Selecione seu repositório "embarcacoes"
5. Clique em "Connect"

### **2. Configurar Backend**
Preencha o formulário:

```
Name: embarcacoes-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
```

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npx prisma migrate deploy && node dist/server.js
```

### **3. Configurar Variáveis de Ambiente**
Clique em "Advanced" e adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | [Cole a URL do banco que você copiou] |
| `JWT_SECRET` | [Gere: `openssl rand -base64 32`] |
| `JWT_REFRESH_SECRET` | [Gere: `openssl rand -base64 32`] |
| `FRONTEND_URL` | `https://embarcacoes-frontend.onrender.com` |

**Gerar senhas no Windows:**
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### **4. Selecionar Plano**
- Selecione: **Free**

### **5. Deploy!**
- Clique em "Create Web Service"
- **AGUARDE 5-10 MINUTOS**
- Acompanhe os logs

### **6. Copiar URL do Backend**
Quando terminar, copie a URL:
```
https://embarcacoes-backend.onrender.com
```

**✅ Backend no ar!**

---

## 🎨 **FASE 4: DEPLOY DO FRONTEND (2 min)**

### **1. Criar Static Site**
1. No Dashboard, clique em "New +"
2. Selecione "Static Site"
3. Conecte o mesmo repositório
4. Clique em "Connect"

### **2. Configurar Frontend**
```
Name: embarcacoes-frontend
Branch: main
Root Directory: frontend
```

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist
```

### **3. Adicionar Variável de Ambiente**
Em "Environment":

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://embarcacoes-backend.onrender.com/api` |

*Substitua pela URL real do seu backend*

### **4. Deploy!**
- Clique em "Create Static Site"
- **AGUARDE 3-5 MINUTOS**

### **5. Copiar URL do Frontend**
```
https://embarcacoes-frontend.onrender.com
```

**✅ Frontend no ar!**

---

## 🎉 **FASE 5: TESTAR (2 min)**

### **1. Acessar Sistema**
Abra no navegador:
```
https://embarcacoes-frontend.onrender.com
```

### **2. Fazer Login**
```
Email: admin@embarcacoes.com
Senha: admin123
```

### **3. Testar Funcionalidades**
- ✅ Login funciona?
- ✅ Dashboard carrega?
- ✅ Embarcações aparecem?
- ✅ Consegue criar usuário?
- ✅ Consegue fazer reserva?

---

## ⚠️ **IMPORTANTE:**

### **App "Dorme" no Plano Free**
- Após 15 min sem uso, app "dorme"
- Primeiro acesso leva ~30 seg para "acordar"
- **Solução:** Mantenha uma aba aberta ou use serviço de ping

### **Serviço de Ping Grátis:**
1. Acesse: https://uptimerobot.com
2. Crie monitor HTTP(S)
3. URL: `https://embarcacoes-backend.onrender.com/health`
4. Intervalo: 5 minutos
5. Isso "acorda" o app automaticamente

---

## 🔄 **ATUALIZAR CÓDIGO:**

```bash
# Fazer alterações no código
# Depois:

git add .
git commit -m "Atualização"
git push origin main

# Render faz deploy automático!
```

---

## 📊 **MONITORAR:**

### **Ver Logs:**
1. Entre no serviço (backend ou frontend)
2. Clique em "Logs"
3. Veja logs em tempo real

### **Ver Métricas:**
1. Clique em "Metrics"
2. Veja uso de CPU, RAM, requests

---

## ❓ **PROBLEMAS COMUNS:**

### **"Application failed to respond"**
- Backend ainda está "dormindo"
- Aguarde 30 segundos e recarregue

### **"Cannot connect to database"**
- Verifique DATABASE_URL nas variáveis
- Banco pode estar inicializando (aguarde 2 min)

### **"CORS error"**
- Verifique FRONTEND_URL no backend
- Deve ser a URL exata do frontend

### **Build falhou**
- Veja os logs de build
- Geralmente falta instalar dependência

---

## ✅ **CHECKLIST FINAL:**

- [ ] Código no GitHub
- [ ] Banco PostgreSQL criado
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] Variáveis configuradas
- [ ] Sistema acessível
- [ ] Login funciona
- [ ] Funcionalidades testadas

---

## 🎯 **PRÓXIMOS PASSOS:**

1. **Compartilhar URL** com usuários para teste
2. **Coletar feedback**
3. **Corrigir bugs** se houver
4. **Validar funcionalidades**
5. **Decidir** se vai para servidor definitivo

---

## 💰 **CUSTOS:**

**Plano Free Render:**
- ✅ R$ 0,00 / mês
- ✅ 750 horas/mês
- ✅ PostgreSQL grátis
- ✅ SSL grátis
- ✅ Suficiente para validação

**Se precisar mais:**
- Upgrade para $7/mês
- Sem limite de horas
- Performance melhor

---

## 📞 **PRECISA DE AJUDA?**

**Documentação Render:**
https://render.com/docs

**Suporte Render:**
https://render.com/support

**Meu suporte:**
Pode perguntar! 💪

---

**Boa sorte com o deploy! 🚀**


