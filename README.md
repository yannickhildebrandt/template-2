# BPMN-Modeler

Ein webbasierter BPMN-Modellierungseditor, entwickelt mit Next.js, bpmn-js und MongoDB.

## Features

- Erstellen und Bearbeiten von BPMN-Diagrammen
- Speichern von Modellen in einer MongoDB-Datenbank
- Importieren und Exportieren von BPMN-XML
- Organisation von Modellen in Ordnern
- Responsive Design für Desktop und mobile Geräte
- Einfache, benutzerfreundliche Oberfläche

## Technologien

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS für das UI
- bpmn-js als BPMN-Modellierungsengine
- MongoDB als Datenbank
- Docker für einfaches Deployment

## Lokale Installation

1. Repository klonen
2. Abhängigkeiten installieren:
```bash
npm install
```
3. Lokale Umgebungsvariablen in `.env.local` konfigurieren:
```
MONGODB_URI=mongodb://localhost:27017/bpmn-editor
NEXT_PUBLIC_API_URL=http://localhost:3000
```
4. Entwicklungsserver starten:
```bash
npm run dev
```
5. Im Browser [http://localhost:3000](http://localhost:3000) öffnen

## Docker-Deployment

Für ein einfaches Deployment kann Docker Compose verwendet werden:

```bash
docker-compose up -d
```

Weitere Informationen zur Docker-Konfiguration finden Sie in der [DOCKER-README.md](DOCKER-README.md).

## Zugängliche Endpunkte

- **BPMN-Editor**: http://localhost:3002 (oder konfigurierter Port)
- **MongoDB Admin Interface**: http://localhost:8081

## Authentifizierung für MongoDB

- **Benutzername**: admin
- **Passwort**: password (sollte in einer Produktionsumgebung geändert werden)

## Lizenz

MIT