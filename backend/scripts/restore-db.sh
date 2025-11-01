#!/bin/bash

# Script de restore do banco de dados PostgreSQL
# Restaura um backup do banco de dados

# Verificar se arquivo foi fornecido
if [ -z "$1" ]; then
  echo "Uso: $0 <arquivo_backup.sql.gz>"
  echo "Exemplo: $0 ./backups/backup_embarcacoes_db_20231201_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Configurações
DB_NAME="${DB_NAME:-embarcacoes_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  ATENÇÃO: Este processo irá SOBRESCREVER o banco de dados atual!"
echo "Banco de dados: $DB_NAME"
echo "Arquivo de backup: $BACKUP_FILE"
read -p "Deseja continuar? (sim/não): " confirm

if [ "$confirm" != "sim" ]; then
  echo "Operação cancelada."
  exit 0
fi

# Descomprimir se necessário
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Descomprimindo backup..."
  TEMP_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

echo "Restaurando banco de dados..."

# Restaurar backup
if PGPASSWORD="${DB_PASSWORD}" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c \
  "$TEMP_FILE" 2>/dev/null; then
  echo "✅ Restore concluído com sucesso!"
  
  # Limpar arquivo temporário se foi descomprimido
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$TEMP_FILE"
  fi
else
  echo "❌ Erro ao restaurar backup!"
  exit 1
fi






