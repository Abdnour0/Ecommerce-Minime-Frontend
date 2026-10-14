# syntax=docker/dockerfile:1

# --- Build stage ------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# API URL / Stripe key / admin emails are baked into the bundle at build time.
ARG VITE_API_URL=/api
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_ADMIN_EMAILS
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_ADMIN_EMAILS=$VITE_ADMIN_EMAILS
RUN npm run build

# --- Serve stage ------------------------------------------------------------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
