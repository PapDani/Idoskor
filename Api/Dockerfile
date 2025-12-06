# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./
# Render a $PORT portot adja meg, ezen kell hallgatni
CMD ["bash","-lc","dotnet Api.dll --urls http://0.0.0.0:$PORT"]
