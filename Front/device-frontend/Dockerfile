# Multi-stage build para Frontend React + Vite

# Etapa 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Argument para API URL
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN npm run build

# Etapa 2: Production con Nginx
FROM nginx:alpine AS production

# Copiar archivos build a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
