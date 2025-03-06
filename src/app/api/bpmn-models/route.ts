import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import BpmnModel from '@/lib/db/models/BpmnModel';

// GET: Alle Modelle oder gefilterte Modelle abrufen
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const folderId = searchParams.get('folderId') || 'root';
    
    console.log('GET: Modelle abrufen, Suchbegriff:', query, 'Ordner:', folderId);
    
    let filterOptions: any = { isFolder: { $ne: true } }; // Keine Ordner, nur Modelle
    
    // Wenn ein Ordner angegeben wurde, filtere nach diesem Ordner
    if (folderId) {
      filterOptions.folderId = folderId;
    }
    
    // Wenn eine Suchabfrage vorhanden ist, führe eine Textsuche durch
    if (query) {
      const searchFilter = { $text: { $search: query } };
      filterOptions = { ...filterOptions, ...searchFilter };
      
      // Modelle nach Relevanz sortieren
      const models = await BpmnModel.find(
        filterOptions,
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
      
      return new Response(
        JSON.stringify(models),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Alle Modelle nach Erstellungszeitpunkt sortiert
      const models = await BpmnModel.find(filterOptions).sort({ createdAt: -1 });
      
      return new Response(
        JSON.stringify(models),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Abrufen der BPMN-Modelle:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Abrufen der Modelle', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST: Ein neues Modell erstellen
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    console.log('POST: Neues Modell erstellen');
    
    // Aktuelle Zeit für Erstellung und letzte Änderung
    const now = new Date();
    
    // Stelle sicher, dass die erforderlichen Felder vorhanden sind
    const modelData = {
      ...body,
      folderId: body.folderId || 'root', // Standardmäßig im Hauptordner
      isFolder: false, // Es handelt sich um ein Modell, nicht um einen Ordner
      createdAt: body.createdAt || now,
      lastModified: now
    };
    
    const model = await BpmnModel.create(modelData);
    
    return new Response(
      JSON.stringify(model),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Erstellen des BPMN-Modells:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Erstellen des Modells', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// DELETE: Ein Modell löschen über Query-Parameter
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    console.log('DELETE: Modell löschen mit ID:', id);
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Keine Modell-ID angegeben' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
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