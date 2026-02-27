# Estágio de Build para Go (Worker)
FROM golang:1.21-alpine AS go-builder
WORKDIR /app
COPY go-service/go.mod go-service/go.sum ./
RUN go mod download
COPY go-service/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o artemis-campaign-worker .

# Estágio de Build para Node (Nuxt)
FROM node:20-alpine AS node-builder
WORKDIR /app

# Argumentos de Build para o Nuxt
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SECRET_KEY
ARG EVOLUTION_API_URL
ARG EVOLUTION_API_KEY
ARG SITE_URL
ARG JWT_SECRET
ARG NUXT_SMTP_HOST
ARG NUXT_SMTP_PORT
ARG NUXT_SMTP_USER
ARG NUXT_SMTP_PASS
ARG NUXT_SMTP_FROM

# Definir como variáveis de ambiente para o build do Nuxt
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY
ENV EVOLUTION_API_URL=$EVOLUTION_API_URL
ENV EVOLUTION_API_KEY=$EVOLUTION_API_KEY
ENV SITE_URL=$SITE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NUXT_SMTP_HOST=$NUXT_SMTP_HOST
ENV NUXT_SMTP_PORT=$NUXT_SMTP_PORT
ENV NUXT_SMTP_USER=$NUXT_SMTP_USER
ENV NUXT_SMTP_PASS=$NUXT_SMTP_PASS
ENV NUXT_SMTP_FROM=$NUXT_SMTP_FROM

COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Usar npx nuxt build para ignorar o script de build do package.json que tenta rodar Go
RUN npx nuxt build

# Estágio Final de Produção
FROM node:20-alpine AS production
WORKDIR /app

# Instalar dependências de runtime necessárias
RUN apk add --no-cache libc6-compat

# Copiar build do Nuxt
COPY --from=node-builder /app/.output ./.output

# Copiar binário do Go
COPY --from=go-builder /app/artemis-campaign-worker ./artemis-campaign-worker

# Copiar script de entrada
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh artemis-campaign-worker

# Variáveis de ambiente de runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expor a porta do Nuxt
EXPOSE 3000

# Usar o entrypoint para rodar ambos os serviços
CMD ["./entrypoint.sh"]
