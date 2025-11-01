# 🚀 Instruções de Deploy - Sistema de Embarcações

## Passo a Passo Completo

### 1. Preparar o Servidor
Execute no servidor VPS:
```bash
# Conectar ao servidor
ssh root@145.223.93.235

# Executar script de preparação
curl -fsSL https://raw.githubusercontent.com/seu-usuario/embarcacoes/main/deploy-script.sh | bash
```

### 2. Fazer Upload dos Arquivos

#### Opção A: Usando SCP (Recomendado)
```bash
# Do seu computador local, execute:
scp -r . root@145.223.93.235:/opt/embarcacoes/
```

#### Opção B: Usando rsync
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' . root@145.223.93.235:/opt/embarcacoes/
```

#### Opção C: Usando Git (se o projeto estiver no GitHub)
```bash
# No servidor:
cd /opt/embarcacoes
git clone https://github.com/seu-usuario/embarcacoes.git .
```

### 3. Configurar Variáveis de Ambiente
```bash
# No servidor:
cd /opt/embarcacoes
cp env.production .env
# Editar o arquivo .env se necessário
nano .env
```

### 4. Iniciar a Aplicação
```bash
# No servidor:
cd /opt/embarcacoes
chmod +x start-deploy.sh
./start-deploy.sh
```

### 5. Verificar se Está Funcionando
```bash
# Verificar containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Testar endpoints
curl http://145.223.93.235/api/health
curl http://145.223.93.235
```

## URLs de Acesso

- **Frontend**: http://145.223.93.235
- **Backend API**: http://145.223.93.235/api
- **n8n**: http://145.223.93.235:5678

## Comandos Úteis

### Parar a aplicação:
```bash
docker-compose -f docker-compose.prod.yml down
```

### Reiniciar a aplicação:
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Ver logs em tempo real:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Acessar container do backend:
```bash
docker-compose -f docker-compose.prod.yml exec backend bash
```

### Executar comandos do Prisma:
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

## Estrutura do Projeto no Servidor

```
/opt/embarcacoes/
├── backend/
├── frontend/
├── nginx/
├── docker-compose.prod.yml
├── .env
├── deploy-script.sh
└── start-deploy.sh
```

## Troubleshooting

### Se algum container não subir:
```bash
docker-compose -f docker-compose.prod.yml logs [nome-do-container]
```

### Se o banco não conectar:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U embarcacoes -d embarcacoes_db
```

### Para rebuild completo:
```bash
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d --build
```
