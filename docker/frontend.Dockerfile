# LinkPilot web — build frontend, serve with nginx
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN mkdir -p backend/src frontend/src
RUN npm ci
COPY frontend frontend
COPY backend backend
RUN npm run build -w frontend

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
