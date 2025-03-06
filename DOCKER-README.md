# Docker-Konfiguration für BPMN-Modeler

Diese Dokumentation beschreibt die Docker-Konfiguration für den BPMN-Modeler und erklärt, wie Sie die Anwendung mit Docker bereitstellen können.

## Voraussetzungen

- Docker installiert (Version 20.10.0 oder höher)
- Docker Compose installiert (Version 2.0.0 oder höher)

## Schnellstart

1. Repository klonen
2. Docker-Container starten:
   ```bash
   docker-compose up -d
   ```
3. Zugriff auf die Anwendung unter http://localhost:3002
4. Zugriff auf die MongoDB-Admin-Oberfläche unter http://localhost:8081

## Docker-Konfiguration

Die `docker-compose.yml` Datei definiert drei Dienste:

1. **mongodb**: MongoDB-Datenbank für die Speicherung der BPMN-Modelle
   - Port: 27017
   - Umgebungsvariablen für Benutzername, Passwort und Datenbankname
   - Persistentes Volume für Datenspeicherung

2. **bpmn-editor**: Die Next.js-Anwendung
   - Port: 3002 (extern) -> 3000 (intern)
   - Umgebungsvariablen für Produktionsumgebung und MongoDB-Verbindung
   - Abhängigkeit von MongoDB

3. **mongo-express**: Web-basierte MongoDB-Verwaltungsoberfläche
   - Port: 8081
   - Umgebungsvariablen für Authentifizierung
   - Abhängigkeit von MongoDB

## Anpassungen

### Dockerfile

Das Dockerfile für den BPMN-Editor verwendet einen mehrstufigen Build-Prozess:
1. Build-Phase: Kompiliert die Next.js-Anwendung
2. Produktions-Phase: Erstellt ein schlankes Image mit nur den notwendigen Dateien

### docker-compose.yml

Sie können folgende Anpassungen vornehmen:

- **Ports ändern**: Wenn Port 3002 oder 8081 bereits verwendet wird, können Sie diese in der `docker-compose.yml` ändern.
- **Umgebungsvariablen**: Passwörter und Benutzernamen für MongoDB anpassen.
- **Volumes**: Speicherort der MongoDB-Daten ändern.

## Deployment auf Docker Hub

Das Image ist auf Docker Hub unter `yannickhildebrandt/bpmn-modeler-kws:latest` verfügbar und kann mit folgendem Befehl heruntergeladen werden:

```bash
docker pull yannickhildebrandt/bpmn-modeler-kws:latest
```

## Bekannte Probleme und Lösungen

### Problem: Node-Module-Fehler

Wenn Sie Fehler bezüglich fehlender Node-Module erhalten, versuchen Sie:

```bash
docker-compose down
docker-compose build --no-cache bpmn-editor
docker-compose up -d
```

### Problem: MongoDB-Verbindungsfehler

Überprüfen Sie die Umgebungsvariablen in der `docker-compose.yml` und stellen Sie sicher, dass die MongoDB-Verbindungszeichenfolge korrekt ist.

### Logs anzeigen

Um die Logs der Anwendung anzuzeigen:

```bash
docker logs bpmn-editor
```

Für MongoDB-Logs:

```bash
docker logs mongodb
``` 