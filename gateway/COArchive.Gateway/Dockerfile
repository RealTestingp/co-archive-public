# Stage 1: Build
# Full SDK image — includes the compiler, only used to build the app.
# Discarded after this stage; never ships in the final container.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# The gateway's whole job is routing (YARP configuration)
# Copying just the .csproj first, before the rest of the source, lets
# Docker cache the restore step so it only reruns if this file changes.
COPY COArchive.Gateway.csproj .
RUN dotnet restore COArchive.Gateway.csproj

COPY . .

RUN dotnet publish COArchive.Gateway.csproj -c Release -o /app/publish

# Stage 2: Run
# Lightweight runtime-only image. No SDK, no compiler, no source code.
# This is the actual image pushed to ACR and deployed.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# Default ASP.NET Core container port. Mapped to a different host port
# locally via docker-compose.yml, and this is also the
# service other Container Apps route to internally in Azure.
EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.Gateway.dll"]