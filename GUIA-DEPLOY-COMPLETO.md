# 🚀 Guia Completo de Deploy - Infinity Náutica

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Servidor](#preparação-do-servidor)
3. [Clone e Configuração](#clone-e-configuração)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Configuração das Variáveis de Ambiente](#configuração-das-variáveis-de-ambiente)
6. [Deploy da Aplicação](#deploy-da-aplicação)
7. [Configuração de SSL/HTTPS](#configuração-de-sslhttps)
8. [Verificação e Testes](#verificação-e-testes)
9. [Manutenção](#manutenção)
10. [Troubleshooting](#troubleshooting)

---

## 📋 Pré-requisitos

### Hardware Mínimo
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB SSD
- **Conectividade**: IP público estático

### Software Necessário
- **Sistema Operacional**: Ubuntu 20.04 LTS ou superior
- **Docker**: versão 20.10 ou superior
- **Docker Compose**: versão 2.0 ou superior
- **Git**: versão 2.30 ou superior
- **OpenSSL**: versão 1.1.1 ou superior

---

## 🖥️ Preparação do Servidor

### 1. Atualizar o Sistema

```bash
# Atualizar lista de pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential ufw openssl software-properties-common
```

### 2. Instalar Docker

```bash
# Remover instalações antigas
sudo apt remove -y docker docker-engine docker.io containerd runc

# Adicionar repositório oficial do Docker
sudo apt install -y ca-certificates gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker compose version
```

### 3. Configurar Firewall

```bash
# Ativar firewall
sudo ufw --force enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

---

## 📁 Clone e Configuração

### 1. Criar Diretório do Projeto

```bash
# Criar diretório
sudo mkdir -p /opt/embarcacoes
sudo chown -R $USER:$USER /opt/embarcacoes
cd /opt/embarcacoes
```

### 2. Clonar Repositório

```bash
# Clonar repositório
git clone https://github.com/Danilobrandaossa/pj-nautica.git .

# Verificar estrutura
ls -la
```

### 3. Copiar Arquivo de Exemplo

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar arquivo
nano .env
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Configurar Variáveis do Postgres

No arquivo `.env`, configure:

```env
# Database
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SUA_SENHA_SUPER_SEGURA_AQUI
POSTGRES_DB=embarcacoes_db
```

**⚠️ IMPORTANTE**: Gere senhas seguras com:

```bash
openssl rand -base64 32
```

---

## ⚙️ Configuração das Variáveis de Ambiente

### Arquivo `.env` Completo

```env
# =====================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# =====================================
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SUA_SENHA_SUPER_SEGURA_AQUI
POSTGRES_DB=embarcacoes_db

# =====================================
# CONFIGURAÇÃO DO BACKEND
# =====================================
NODE_ENV=production
JWT_SECRET=GereUmHashAleatorioMuitoSeguro123!@#$%^&*()
JWT_REFRESH_SECRET=OutroHashAleatorioMuitoSeguro123!@#$%^&*()
FRONTEND_URL=https://app.infinitynautica.com.br
PORT=3001

# =====================================
# CONFIGURAÇÃO DO FRONTEND
# =====================================
VITE_API_URL=https://app.infinitynautica.com.br/api

# =====================================
# CONFIGURAÇÃO DO n8n (Opcional)
# =====================================
N8N_USER=admin
N8N_PASSWORD=SenhaN8NSeguraAqui123!
N8N_HOST=n8n.infinitynautica.com.br
N8N_WEBHOOK_URL=https://n8n.infinitynautica.com.br/webhook

# =====================================
# CONFIGURAÇÃO DE EMAIL (Opcional)
# =====================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app

# =====================================
# SENTRY (Opcional - para monitoramento)
# =====================================
SENTRY_DSN=
```

### 2. Configurar Domínio

**Antes de continuar**, certifique-se de que:

1. **DNS configurado** apontando para o IP do servidor:
   - A: `app.infinitynautica.com.br` → `SEU_IP`
   - A: `n8n.infinitynautica.com.br` → `SEU_IP`

2. **Portas abertas** no firewall:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

---

## 🚀 Deploy da Aplicação

### 1. Build e Inicialização

```bash
cd /opt/embarcacoes

# Fazer build de todos os containers
docker compose -f docker-compose.prod.yml build --no-cache

# Iniciar containers
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker ps
```

### 2. Aplicar Migrações do Banco

```bash
# Executar migrações
docker exec embarcacoes_backend_prod npx prisma migrate deploy

# Verificar se migrações foram aplicadas
docker exec embarcacoes_backend_prod npx prisma migrate status
```

### 3. Criar Usuário Administrador

```bash
# Entrar no container backend
docker exec -it embarcacoes_backend_prod sh

# Executar seed (dentro do container)
cd /app
node prisma/seed.js

# Sair do container
exit
```

**Credenciais padrão do admin:**
- **Email**: `danilo@danilobrandao.com.br`
- **Senha**: `05062618592`

**⚠️ ALTERE A SENHA IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!**

---

## 🔒 Configuração de SSL/HTTPS

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obter Certificados SSL

```bash
# Parar containers temporariamente
docker compose -f docker-compose.prod.yml stop nginx

# Obter certificado
sudo certbot certonly --standalone -d app.infinitynautica.com.br -d n8n.infinitynautica.com.br

# Certificados estarão em:
# /etc/letsencrypt/live/app.infinitynautica.com.br/fullchain.pem
# /etc/letsencrypt/live/app.infinitynautica.com.br/privkey.pem
```

### 3. Configurar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Adicionar ao crontab (renovar automaticamente)
sudo crontab -e

# Adicionar linha:
# 0 0 1 * * certbot renew --quiet && docker compose -f /opt/embarcacoes/docker-compose.prod.yml restart nginx
```

### 4. Reiniciar Containers

```bash
cd /opt/embarcacoes
docker compose -f docker-compose.prod.yml up -d
```

---

## ✅ Verificação e Testes

### 1. Verificar Status dos Containers

```bash
docker ps

# Todos devem estar com status "healthy" ou "running"
```

### 2. Verificar Logs

```bash
# Backend
docker logs embarcacoes_backend_prod --tail=50

# Frontend
docker logs embarcacoes_frontend_prod --tail=50

# Nginx
docker logs embarcacoes_nginx_prod --tail=50

# Banco de dados
docker logs embarcacoes_db_prod --tail=50
```

### 3. Testar Endpoints

```bash
# Health check do backend
curl http://localhost:3001/health

# Health check via Nginx
curl http://localhost/api/health

# Testar HTTPS
curl https://app.infinitynautica.com.br
```

### 4. Verificar Banco de Dados

```bash
# Entrar no banco
docker exec -it embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db

# Listar tabelas
\dt

# Verificar usuários
SELECT id, name, email, role FROM users;

# Sair
\q
```

---

## 🧪 Testes Funcionais

### 1. Login

- Acesse: `https://app.infinitynautica.com.br/login`
- Email: `danilo@danilobrandao.com.br`
- Senha: `05062618592`

### 2. Testar Funcionalidades Admin

- ✅ **Usuários**: Criar, editar, deletar, redefinir senha
- ✅ **Embarcações**: Criar, editar, deletar, vincular usuários
- ✅ **Reservas**: Visualizar calendário, criar, aprovar, cancelar
- ✅ **Bloqueios**: Datas bloqueadas e bloqueios semanais
- ✅ **Notificações**: Enviar para usuários
- ✅ **Financeiro**: Registrar pagamentos, visualizar histórico

### 3. Verificar Navegador

```bash
# Abrir DevTools (F12) e verificar console
# Não deve haver erros 500 ou CORS
```

---

## 🔧 Manutenção

### 1. Atualizar Aplicação

```bash
cd /opt/embarcacoes

# Baixar últimas mudanças
git pull

# Rebuild e restart
docker compose -f docker-compose.prod.yml up -d --build

# Verificar logs
docker logs embarcacoes_backend_prod --tail=50
```

### 2. Backup do Banco de Dados

```bash
# Backup manual
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i embarcacoes_db_prod psql -U embarcacoes embarcacoes_db < backup_20250101_120000.sql
```

### 3. Limpar Recursos Docker

```bash
# Remover imagens não utilizadas
docker system prune -a --volumes

# Limpar builds antigos
docker builder prune -a
```

### 4. Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker logs -f embarcacoes_backend_prod
```

---

## 🐛 Troubleshooting

### Erro: "Origin é obrigatório em produção"

**Causa**: CORS não configurado corretamente

**Solução**:
```bash
cd /opt/embarcacoes
git pull
docker compose -f docker-compose.prod.yml restart backend nginx
```

### Erro: "Container unhealthy"

**Causa**: Healthcheck falhando

**Solução**:
```bash
# Verificar logs
docker logs embarcacoes_backend_prod --tail=100

# Verificar se backend está respondendo
docker exec embarcacoes_backend_prod curl -f http://localhost:3001/health
```

### Erro: "Table does not exist"

**Causa**: Migrações não aplicadas

**Solução**:
```bash
docker exec embarcacoes_backend_prod npx prisma migrate deploy
```

### Página em branco no navegador

**Causa**: Cache ou build antigo

**Solução**:
```bash
# Hard refresh no navegador (Ctrl+F5)
# OU
docker compose -f docker-compose.prod.yml restart frontend
```

### Erro: "Cannot read properties of undefined"

**Causa**: Problema com chunks do Vite

**Solução**:
```bash
cd /opt/embarcacoes
git pull
docker compose -f docker-compose.prod.yml up -d --build frontend --no-cache
```

### Dados sumiram após atualização

**Causa**: Cache do React Query ou usuários soft-deleted

**Solução**:
```bash
# Verificar se dados estão no banco
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "SELECT COUNT(*) FROM users;"

# Se count = 0, verificar se há soft-deletes
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "SELECT id, email, \"deletedAt\" FROM users;"

# Se houver deletedAt, restaurar
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "UPDATE users SET \"deletedAt\" = NULL WHERE email = 'seu-email@email.com';"

# Limpar cache no navegador (Ctrl+Shift+Delete)
```

---

## 📊 Verificação de Saúde do Sistema

### Script de Verificação Automática

Crie arquivo `/opt/embarcacoes/health-check.sh`:

```bash
#!/bin/bash

echo "=== Verificação de Saúde - Infinity Náutica ==="
echo ""

# Verificar containers
echo "📦 Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

# Verificar backend
echo "🔧 Backend Health:"
curl -s http://localhost:3001/health | jq || echo "Backend offline"
echo ""

# Verificar banco
echo "🗄️ Banco de Dados:"
docker exec embarcacoes_db_prod pg_isready -U embarcacoes || echo "Postgres offline"
echo ""

# Verificar usuários
echo "👥 Usuários no banco:"
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -t -c "SELECT COUNT(*) FROM users WHERE \"deletedAt\" IS NULL;"
echo ""

# Verificar logs de erro
echo "⚠️ Últimos erros do backend:"
docker logs embarcacoes_backend_prod --tail=50 2>&1 | grep -i "error" || echo "Nenhum erro recente"
echo ""

echo "✅ Verificação concluída"
```

### Tornar Executável

```bash
chmod +x /opt/embarcacoes/health-check.sh
```

---

## 📝 Comandos Rápidos de Referência

```bash
# =====================================
# STATUS E LOGS
# =====================================
docker ps                                    # Ver containers
docker logs embarcacoes_backend_prod -f     # Logs backend em tempo real
docker logs embarcacoes_frontend_prod -f    # Logs frontend em tempo real
docker logs embarcacoes_nginx_prod -f       # Logs nginx em tempo real

# =====================================
# REINICIAR SERVIÇOS
# =====================================
docker compose -f docker-compose.prod.yml restart backend     # Backend
docker compose -f docker-compose.prod.yml restart frontend    # Frontend
docker compose -f docker-compose.prod.yml restart nginx       # Nginx
docker compose -f docker-compose.prod.yml restart             # Todos

# =====================================
# BANCO DE DADOS
# =====================================
docker exec -it embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db
docker exec embarcacoes_backend_prod npx prisma migrate deploy
docker exec embarcacoes_backend_prod npx prisma migrate status

# =====================================
# ATUALIZAÇÃO
# =====================================
cd /opt/embarcacoes && git pull && docker compose -f docker-compose.prod.yml up -d --build

# =====================================
# BACKUP
# =====================================
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backup_$(date +%Y%m%d).sql

# =====================================
# LIMPEZA
# =====================================
docker system prune -a --volumes             # Remove tudo não utilizado
docker compose -f docker-compose.prod.yml down -v  # Para tudo e remove volumes
```

---

## 🗄️ Verificação do Banco de Dados

### Procedimento Completo de Verificação

Após o deploy, execute a verificação completa do banco de dados para garantir integridade:

```bash
# Executar script de verificação
docker cp backend/scripts/check-database.sql embarcacoes_db_prod:/tmp/
docker exec embarcacoes_db_prod psql -U postgres -d embarcacoes -f /tmp/check-database.sql
```

### Documentação Detalhada

- 📄 **Verificação Completa**: `VERIFICACAO-BANCO-DADOS.md`
- 🚀 **Execução no Servidor**: `EXECUTE-VERIFICACAO-SERVIDOR.md`

### Verificações Principais

1. ✅ Tabelas principais existem
2. ✅ Migrations aplicadas corretamente
3. ✅ Dados de usuários íntegros
4. ✅ Reservas (bookings) acessíveis
5. ✅ Soft deletes funcionando
6. ✅ Índices criados corretamente
7. ✅ Foreign keys válidas

---

## 🔐 Segurança

### 1. Alterar Senhas Padrão

Após primeiro login, altere:
- ✅ Senha do administrador
- ✅ `POSTGRES_PASSWORD` no `.env`
- ✅ `JWT_SECRET` e `JWT_REFRESH_SECRET`
- ✅ Senha do n8n

### 2. Configurar Firewall Adicional

```bash
# Bloquear acesso direto ao backend (só via nginx)
sudo ufw deny 3001/tcp

# Permitir apenas IPs específicos (opcional)
sudo ufw allow from SEU_IP_OFICIAL to any port 22
```

### 3. Monitoramento de Segurança

```bash
# Ver tentativas de login falhadas
docker logs embarcacoes_backend_prod | grep -i "login failed"

# Ver tentativas de acesso bloqueadas
docker logs embarcacoes_nginx_prod | grep -i "blocked"
```

---

## 📞 Suporte

### Informações do Sistema

- **Repositório**: https://github.com/Danilobrandaossa/pj-nautica
- **Versão**: 1.0.0
- **Ambiente**: Production

### Logs Importantes

- **Backend**: `/app/logs/app.log` (dentro do container)
- **Nginx**: `/var/log/nginx/access.log` e `/var/log/nginx/error.log`
- **Postgres**: Logs via Docker

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Todos os containers estão `healthy` ou `running`
- [ ] Login funcionando
- [ ] SSL/HTTPS configurado e válido
- [ ] Backup automático configurado
- [ ] Senhas padrão alteradas
- [ ] Firewall configurado
- [ ] Renovação de certificados SSL automatizada
- [ ] Monitoramento configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

## 🎉 Deploy Concluído!

Sistema Infinity Náutica está **100% funcional e pronto para produção**!

### Próximos Passos

1. 📧 Configurar notificações por email
2. 🔔 Configurar webhooks do n8n
3. 📊 Implementar monitoramento (Sentry, New Relic, etc)
4. 🔄 Configurar CI/CD para deploys automáticos
5. 📈 Implementar analytics

---

**Última atualização**: 01/11/2025  
**Versão do guia**: 2.0  
**Autor**: Infinity Náutica Team

