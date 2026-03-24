FROM node:20-bullseye

# Instalar Chromium e dependências necessárias com retry e tratamento de erros
# Dividir em múltiplas etapas para melhor resiliência a problemas de rede
RUN set -eux; \
    # Atualizar lista de pacotes com retry
    for i in 1 2 3; do \
        apt-get update && break || sleep 5; \
    done; \
    # Instalar pacotes essenciais primeiro
    apt-get install -y --no-install-recommends --fix-missing \
        ca-certificates \
        curl \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing ca-certificates curl); \
    # Instalar dependências do Chromium em grupos menores
    apt-get install -y --no-install-recommends --fix-missing \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libgdk-pixbuf2.0-0 \
        libnspr4 \
        libnss3 \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        xdg-utils \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing \
        fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
        libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
        libxdamage1 libxrandr2 xdg-utils); \
    # Instalar libdbus-1-3 separadamente (geralmente causa problemas)
    apt-get install -y --no-install-recommends --fix-missing libdbus-1-3 \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing libdbus-1-3); \
    # Instalar libappindicator3-1 separadamente
    apt-get install -y --no-install-recommends --fix-missing libappindicator3-1 \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing libappindicator3-1); \
    # Instalar Chromium por último
    apt-get install -y --no-install-recommends --fix-missing chromium \
    || (apt-get update && apt-get install -y --no-install-recommends --fix-missing chromium); \
    # Limpar cache
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Configurar Puppeteer para usar Chromium do sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 3333
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
