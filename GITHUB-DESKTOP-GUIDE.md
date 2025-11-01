# 🚀 Criar Repositório com GitHub Desktop

## **Passo a Passo - GitHub Desktop**

### **1. Abrir GitHub Desktop**

1. Abra o GitHub Desktop no seu computador
2. Se não estiver logado, faça login com: **Danilobrandaossa**

---

### **2. Criar Novo Repositório**

1. Clique em **"File"** → **"New repository"** (ou `Ctrl+N`)
2. Preencha os campos:

   - **Name:** `pj-nautica`
   - **Description:** `Sistema de Gestão Náutica PWA - Infinity Nautical`
   - **Local path:** Crie uma pasta nova OU use a pasta atual
   
   ⚠️ **IMPORTANTE:** 
   - Deixe **"Initialize this repository with a README"** **DESMARCADO**
   - Deixe **"Add .gitignore"** **DESMARCADO**
   - Deixe **"Choose a license"** **DESMARCADO**
   
3. Clique em **"Create Repository"**

---

### **3. Alternativa: Criar pelo Navegador**

Se preferir criar pelo navegador:

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `pj-nautica`
   - **Description:** `Sistema de Gestão Náutica PWA - Infinity Nautical`
   - Deixe **"Add README"** **DESMARCADO**
   - Deixe **"Add .gitignore"** **DESMARCADO**
   - Deixe **"Choose a license"** **DESMARCADO**
3. Clique em **"Create repository"**

---

### **4. Adicionar Arquivos ao GitHub Desktop**

Se você acabou de criar o repositório vazio:

1. No GitHub Desktop, clique em **"File"** → **"Add local repository"**
2. Navegue até: `C:\Users\ueles\OneDrive\Área de Trabalho\pj-nautica`
3. Clique em **"Add"**
4. Você verá todos os arquivos na aba "Changes"
5. Clique em **"Commit to main"** (embaixo, à esquerda)
6. Deixe a mensagem como: `🎉 Deploy inicial - Sistema completo PWA`
7. Clique em **"Commit to main"**

---

### **5. Fazer Push para o GitHub**

1. No GitHub Desktop, clique no botão **"Publish repository"** (ou "Push origin")
2. Certifique-se que está marcado **"Keep this code private"** (ou desmarque se quiser público)
3. Clique em **"Publish repository"**
4. Aguarde o upload

---

## **Verificar**

1. Acesse: https://github.com/Danilobrandaossa/pj-nautica
2. Você deve ver todos os arquivos do projeto

---

## **Próximo Passo: Deploy no Servidor**

Após o repositório estar no GitHub, execute no servidor:

```bash
ssh root@148.230.77.113
# Senha: Zy598859D@n22

# No servidor:
cd /opt
mv embarcacoes embarcacoes.backup 2>/dev/null || true
mkdir -p embarcacoes && cd embarcacoes

# Clonar repositório
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Configurar .env
cp backend/ENV.EXAMPLE .env
nano .env  # Configure as variáveis

# Criar diretórios
mkdir -p nginx/ssl certbot/conf certbot/www

# Deploy
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
sleep 30

# Migrações
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || true

# Verificar
docker compose -f docker-compose.prod.yml ps
curl http://localhost
```

---

**✅ Pronto!**

