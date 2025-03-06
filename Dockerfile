# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Installiere weitere Abhängigkeiten
RUN apk add --no-cache libc6-compat

# Kopiere package.json und package-lock.json
COPY package.json package-lock.json* ./

# Installiere die Abhängigkeiten
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Kopiere die Abhängigkeiten und den Quellcode
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build der Anwendung
RUN npm run build

# Stage 3: Runner (Produktionsumgebung)
FROM node:18-alpine AS runner
WORKDIR /app

# Setze auf Produktionsmodus
ENV NODE_ENV production

# Erstelle einen Benutzer mit niedrigeren Rechten für mehr Sicherheit
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere die notwendigen Dateien aus dem Builder-Stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Setze die Berechtigungen
RUN chown -R nextjs:nodejs /app

# Wechsle zum Benutzer mit niedrigeren Rechten
USER nextjs

# Exponiere den Port, auf dem die Anwendung läuft
EXPOSE 3000

# Setze Host-Umgebungsvariable für Next.js
ENV HOSTNAME "0.0.0.0"

# Starte die Anwendung
CMD ["node", "server.js"] 