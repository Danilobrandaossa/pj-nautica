$envFile = ".env"
$content = "DISABLE_CSRF=true"

if (Test-Path $envFile) {
    $existing = Get-Content $envFile -Raw
    if ($existing -notmatch "DISABLE_CSRF") {
        Add-Content -Path $envFile -Value "`n$content"
        Write-Host "✅ DISABLE_CSRF=true adicionado ao .env"
    } else {
        Write-Host "⚠️ DISABLE_CSRF já existe no .env"
    }
} else {
    $content | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "✅ Arquivo .env criado com DISABLE_CSRF=true"
}




