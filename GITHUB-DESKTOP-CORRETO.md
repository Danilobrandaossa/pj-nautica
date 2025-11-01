# ✅ Como Usar GitHub Desktop CORRETAMENTE

## ❌ **NÃO FAÇA:**
- ❌ File → New repository (cria repo DENTRO da sua pasta)
- ❌ Isso criaria: `pj-nautica/app-pj-nautica` (ERRADO!)

## ✅ **FAÇA ISSO:**

### **OPÇÃO 1 - GitHub Desktop (Add Existing Repository)**

1. No GitHub Desktop, clique em **"File"** → **"Add Local Repository"**
2. Navegue até: `C:\Users\ueles\OneDrive\Área de Trabalho\pj-nautica`
3. Clique em **"Add"**
4. Você verá:
   - Todos os arquivos na aba "Changes"
   - O commit "🎉 Deploy inicial - Sistema PWA"
5. Clique em **"Publish repository"** (botão azul embaixo)
6. Marque **"Keep this code private"** (ou não)
7. Clique em **"Publish repository"**
8. Pronto! 🎉

---

### **OPÇÃO 2 - Terminal (MAIS RÁPIDO)**

Se o GitHub Desktop estiver confuso, use o terminal:

1. Crie o repositório no navegador: https://github.com/new
   - Nome: `pj-nautica`
   - **NÃO marque:** README, .gitignore, license
   - Create repository

2. No terminal PowerShell:
```bash
git remote add origin https://github.com/Danilobrandaossa/pj-nautica.git
git push -u origin main
```

3. Pronto! 🎉

---

## 🎯 **Recomendação**

Use a **OPÇÃO 2 (Terminal)** - é mais rápida e direta!

---

**Pronto! Depois avise quando o repositório estiver no GitHub.**

