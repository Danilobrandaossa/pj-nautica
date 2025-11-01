# 🔐 Configurar Acesso SSH sem Senha

Para o GitHub Actions fazer deploy, você precisa configurar autenticação SSH via chave.

## 📋 Opção 1: Gerar Nova Chave SSH (Recomendado)

### No seu computador local:

```powershell
# Gerar nova chave SSH dedicada para deploy
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f $HOME\.ssh\github_deploy

# Ou no Git Bash:
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

Isso criará dois arquivos:
- `github_deploy` (chave PRIVADA - para GitHub Secrets)
- `github_deploy.pub` (chave PÚBLICA - para o servidor)

### Adicionar chave pública no servidor:

**Opção A: Via SSH com senha (primeira vez)**
```bash
# Copiar conteúdo da chave pública
cat ~/.ssh/github_deploy.pub
# ou no Windows
Get-Content $HOME\.ssh\github_deploy.pub

# Conectar ao servidor (com senha)
ssh root@145.223.93.235

# No servidor, adicionar a chave
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "COLE_A_CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

**Opção B: Usando ssh-copy-id (Linux/WSL)**
```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub root@145.223.93.235
```

**Opção C: Manual via PowerShell**
```powershell
# Ler chave pública
$pubKey = Get-Content $HOME\.ssh\github_deploy.pub

# Conectar e adicionar (será solicitada senha uma vez)
$pubKey | ssh root@145.223.93.235 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Adicionar chave privada no GitHub:

1. Ler a chave privada:
```powershell
Get-Content $HOME\.ssh\github_deploy
```

2. No GitHub:
   - Vá para: **Settings** → **Secrets and variables** → **Actions**
   - Crie secret: `VPS_SSH_PRIVATE_KEY`
   - Cole o conteúdo COMPLETO da chave privada (incluindo `-----BEGIN RSA PRIVATE KEY-----` e `-----END RSA PRIVATE KEY-----`)

### Testar conexão:

```powershell
# Testar conexão com a nova chave
ssh -i $HOME\.ssh\github_deploy root@145.223.93.235

# Ou adicionar ao ssh config
# Editar: C:\Users\seu-usuario\.ssh\config
# Adicionar:
Host embarcacoes-vps
    HostName 145.223.93.235
    User root
    IdentityFile ~/.ssh/github_deploy

# Depois usar:
ssh embarcacoes-vps
```

## 📋 Opção 2: Usar Chave SSH Existente

Se você já tem uma chave SSH:

```powershell
# Ver chaves existentes
ls ~/.ssh/*.pub

# Usar uma existente (ex: id_rsa.pub)
cat ~/.ssh/id_rsa.pub
# Copiar e adicionar no servidor como acima
```

## 📋 Opção 3: Configurar Autenticação por Senha (Temporário)

Se precisar acessar agora sem configurar chave:

1. Conecte com senha normalmente:
```bash
ssh root@145.223.93.235
# Digite a senha quando solicitado
```

2. No servidor, faça upload do script manualmente:
```bash
# Criar script direto no servidor
nano /tmp/check-server.sh
# (Cole o conteúdo do arquivo check-server.sh)
chmod +x /tmp/check-server.sh
bash /tmp/check-server.sh
```

Ou copie o arquivo via SFTP/FTP cliente.

## ✅ Verificar se funcionou

Após configurar, teste:

```bash
# Deve conectar sem pedir senha
ssh -i ~/.ssh/github_deploy root@145.223.93.235

# Ou se configurou no ssh config:
ssh embarcacoes-vps
```

## 🚨 Troubleshooting

### "Permission denied (publickey)"

**Causa:** Chave pública não está no servidor ou permissões incorretas

**Solução:**
```bash
# No servidor
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### "Too many authentication failures"

**Solução:** Especifique a chave explicitamente
```bash
ssh -i ~/.ssh/github_deploy -o IdentitiesOnly=yes root@145.223.93.235
```

### Servidor não aceita conexão

**Verificar:**
- Firewall permite porta 22?
- Serviço SSH está rodando?
- IP correto?

```bash
# No servidor
systemctl status ssh
netstat -tuln | grep :22
```


