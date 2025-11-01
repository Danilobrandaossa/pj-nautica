# Script simples para upload
$SERVER_IP = "145.223.93.235"
$SERVER_USER = "root"
$SERVER_PATH = "/opt/embarcacoes"

Write-Host "Fazendo upload dos arquivos..." -ForegroundColor Green

# Upload dos diretorios principais
scp -r backend "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
scp -r frontend "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
scp -r nginx "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"

# Upload dos arquivos de configuracao
scp docker-compose.yml "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
scp docker-compose.prod.yml "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
scp env.production "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env"

# Upload dos scripts
scp prepare-server.sh "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
scp start-deploy.sh "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"

# Configurar permissoes
ssh "${SERVER_USER}@${SERVER_IP}" "chmod +x ${SERVER_PATH}/prepare-server.sh ${SERVER_PATH}/start-deploy.sh"

Write-Host "Upload concluido!" -ForegroundColor Green
Write-Host "Conecte ao servidor: ssh ${SERVER_USER}@${SERVER_IP}"
Write-Host "Execute: cd ${SERVER_PATH} && ./start-deploy.sh"
