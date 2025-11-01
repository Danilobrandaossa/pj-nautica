# 🎉 Instalação Final - Próximos Passos

## ✅ **Status Atual**

- ✅ Git configurado
- ✅ 254 arquivos commitados (52.562 linhas!)
- ⏳ Aguardando criação do repositório no GitHub

---

## 🚀 **AGORA VOCÊ PRECISA:**

### **PASSO 1: Criar repositório no GitHub**

**Opção A - Navegador (RECOMENDADO):**
1. Acesse: https://github.com/new
2. Nome: `pj-nautica`
3. **NÃO marque:** Add README, Add .gitignore, Choose license
4. Clique em **"Create repository"**

**Opção B - GitHub Desktop:**
1. Abra GitHub Desktop
2. File → New repository
3. Nome: `pj-nautica`
4. Local: Crie pasta NOVA (ex: `C:\pj-nautica-github`)
5. NÃO marque: README, .gitignore, license
6. Create repository
7. **Depois:** Copie TODOS os arquivos da pasta ATUAL para a nova pasta
8. No GitHub Desktop → Reload → Verá todos os arquivos

---

### **PASSO 2: Conectar e fazer Push**

**Se criou pelo navegador:**
```bash
git remote add origin https://github.com/Danilobrandaossa/pj-nautica.git
git push -u origin main
```

**Se criou pelo GitHub Desktop:**
1. GitHub Desktop → File → Add local repository
2. Adicione a pasta ATUAL
3. Você verá o commit feito
4. Clique em "Publish repository"

---

### **PASSO 3: Verificar no GitHub**

Acesse: https://github.com/Danilobrandaossa/pj-nautica

Você deve ver todos os arquivos!

---

### **PASSO 4: Deploy no Servidor**

Conecte ao servidor:
```bash
ssh root@148.230.77.113
# Senha: Zy598859D@n22
```

Execute:
```bash
cd /opt
mv embarcacoes embarcacoes.backup 2>/dev/null || true
mkdir -p embarcacoes && cd embarcacoes

# Clonar repositório
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Configurar .env
cp backend/ENV.EXAMPLE .env
nano .env
# IMPORTANTE: Valores com caracteres especiais entre aspas simples!
# JWT_SECRET='valor_com_!@#$'
# Salve: Ctrl+X, Y, Enter

# Criar diretórios
mkdir -p nginx/ssl certbot/conf certbot/www

# Verificar qual comando funciona
which docker-compose || docker compose version

# Deploy (use o comando que funcionar)
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
sleep 30

# Ou use:
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
sleep 30

# Migrações
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate || true

# Verificar
docker-compose -f docker-compose.prod.yml ps
curl http://localhost
```

---

### **PASSO 5: Testar**

Abra no navegador:
```
http://148.230.77.113
```

---

### **PASSO 6: Deploy Automático (Opcional)**

Para configurar GitHub Actions:

1. Adicione Secrets em: https://github.com/Danilobrandaossa/pj-nautica/settings/secrets/actions
   - `VPS_SSH_PRIVATE_KEY`
   - `VPS_HOST`: 148.230.77.113
   - `VPS_USER`: root
   - `VPS_URL`: http://148.230.77.113

2. Depois, cada `git push` faz deploy automático!

---

## ⚠️ **PROBLEMAS COMUNS**

### Erro ao fazer push: "remote: Support for password authentication was removed"
**Solução:** Use token de acesso pessoal:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Marque `repo` e `workflow`
4. Use o token como senha

### Erro no servidor: "docker-compose: command not found"
**Solução:** Use `docker compose` (sem hífen)

### Erro: "Invalid interpolation format"
**Solução:** No `.env`, valores entre aspas simples:
```bash
JWT_SECRET='senha!@#$%^'
```

---

**✅ Pronto! Siga os passos e seu sistema estará no ar!**

