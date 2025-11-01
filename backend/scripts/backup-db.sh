#!/bin/bash

# Script de backup do banco de dados PostgreSQL
# Este script cria um backup completo do banco de dados

# Configurações
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-embarcacoes_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "Iniciando backup do banco de dados: $DB_NAME"
echo "Arquivo: $BACKUP_FILE"

# Executar backup
if PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_FILE" 2>/dev/null; then
  echo "✅ Backup concluído com sucesso!"
  echo "Arquivo salvo em: $BACKUP_FILE"
  
  # Comprimir backup
  if command -v gzip &> /dev/null; then
    gzip "$BACKUP_FILE"
    echo "Backup comprimido: ${BACKUP_FILE}.gz"
  fi
  
  # Remover backups antigos (manter apenas últimos 7 dias)
  find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +7 -delete 2>/dev/null
  echo "Backups antigos removidos (>7 dias)"
else
  echo "❌ Erro ao fazer backup!"
  exit 1
fi






