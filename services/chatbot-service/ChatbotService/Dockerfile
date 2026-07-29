# Stage 1: Build — full SDK image, only used to compile, discarded after this stage.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy just the .csproj first so restore only reruns when it actually changes.
COPY ChatbotService.csproj .
RUN dotnet restore ChatbotService.csproj

COPY . .

RUN dotnet publish ChatbotService.csproj -c Release -o /app/publish

# Stage 2: Run — lightweight runtime image, no SDK/compiler/source. This is what deploys.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core's default container port — docker-compose maps this to a different host port locally.
EXPOSE 8080

ENTRYPOINT ["dotnet", "ChatbotService.dll"]