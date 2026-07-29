# Stage 1: Build — full SDK image, only used to compile, discarded after this stage.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# reports-service is two projects (API + Core) — copy both .csproj files first so restore caching works for either.
COPY ReportsService.API/ReportsService.API.csproj ReportsService.API/
COPY ReportsService.Core/ReportsService.Core.csproj ReportsService.Core/

RUN dotnet restore ReportsService.API/ReportsService.API.csproj

COPY . .

# Extra flag needed since the API project references Core directly, so some output files can overlap.
RUN dotnet publish ReportsService.API/ReportsService.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2: Run — lightweight runtime image, no SDK/compiler/source. This is what deploys.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core's default container port — docker-compose maps this to a different host port locally.
EXPOSE 8080

ENTRYPOINT ["dotnet", "ReportsService.API.dll"]