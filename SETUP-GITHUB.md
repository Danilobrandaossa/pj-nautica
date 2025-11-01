# 🚀 Guia Rápido: Configurar Git e GitHub

## Passo 1: Inicializar o Repositório Git

```bash
# No diretório do projeto
cd C:\Users\ueles\OneDrive\Área de Trabalho\pj-nautica

# Inicializar Git
git init

# Adicionar todos os arquivos (exceto os ignorados pelo .gitignore)
git add .

# Fazer commit inicial
git commit -m "feat: configuração inicial do projeto com deploy automático"
```

## Passo 2: Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Crie um novo repositório (ex: `pj-nautica` ou `embarcacoes`)
3. **NÃO** inicialize com README, .gitignore ou license (já temos isso)
4. Copie a URL do repositório (ex: `https://github.com/seu-usuario/pj-nautica.git`)

## Passo 3: Conectar ao GitHub

```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Renomear branch principal para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## Passo 4: Configurar Secrets no GitHub

Após o repositório estar no GitHub:

1. Vá para: **Settings** → **Secrets and variables** → **Actions**
2. Adicione os seguintes secrets:

### `VPS_SSH_PRIVATE_KEY`
Gere uma chave SSH e adicione:

```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
# Salve em: ~/.ssh/github_deploy

# Copiar chave PRIVADA (para GitHub Secrets)
cat ~/.ssh/github_deploy

# Copiar chave PÚBLICA (para adicionar no servidor)
cat ~/.ssh/github_deploy.pub
```

**No servidor VPS:**
```bash
# Adicionar chave pública no servidor
echo "sua-chave-publica-aqui" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### `VPS_HOST`
```
145.223.93.235
```

### `VPS_USER`
```
root
```

### `VPS_URL`
```
http://145.223.93.235
```

## Passo 5: Preparar o Servidor VPS

Execute no servidor:

```bash
# Conectar ao VPS
ssh root@145.223.93.235

# Criar diretório
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Instalar Docker (se não tiver)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Criar arquivo .env
nano .env
# (Copie o conteúdo de env.production.example e ajuste)
```

## Passo 6: Testar Deploy

Após configurar tudo:

1. Faça uma alteração qualquer no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "test: primeiro deploy"
   git push
   ```
3. Vá para **Actions** no GitHub e acompanhe o deploy
4. Acesse: http://145.223.93.235

## 📚 Documentação Completa

Para mais detalhes, veja: `DEPLOY-GITHUB.md`


