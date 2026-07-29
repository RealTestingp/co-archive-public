# Stage 1: Build — full SDK image, only used to compile, discarded after this stage.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# core-api is two projects (COArchive.API + COArchive) — copy both .csproj files first so restore caching works for either.
COPY COArchive.API/COArchive.API.csproj COArchive.API/
COPY COArchive/COArchive.csproj COArchive/

RUN dotnet restore COArchive.API/COArchive.API.csproj

COPY . .

# Extra flag needed since both projects can produce a same-named output file (COArchive.API references COArchive directly).
RUN dotnet publish COArchive.API/COArchive.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2: Run — lightweight runtime image, no SDK/compiler/source. This is what deploys.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core's default container port — docker-compose maps this to a different host port locally.
EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.API.dll"]