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
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio Final de Produção
FROM node:20-alpine AS production
WORKDIR /app

# Instalar dependências de runtime necessárias (libc6-compat para binários compilados se necessário)
RUN apk add --no-cache libc6-compat

# Copiar build do Nuxt
COPY --from=node-builder /app/.output ./.output

# Copiar binário do Go
COPY --from=go-builder /app/artemis-campaign-worker ./artemis-campaign-worker

# Copiar script de entrada
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh artemis-campaign-worker

# Variáveis de ambiente
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expor a porta do Nuxt
EXPOSE 3000

# Usar o entrypoint para rodar ambos os serviços
CMD ["./entrypoint.sh"]
