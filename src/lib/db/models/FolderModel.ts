import mongoose from 'mongoose';

// Schema für Ordner
const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ein Name für den Ordner ist erforderlich'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  parentId: {
    type: String,
    default: 'root', // 'root' ist der oberste Ordner
  },
  path: {
    type: String,
    default: '/', // Pfad im Ordnerbaum, z.B. "/Hauptordner/Unterordner"
  },
  createdBy: {
    type: String,
    default: 'Anonymous',
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Indizes für verbesserte Abfrageleistung
FolderSchema.index({ name: 'text', description: 'text' });

// Modell exportieren
export default mongoose.models.Folder || mongoose.model('Folder', FolderSchema); 