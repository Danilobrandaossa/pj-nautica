FROM node:20-slim

WORKDIR /app

# Instalar dependências necessárias para o Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npm run prisma:generate

# Expor porta
EXPOSE 3001

# Comando de desenvolvimento
CMD ["npm", "run", "dev"]

