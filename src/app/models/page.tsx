'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BpmnModel {
  _id: string;
  name: string;
  description: string;
  svg: string;
  xml: string;
  createdAt: string;
  lastModified: string;
  tags: string[];
  createdBy: string;
  folderId?: string;
  isFolder?: boolean;
}

interface Folder {
  _id: string;
  name: string;
  description: string;
  parentId: string;
  path: string;
  createdAt: string;
  lastModified: string;
  createdBy: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<BpmnModel[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [currentFolderPath, setCurrentFolderPath] = useState<string[]>(['Hauptverzeichnis']);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState<boolean>(false);
  const [showMoveModelModal, setShowMoveModelModal] = useState<boolean>(false);
  const [selectedModelToMove, setSelectedModelToMove] = useState<BpmnModel | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('root');
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const router = useRouter();

  // Laden aller Modelle und Ordner beim Start
  useEffect(() => {
    fetchFolders();
    fetchModels();
  }, [currentFolderId]);

  // Ordner aus der Datenbank laden
  const fetchFolders = async () => {
    try {
      const url = `/api/folders?parentId=${currentFolderId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Ordner');
      }
      
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Fehler beim Laden der Ordner:', error);
      setError(`Fehler beim Laden der Ordner: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Modelle aus der Datenbank laden
  const fetchModels = async (query: string = '') => {
    setLoading(true);
    try {
      // URL mit Ordner-ID und optional Suchparameter
      const baseUrl = `/api/bpmn-models?folderId=${currentFolderId}`;
      const url = query 
        ? `${baseUrl}&query=${encodeURIComponent(query)}` 
        : baseUrl;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Modelle');
      }
      
      const data = await response.json();
      setModels(data);
      setError(null);
    } catch (error) {
      console.error('Fehler beim Laden der Modelle:', error);
      setError(`Fehler beim Laden der Modelle: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Modell aus der Datenbank löschen
  const deleteModel = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Modell löschen möchten?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Verwende eine alternative URL mit Query-Parameter statt Pfadparameter
      const response = await fetch(`/api/bpmn-models?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Robustere Verarbeitung der Response
      const responseText = await response.text();
      
      let data;
      try {
        // Nur parsen, wenn tatsächlich Text vorhanden ist
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Leere Antwort vom Server erhalten');
          data = {};
        }
      } catch (parseError) {
        console.error('JSON-Parsing-Fehler:', parseError);
        console.error('Response-Text:', responseText);
        setError(`Modell konnte nicht gelöscht werden: JSON-Parsing-Fehler. Server-Antwort: ${responseText.substring(0, 100)}...`);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorMsg = data?.error || 'Unbekannter Fehler';
        setError(`Fehler beim Löschen des Modells: ${errorMsg}`);
        console.error('Fehler beim Löschen des Modells:', data);
      } else {
        console.log('Modell erfolgreich gelöscht:', data);
        setError(null);
        // Aktualisiere die Liste der Modelle
        fetchModels();
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Modells:', error);
      setError(`Modell konnte nicht gelöscht werden: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Suche ausführen
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModels(searchQuery);
  };

  // Datumsformatierung
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Zurück zum Editor
  const goToEditor = () => {
    // Leeres Modell im aktuellen Ordner erstellen
    localStorage.setItem('currentModel', JSON.stringify({
      id: '',
      name: '',
      description: '',
      xml: '',
      tags: [],
      folderId: currentFolderId
    }));
    
    // Navigiere zum Editor
    router.push('/');
  };

  // Modell im Editor öffnen
  const openModelInEditor = (model: BpmnModel) => {
    // Speichere das Modell im localStorage für den Editor
    localStorage.setItem('currentModel', JSON.stringify({
      id: model._id,
      name: model.name,
      description: model.description,
      xml: model.xml,
      tags: model.tags,
      folderId: model.folderId || 'root'
    }));
    
    // Navigiere zum Editor
    router.push('/');
  };

  // Ordner erstellen
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Bitte geben Sie einen Ordnernamen ein');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
          description: '',
        }),
      });
      
      const responseText = await response.text();
      
      let data;
      try {
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Leere Antwort vom Server erhalten');
          data = {};
        }
      } catch (parseError) {
        console.error('JSON-Parsing-Fehler:', parseError);
        console.error('Response-Text:', responseText);
        setError(`Ordner konnte nicht erstellt werden: JSON-Parsing-Fehler. Server-Antwort: ${responseText.substring(0, 100)}...`);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorMsg = data?.error || 'Unbekannter Fehler';
        setError(`Fehler beim Erstellen des Ordners: ${errorMsg}`);
        console.error('Fehler beim Erstellen des Ordners:', data);
      } else {
        console.log('Ordner erfolgreich erstellt:', data);
        setError(null);
        setNewFolderName('');
        setShowNewFolderDialog(false);
        // Aktualisiere die Liste der Ordner
        fetchFolders();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      setError(`Ordner konnte nicht erstellt werden: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Ordner löschen
  const deleteFolder = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Ordner löschen möchten?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/folders?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseText = await response.text();
      
      let data;
      try {
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Leere Antwort vom Server erhalten');
          data = {};
        }
      } catch (parseError) {
        console.error('JSON-Parsing-Fehler:', parseError);
        console.error('Response-Text:', responseText);
        setError(`Ordner konnte nicht gelöscht werden: JSON-Parsing-Fehler. Server-Antwort: ${responseText.substring(0, 100)}...`);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorMsg = data?.error || 'Unbekannter Fehler';
        setError(`Fehler beim Löschen des Ordners: ${errorMsg}`);
        console.error('Fehler beim Löschen des Ordners:', data);
      } else {
        console.log('Ordner erfolgreich gelöscht:', data);
        setError(null);
        // Aktualisiere die Liste der Ordner
        fetchFolders();
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Ordners:', error);
      setError(`Ordner konnte nicht gelöscht werden: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // In einen Ordner navigieren
  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder._id);
    setCurrentFolderPath([...currentFolderPath, folder.name]);
  };

  // Zum übergeordneten Ordner navigieren
  const navigateUp = async () => {
    if (currentFolderId === 'root') {
      return; // Wir sind bereits im Hauptverzeichnis
    }
    
    try {
      // Finde den übergeordneten Ordner
      const currentFolder = folders.find(f => f._id === currentFolderId);
      if (currentFolder) {
        setCurrentFolderId(currentFolder.parentId || 'root');
        // Entferne den letzten Eintrag aus dem Pfad
        setCurrentFolderPath(currentFolderPath.slice(0, -1));
      } else {
        // Falls wir den aktuellen Ordner nicht finden können, gehen wir zum Hauptverzeichnis zurück
        setCurrentFolderId('root');
        setCurrentFolderPath(['Hauptverzeichnis']);
      }
    } catch (error) {
      console.error('Fehler beim Navigieren zum übergeordneten Ordner:', error);
      setError(`Fehler beim Navigieren: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Zum Hauptverzeichnis zurückkehren
  const navigateToRoot = () => {
    setCurrentFolderId('root');
    setCurrentFolderPath(['Hauptverzeichnis']);
  };

  // Alle Ordner für das Verschieben-Modal laden
  const fetchAllFolders = async () => {
    try {
      const response = await fetch('/api/folders/all');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden aller Ordner');
      }
      
      const data = await response.json();
      setAllFolders(data);
    } catch (error) {
      console.error('Fehler beim Laden aller Ordner:', error);
      setError(`Fehler beim Laden aller Ordner: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Modell zwischen Ordnern verschieben
  const moveModel = async () => {
    if (!selectedModelToMove) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/bpmn-models/${selectedModelToMove._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: targetFolderId
        }),
      });
      
      const responseText = await response.text();
      
      let data;
      try {
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Leere Antwort vom Server erhalten');
          data = {};
        }
      } catch (parseError) {
        console.error('JSON-Parsing-Fehler:', parseError);
        console.error('Response-Text:', responseText);
        setError(`Modell konnte nicht verschoben werden: JSON-Parsing-Fehler. Server-Antwort: ${responseText.substring(0, 100)}...`);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorMsg = data?.error || 'Unbekannter Fehler';
        setError(`Fehler beim Verschieben des Modells: ${errorMsg}`);
        console.error('Fehler beim Verschieben des Modells:', data);
      } else {
        console.log('Modell erfolgreich verschoben:', data);
        setError(null);
        setShowMoveModelModal(false);
        setSelectedModelToMove(null);
        // Aktualisiere die Liste der Modelle
        fetchModels();
      }
    } catch (error) {
      console.error('Fehler beim Verschieben des Modells:', error);
      setError(`Modell konnte nicht verschoben werden: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Modal zum Verschieben eines Modells öffnen
  const openMoveModelModal = (model: BpmnModel) => {
    setSelectedModelToMove(model);
    setTargetFolderId(model.folderId || 'root');
    fetchAllFolders();
    setShowMoveModelModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">BPMN-Modelle</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewFolderDialog(true)}
                className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-md"
              >
                Neuer Ordner
              </button>
              <button
                onClick={goToEditor}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Neues Modell
              </button>
            </div>
          </div>
          
          {/* Breadcrumb-Navigation */}
          <div className="flex items-center mb-4 text-sm">
            <button 
              onClick={navigateToRoot}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Hauptverzeichnis
            </button>
            
            {currentFolderPath.slice(1).map((folderName, index) => (
              <div key={index} className="flex items-center">
                <span className="mx-2 text-gray-500">/</span>
                <span className="text-gray-700">{folderName}</span>
              </div>
            ))}
            
            {currentFolderId !== 'root' && (
              <button 
                onClick={navigateUp}
                className="ml-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück
              </button>
            )}
          </div>
          
          {/* Suchleiste */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <input
                type="text"
                placeholder="Modelle suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-md"
              >
                Suchen
              </button>
            </form>
          </div>
          
          {/* Neuer Ordner Dialog */}
          {showNewFolderDialog && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Neuen Ordner erstellen</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ordnername"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={createFolder}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Erstellen
                </button>
                <button
                  onClick={() => setShowNewFolderDialog(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          
          {/* Fehlermeldung */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
            </div>
          )}
          
          {/* Ladeanzeige */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Ordner und Modelle anzeigen */}
              <div className="mb-8">
                {/* Ordner */}
                {folders.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-3">Ordner</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {folders.map((folder) => (
                        <div
                          key={folder._id}
                          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          <div className="p-4 flex items-center">
                            <div className="mr-3 text-yellow-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 truncate">{folder.name}</h3>
                              {folder.description && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-1">{folder.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="px-4 py-3 bg-gray-50 flex justify-between">
                            <button
                              onClick={() => navigateToFolder(folder)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Öffnen
                            </button>
                            <button
                              onClick={() => deleteFolder(folder._id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Modelle */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Modelle</h2>
                  {models.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">Keine Modelle in diesem Ordner.</p>
                      <button
                        onClick={goToEditor}
                        className="mt-4 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm"
                      >
                        Neues Modell erstellen
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {models.map((model) => (
                        <div
                          key={model._id}
                          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
                        >
                          {/* SVG-Vorschau */}
                          <div 
                            className="p-4 h-48 flex items-center justify-center bg-gray-50 border-b border-gray-200 overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: model.svg }}
                          />
                          
                          {/* Modell-Informationen */}
                          <div className="px-4 py-4">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{model.name}</h3>
                            {model.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{model.description}</p>
                            )}
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span>Erstellt: {formatDate(model.createdAt)}</span>
                              <span className="mx-1">•</span>
                              <span>Geändert: {formatDate(model.lastModified)}</span>
                            </div>
                          </div>
                          
                          {/* Aktionen */}
                          <div className="px-4 py-3 bg-gray-50 flex justify-between">
                            <button
                              onClick={() => openModelInEditor(model)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Bearbeiten
                            </button>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openMoveModelModal(model)}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Verschieben
                              </button>
                              <button
                                onClick={() => deleteModel(model._id)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                Löschen
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal zum Verschieben eines Modells */}
      {showMoveModelModal && selectedModelToMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Modell verschieben: {selectedModelToMove.name}
            </h3>
            <div className="mb-4">
              <label htmlFor="targetFolder" className="block text-sm font-medium text-gray-700 mb-1">
                Zielordner auswählen:
              </label>
              <select
                id="targetFolder"
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="root">Hauptverzeichnis</option>
                {allFolders.map((folder) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.path}{folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMoveModelModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
              >
                Abbrechen
              </button>
              <button
                onClick={moveModel}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
                disabled={loading}
              >
                {loading ? 'Wird verschoben...' : 'Verschieben'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 