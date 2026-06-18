FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY HireMind.sln ./
COPY backend/backend.csproj ./backend/

RUN dotnet restore ./backend/backend.csproj

COPY . .

RUN dotnet publish ./backend/backend.csproj \
		-c Release \
		-o /app/publish \
		--no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
EXPOSE 8443

ENTRYPOINT [ "dotnet", "backend.dll" ]
