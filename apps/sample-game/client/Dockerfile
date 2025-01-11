# Base image
FROM node:alpine AS build
ARG BUILD_ENV=
ENV BUILD_ENV=${BUILD_ENV}

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:${BUILD_ENV}
# Prune dev dependencies to save space
RUN npm prune --production

# Runtime image
FROM nginx:alpine AS final

COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]