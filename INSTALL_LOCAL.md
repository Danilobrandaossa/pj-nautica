# 🚀 Guia de Instalação Local - Windows com Docker Desktop

Este guia vai te ajudar a rodar o sistema completo de agendamento de embarcações no seu PC Windows com Docker Desktop.

## 📋 Pré-requisitos

✅ Docker Desktop instalado e rodando  
✅ Node.js 20+ (opcional, para desenvolvimento sem Docker)  
✅ Git (opcional)

## 🎯 Instalação Rápida com Docker

### 1. Abra o PowerShell ou Terminal

```powershell
# Navegue até a pasta do projeto
cd "C:\Users\ueles\OneDrive\Área de Trabalho\Inffinity"
```

### 2. Inicie todos os serviços com Docker Compose

```powershell
docker-compose up -d
```

Isso vai iniciar:
- ✅ PostgreSQL (banco de dados)
- ✅ Backend API (Node.js + Express)
- ✅ Frontend (React + Vite)
- ✅ n8n (automação WhatsApp)

### 3. Aguarde os containers iniciarem

```powershell
# Verifique o status dos containers
docker-compose ps

# Acompanhe os logs
docker-compose logs -f
```

### 4. Execute as migrations do banco de dados

```powershell
# Rode as migrations
docker-compose exec backend npm run prisma:migrate

# Crie os dados iniciais (usuários, embarcações)
docker-compose exec backend npm run seed
```

### 5. Acesse o sistema! 🎉

- **Frontend (Interface do Sistema):** http://localhost:3000
- **Backend API:** http://localhost:3001
- **n8n (Automações):** http://localhost:5678

## 🔐 Credenciais de Acesso

### Admin
- **Email:** admin@embarcacoes.com
- **Senha:** Admin@123

### Usuários de Teste
- **Email:** danilo@exemplo.com ou maria@exemplo.com
- **Senha:** Usuario@123

⚠️ **IMPORTANTE:** Altere as senhas após o primeiro login!

## 🛠 Comandos Úteis

### Parar os containers
```powershell
docker-compose stop
```

### Reiniciar os containers
```powershell
docker-compose restart
```

### Ver logs em tempo real
```powershell
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Parar e remover tudo
```powershell
docker-compose down
```

### Parar e remover incluindo dados do banco
```powershell
docker-compose down -v
```

### Acessar o banco de dados (Prisma Studio)
```powershell
docker-compose exec backend npm run prisma:studio
```

Acesse: http://localhost:5555

### Resetar o banco e recriar dados
```powershell
# Parar containers
docker-compose down -v

# Iniciar novamente
docker-compose up -d

# Aguardar banco iniciar (10 segundos)
timeout /t 10

# Rodar migrations e seed
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed
```

## 🧪 Testando o Sistema

### 1. Teste de Login
1. Acesse http://localhost:3000
2. Faça login com: admin@embarcacoes.com / Admin@123
3. Você verá o painel administrativo

### 2. Teste de Agendamento
1. Faça login como usuário: danilo@exemplo.com / Usuario@123
2. Vá em "Minhas Embarcações"
3. Selecione "Infinity ONE"
4. Clique em uma data futura (mínimo 24h)
5. Crie uma reserva

### 3. Teste de Bloqueio (Admin)
1. Faça login como admin
2. Vá em "Bloqueios"
3. Selecione uma embarcação e bloqueie algumas datas
4. Tente reservar essas datas como usuário

### 4. Teste de Notificações WhatsApp
O sistema está configurado para enviar webhooks ao n8n. Para testar:

1. Acesse n8n: http://localhost:5678
2. Login: admin / admin123
3. Crie um workflow básico com Webhook
4. Configure a URL no backend/.env:
   ```
   N8N_WEBHOOK_URL=http://n8n:5678/webhook/agendamentos
   ```
5. Reinicie o backend: `docker-compose restart backend`

## 🐛 Resolução de Problemas

### Container não inicia

```powershell
# Ver erro específico
docker-compose logs backend

# Reconstruir containers
docker-compose up -d --build
```

### Erro de porta já em uso

Se a porta 3000, 3001 ou 5432 já estiver em uso, edite o arquivo `docker-compose.yml`:

```yaml
# Exemplo: mudar porta do frontend
frontend:
  ports:
    - "3001:3000"  # Muda de 3000 para 3001
```

### Banco de dados não conecta

```powershell
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar apenas o banco
docker-compose restart postgres

# Aguardar 10 segundos
timeout /t 10

# Testar conexão
docker-compose exec postgres pg_isready -U embarcacoes
```

### Erro ao rodar migrations

```powershell
# Deletar e recriar banco
docker-compose down -v
docker-compose up -d
timeout /t 10
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run seed
```

### Frontend não carrega

```powershell
# Ver logs do frontend
docker-compose logs -f frontend

# Reconstruir frontend
docker-compose up -d --build frontend
```

## 📊 Monitoramento

### Ver uso de recursos
```powershell
docker stats
```

### Ver containers em execução
```powershell
docker ps
```

### Inspecionar um container específico
```powershell
docker inspect embarcacoes_backend
```

## 🔄 Atualizar o Sistema

Quando houver mudanças no código:

```powershell
# Parar containers
docker-compose down

# Reconstruir e iniciar
docker-compose up -d --build

# Se houver mudanças no banco
docker-compose exec backend npm run prisma:migrate
```

## 💡 Dicas de Desenvolvimento

### Desenvolvimento sem Docker (opcional)

Se preferir rodar localmente sem Docker:

```powershell
# Backend
cd backend
npm install
npm run prisma:migrate:dev
npm run seed
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

⚠️ Você precisará de PostgreSQL instalado localmente e configurar o .env

### Hot Reload

O Docker Compose já está configurado com volumes para hot reload:
- Mudanças no backend são recarregadas automaticamente
- Mudanças no frontend são recarregadas automaticamente

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Veja o status: `docker-compose ps`
3. Reinicie tudo: `docker-compose down && docker-compose up -d`
4. Se nada funcionar, delete tudo e recomece:
   ```powershell
   docker-compose down -v
   docker-compose up -d --build
   timeout /t 10
   docker-compose exec backend npm run prisma:migrate
   docker-compose exec backend npm run seed
   ```

## ✨ Pronto!

Seu sistema de agendamento de embarcações está rodando! 🚤

Acesse: http://localhost:3000



