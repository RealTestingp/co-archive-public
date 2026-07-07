# Stage 1 - Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY COArchive.Gateway.csproj .
RUN dotnet restore COArchive.Gateway.csproj

COPY . .

RUN dotnet publish COArchive.Gateway.csproj -c Release -o /app/publish

# Stage 2 - Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.Gateway.dll"]