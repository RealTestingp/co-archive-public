# Stage 1: Build
# Uses the full .NET SDK image. This image is large, but it's only used
# during the build — it never ships in the final container.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy just the .csproj file first and restore
# NuGet packages before copying the rest of the code. 
# Docker caches each instruction as a layer and as long as the .csproj file hasn't changed,
# Docker can reuse the cached layer even if application code
# changes, instead of re-downloading every package on every single build.
COPY ChatbotService.csproj .
RUN dotnet restore ChatbotService.csproj

# Copy the rest of the source code.
COPY . .

# Compile the app in Release mode and publish the output to /app/publish.
# This is the actual BUILD step. Everything before was just getting ready for the build.
RUN dotnet publish ChatbotService.csproj -c Release -o /app/publish

# Stage 2: Run
# Switches to a much smaller image that only has the .NET runtime, not
# the full SDK/compiler. This is the actual image that gets pushed
# to Azure Container Registry and deployed.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

# Copy ONLY the compiled output from Stage 1 (not entire source code). This is what keeps the final image
# small and avoids shipping our actual source code inside the container.
COPY --from=build /app/publish .

# ASP.NET Core's default listening port inside a container. This is why
# our docker-compose.yml maps this container's 8080 to a different port
# on the host machine — 8080 is what the app listens
# on internally, the host-side port is just how we reach it locally.
EXPOSE 8080

# The actual command that runs when the container starts.
ENTRYPOINT ["dotnet", "ChatbotService.dll"]