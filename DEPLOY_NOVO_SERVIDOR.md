# Guia de Deploy em Novo Servidor (Ubuntu 22.04)

Este documento descreve, passo a passo, como subir este projeto do zero em um novo servidor Ubuntu 22.04 (com Docker), do provisionamento à verificação final.

## 0) Pré‑requisitos
- VPS Ubuntu 22.04 x64 (mínimo: 2 vCPU, 2 GB RAM)
- Domínio/subdomínio (ex.: `app.seudominio.com`) apontado via DNS A para o IP da VPS
- Portas 80 e 443 liberadas no provedor e no firewall local

## 1) Acesso inicial e segurança básica
```bash
ssh root@SEU_IP
apt update && apt -y upgrade
apt -y install ca-certificates curl git ufw

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2) Instalar Docker e Docker Compose Plugin
```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

## 3) Clonar o projeto
```bash
cd /opt
git clone https://github.com/Danilobrandaossa/pj-nautica.git embarcacoes
cd /opt/embarcacoes
```

## 4) Configurar variáveis (.env)
Crie o arquivo `.env` na raiz de `/opt/embarcacoes`:
```bash
cat > /opt/embarcacoes/.env << 'EOF'
# Banco
POSTGRES_USER=embarcacoes
POSTGRES_PASSWORD=defina-um-segredo-forte
POSTGRES_DB=embarcacoes_db

# JWT
JWT_SECRET=coloque_um_segredo_muito_forte
JWT_REFRESH_SECRET=coloque_um_segredo_refresh_muito_forte

# Frontend/Backend
FRONTEND_URL=https://app.seudominio.com
VITE_API_URL=https://app.seudominio.com/api

# n8n (opcional)
N8N_USER=admin
N8N_PASSWORD=defina_um_segredo
N8N_HOST=n8n.seudominio.com.br
N8N_WEBHOOK_URL=
EOF
```
Observações:
- `FRONTEND_URL` deve ser HTTPS com o domínio final.
- `VITE_API_URL` deve apontar para `https://SEU_DOMINIO/api`.

## 5) Configurar Nginx do projeto (container)
Use a versão com SSL do repositório:
```bash
cd /opt/embarcacoes
cp nginx/nginx.conf.ssl nginx/nginx.conf
```
Confirme `server_name` em `nginx/nginx.conf.ssl` e ajuste para o seu domínio.

## 6) Primeira subida (sem certificado)
```bash
docker compose -f docker-compose.prod.yml up -d
docker ps
```
Aguarde o Postgres e o backend ficarem “healthy”.

## 7) Emitir/Ativar SSL (Let's Encrypt via webroot)
```bash
docker run --rm \
  -v /opt/embarcacoes/certbot/conf:/etc/letsencrypt \
  -v /opt/embarcacoes/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d app.seudominio.com --agree-tos -m seu-email@dominio.com --no-eff-email
```
Recrie o Nginx:
```bash
docker compose -f docker-compose.prod.yml up -d --build nginx
docker exec embarcacoes_nginx_prod nginx -t && docker exec embarcacoes_nginx_prod nginx -s reload
```

## 8) Build final
```bash
cd /opt/embarcacoes
docker compose -f docker-compose.prod.yml up -d --build
```

## 9) Testes rápidos
```bash
# DNS
dig +short app.seudominio.com

# Backend health (externo)
curl -I https://app.seudominio.com/api/health

# Página inicial
curl -I https://app.seudominio.com/

# Nginx
docker exec embarcacoes_nginx_prod nginx -t && docker exec embarcacoes_nginx_prod nginx -s reload

docker logs --tail=200 embarcacoes_nginx_prod
docker logs --tail=200 embarcacoes_backend_prod
```
Se usar Cloudflare: SSL/TLS “Full”, proxy laranja e purge de cache após deploy.

## 10) Configurações no app (pós‑deploy)
- Acesse `https://app.seudominio.com/login` e entre como admin.
- Em “Configurações → Identidade do Sistema” defina o nome do sistema e, se quiser, o PWA.
- Se o navegador mantiver Service Worker antigo, use DevTools → Application → Service Workers → Unregister e recarregue.

## 11) Próximos deploys
```bash
cd /opt/embarcacoes
git pull
docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx
```
Se editar Nginx:
```bash
docker exec embarcacoes_nginx_prod nginx -t && docker exec embarcacoes_nginx_prod nginx -s reload
```

## 12) Backup e Restore (PostgreSQL)
Backup:
```bash
mkdir -p /opt/backups
docker exec embarcacoes_db_prod pg_dump -U embarcacoes embarcacoes_db | gzip > /opt/backups/backup_$(date +%F_%H%M).sql.gz
```
Restore:
```bash
gunzip -c /opt/backups/backup_YYYY-MM-DD_HHMM.sql.gz | \
  docker exec -i embarcacoes_db_prod psql -U embarcacoes -d embarcacoes_db
```

## 13) Troubleshooting rápido
- 429 (Too Many Requests) no início: mantemos bypass de rate limit para `/api/pwa`, `/api/health` e `/api/csrf-token`.
- SW/Manifest: Unregister SW e hard refresh; confirme `FRONTEND_URL`/`VITE_API_URL`.
- Mixed content: garanta `VITE_API_URL=https://.../api` no build do frontend.
- Certificado: valide com `openssl s_client -connect app.seudominio.com:443 -servername app.seudominio.com`.

## 14) Comandos úteis
```bash
# ver containers
docker ps

# logs
docker logs -f embarcacoes_backend_prod
docker logs -f embarcacoes_nginx_prod

# rebuild de um serviço específico
docker compose -f docker-compose.prod.yml up -d --build backend

# entrar no backend
docker exec -it embarcacoes_backend_prod sh
```

---

Dúvidas ou erros durante o processo: valide DNS, `.env`, e os logs dos containers (`backend` e `nginx`).

## 15) Atualizações Importantes (2025-11)

- API e Frontend devem falar sempre em HTTPS. Garanta no `.env`:
  - `VITE_API_URL=https://SEU_DOMINIO/api` (NUNCA http)

- Rate Limiting: desabilitado por padrão no backend a pedido do cliente. Se quiser reativar futuramente, ajuste `backend/src/server.ts` e `backend/src/routes/auth.routes.ts` conforme necessidade.

- Service Worker (PWA): registro desativado temporariamente no frontend para estabilidade de login. Quando desejar reativar, ajuste `frontend/src/main.tsx` e recrie o frontend.

- Rebuild rápido apenas do frontend:
```bash
cd /opt/embarcacoes
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

- Rebuild rápido apenas do backend:
```bash
cd /opt/embarcacoes
docker compose -f docker-compose.prod.yml up -d --build backend
```

- Limpeza de cache do navegador (após qualquer troca de SW/manifest):
  1) DevTools → Application → Service Workers → Unregister
  2) Application → Clear storage → Clear site data
  3) Hard refresh (Ctrl+F5)

- 429 (Too Many Requests): não deve ocorrer com rate limiting desativado. Se reativar limites e ocorrer 429, eleve `RATE_LIMIT_MAX_REQUESTS` no `.env` e recrie o backend.

- Loop/reload na página de login: a tela já busca o nome do app no endpoint público `/api/pwa/manifest.json` para evitar 401. Se reativar chamadas autenticadas no login, garanta que não há redirecionamento para `/login` em caso de 401.
