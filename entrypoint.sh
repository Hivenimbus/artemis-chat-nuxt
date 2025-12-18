#!/bin/sh

# Iniciar o worker em Go em segundo plano
echo "Iniciando Artemis Campaign Worker..."
./artemis-campaign-worker &

# Iniciar a aplicação Nuxt
echo "Iniciando Nuxt App..."
node .output/server/index.mjs

