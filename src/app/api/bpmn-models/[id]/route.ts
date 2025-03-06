import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import BpmnModel from '@/lib/db/models/BpmnModel';

// GET: Ein spezifisches Modell abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const id = params.id;
    console.log('GET: Modell abrufen mit ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Modell-ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const model = await BpmnModel.findById(id);
    
    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Modell nicht gefunden' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify(model),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Abrufen des BPMN-Modells:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Abrufen des Modells', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// PUT: Ein Modell aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PUT: Modell-Update erhalten für ID:', params.id);
  
  try {
    // Stelle sicher, dass die Datenbankverbindung hergestellt ist
    await dbConnect();
    console.log('Datenbankverbindung hergestellt');
    
    const id = params.id;
    
    // Validierung der ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Ungültige Modell-ID:', id);
      return new Response(
        JSON.stringify({ error: 'Ungültige Modell-ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Prüfen, ob das Modell existiert
    console.log('Suche nach bestehendem Modell...');
    const existingModel = await BpmnModel.findById(id);
    if (!existingModel) {
      console.error('Modell nicht gefunden:', id);
      return new Response(
        JSON.stringify({ error: 'Modell nicht gefunden' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Bestehendes Modell gefunden, verarbeite Request-Body');
    
    // Request-Body parsen - vereinfachte Version für Robustheit
    let bodyData;
    try {
      // 1. Text-Inhalt lesen
      const textContent = await request.text();
      console.log('Erhaltener Text (gekürzt):', textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''));
      
      // 2. Als JSON parsen
      bodyData = JSON.parse(textContent);
      console.log('Daten erfolgreich geparst mit Feldern:', Object.keys(bodyData).join(', '));
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Request-Body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Verarbeiten der Anfrage',
          details: error instanceof Error ? error.message : String(error)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Update-Daten vorbereiten
    const updateData: Record<string, any> = {
      ...bodyData,
      lastModified: new Date()
    };
    
    // ID entfernen, falls vorhanden
    if (updateData._id) {
      delete updateData._id;
    }
    
    console.log('Führe Update in Datenbank durch...');
    
    // Einfaches direktes Update ohne Validierung (für Robustheit)
    const result = await BpmnModel.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    );
    
    if (!result) {
      console.error('Modell konnte nicht aktualisiert werden');
      return new Response(
        JSON.stringify({ error: 'Modell konnte nicht aktualisiert werden' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Modell erfolgreich aktualisiert, ID:', id);
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Allgemeiner Fehler beim Aktualisieren des BPMN-Modells:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Aktualisieren des Modells', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// DELETE: Ein Modell löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('DELETE API-Route aufgerufen für ID:', params.id);
  
  try {
    // Datenbankverbindung herstellen
    await dbConnect();
    
    const id = params.id;
    console.log('Lösche Modell mit ID:', id);
    
    // Validierung der ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Ungültige Modell-ID:', id);
      return new Response(
        JSON.stringify({ error: 'Ungültige Modell-ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Versuche das Modell zu finden und zu löschen
    const deletedModel = await BpmnModel.findByIdAndDelete(id);
    
    if (!deletedModel) {
      console.error('Modell nicht gefunden:', id);
      return new Response(
        JSON.stringify({ error: 'Modell nicht gefunden' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Modell erfolgreich gelöscht:', id);
    return new Response(
      JSON.stringify({ message: 'Modell erfolgreich gelöscht', id }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Löschen des BPMN-Modells:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Löschen des Modells', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 