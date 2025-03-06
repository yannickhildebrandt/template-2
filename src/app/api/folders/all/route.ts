import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Folder from '@/lib/db/models/FolderModel';

// GET: Alle Ordner abrufen (für Dropdown-Menüs etc.)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    console.log('GET: Alle Ordner abrufen');
    
    // Alle Ordner nach Pfad sortiert abrufen
    const folders = await Folder.find({}).sort({ path: 1, name: 1 });
    
    return new Response(
      JSON.stringify(folders),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Abrufen aller Ordner:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Abrufen aller Ordner', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 