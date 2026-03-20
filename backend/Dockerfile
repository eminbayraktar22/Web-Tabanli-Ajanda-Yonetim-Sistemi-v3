FROM node:20-alpine
WORKDIR /app

# Sadece bağımlılık listesini kopyala (önbellek performansı için)
COPY package*.json ./
RUN npm install

# Kalan dosyaları kopyala
COPY . .

# Konteyner çıkış portu
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "run", "start"]
