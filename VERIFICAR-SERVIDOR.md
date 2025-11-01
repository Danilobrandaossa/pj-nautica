# 🔍 Como Verificar se o Servidor VPS Está Pronto

## 📋 Checklist Rápido

Execute os comandos abaixo no servidor para verificar se está tudo configurado:

### 1. Conectar ao Servidor

```bash
ssh root@145.223.93.235
```

### 2. Executar Script de Verificação Automática

**Opção A: Upload via SCP (Recomendado)**
```bash
# Do seu computador local
scp check-server.sh root@145.223.93.235:/tmp/

# No servidor
ssh root@145.223.93.235
bash /tmp/check-server.sh
```

**Opção B: Copiar conteúdo do script**
```bash
# Conectar ao servidor
ssh root@145.223.93.235

# Criar arquivo
nano check-server.sh
# (Cole o conteúdo do arquivo check-server.sh do projeto)
# Salve com Ctrl+X, Y, Enter

# Dar permissão de execução
chmod +x check-server.sh

# Executar
./check-server.sh
```

## ✅ Verificações Manuais (Se preferir)

Se não quiser usar o script, verifique manualmente:

### 1. Docker instalado?
```bash
docker --version
docker ps
```
✅ Deve mostrar versão do Docker e lista de containers

### 2. Docker Compose instalado?
```bash
docker-compose --version
# ou
docker compose version
```
✅ Deve mostrar versão do Docker Compose

### 3. Diretório do projeto existe?
```bash
ls -la /opt/embarcacoes
```
✅ Deve existir o diretório

### 4. Arquivo docker-compose.prod.yml existe?
```bash
ls -la /opt/embarcacoes/docker-compose.prod.yml
```
✅ Arquivo deve existir

### 5. Arquivo .env configurado?
```bash
cd /opt/embarcacoes
ls -la .env
cat .env | grep -E "POSTGRES_PASSWORD|JWT_SECRET|FRONTEND_URL"
```
✅ Deve existir e ter valores configurados (não vazios)

### 6. Estrutura de diretórios
```bash
cd /opt/embarcacoes
ls -la nginx/
mkdir -p nginx/ssl certbot/conf certbot/www
```
✅ Diretórios devem existir

### 7. Docker rodando?
```bash
systemctl status docker
```
✅ Deve estar "active (running)"

### 8. Portas disponíveis?
```bash
netstat -tuln | grep -E ":80|:443|:5432"
# ou
ss -tuln | grep -E ":80|:443|:5432"
```
✅ Portas devem estar abertas ou disponíveis

### 9. Espaço em disco
```bash
df -h
```
✅ Deve ter pelo menos 5GB livre

### 10. Memória disponível
```bash
free -h
```
✅ Recomendado: pelo menos 1GB RAM disponível

## 🚨 Problemas Comuns e Soluções

### ❌ Docker não está instalado

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
```

### ❌ Docker Compose não está instalado

```bash
apt update
apt install docker-compose -y
```

### ❌ Diretório não existe

```bash
mkdir -p /opt/embarcacoes
chown -R $USER:$USER /opt/embarcacoes
```

### ❌ Arquivo .env não existe

```bash
cd /opt/embarcacoes
cp env.production.example .env
nano .env
# Configure as variáveis necessárias
```

### ❌ Permissões incorretas

```bash
chown -R $USER:$USER /opt/embarcacoes
chmod 755 /opt/embarcacoes
```

## 📊 Status Esperado

Após todas as verificações, você deve ter:

- ✅ Docker instalado e rodando
- ✅ Docker Compose instalado
- ✅ Diretório `/opt/embarcacoes` criado
- ✅ Arquivo `docker-compose.prod.yml` presente
- ✅ Arquivo `.env` configurado com todas as variáveis
- ✅ Diretórios `nginx/`, `certbot/` criados
- ✅ Portas 80, 443 disponíveis
- ✅ Espaço em disco e memória suficientes

## 🎯 Próximos Passos

Após confirmar que o servidor está pronto:

1. Configure os secrets no GitHub (veja `DEPLOY-GITHUB.md`)
2. Faça push do código para o repositório
3. O GitHub Actions fará o deploy automaticamente

## 📞 Precisa de Ajuda?

Se encontrar problemas, o script `check-server.sh` mostrará exatamente o que está faltando e como corrigir.


