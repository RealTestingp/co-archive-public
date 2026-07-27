# tage 1: Build 
# Full SDK image, used only for compiling — discarded after this stage.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Reports-service is split into two projects, ReportsService.API and
# ReportsService.Core. Copying both .csproj files before any real source code lets Docker cache
# the restore step. It only reruns if one of these two files changes, not on every source code edit.
COPY ReportsService.API/ReportsService.API.csproj ReportsService.API/
COPY ReportsService.Core/ReportsService.Core.csproj ReportsService.Core/

RUN dotnet restore ReportsService.API/ReportsService.API.csproj

COPY . .

# Compile and publish both projects together. The API project
# references the Core project directly, so some output files can overlap.
RUN dotnet publish ReportsService.API/ReportsService.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2: Run
# Lightweight runtime-only image — no SDK, no source code, just what's
# needed to actually run the compiled app. This is what actually gets
# pushed to ACR and deployed.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# Default ASP.NET Core container port. Mapped to a different host port
# locally via docker-compose.yml.
EXPOSE 8080

ENTRYPOINT ["dotnet", "ReportsService.API.dll"]