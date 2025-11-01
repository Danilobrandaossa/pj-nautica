# 🔧 Corrigir Erro 404 - Nginx não está roteando corretamente

## 🔍 Diagnóstico

O erro 404 que você está vendo indica que:
- O Nginx está respondendo (nginx/1.18.0 Ubuntu)
- Mas está mostrando o **Nginx do sistema**, não o **container Nginx**
- Ou o container Nginx não está configurado corretamente

## ✅ Solução Rápida

### Opção 1: Usar o Script Automático

No servidor, execute:

```bash
ssh root@145.223.93.235
cd /opt/embarcacoes
curl -fsSL https://raw.githubusercontent.com/SEU-REPO/main/fix-nginx-404.sh | bash
```

Ou faça upload do arquivo `fix-nginx-404.sh` e execute:

```bash
scp fix-nginx-404.sh root@145.223.93.235:/tmp/
ssh root@145.223.93.235 'bash /tmp/fix-nginx-404.sh'
```

### Opção 2: Correção Manual

#### 1. Parar Nginx do Sistema (se estiver rodando)

```bash
ssh root@145.223.93.235
systemctl stop nginx
systemctl disable nginx
```

#### 2. Verificar Containers

```bash
cd /opt/embarcacoes
docker-compose -f docker-compose.prod.yml ps
```

Todos devem estar "Up":
- ✅ embarcacoes_nginx_prod
- ✅ embarcacoes_frontend_prod
- ✅ embarcacoes_backend_prod
- ✅ embarcacoes_db_prod

#### 3. Verificar Configuração do Nginx

```bash
cd /opt/embarcacoes
cat nginx/nginx.conf
```

Deve ter configuração de `proxy_pass` para frontend e backend.

Se não existir, crie:

```bash
mkdir -p nginx
nano nginx/nginx.conf
```

Cole a configuração do arquivo `fix-nginx-404.sh` (seção 4).

#### 4. Reiniciar Container Nginx

```bash
docker-compose -f docker-compose.prod.yml restart nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

#### 5. Verificar Portas

```bash
# Verificar se porta 80 está sendo usada pelo container
docker ps | grep nginx
docker port embarcacoes_nginx_prod

# Verificar se Nginx do sistema não está usando porta 80
netstat -tuln | grep ":80"
```

O container Nginx deve ter `0.0.0.0:80->80/tcp`.

#### 6. Testar Internamente

```bash
# Testar se frontend responde
docker exec embarcacoes_frontend_prod wget -q -O- http://localhost/

# Testar se backend responde
docker exec embarcacoes_backend_prod wget -q -O- http://localhost:3001/health

# Testar se nginx consegue alcançar frontend
docker exec embarcacoes_nginx_prod ping -c 1 frontend
docker exec embarcacoes_nginx_prod ping -c 1 backend
```

## 🔍 Verificações Adicionais

### Verificar Logs dos Containers

```bash
cd /opt/embarcacoes

# Logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Logs do Frontend
docker-compose -f docker-compose.prod.yml logs frontend

# Logs do Backend
docker-compose -f docker-compose.prod.yml logs backend
```

### Verificar docker-compose.prod.yml

```bash
cd /opt/embarcacoes
cat docker-compose.prod.yml | grep -A 10 nginx
```

O serviço `nginx` deve ter:
- Porta `"80:80"` mapeada
- Volume `./nginx/nginx.conf:/etc/nginx/nginx.conf:ro`
- Dependência de `backend` e `frontend`

### Rebuild Completo (se necessário)

```bash
cd /opt/embarcacoes
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml logs -f
```

## ✅ Resultado Esperado

Após a correção:

1. ✅ Acessar `http://145.223.93.235` deve mostrar o frontend
2. ✅ Acessar `http://145.223.93.235/api/health` deve mostrar status do backend
3. ✅ Não deve aparecer mais erro 404
4. ✅ Container Nginx deve estar usando porta 80

## 🚨 Problemas Comuns

### Porta 80 já em uso pelo Nginx do sistema

**Solução:**
```bash
systemctl stop nginx
systemctl disable nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Container Nginx não está rodando

**Solução:**
```bash
cd /opt/embarcacoes
docker-compose -f docker-compose.prod.yml up -d nginx
docker-compose -f docker-compose.prod.yml ps nginx
```

### Configuração do Nginx incorreta

**Solução:** Recrie a configuração (veja seção 4 do script ou opção 2 acima).

### Containers não estão na mesma rede

**Solução:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Ainda com problemas?

Execute diagnóstico completo:

```bash
cd /opt/embarcacoes
./check-server.sh
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50
```


