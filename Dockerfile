# ---------- Builder stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build


# ---------- Nginx (rootless) stage ----------
FROM nginx:1.19.3-alpine

# Create non-root user and group
RUN addgroup -S app && adduser -S app -G app

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config (listening on 8080)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Ensure permissions for non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chmod -R 755 /usr/share/nginx/html \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/log/nginx \
 && chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid \
 &&  chown -R nginx:nginx /var/run/nginx.pid

# Run as non-root
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
