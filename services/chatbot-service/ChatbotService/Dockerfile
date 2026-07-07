# Stage 1 - Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ChatbotService.csproj .
RUN dotnet restore ChatbotService.csproj

COPY . .

RUN dotnet publish ChatbotService.csproj -c Release -o /app/publish

# Stage 2 - Run
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ChatbotService.dll"]