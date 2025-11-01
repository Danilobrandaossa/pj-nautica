# 🚨 URGENTE - RECUPERAR SISTEMA

## ❓ Problema: Sistema Fora do Ar

Se o sistema saiu do ar, execute estes comandos **IMEDIATAMENTE** no servidor:

---

## ⚡ COMANDOS RÁPIDOS DE EMERGÊNCIA

### 1. Conectar ao Servidor

```bash
ssh root@srv1095801
cd /opt/embarcacoes
```

---

### 2. Verificar Status Atual

```bash
# Ver containers rodando
docker ps -a

# Ver logs recentes
docker logs embarcacoes_backend_prod --tail=50
docker logs embarcacoes_nginx_prod --tail=50
docker logs embarcacoes_db_prod --tail=50
```

---

### 3. Tentar Restart Simples

```bash
# Tentar restart de todos os containers
cd /opt/embarcacoes
docker compose -f docker-compose.prod.yml restart

# Aguardar 30 segundos
sleep 30

# Verificar se voltou
curl http://localhost:3001/health
```

---

### 4. Se Não Voltar, Rebuild

```bash
# Fazer pull do código
git pull origin main

# Rebuild e restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Aguardar inicialização
sleep 30

# Verificar
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

### 5. Verificar Banco de Dados

```bash
# Verificar se banco está rodando
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "SELECT 1;"

# Se retornar erro, banco pode estar corrompido
# Restaurar do backup mais recente
ls -lh backups/
docker exec -i embarcacoes_db_prod psql -U embarcacoes embarcacoes_db < backups/backup_YYYYMMDD_HHMMSS.sql
```

---

### 6. Verificar DNS e Rede

```bash
# Testar DNS
nslookup app.infinitynautica.com.br

# Testar conectividade
curl -I https://app.infinitynautica.com.br
curl -I http://app.infinitynautica.com.br

# Verificar firewall
sudo ufw status
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

### Se containers não estão rodando:

```bash
# Ver todos os containers (parados)
docker ps -a | grep embarcacoes

# Ver logs de erro
docker inspect embarcacoes_backend_prod | grep -A 10 "State"
docker inspect embarcacoes_nginx_prod | grep -A 10 "State"
docker inspect embarcacoes_db_prod | grep -A 10 "State"
```

### Se banco não está conectando:

```bash
# Verificar volume do banco
docker volume ls | grep postgres

# Verificar permissões
docker exec embarcacoes_db_prod ls -la /var/lib/postgresql/data

# Verificar logs específicos
docker logs embarcacoes_db_prod 2>&1 | grep -i error
```

### Se frontend não carrega:

```bash
# Verificar build do frontend
docker exec embarcacoes_frontend_prod ls -la /usr/share/nginx/html

# Verificar nginx.conf
docker exec embarcacoes_nginx_prod nginx -t

# Ver logs nginx
docker logs embarcacoes_nginx_prod --tail=100 | grep -i error
```

---

## 🛠️ RESTAURAÇÃO COMPLETA

Se nada funcionar, fazer restore completo:

```bash
# 1. Backup do estado atual (se possível)
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db > backup_emergencia.sql

# 2. Parar tudo
docker compose -f docker-compose.prod.yml down

# 3. Limpar volumes (CAREFUL!)
# docker compose -f docker-compose.prod.yml down -v  # SÓ SE NECESSÁRIO

# 4. Pull código mais recente
git pull origin main

# 5. Rebuild completo
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 6. Aguardar
sleep 30

# 7. Aplicar migrations
docker exec embarcacoes_backend_prod npx prisma migrate deploy

# 8. Restaurar backup
docker exec -i embarcacoes_db_prod psql -U embarcacoes embarcacoes_db < backup_emergencia.sql

# 9. Verificar
docker ps | grep embarcacoes
curl http://localhost:3001/health
```

---

## 📞 VERIFICAÇÃO PASSO A PASSO

Execute na ordem:

```bash
echo "=== PASSO 1: Containers ==="
docker ps | grep embarcacoes

echo ""
echo "=== PASSO 2: Health ==="
curl -I http://localhost:3001/health

echo ""
echo "=== PASSO 3: Banco ==="
docker exec embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db -c "SELECT COUNT(*) FROM users;"

echo ""
echo "=== PASSO 4: Migrations ==="
docker exec embarcacoes_backend_prod npx prisma migrate status

echo ""
echo "=== PASSO 5: Logs ==="
docker logs embarcacoes_backend_prod --tail=20 | grep -i error || echo "✅ Sem erros"

echo ""
echo "=== PASSO 6: Frontend ==="
curl -I http://localhost/ | head -1
```

---

## 🆘 SE NADA FUNCIONAR

**Contatar suporte com estes dados:**

```bash
# Sistema
uname -a
docker --version
docker compose version

# Disco
df -h

# RAM
free -h

# Logs completos
docker logs embarcacoes_backend_prod > backend.log
docker logs embarcacoes_frontend_prod > frontend.log
docker logs embarcacoes_db_prod > database.log
docker logs embarcacoes_nginx_prod > nginx.log

# Enviar logs
tar -czf logs_emergencia.tar.gz *.log
```

---

## ⏱️ TEMPO ESTIMADO DE RECUPERAÇÃO

- **Restart simples:** 2-5 minutos
- **Rebuild completo:** 10-20 minutos
- **Restore do backup:** 5-10 minutos
- **Configuração do zero:** 30-60 minutos

---

**Execute os comandos urgentes acima primeiro!**

