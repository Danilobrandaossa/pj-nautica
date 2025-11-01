# 🌐 DEPLOY EM SUBDOMÍNIO - GUIA PASSO A PASSO

## 📋 **CONFIGURAÇÃO PARA SUBDOMÍNIO**

### **Exemplo de subdomínios:**
- `embarcacoes.seudominio.com.br` - Sistema principal
- `n8n.seudominio.com.br` - n8n para automações
- `api.seudominio.com.br` - API (opcional)

---

## 🎯 **PASSO A PASSO COMPLETO**

### **PASSO 1: PREPARAR O SERVIDOR**

Vamos começar conectando ao servidor e preparando o ambiente:

```bash
# Conectar ao servidor
ssh root@145.223.93.235

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release nginx certbot python3-certbot-nginx
```

### **PASSO 2: INSTALAR DOCKER**

```bash
# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Instalar Docker Compose standalone
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalações
docker --version
docker-compose --version
```

### **PASSO 3: CRIAR DIRETÓRIO DO PROJETO**

```bash
# Criar diretório
mkdir -p /opt/embarcacoes
cd /opt/embarcacoes

# Criar estrutura
mkdir -p nginx ssl certbot/conf certbot/www
```

### **PASSO 4: CONFIGURAR DNS**

**Antes de continuar, configure os DNS:**
- `embarcacoes.seudominio.com.br` → 145.223.93.235
- `n8n.seudominio.com.br` → 145.223.93.235

**Testar DNS:**
```bash
# Testar se os subdomínios estão apontando para o servidor
ping embarcacoes.seudominio.com.br
ping n8n.seudominio.com.br
```

### **PASSO 5: CRIAR ARQUIVOS DE CONFIGURAÇÃO**

Vou te ajudar a criar cada arquivo necessário. Vamos começar?

**Qual é o seu domínio principal?** (exemplo: seudominio.com.br)

---

## 🔧 **ARQUIVOS QUE VAMOS CRIAR:**

1. **docker-compose.prod.yml** - Configuração dos containers
2. **nginx.conf** - Configuração do Nginx com SSL
3. **.env** - Variáveis de ambiente
4. **Scripts de deploy** - Para automatizar o processo

---

## 📋 **INFORMAÇÕES NECESSÁRIAS:**

Para configurar corretamente, preciso saber:

1. **Qual é o seu domínio principal?** (exemplo: seudominio.com.br)
2. **Qual subdomínio quer usar para o sistema?** (exemplo: embarcacoes.seudominio.com.br)
3. **Qual subdomínio quer usar para o n8n?** (exemplo: n8n.seudominio.com.br)

**Me informe esses dados e vamos começar a configuração! 🚀**

