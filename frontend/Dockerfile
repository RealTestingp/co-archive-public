# Stage 1: Build the React app
# Node image, used only to compile the React/TypeScript app into static
# HTML/CSS/JS files. This stage is discarded after building. None of
# Node, npm, or node_modules ship in the final container.
FROM node:20-alpine AS build

WORKDIR /app

# VITE_API_BASE_URL is the gateway's URL, this is what tells the
# frontend where to send its API calls. Critically, this is a BUILD-TIME
# value, not a runtime one: Vite bakes it directly into the compiled JS
# bundle when `npm run build` runs below. 
#This means changing this value later requires rebuilding the image from scratch, cannot just
# change an environment variable on an already-built container and have it pick up a new URL.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy just the package files first, before the rest of the source code,
# so Docker can cache the npm install layer, it only reruns if
# package.json/package-lock.json actually change, not on every code edit.
COPY package*.json ./
RUN npm install

COPY . .

# Compiles the app into static files. This is where
# VITE_API_BASE_URL actually gets embedded into the built JS bundle.
RUN npm run build

# Stage 2: Serve with nginx
# Switches to a lightweight nginx image whose only job is serving the
# static files produced above. No Node, no build tools, no source code
# make it into this final image; only the compiled output does.
FROM nginx:alpine

# Copy only the compiled static files from Stage 1, not the source
# code, not node_modules, nothing build-time-only.
COPY --from=build /app/dist /usr/share/nginx/html

# Our custom nginx config.
# Its job today is serving these static files and handling React Router's client-side routing (so a direct
# visit to a route like /search loads correctly instead of 404ing).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx's default port — this is why frontend uses port 80 while our
# .NET services all use 8080 (ASP.NET Core's default).
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]