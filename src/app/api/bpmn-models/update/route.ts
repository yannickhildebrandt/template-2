import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import BpmnModel from '@/lib/db/models/BpmnModel';

// POST: Ein Modell aktualisieren (Alternative zu PUT /api/bpmn-models/[id])
export async function POST(request: NextRequest) {
  console.log('Update-Route aufgerufen');
  
  try {
    // Stelle sicher, dass die Datenbankverbindung hergestellt ist
    await dbConnect();
    console.log('Datenbankverbindung hergestellt');
    
    // Request-Body parsen
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
    
    // ID aus dem Body holen
    const id = bodyData._id;
    if (!id) {
      console.error('Keine ID im Request-Body gefunden');
      return new Response(
        JSON.stringify({ error: 'Keine Modell-ID angegeben' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
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
    
    // Prüfen, ob das Modell existiert
    console.log('Suche nach bestehendem Modell mit ID:', id);
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
    
    console.log('Bestehendes Modell gefunden, bereite Update vor');
    
    // Update-Daten vorbereiten
    const updateData: Record<string, any> = {
      ...bodyData,
      lastModified: new Date()
    };
    
    // ID aus den Aktualisierungsdaten entfernen
    delete updateData._id;
    
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