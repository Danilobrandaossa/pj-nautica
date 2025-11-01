# 🆓 Deploy Gratuito para Validação

## 🎯 **OPÇÃO 1: RENDER.COM** ⭐ (Recomendado)

### **Por que Render?**
- ✅ 100% gratuito para validação
- ✅ SSL automático (HTTPS)
- ✅ PostgreSQL grátis incluído
- ✅ Deploy automático via Git
- ✅ 750 horas/mês grátis
- ✅ Subdomínio gratuito

### **Limitações do Plano Free:**
- ⏱️ App "dorme" após 15 min inativo
- 🐌 Primeiro acesso pode ser lento (30 seg)
- 💾 512 MB RAM
- ⚠️ Apenas para validação/testes

---

## 📝 **PASSO A PASSO RENDER:**

### **1. Criar Conta**
1. Acesse: https://render.com
2. Clique em "Get Started for Free"
3. Cadastre-se com GitHub ou email

### **2. Criar Banco de Dados**
1. No dashboard, clique em "New +"
2. Selecione "PostgreSQL"
3. Configure:
   - **Name**: `embarcacoes-db`
   - **Database**: `embarcacoes_db`
   - **User**: `embarcacoes`
   - **Region**: Oregon (mais rápido)
   - **Plan**: Free
4. Clique em "Create Database"
5. **Copie a URL de conexão** (Internal Database URL)

### **3. Fazer Upload do Código**
**Opção A: Via GitHub (Recomendado)**
1. Crie repositório no GitHub
2. Faça push do código:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/embarcacoes.git
git push -u origin main
```

**Opção B: Via Render Git**
1. Use o repositório Git do Render

### **4. Deploy do Backend**
1. No dashboard, clique em "New +"
2. Selecione "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `embarcacoes-backend`
   - **Region**: Oregon
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/server.js`
5. Adicione variáveis de ambiente:
   ```
   NODE_ENV=production
   DATABASE_URL=[Cole a URL do banco copiada]
   JWT_SECRET=[Gere uma senha aleatória]
   JWT_REFRESH_SECRET=[Gere outra senha]
   FRONTEND_URL=https://embarcacoes-frontend.onrender.com
   ```
6. Clique em "Create Web Service"

### **5. Deploy do Frontend**
1. No dashboard, clique em "New +"
2. Selecione "Static Site"
3. Conecte seu repositório
4. Configure:
   - **Name**: `embarcacoes-frontend`
   - **Branch**: main
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Adicione variável de ambiente:
   ```
   VITE_API_URL=https://embarcacoes-backend.onrender.com/api
   ```
6. Clique em "Create Static Site"

### **6. Aguardar Deploy**
- ⏳ Backend: ~5-10 minutos
- ⏳ Frontend: ~3-5 minutos

### **7. Acessar Sistema**
- **Frontend**: https://embarcacoes-frontend.onrender.com
- **Backend API**: https://embarcacoes-backend.onrender.com/api

---

## 🎯 **OPÇÃO 2: RAILWAY.APP**

### **Vantagens:**
- ✅ $5 de crédito grátis/mês
- ✅ Não "dorme"
- ✅ Deploy via Git
- ✅ PostgreSQL incluído

### **Passo a Passo:**
1. Acesse: https://railway.app
2. "Start a New Project"
3. "Deploy from GitHub repo"
4. Adicione PostgreSQL do template
5. Configure variáveis de ambiente
6. Deploy automático

---

## 🎯 **OPÇÃO 3: FLY.IO**

### **Vantagens:**
- ✅ Gratuito até 3 VMs
- ✅ PostgreSQL grátis
- ✅ Melhor performance

### **Limitações:**
- Requer cartão de crédito (não cobra)
- Mais técnico

---

## 🎯 **OPÇÃO 4: VERCEL + SUPABASE**

### **Frontend no Vercel:**
1. Acesse: https://vercel.com
2. Import do GitHub
3. Deploy automático

### **Backend + DB no Supabase:**
1. Acesse: https://supabase.com
2. Crie projeto grátis
3. PostgreSQL automático

---

## 💡 **COMPARAÇÃO RÁPIDA:**

| Serviço | Custo | Facilidade | Performance | Limitações |
|---------|-------|------------|-------------|------------|
| **Render** | 🆓 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Dorme após 15min |
| **Railway** | 🆓 $5/mês | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Crédito limitado |
| **Fly.io** | 🆓 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Requer cartão |
| **Vercel+Supabase** | 🆓 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Configuração dual |

---

## 🚀 **RECOMENDAÇÃO:**

### **Para Validação Rápida (1 semana):**
✅ **RENDER.COM** - Mais simples e rápido

### **Para Testes Mais Longos (1 mês):**
✅ **RAILWAY.APP** - Melhor performance

### **Para Produção Real:**
✅ **Seu Servidor Ubuntu** - Controle total

---

## 📋 **CHECKLIST RENDER:**

- [ ] Criar conta no Render
- [ ] Criar banco PostgreSQL
- [ ] Push código para GitHub
- [ ] Deploy backend no Render
- [ ] Deploy frontend no Render
- [ ] Configurar variáveis de ambiente
- [ ] Testar acesso
- [ ] Validar funcionalidades

---

## ⚠️ **IMPORTANTE:**

### **Render Free - Limitações:**
- App "dorme" após 15 min sem uso
- Primeiro acesso leva ~30 seg para "acordar"
- Apenas para validação/testes
- Para produção, use servidor próprio

### **Dados de Teste:**
- Use apenas dados fictícios
- Não coloque dados reais de clientes
- É apenas para validar o sistema

---

## 🎯 **PRÓXIMOS PASSOS:**

1. **Validar no Render** (grátis)
2. **Testar todas as funcionalidades**
3. **Coletar feedback dos usuários**
4. **Se aprovado → Deploy no servidor definitivo**

---

## 💬 **QUAL OPÇÃO VOCÊ PREFERE?**

**Recomendo começar com RENDER.COM porque:**
- ✅ 100% gratuito
- ✅ Mais simples de configurar
- ✅ SSL automático
- ✅ Deploy em 10 minutos

**Quer que eu te ajude com o deploy no Render agora?** 🚀


