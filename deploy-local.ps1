# Script para rodar o SAAS localmente
Write-Host "🚀 Iniciando deploy local do Sistema de Embarcações..." -ForegroundColor Green

# Verificar se Docker está rodando
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está instalado ou não está rodando!" -ForegroundColor Red
    Write-Host "💡 Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Remover volumes antigos (opcional)
Write-Host "🗑️ Removendo volumes antigos..." -ForegroundColor Yellow
docker volume prune -f

# Construir e iniciar containers
Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up --build -d

# Aguardar containers iniciarem
Write-Host "⏳ Aguardando containers iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status
Write-Host "📊 Verificando status dos containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml ps

# Testar aplicação
Write-Host "🧪 Testando aplicação..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "✅ Frontend funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend não está respondendo" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 10
    Write-Host "✅ Backend funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Deploy local concluído!" -ForegroundColor Green
Write-Host "📱 Acesse o SAAS em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "🗄️ Banco de dados: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para parar: docker-compose -f docker-compose.local.yml down" -ForegroundColor Yellow