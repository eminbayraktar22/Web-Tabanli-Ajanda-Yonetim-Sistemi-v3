FROM node:20-alpine

# Uygulama dizinini oluştur
WORKDIR /app

# Paket bağımlılıklarını kopyala
COPY package*.json ./

# Sadece production (üretim) modundaki paketleri kur
RUN npm install --omit=dev

# Bütün kaynak kodları kopyala
COPY . .

# Cloud Run için standart PORT ayarı
ENV PORT=8080
EXPOSE 8080

# NODE_ENV değişkenini production olarak ayarla ki performans artsın
ENV NODE_ENV=production

# Server'ı başlat
CMD ["npm", "start"]
