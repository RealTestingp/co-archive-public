# Stage 1: Build — full SDK image, only used to compile, discarded after this stage.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy just the .csproj first so restore only reruns when it actually changes.
COPY COArchive.Gateway.csproj .
RUN dotnet restore COArchive.Gateway.csproj

COPY . .

RUN dotnet publish COArchive.Gateway.csproj -c Release -o /app/publish

# Stage 2: Run — lightweight runtime image, no SDK/compiler/source. This is what deploys.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core's default container port — same port other Container Apps route to internally.
EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.Gateway.dll"]