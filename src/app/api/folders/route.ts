import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import Folder from '@/lib/db/models/FolderModel';
import BpmnModel from '@/lib/db/models/BpmnModel';

// GET: Alle Ordner oder Ordner mit einem bestimmten parentId abrufen
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId') || 'root';
    
    console.log('GET: Ordner abrufen, parentId:', parentId);
    
    // Ordner nach dem übergeordneten Ordner filtern
    const folders = await Folder.find({ parentId }).sort({ name: 1 });
    
    return new Response(
      JSON.stringify(folders),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Abrufen der Ordner:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Abrufen der Ordner', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST: Einen neuen Ordner erstellen
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    console.log('POST: Neuen Ordner erstellen:', body.name);
    
    // Überprüfen, ob ein Ordner mit diesem Namen bereits im selben übergeordneten Ordner existiert
    const existingFolder = await Folder.findOne({ 
      name: body.name, 
      parentId: body.parentId || 'root' 
    });
    
    if (existingFolder) {
      return new Response(
        JSON.stringify({ error: 'Ein Ordner mit diesem Namen existiert bereits im ausgewählten Ordner' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Pfad erstellen
    let path = '/';
    if (body.parentId && body.parentId !== 'root') {
      const parentFolder = await Folder.findById(body.parentId);
      if (parentFolder) {
        path = `${parentFolder.path}${parentFolder.name}/`;
      }
    }
    
    // Neuen Ordner erstellen
    const now = new Date();
    const folder = await Folder.create({
      ...body,
      path,
      createdAt: now,
      lastModified: now
    });
    
    return new Response(
      JSON.stringify(folder),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Erstellen des Ordners:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Erstellen des Ordners', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// PUT: Einen Ordner aktualisieren
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    console.log('PUT: Ordner aktualisieren, ID:', id);
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Keine Ordner-ID angegeben' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Ordner-ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Ordner aktualisieren
    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { ...updateData, lastModified: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedFolder) {
      return new Response(
        JSON.stringify({ error: 'Ordner nicht gefunden' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify(updatedFolder),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Aktualisieren des Ordners:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Aktualisieren des Ordners', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// DELETE: Einen Ordner löschen
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    console.log('DELETE: Ordner löschen mit ID:', id);
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Keine Ordner-ID angegeben' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Ordner-ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Prüfen, ob Ordner Unterordner oder Modelle enthält
    const subFolders = await Folder.find({ parentId: id });
    const modelsInFolder = await BpmnModel.find({ folderId: id });
    
    if (subFolders.length > 0 || modelsInFolder.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Der Ordner kann nicht gelöscht werden, da er Unterordner oder Modelle enthält',
          subFolders: subFolders.length,
          models: modelsInFolder.length
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Ordner löschen
    const deletedFolder = await Folder.findByIdAndDelete(id);
    
    if (!deletedFolder) {
      return new Response(
        JSON.stringify({ error: 'Ordner nicht gefunden' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ message: 'Ordner erfolgreich gelöscht', id }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fehler beim Löschen des Ordners:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Löschen des Ordners', 
        details: errorMessage 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 