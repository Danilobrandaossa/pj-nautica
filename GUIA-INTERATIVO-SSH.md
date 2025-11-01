# 🛠️ Guia Interativo - Execute Comigo

Vou te guiar passo a passo! Siga as instruções abaixo:

---

## **INSTRUÇÕES GERAIS**

1. Você deve estar conectado via SSH no servidor (o terminal que você já abriu)
2. Copie e cole **UM BLOCO** por vez
3. Cole a **SAÍDA COMPLETA** de volta aqui
4. Eu vou te dar o próximo passo

---

## **BLOCO 1 - Verificar Sistema**

```bash
echo "=== VERIFICANDO SISTEMA ==="
whoami
hostname
cat /etc/os-release | grep PRETTY
free -h
df -h /
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 2 - Atualizar Sistema**

```bash
echo "=== ATUALIZANDO SISTEMA ==="
sudo apt update && sudo apt upgrade -y
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 3 - Instalar Docker**

```bash
echo "=== INSTALANDO DOCKER ==="
sudo apt install docker.io docker-compose git -y
sudo systemctl enable docker
sudo systemctl start docker
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 4 - Verificar Instalações**

```bash
echo "=== VERIFICANDO INSTALAÇÕES ==="
docker --version
docker compose version
git --version
systemctl status docker --no-pager
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 5 - Configurar Firewall**

```bash
echo "=== CONFIGURANDO FIREWALL ==="
sudo timedatectl set-timezone America/Sao_Paulo
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 6 - Preparar Diretório**

```bash
echo "=== PREPARANDO DIRETÓRIO ==="
cd /opt
ls -la
mv embarcacoes embarcacoes.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Diretório não existe"
mkdir -p embarcacoes && cd embarcacoes
pwd
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 7 - Clonar Repositório**

```bash
echo "=== CLONANDO REPOSITÓRIO ==="
git clone https://github.com/Danilobrandaossa/pj-nautica.git .
ls -la
```

**Cole a saída completa aqui e diga "Próximo"**

---

## **BLOCO 8 - Configurar .env**

```bash
echo "=== CONFIGURANDO .env ==="
cp backend/ENV.EXAMPLE .env
cat .env
```

**Cole a saída completa aqui**

**IMPORTANTE:** Vou te dar os valores corretos para o .env baseado na saída acima.

---

## **E assim por diante...**

Vou te guiar até o final! 🚀

---

**Comece pelo BLOCO 1 acima!**


