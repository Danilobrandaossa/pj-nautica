# 📤 SCRIPT DE UPLOAD PARA VPS - PowerShell
# Execute este script do seu computador Windows para fazer upload dos arquivos

Write-Host "📤 INICIANDO UPLOAD DOS ARQUIVOS PARA VPS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Configurações
$VPS_IP = "145.223.93.235"
$VPS_USER = "root"
$VPS_PATH = "/opt/embarcacoes"

Write-Host "=== CONFIGURAÇÕES ===" -ForegroundColor Blue
Write-Host "VPS IP: $VPS_IP"
Write-Host "VPS User: $VPS_USER"
Write-Host "VPS Path: $VPS_PATH"
Write-Host ""

# Verificar se SCP está disponível
try {
    scp --version | Out-Null
    Write-Host "✅ SCP encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ SCP não encontrado. Instale o OpenSSH client." -ForegroundColor Red
    exit 1
}

# Verificar se SSH está disponível
try {
    ssh -V | Out-Null
    Write-Host "✅ SSH encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH não encontrado. Instale o OpenSSH client." -ForegroundColor Red
    exit 1
}

Write-Host "=== FAZENDO UPLOAD DOS ARQUIVOS ===" -ForegroundColor Green

# Criar arquivo .rsyncignore para excluir arquivos desnecessários
$ignoreContent = @"
node_modules
.git
.env
.env.local
.env.production
*.log
dist
build
.DS_Store
Thumbs.db
*.tmp
*.temp
coverage
.nyc_output
.vscode
.idea
*.swp
*.swo
*~
"@

$ignoreContent | Out-File -FilePath ".rsyncignore" -Encoding UTF8

# Fazer upload usando SCP
Write-Host "Fazendo upload dos arquivos..." -ForegroundColor Yellow

# Criar lista de arquivos para upload
$filesToUpload = @(
    "backend",
    "frontend", 
    "nginx",
    "docker-compose.prod.yml",
    "deploy-vps.sh",
    "GUIA_DEPLOY_VPS.md",
    "AUDITORIA_CRITICA_FINAL.md",
    "CORRECOES_SEGURANCA.md",
    "DEPLOY_ZERADO.md"
)

# Fazer upload de cada arquivo/diretório
foreach ($item in $filesToUpload) {
    if (Test-Path $item) {
        Write-Host "Uploading $item..." -ForegroundColor Yellow
        scp -r $item "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
    } else {
        Write-Host "⚠️  $item não encontrado, pulando..." -ForegroundColor Yellow
    }
}

# Remover arquivo temporário
Remove-Item ".rsyncignore" -ErrorAction SilentlyContinue

Write-Host "=== CONFIGURANDO PERMISSÕES ===" -ForegroundColor Green

# Configurar permissões no VPS
Write-Host "Configurando permissões..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $VPS_PATH && chmod +x deploy-vps.sh"

Write-Host "=== UPLOAD CONCLUÍDO! ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS NO VPS:" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Conecte ao VPS:" -ForegroundColor White
Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Navegue para o diretório:" -ForegroundColor White
Write-Host "   cd $VPS_PATH" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host "   nano .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Execute o script de preparação:" -ForegroundColor White
Write-Host "   ./deploy-vps.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Inicie o sistema:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Execute as migrações:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate" -ForegroundColor Cyan
Write-Host ""
Write-Host "7. Execute o seed:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Upload concluído com sucesso!" -ForegroundColor Green

