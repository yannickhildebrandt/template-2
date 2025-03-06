# BPMN-Editor Docker-Setup

Dieses Dokument enthält Anweisungen zur Verwendung des BPMN-Editors mit Docker.

## Voraussetzungen

- Docker installiert (https://docs.docker.com/get-docker/)
- Docker Compose installiert (https://docs.docker.com/compose/install/)

## Schnellstart

1. Repository klonen oder Dateien herunterladen
2. Im Projektverzeichnis den folgenden Befehl ausführen:

```bash
docker-compose up -d
```

Der BPMN-Editor ist dann unter http://localhost:3000 verfügbar.

## Manueller Docker-Build

Wenn Sie Docker Compose nicht verwenden möchten, können Sie den Container auch manuell bauen und starten:

```bash
# Container bauen
docker build -t bpmn-editor .

# Container starten
docker run -p 3000:3000 -d --name bpmn-editor bpmn-editor
```

## Container-Management

### Container stoppen

```bash
docker-compose down
```

### Container neu starten

```bash
docker-compose restart
```

### Logs anzeigen

```bash
docker-compose logs -f
```

## Anpassungen

Die Docker-Konfiguration kann über folgende Dateien angepasst werden:

- `Dockerfile`: Haupt-Build-Datei für die Anwendung
- `docker-compose.yml`: Definiert die Services und deren Konfiguration
- `.dockerignore`: Definiert welche Dateien beim Build ignoriert werden
- `next.config.mjs`: Enthält spezifische Next.js-Konfigurationen für Docker

## Produktionsumgebung

Für eine Produktionsumgebung empfehlen wir folgende zusätzliche Schritte:

1. Aktivieren Sie den auskommentierten NGINX-Service in der docker-compose.yml
2. Konfigurieren Sie SSL-Zertifikate
3. Passen Sie die NGINX-Konfiguration für Ihre Domain an

## Bekannte Probleme und Lösungen

- Wenn der Container mit einem Fehler bezüglich der Node-Module startet, versuchen Sie, den Node_Modules-Ordner zu löschen und den Container neu zu bauen.
- Fehler beim Zugriff auf die Anwendung können oft durch einen Blick in die Container-Logs (`docker-compose logs -f`) diagnostiziert werden. 