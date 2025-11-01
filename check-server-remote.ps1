# 🔍 Script PowerShell para Verificar Servidor VPS Remotamente
# Execute este script no seu computador local

param(
    [Parameter(Mandatory=$true)]
    [string]$HostIP = "145.223.93.235",
    
    [Parameter(Mandatory=$true)]
    [string]$UserName = "root"
)

Write-Host "🔍 VERIFICAÇÃO REMOTA DO SERVIDOR VPS" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Função para verificar conexão
function Test-ServerConnection {
    param([string]$IP)
    
    Write-Host "1️⃣ Testando conectividade com o servidor..." -ForegroundColor Yellow
    try {
        $ping = Test-Connection -ComputerName $IP -Count 2 -Quiet
        if ($ping) {
            Write-Host "   ✅ Servidor está acessível" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   ❌ Servidor não está acessível" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "   ❌ Erro ao verificar conectividade: $_" -ForegroundColor Red
        return $false
    }
}

# Função para executar comando SSH
function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [string]$HostIP,
        [string]$UserName
    )
    
    try {
        # Usando ssh diretamente (requer OpenSSH instalado no Windows)
        $result = ssh "${UserName}@${HostIP}" $Command 2>&1
        return $result
    } catch {
        Write-Host "   ⚠️  Erro ao executar comando remoto: $_" -ForegroundColor Yellow
        return $null
    }
}

# Verificar conectividade
if (-not (Test-ServerConnection -IP $HostIP)) {
    Write-Host "`n❌ Não foi possível conectar ao servidor. Verifique:" -ForegroundColor Red
    Write-Host "   - IP do servidor está correto?" -ForegroundColor Yellow
    Write-Host "   - Servidor está online?" -ForegroundColor Yellow
    Write-Host "   - Firewall permite conexões?" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2️⃣ Verificando Docker..." -ForegroundColor Yellow
$dockerVersion = Invoke-RemoteCommand -Command "docker --version" -HostIP $HostIP -UserName $UserName
if ($dockerVersion -and $dockerVersion -match "version") {
    Write-Host "   ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker não está instalado" -ForegroundColor Red
}

$dockerStatus = Invoke-RemoteCommand -Command "systemctl is-active docker" -HostIP $HostIP -UserName $UserName
if ($dockerStatus -eq "active") {
    Write-Host "   ✅ Docker está rodando" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Docker não está rodando" -ForegroundColor Yellow
}

Write-Host "`n3️⃣ Verificando Docker Compose..." -ForegroundColor Yellow
$composeVersion = Invoke-RemoteCommand -Command "docker-compose --version 2>/dev/null || docker compose version" -HostIP $HostIP -UserName $UserName
if ($composeVersion -and ($composeVersion -match "version" -or $composeVersion -match "compose")) {
    Write-Host "   ✅ Docker Compose instalado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker Compose não está instalado" -ForegroundColor Red
}

Write-Host "`n4️⃣ Verificando diretório do projeto..." -ForegroundColor Yellow
$projectExists = Invoke-RemoteCommand -Command "test -d /opt/embarcacoes && echo 'exists' || echo 'not found'" -HostIP $HostIP -UserName $UserName
if ($projectExists -eq "exists") {
    Write-Host "   ✅ Diretório /opt/embarcacoes existe" -ForegroundColor Green
    
    $composeExists = Invoke-RemoteCommand -Command "test -f /opt/embarcacoes/docker-compose.prod.yml && echo 'exists' || echo 'not found'" -HostIP $HostIP -UserName $UserName
    if ($composeExists -eq "exists") {
        Write-Host "   ✅ docker-compose.prod.yml encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  docker-compose.prod.yml não encontrado" -ForegroundColor Yellow
    }
    
    $envExists = Invoke-RemoteCommand -Command "test -f /opt/embarcacoes/.env && echo 'exists' || echo 'not found'" -HostIP $HostIP -UserName $UserName
    if ($envExists -eq "exists") {
        Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Arquivo .env não encontrado" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Diretório /opt/embarcacoes não existe" -ForegroundColor Red
}

Write-Host "`n5️⃣ Verificando containers..." -ForegroundColor Yellow
$containers = Invoke-RemoteCommand -Command "docker ps --format '{{.Names}}' | grep -E 'embarcacoes|postgres' | wc -l" -HostIP $HostIP -UserName $UserName
if ($containers -and [int]$containers -gt 0) {
    Write-Host "   ✅ Containers em execução: $containers" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Nenhum container do projeto em execução" -ForegroundColor Cyan
}

Write-Host "`n6️⃣ Verificando espaço em disco..." -ForegroundColor Yellow
$diskUsage = Invoke-RemoteCommand -Command "df -h / | awk 'NR==2 {print \$5}'" -HostIP $HostIP -UserName $UserName
if ($diskUsage) {
    Write-Host "   Uso de disco: $diskUsage" -ForegroundColor Cyan
}

Write-Host "`n7️⃣ Verificando memória..." -ForegroundColor Yellow
$memory = Invoke-RemoteCommand -Command "free -h | awk 'NR==2{print \"Total: \" \$2 \", Disponível: \" \$7}'" -HostIP $HostIP -UserName $UserName
if ($memory) {
    Write-Host "   $memory" -ForegroundColor Cyan
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Para uma verificação completa, execute o script check-server.sh diretamente no servidor:" -ForegroundColor Yellow
Write-Host "   ssh ${UserName}@${HostIP}" -ForegroundColor White
Write-Host "   cd /opt/embarcacoes" -ForegroundColor White
Write-Host "   ./check-server.sh" -ForegroundColor White

Write-Host "`nOu faça upload do script e execute:" -ForegroundColor Yellow
Write-Host "   scp check-server.sh ${UserName}@${HostIP}:/tmp/" -ForegroundColor White
Write-Host "   ssh ${UserName}@${HostIP} 'bash /tmp/check-server.sh'" -ForegroundColor White


