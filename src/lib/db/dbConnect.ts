import mongoose from 'mongoose';

// Interface für die Cache-Struktur
interface CacheType {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// Typdeklarationen für globale Mongoose-Verbindung
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CacheType | undefined;
}

// Globale Variable für die Datenbankverbindung
const cached: CacheType = global.mongoose || { conn: null, promise: null };

// Stelle sicher, dass die globale Variable initialisiert ist
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Stellt eine Verbindung zur MongoDB her
 */
async function dbConnect(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Verwende MONGODB_URI aus der Umgebungsvariable oder Standard-URI für lokale Entwicklung
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bpmn-editor';

    const opts = {
      bufferCommands: false,
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB verbunden!');
        return mongoose.connection;
      });
    } catch (error) {
      console.error('Fehler beim Verbinden mit MongoDB:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('Fehler beim Warten auf MongoDB-Verbindung:', error);
    throw error;
  }

  return cached.conn;
}

export default dbConnect; 