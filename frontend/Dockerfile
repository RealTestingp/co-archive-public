# Stage 1: Build the React app — Node is only used to compile, doesn't ship in the final image.
FROM node:20-alpine AS build

WORKDIR /app

# Gateway's URL, baked into the compiled JS at build time — changing it later needs a full rebuild.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_ENTRA_CLIENT_ID
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_TENANT_ID
ENV VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID

# Copy package files first so npm install only reruns when they actually change.
COPY package*.json ./
RUN npm install

COPY . .

# Compiles to static files — this is where VITE_API_BASE_URL gets embedded.
RUN npm run build

# Stage 2: Serve with nginx — only the compiled output makes it in, no Node/source/node_modules.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Serves the static files and handles React Router client-side routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx's default port — why frontend uses 80 while our .NET services use 8080.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]