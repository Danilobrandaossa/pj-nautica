#!/bin/bash

# Script para rotação de secrets JWT
# Este script gera novos secrets JWT e atualiza as variáveis de ambiente

echo "🔄 Iniciando rotação de secrets JWT..."

# Gerar novos secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "Novos secrets gerados:"
echo "JWT_SECRET: ${NEW_JWT_SECRET:0:20}..."
echo "JWT_REFRESH_SECRET: ${NEW_JWT_REFRESH_SECRET:0:20}..."

# Backup do .env atual
if [ -f .env ]; then
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  cp .env ".env.backup_${TIMESTAMP}"
  echo "✅ Backup do .env criado: .env.backup_${TIMESTAMP}"
fi

# Atualizar .env
if [ -f .env ]; then
  # Atualizar JWT_SECRET
  if grep -q "^JWT_SECRET=" .env; then
    sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env
  else
    echo "JWT_SECRET=$NEW_JWT_SECRET" >> .env
  fi

  # Atualizar JWT_REFRESH_SECRET
  if grep -q "^JWT_REFRESH_SECRET=" .env; then
    sed -i.bak "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$NEW_JWT_REFRESH_SECRET/" .env
  else
    echo "JWT_REFRESH_SECRET=$NEW_JWT_REFRESH_SECRET" >> .env
  fi

  # Remover arquivo de backup do sed
  rm -f .env.bak

  echo "✅ .env atualizado com novos secrets"
else
  echo "⚠️  Arquivo .env não encontrado. Criando novo..."
  cat > .env << EOF
JWT_SECRET=$NEW_JWT_SECRET
JWT_REFRESH_SECRET=$NEW_JWT_REFRESH_SECRET
EOF
  echo "✅ Novo arquivo .env criado"
fi

echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Reinicie o servidor para aplicar os novos secrets"
echo "2. Os tokens JWT atuais serão invalidados"
echo "3. Usuários precisarão fazer login novamente"
echo "4. Mantenha os secrets seguros e não os compartilhe"






