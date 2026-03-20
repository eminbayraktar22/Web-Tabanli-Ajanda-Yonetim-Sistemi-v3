# 1. Aşama: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# .env dosyasını üretim aşaması için VITE build içine zorunlu verebilirsiniz (veya docker-compose'dan env verebilirsiniz)
RUN npm run build

# 2. Aşama: NGINX Sunucusu
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# React SPA (Single Page Application) yönlendirmesi için config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
