# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1) csak a csproj-ok bemásolása a gyorsabb restore-cache miatt
COPY Domain/Domain.csproj Domain/
COPY Infrastructure/Infrastructure.csproj Infrastructure/
COPY Api/Api.csproj Api/

# 2) restore csak az Api projektre (a hivatkozott csproj-ok itt vannak)
RUN dotnet restore Api/Api.csproj

# 3) most jöhet a teljes kódbázis
COPY . .

# 4) publish kizárólag projektre, solution NÉLKÜL
RUN dotnet publish Api/Api.csproj -c Release --no-restore -o /app

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./

# Render a $PORT-ot adja környezeti változóban
CMD ["bash","-lc","dotnet Api.dll --urls http://0.0.0.0:$PORT"]
