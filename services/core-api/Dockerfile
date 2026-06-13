# Stage 1 - Build the .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY COArchive.API/COArchive.API.csproj COArchive.API/
COPY COArchive/COArchive.csproj COArchive/

RUN dotnet restore COArchive.API/COArchive.API.csproj

COPY . .

RUN dotnet publish COArchive.API/COArchive.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2 - Run the .NET app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.API.dll"]