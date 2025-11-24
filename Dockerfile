# Use a imagem base oficial do Node.js
FROM node:20-alpine AS base

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json* ./

# Instala as dependências
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio de produção para uma imagem menor
FROM node:20-alpine AS production

WORKDIR /app

# Copia os arquivos de build do estágio anterior
COPY --from=base /app/.output ./.output
# Opcional: Copia node_modules se houver dependências de runtime não incluídas no bundle (geralmente o Nuxt faz o bundle de tudo necessário)
# COPY --from=base /app/node_modules ./node_modules 
# COPY --from=base /app/package.json ./package.json

# Define variáveis de ambiente para produção
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expõe a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", ".output/server/index.mjs"]

