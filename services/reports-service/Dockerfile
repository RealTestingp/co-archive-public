# Stage 1 - Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ReportsService.API/ReportsService.API.csproj ReportsService.API/
COPY ReportsService.Core/ReportsService.Core.csproj ReportsService.Core/

RUN dotnet restore ReportsService.API/ReportsService.API.csproj

COPY . .

RUN dotnet publish ReportsService.API/ReportsService.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2 - Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ReportsService.API.dll"]