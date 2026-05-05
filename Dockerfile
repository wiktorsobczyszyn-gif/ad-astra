FROM ghcr.io/puppeteer/puppeteer:22.6.0

# Ustawiamy katalog roboczy
WORKDIR /usr/src/app

# Kopiujemy pliki projektu
COPY package*.json ./
RUN npm install

# Kopiujemy resztę kodu
COPY . .

# Ważne: Render używa portu 10000 domyślnie
EXPOSE 10000

CMD [ "node", "index.js" ]
