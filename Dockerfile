# ---- STAGE 1: Build source code ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Nhận biến API Base URL từ Docker Compose
ARG VITE_API_BASE_URL=http://localhost:5051
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Biên dịch ra thư mục dist-web/
RUN npm run build

# ---- STAGE 2: Nginx Web Server ----
FROM nginx:alpine AS runner

# Xóa trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy bản build tĩnh từ builder sang
COPY --from=builder /app/dist-web /usr/share/nginx/html

# Copy file cấu hình điều phối routing của Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
