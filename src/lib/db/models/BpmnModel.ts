import mongoose from 'mongoose';

// Schema für BPMN-Modelle
const BpmnModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ein Name für das Modell ist erforderlich'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  xml: {
    type: String,
    required: [true, 'XML-Daten sind erforderlich'],
  },
  svg: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  folderId: {
    type: String,
    default: 'root', // 'root' steht für den Hauptordner
  },
  isFolder: {
    type: Boolean,
    default: false, // true für Ordner, false für Modelle
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
BpmnModelSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Modell exportieren
export default mongoose.models.BpmnModel || mongoose.model('BpmnModel', BpmnModelSchema); 