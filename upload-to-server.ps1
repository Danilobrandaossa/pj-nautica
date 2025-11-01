# Script PowerShell para fazer upload dos arquivos para o servidor
# Execute este script do seu computador local

Write-Host "📤 Fazendo upload dos arquivos para o servidor..." -ForegroundColor Green

# Configurações do servidor
$SERVER_IP = "145.223.93.235"
$SERVER_USER = "root"
$SERVER_PATH = "/opt/embarcacoes"

# Função para log
function Write-Log {
    param($Message, $Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Verificar se SCP está disponível (via OpenSSH)
try {
    scp -V 2>$null
    Write-Log "SCP disponível"
} catch {
    Write-Error "SCP não está disponível. Instale OpenSSH ou use WSL."
}

# Criar arquivo temporário com lista de arquivos para excluir
$excludeFile = "exclude-list.txt"
@"
node_modules
.git
.env
*.log
dist
build
.idea
.vscode
*.tmp
*.temp
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

Write-Log "Fazendo upload dos arquivos do projeto"

# Fazer upload dos arquivos principais
$filesToUpload = @(
    "backend",
    "frontend", 
    "nginx",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "env.production",
    "prepare-server.sh",
    "start-deploy.sh",
    "upload-instructions.md"
)

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        Write-Log "Enviando $file"
        scp -r $file "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"
    } else {
        Write-Warning "Arquivo $file nao encontrado"
    }
}

# Fazer upload do arquivo de configuração como .env
Write-Log "Configurando arquivo .env"
scp env.production "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env"

# Tornar scripts executáveis
Write-Log "Configurando permissoes dos scripts"
ssh "${SERVER_USER}@${SERVER_IP}" "chmod +x ${SERVER_PATH}/prepare-server.sh ${SERVER_PATH}/start-deploy.sh"

# Limpar arquivo temporário
Remove-Item $excludeFile -ErrorAction SilentlyContinue

Write-Log "Upload concluido com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Info "🌐 Próximos passos:"
Write-Host "1. Conecte ao servidor: ssh ${SERVER_USER}@${SERVER_IP}"
Write-Host "2. Execute: cd ${SERVER_PATH}"
Write-Host "3. Execute: ./start-deploy.sh"
Write-Host ""
Write-Info "📊 Para monitorar o deploy:"
Write-Host "   ssh ${SERVER_USER}@${SERVER_IP} 'cd ${SERVER_PATH} && docker-compose -f docker-compose.prod.yml logs -f'"
