# 🔒 Guia Completo: Ativar SSL/HTTPS no Infinity Náutica

## 🎯 Objetivo

Ativar HTTPS com Let's Encrypt SSL, redirecionar todo tráfego HTTP para HTTPS e garantir que o site seja servido com segurança.

---

## ⚠️ IMPORTANTE: Status Atual

**Problema:** O nginx está rodando apenas em HTTP  
**Impacto:** Site marcado como "Not Secure" pelo navegador  
**Prioridade:** CRÍTICA  

---

## 📋 Pré-requisitos

1. ✅ Domínio apontando para o servidor VPS
2. ✅ Porta 80 aberta no firewall
3. ✅ Docker e Docker Compose instalados
4. ✅ Certbot já está no docker-compose.prod.yml

---

## 🔧 MÉTODO 1: Usando Certbot Automático (Recomendado)

### Passo 1: Verificar Domínio

```bash
# Testar se domínio aponta para o servidor
ping app.infinitynautica.com.br

# Verificar DNS
nslookup app.infinitynautica.com.br
```

### Passo 2: Verificar Certificados Existentes

```bash
# Verificar se já existem certificados
docker exec embarcacoes_certbot certbot certificates

# Listar arquivos de certificado
ls -la certbot/conf/live/
```

**Se já existem certificados válidos:** Pule para Passo 4.  
**Se não existem ou estão expirados:** Continue no Passo 3.

---

### Passo 3: Gerar Novos Certificados

```bash
# Opção A: Standalone (para primeira vez)
# Parar nginx temporariamente
docker compose -f docker-compose.prod.yml stop nginx

# Gerar certificado standalone
docker run -it --rm \
  -v /opt/embarcacoes/certbot/conf:/etc/letsencrypt \
  -v /opt/embarcacoes/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email danilo@danilobrandao.com.br \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d app.infinitynautica.com.br

# Verificar certificados gerados
ls -la certbot/conf/live/app.infinitynautica.com.br/

# Voltar nginx
docker compose -f docker-compose.prod.yml start nginx
```

**Ou Opção B: Webroot (se nginx já estiver rodando):**

```bash
# Certbot já tem volume montado no docker-compose
docker exec embarcacoes_certbot certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email danilo@danilobrandao.com.br \
  --agree-tos \
  --no-eff-email \
  -d app.infinitynautica.com.br

# Verificar
docker exec embarcacoes_certbot certbot certificates
```

---

### Passo 4: Ativar HTTPS no Nginx

**CRÍTICO:** Antes de fazer isso, certifique-se de que os certificados existem!

```bash
# Backup do nginx.conf atual
cp nginx/nginx.conf nginx/nginx.conf.backup

# Descommentar bloco HTTPS
sed -i 's/#     listen 443 ssl http2;/    listen 443 ssl http2;/g' nginx/nginx.conf
sed -i 's/#     server_name/    server_name/g' nginx/nginx.conf
sed -i 's/#     # SSL certificates/    # SSL certificates/g' nginx/nginx.conf
# ... (ou fazer manualmente)

# CONSULTAR ARQUIVO COMPLETO: nginx/nginx.conf.ssl
```

**Melhor:** Use o arquivo pré-configurado:

```bash
# Copiar configuração SSL pré-feita
cp nginx/nginx.conf.ssl nginx/nginx.conf

# OU fazer manualmente (ver seção abaixo)
```

---

### Passo 5: Rebuild e Reiniciar Nginx

```bash
# Rebuild nginx com nova configuração
docker compose -f docker-compose.prod.yml up -d --build nginx

# Verificar logs
docker logs embarcacoes_nginx_prod --tail=50

# Verificar status
docker ps | grep nginx
```

---

### Passo 6: Testar HTTPS

```bash
# Testar certificado
curl -I https://app.infinitynautica.com.br

# Verificar redirect HTTP->HTTPS
curl -I http://app.infinitynautica.com.br

# Testar SSL Labs (opcional)
# Abrir: https://www.ssllabs.com/ssltest/analyze.html?d=app.infinitynautica.com.br
```

**Resultado Esperado:**
- HTTP 301 redirect para HTTPS
- HTTPS 200 OK
- Cadeado verde no navegador

---

### Passo 7: Verificar Auto-Renewal

```bash
# Verificar renovação automática
docker logs embarcacoes_certbot --tail=50

# Testar renew (dry-run)
docker exec embarcacoes_certbot certbot renew --dry-run

# Verificar cron job no container
docker exec embarcacoes_certbot cat /etc/crontabs/root
```

---

## 📝 nginx.conf HTTPS Completo

Se preferir ativar manualmente, aqui está a configuração completa:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json 
               application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    # Upstreams
    upstream backend {
        server embarcacoes_backend_prod:3001;
    }

    upstream frontend {
        server embarcacoes_frontend_prod:80;
    }

    upstream n8n {
        server embarcacoes_n8n_prod:5678;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name app.infinitynautica.com.br;

        # ACME challenge para certbot
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect tudo para HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name app.infinitynautica.com.br;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/app.infinitynautica.com.br/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/app.infinitynautica.com.br/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Client max body size
        client_max_body_size 10M;

        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            access_log off;
        }

        # API backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Origin $http_origin;
            proxy_cache_bypass $http_upgrade;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Frontend
        location / {
            limit_req zone=general burst=10 nodelay;

            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

## 🔍 Troubleshooting

### Erro: "Cannot connect to the Docker daemon"

```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker
```

### Erro: "Port 80 already in use"

```bash
# Verificar o que está usando porta 80
sudo netstat -tlnp | grep :80

# Se for outro nginx, parar:
sudo systemctl stop nginx
```

### Erro: "Failed to obtain certificate"

```bash
# Verificar firewall
sudo ufw status
sudo ufw allow 80/tcp

# Verificar DNS
nslookup app.infinitynautica.com.br

# Verificar conectividade
curl -I http://app.infinitynautica.com.br
```

### Erro: "Certificate file not found"

```bash
# Verificar certificados
docker exec embarcacoes_certbot certbot certificates

# Listar arquivos
ls -la certbot/conf/live/app.infinitynautica.com.br/

# Se não existirem, gerar novamente (Passo 3)
```

### Erro: "502 Bad Gateway" após ativar HTTPS

```bash
# Verificar logs do nginx
docker logs embarcacoes_nginx_prod --tail=100

# Verificar sintaxe
docker exec embarcacoes_nginx_prod nginx -t

# Verificar backend e frontend
docker ps | grep embarcacoes
docker logs embarcacoes_backend_prod --tail=50
```

### Erro: "Certificate has expired"

```bash
# Renovar certificado
docker exec embarcacoes_certbot certbot renew --force-renewal

# Rebuild nginx
docker compose -f docker-compose.prod.yml up -d --build nginx
```

---

## ✅ Checklist Final

Após completar os passos, verifique:

- [ ] HTTPS funcionando: `curl -I https://app.infinitynautica.com.br`
- [ ] HTTP redirectando: `curl -I http://app.infinitynautica.com.br`
- [ ] Cadeado verde no navegador
- [ ] Certificado válido (não expirou)
- [ ] Auto-renewal configurado
- [ ] Security headers presentes
- [ ] HSTS header ativo
- [ ] Performance OK (http2)

---

## 🎉 Resultado Esperado

Após concluir, você deve ver:

1. ✅ Site acessível via HTTPS
2. ✅ Redirect automático de HTTP para HTTPS
3. ✅ Cadeado verde no navegador
4. ✅ Nota A ou A+ no SSL Labs
5. ✅ Renovação automática a cada 90 dias

---

## 📞 Próximos Passos

Depois de ativar HTTPS:

1. Atualizar `FRONTEND_URL` no .env para HTTPS
2. Rebuild backend e frontend
3. Verificar CORS (já configurado para aceitar HTTPS)
4. Testar login e todas as funcionalidades
5. Monitorar logs por 24h

---

**Última atualização:** 02/01/2025  
**Prioridade:** CRÍTICA  
**Tempo estimado:** 15-30 minutos

