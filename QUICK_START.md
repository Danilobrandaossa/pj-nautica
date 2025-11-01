# 🚀 Início Rápido - 5 Minutos

## Passo 1: Abrir Docker Desktop

Certifique-se que o Docker Desktop está rodando no seu Windows.

## Passo 2: Abrir PowerShell na pasta do projeto

```powershell
cd "C:\Users\ueles\OneDrive\Área de Trabalho\Inffinity"
```

## Passo 3: Iniciar TUDO com 1 comando

```powershell
docker-compose up -d
```

Aguarde 30 segundos...

## Passo 4: Criar banco de dados

```powershell
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed
```

## Passo 5: Acessar o sistema! 🎉

Abra o navegador em: **http://localhost:3000**

**Login Admin:**
- Email: `admin@embarcacoes.com`
- Senha: `Admin@123`

**Login Usuário:**
- Email: `danilo@exemplo.com`
- Senha: `Usuario@123`

---

## ✅ O que está rodando:

- **Frontend:** http://localhost:3000 (Interface do usuário)
- **Backend:** http://localhost:3001 (API)
- **Banco de Dados:** localhost:5432 (PostgreSQL)
- **n8n:** http://localhost:5678 (Automações WhatsApp)

---

## 🛑 Para parar tudo:

```powershell
docker-compose stop
```

## 🔄 Para reiniciar:

```powershell
docker-compose restart
```

## 🗑️ Para resetar tudo:

```powershell
docker-compose down -v
docker-compose up -d
timeout /t 30
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed
```

---

## 📱 Configurar WhatsApp (Opcional)

1. Acesse n8n: http://localhost:5678
2. Login: `admin` / `admin123`
3. Importe o arquivo `n8n-workflow.json`
4. Configure suas credenciais de API do WhatsApp
5. Copie a URL do webhook gerado
6. Cole no arquivo `backend/.env`:
   ```
   N8N_WEBHOOK_URL=http://n8n:5678/webhook/agendamentos
   ```
7. Reinicie o backend: `docker-compose restart backend`

---

## 🎯 Funcionalidades Prontas:

✅ Login com perfis Admin e Usuário  
✅ Gerenciamento de Embarcações  
✅ Calendário de Agendamentos  
✅ Reservas com validação de 24h  
✅ Limite de reservas por usuário  
✅ Bloqueio de datas  
✅ Histórico completo de ações  
✅ Notificações no sistema  
✅ Integração WhatsApp via n8n  
✅ Painel administrativo completo  

---

## 🐛 Problemas?

Veja o log:
```powershell
docker-compose logs -f
```

Reconstruir tudo:
```powershell
docker-compose down -v
docker-compose up -d --build
timeout /t 30
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed
```

---

## 🎊 Pronto para usar!

O sistema está 100% funcional e pronto para testes de usabilidade! 🚤



