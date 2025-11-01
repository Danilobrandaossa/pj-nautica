# 🚀 Deploy Automático via GitHub Actions

Este guia explica como configurar o deploy automático do projeto para o VPS usando GitHub Actions.

## 📋 Pré-requisitos

1. **Repositório no GitHub**: O projeto deve estar em um repositório GitHub
2. **Acesso SSH ao VPS**: Você precisa ter acesso SSH ao servidor
3. **Chave SSH configurada**: Uma chave SSH privada para autenticação

## 🔐 Configurando Secrets no GitHub

Para que o GitHub Actions possa fazer deploy no seu VPS, você precisa configurar os seguintes secrets:

### 1. Acesse as Configurações do Repositório

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. Adicione os Seguintes Secrets:

#### `VPS_SSH_PRIVATE_KEY`
A chave SSH privada que permite acesso ao VPS.

**Como obter:**
```bash
# No seu computador local, se você já tem uma chave SSH:
cat ~/.ssh/id_rsa

# Ou gere uma nova chave SSH:
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
# Salve a chave privada (aparecerá ao executar cat ~/.ssh/id_rsa)
```

**Importante:** 
- Copie a chave **privada** completa (incluindo `-----BEGIN RSA PRIVATE KEY-----` e `-----END RSA PRIVATE KEY-----`)
- Adicione a chave **pública** correspondente no servidor:
  ```bash
  # No servidor VPS
  echo "sua-chave-publica-aqui" >> ~/.ssh/authorized_keys
  ```

#### `VPS_HOST`
O endereço IP ou domínio do seu VPS.

**Exemplo:**
```
145.223.93.235
```
ou
```
seu-dominio.com.br
```

#### `VPS_USER`
O usuário SSH para conectar ao VPS.

**Exemplo:**
```
root
```
ou
```
ubuntu
```

#### `VPS_URL`
A URL completa do sistema (para verificação de saúde).

**Exemplo:**
```
http://145.223.93.235
```
ou
```
https://seu-dominio.com.br
```

## 📝 Configuração Inicial no VPS

Antes do primeiro deploy, você precisa preparar o servidor:

### 1. Conectar ao VPS

```bash
ssh root@145.223.93.235
```

### 2. Criar Diretório do Projeto

```bash
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes
```

### 3. Configurar Permissões

```bash
chown -R $USER:$USER /opt/embarcacoes
```

### 4. Criar Arquivo .env

```bash
nano .env
```

Adicione todas as variáveis de ambiente necessárias (veja `env.production.example`):

```env
# Database Configuration
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
POSTGRES_DB=embarcacoes_db

# Backend Configuration
NODE_ENV=production
DATABASE_URL=postgresql://embarcacoes:SUA_SENHA_SEGURA_AQUI@postgres:5432/embarcacoes_db?schema=public
JWT_SECRET=SUA_CHAVE_JWT_64_CARACTERES_SEGURA
JWT_REFRESH_SECRET=SUA_CHAVE_REFRESH_64_CARACTERES_SEGURA

# URLs
FRONTEND_URL=http://145.223.93.235
VITE_API_URL=http://145.223.93.235/api

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=SUA_SENHA_N8N_SEGURA
N8N_HOST=145.223.93.235
N8N_WEBHOOK_URL=http://145.223.93.235:5678/webhook

# Outras configurações conforme necessário
```

### 5. Instalar Docker (se ainda não estiver instalado)

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Adicionar usuário ao grupo docker
usermod -aG docker $USER
```

## 🚀 Fazendo o Primeiro Deploy

### Opção 1: Deploy Automático (Recomendado)

1. **Faça commit e push para a branch `main` ou `master`:**

```bash
git add .
git commit -m "feat: configuração inicial para deploy"
git push origin main
```

2. **O GitHub Actions executará automaticamente**

Você pode acompanhar o progresso em:
- Repositório → **Actions** (no topo)
- Clique no workflow em execução para ver os logs

### Opção 2: Deploy Manual via GitHub Actions

1. Vá para **Actions** no seu repositório
2. Selecione o workflow **🚀 Deploy to VPS**
3. Clique em **Run workflow**
4. Selecione a branch e clique em **Run workflow**

## 📊 Monitorando o Deploy

### Durante o Deploy

Acesse a aba **Actions** no GitHub para ver:
- Status de cada etapa
- Logs detalhados
- Possíveis erros

### Após o Deploy

No servidor, você pode verificar:

```bash
# Status dos containers
cd /opt/embarcacoes
docker-compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Testar endpoint de saúde
curl http://localhost/api/health
```

## 🔄 Deploys Futuros

Após a configuração inicial, todos os pushes para `main`/`master` irão:

1. ✅ Fazer pull do código mais recente
2. ✅ Parar os containers antigos
3. ✅ Reconstruir as imagens
4. ✅ Iniciar os novos containers
5. ✅ Executar migrações do banco
6. ✅ Verificar saúde do sistema

## 🛠️ Troubleshooting

### Erro: "Permission denied (publickey)"

**Solução:**
1. Verifique se a chave privada está correta no GitHub Secrets
2. Adicione a chave pública no servidor:
   ```bash
   # No servidor
   echo "sua-chave-publica" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

### Erro: "Connection refused"

**Solução:**
1. Verifique se o VPS está acessível:
   ```bash
   ping 145.223.93.235
   ```
2. Verifique se a porta SSH (22) está aberta no firewall

### Erro: "Directory /opt/embarcacoes does not exist"

**Solução:**
Execute no servidor:
```bash
sudo mkdir -p /opt/embarcacoes
sudo chown -R $USER:$USER /opt/embarcacoes
```

### Containers não iniciam

**Solução:**
1. Verifique os logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```
2. Verifique o arquivo `.env`:
   ```bash
   cat .env
   ```
3. Verifique se o Docker está rodando:
   ```bash
   systemctl status docker
   ```

### Migrações falham

**Solução:**
Execute manualmente no servidor:
```bash
cd /opt/embarcacoes
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
```

## 📝 Estrutura de Arquivos

```
.github/
  workflows/
    deploy.yml          # Workflow do GitHub Actions
deploy-server.sh        # Script executado no servidor
docker-compose.prod.yml # Configuração Docker para produção
.env                    # Variáveis de ambiente (NÃO commitar!)
env.production.example  # Exemplo de variáveis de ambiente
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**

1. **NUNCA** commite o arquivo `.env` no repositório
2. **SEMPRE** use secrets do GitHub para informações sensíveis
3. **VERIFIQUE** que o `.gitignore` inclui `.env`
4. **USE** senhas fortes em produção
5. **ATUALIZE** as senhas padrão após o primeiro deploy

## ✅ Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Secrets configurados no GitHub
- [ ] Chave SSH adicionada ao servidor
- [ ] Diretório `/opt/embarcacoes` criado no servidor
- [ ] Arquivo `.env` configurado no servidor
- [ ] Docker instalado no servidor
- [ ] Firewall configurado (portas 80, 443, 22 abertas)
- [ ] Domínio apontado para o IP do VPS (se usando domínio)

## 🎉 Pronto!

Após configurar tudo, seus deploys serão automáticos sempre que você fizer push para a branch principal!

**🌐 Sistema estará disponível em:** `http://145.223.93.235` (ou seu domínio)


