# Stage 1 - Build the .NET app
# Stage 1: Build
# Full SDK image — includes the compiler and everything needed to build, but never ships in the final container.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# core-api is actually two separate projects: COArchive.API and COArchive. 
# we copy both project files before restoring, so Docker's cache still works correctly 
# for either one changing independently.
COPY COArchive.API/COArchive.API.csproj COArchive.API/
COPY COArchive/COArchive.csproj COArchive/

RUN dotnet restore COArchive.API/COArchive.API.csproj

# Copy the rest of the actual source for both projects.
COPY . .

# Compile and publish. The extra flag below (ErrorOnDuplicatePublishOutputFiles=false)
# relaxes a build check that would otherwise fail if both projects happen
# to produce a file with the same name in the output folder — expected here since COArchive.API references COArchive directly.
RUN dotnet publish COArchive.API/COArchive.API.csproj -c Release -o /app/publish /p:ErrorOnDuplicatePublishOutputFiles=false

# Stage 2: Run
# Lightweight runtime-only image — no SDK, no compiler, no source code.
# This is the actual image pushed to ACR and deployed; Stage 1 is discarded after producing the files copied in below.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Only the compiled output comes across, not the source code for either
# project, not the SDK, nothing build-time-only.
COPY --from=build /app/publish .

# Default ASP.NET Core container port. docker-compose.yml maps this to
# a different port on the host for local access.
EXPOSE 8080

ENTRYPOINT ["dotnet", "COArchive.API.dll"]