FROM evolutionapi/evolution-api:latest

# Instalar Chromium e dependências (Alpine Linux)
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    font-noto-emoji \
    freetype \
    harfbuzz \
    nss \
    ttf-freefont \
    udev

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"

# Criar diretório para instâncias
RUN mkdir -p /evolution/instances && chmod -R 777 /evolution/instances

WORKDIR /evolution

EXPOSE 8080

CMD ["node", "dist/main"]

