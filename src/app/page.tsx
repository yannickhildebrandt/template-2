'use client';

import { useEffect, useRef, useState } from 'react';
// Import des vollständigen BPMN.js-Pakets statt nur des Modelers
import BpmnModeler from 'bpmn-js/lib/Modeler';

// Importiere die CSS
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "./bpmn-overrides.css";

// Zusätzliche Importe für den Export
import { saveAs } from 'file-saver';
import Link from 'next/link';

export default function MinimalBpmnEditor() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [modeler, setModeler] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [diagramName, setDiagramName] = useState<string>("bpmn-diagram");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);
  const modelerInstance = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Einfaches BPMN-XML als Startpunkt mit korrekter Formatierung
  const initialBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Aufgabe 1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Ende">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="155" y="145" width="31" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="262" y="113" width="56" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="392" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="396" y="145" width="28" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="392" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  // BPMN-Modeler initialisieren
  useEffect(() => {
    initBpmnModeler();
    
    // Versuche, ein Modell aus dem lokalen Speicher zu laden
    const storedModel = typeof window !== 'undefined' ? localStorage.getItem('currentModel') : null;
    
    if (storedModel) {
      try {
        const modelData = JSON.parse(storedModel);
        
        // Verzögerung hinzufügen, um sicherzustellen, dass der Modeler initialisiert ist
        setTimeout(() => {
          if (modelerInstance.current && modelData.xml) {
            importBpmnXML(modelerInstance.current, modelData.xml);
            if (modelData.name) {
              setDiagramName(modelData.name);
              setModelName(modelData.name);
            }
            if (modelData.description) {
              setModelDescription(modelData.description);
            }
          }
        }, 500);
      } catch (error) {
        console.error('Fehler beim Parsen des gespeicherten Modells:', error);
        // Fallback auf das Standard-Diagramm
        if (modelerInstance.current) {
          importBpmnXML(modelerInstance.current, initialBpmnXml);
        }
      }
    } else {
      // Kein gespeichertes Modell, lade das Standard-Diagramm
      setTimeout(() => {
        if (modelerInstance.current) {
          importBpmnXML(modelerInstance.current, initialBpmnXml);
        }
      }, 500);
    }
    
    // Aufräumen beim Unmount
    return () => {
      if (modelerInstance.current) {
        modelerInstance.current.destroy();
      }
    };
  }, []);

  const initBpmnModeler = () => {
    if (!canvasRef.current) {
      console.error("Canvas-Referenz nicht gefunden");
      return;
    }

    try {
      if (modelerInstance.current) {
        try {
          modelerInstance.current.destroy();
        } catch (e) {
          console.error("Fehler beim Zurücksetzen des vorherigen Modelers", e);
        }
      }

      // Modeler mit vollständiger Konfiguration und allen benötigten Modulen
      const bpmnModeler = new BpmnModeler({
        container: canvasRef.current,
        keyboard: { bindTo: document },
        // Höhe und Breite explizit setzen
        width: '100%',
        height: '100%',
        // Stelle sicher, dass alle benötigten Module aktiv sind
        additionalModules: [],
        // Aktiviere alle Standard-Interaktionen
        contextPad: {
          autoPlace: true,
          // Alle BPMN Elemente anzeigen
          components: ['bpmn-replace', 'connect', 'append.start-event', 'append.intermediate-event', 
                      'append.end-event', 'append.gateway', 'append.append-task', 'append.text-annotation']
        },
        // Aktiviere Replace-Menu (für verschiedene Aktivitätstypen)
        bpmnReplace: {
          menu: true
        },
        // Aktiviere das Verbinden von Elementen
        connectionPreview: {
          enabled: true
        },
        // Aktiviere den Replace-Popup für Task-Typen
        popupMenu: {
          autoPlace: true
        },
        // Font-Einstellungen für Text-Labels
        canvas: {
          deferUpdate: false
        },
        textRenderer: {
          defaultStyle: {
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            fontSize: 12,
            fontWeight: 'normal',
            fill: '#333',
            letterSpacing: '0.2px',
            stroke: 'none',
            textAnchor: 'middle',
            alignmentBaseline: 'middle'
          },
          externalStyle: {
            fontSize: 12,
            fontWeight: 'normal',
            letterSpacing: '0.2px',
            stroke: 'none',
            textAnchor: 'middle',
            alignmentBaseline: 'middle'
          }
        },
        // Steuerung des Text-Renderings
        renderer: {
          defaultFillColor: '#333',
          defaultStrokeColor: '#000'
        },
        // Label-Positionierung
        labelEditingProvider: {
          autoResize: true,
          centerVertically: true
        },
        // Direkte Textbearbeitung
        directEditing: {
          active: true,
          style: {
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
            fontSize: '12px',
            color: '#333',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '2px',
            padding: '3px',
            textAlign: 'center'
          }
        },
        // Leer lassen für Standardverhalten
        moddleExtensions: {}
      });

      // Debug: Liste alle verfügbaren Module
      console.log('Verfügbare Module:', Object.keys(bpmnModeler));

      modelerInstance.current = bpmnModeler;
      setModeler(bpmnModeler);
      setStatus("BPMN Editor erfolgreich geladen");

      // XML importieren mit Verzögerung
      setTimeout(() => {
        importBpmnXML(bpmnModeler, initialBpmnXml);
      }, 100);
    } catch (error) {
      console.error("Fehler bei der Initialisierung des BPMN-Modelers:", error);
      setStatus(`Fehler bei der Initialisierung: ${error}`);
    }
  };

  const importBpmnXML = (bpmnModeler: any, xml: string) => {
    if (!bpmnModeler) {
      console.error("Modeler nicht initialisiert");
      setStatus("Fehler: Modeler nicht initialisiert");
      return;
    }

    bpmnModeler.importXML(xml)
      .then((result: any) => {
        const { warnings } = result;
        
        if (warnings && warnings.length) {
          console.warn('Warnungen beim Import des BPMN-Diagramms:', warnings);
        }
        
        try {
          // Canvas anpassen
          const canvas = bpmnModeler.get('canvas');
          if (canvas) {
            canvas.zoom('fit-viewport');
            setZoom(canvas.zoom());
          }
          
          // EventBus für Änderungserkennung
          const eventBus = bpmnModeler.get('eventBus');
          if (eventBus && typeof eventBus.on === 'function') {
            eventBus.on('commandStack.changed', () => {
              console.log('Änderungen im Diagramm erkannt');
            });
          }

          // Erfolgreichen Import bestätigen
          setStatus("BPMN Diagramm erfolgreich geladen");
        } catch (err) {
          console.error("Fehler nach dem XML-Import:", err);
          setStatus(`Fehler nach dem XML-Import: ${err}`);
        }
      })
      .catch((err: Error) => {
        console.error('Fehler beim Import des BPMN-Diagramms:', err);
        setStatus(`Fehler beim Import des BPMN-Diagramms: ${err.message}`);
      });
  };

  // Exportfunktionen 
  const exportSVG = async () => {
    try {
      if (!modeler) return;
      
      const { svg } = await modeler.saveSVG();
      
      // SVG als Datei speichern
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      saveAs(svgBlob, `${diagramName}.svg`);
      
      showNotification('SVG erfolgreich exportiert!', 'success');
    } catch (err) {
      console.error('Fehler beim Export als SVG:', err);
      showNotification('Fehler beim Export als SVG', 'error');
    }
  };

  const exportPNG = async () => {
    try {
      if (!modeler) return;
      
      const { svg } = await modeler.saveSVG();
      
      // SVG in ein Bild konvertieren
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // SVG in ein Bild umwandeln
      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Canvas in PNG umwandeln
        canvas.toBlob((blob) => {
          if (!blob) return;
          saveAs(blob, `${diagramName}.png`);
          showNotification('PNG erfolgreich exportiert!', 'success');
        });
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (err) {
      console.error('Fehler beim Export als PNG:', err);
      showNotification('Fehler beim Export als PNG', 'error');
    }
  };

  const exportXML = async () => {
    try {
      if (!modeler) return;
      
      const { xml } = await modeler.saveXML({ format: true });
      
      // XML als Datei speichern
      const xmlBlob = new Blob([xml], { type: 'application/xml' });
      saveAs(xmlBlob, `${diagramName}.bpmn`);
      
      showNotification('BPMN-XML erfolgreich exportiert!', 'success');
    } catch (err) {
      console.error('Fehler beim Export als XML:', err);
      showNotification('Fehler beim Export als XML', 'error');
    }
  };
  
  // Zoom-Funktionen
  const zoomIn = () => {
    if (!modeler) return;
    try {
      const canvas = modeler.get('canvas');
      if (canvas) {
        canvas.zoom(canvas.zoom() * 1.1);
        setZoom(canvas.zoom());
      }
    } catch (err) {
      console.error("Fehler beim Zoomen:", err);
    }
  };

  const zoomOut = () => {
    if (!modeler) return;
    try {
      const canvas = modeler.get('canvas');
      if (canvas) {
        canvas.zoom(canvas.zoom() * 0.9);
        setZoom(canvas.zoom());
      }
    } catch (err) {
      console.error("Fehler beim Zoomen:", err);
    }
  };

  const zoomReset = () => {
    if (!modeler) return;
    try {
      const canvas = modeler.get('canvas');
      if (canvas) {
        canvas.zoom(1.0);
        setZoom(1.0);
      }
    } catch (err) {
      console.error("Fehler beim Zurücksetzen des Zooms:", err);
    }
  };

  const zoomFit = () => {
    if (!modeler) return;
    try {
      const canvas = modeler.get('canvas');
      if (canvas) {
        canvas.zoom('fit-viewport', 'auto');
        setZoom(canvas.zoom());
      }
    } catch (err) {
      console.error("Fehler beim Anpassen des Zooms:", err);
    }
  };

  // Neues Diagramm erstellen
  const createNewDiagram = () => {
    if (!modeler) return;
    
    try {
      importBpmnXML(modeler, initialBpmnXml);
      showNotification('Neues Diagramm erstellt!', 'success');
    } catch (err) {
      console.error('Fehler beim Erstellen eines neuen Diagramms:', err);
      showNotification('Fehler beim Erstellen eines neuen Diagramms', 'error');
    }
  };
  
  // XML importieren
  const importXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modeler) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlContent = event.target?.result as string;
      if (xmlContent) {
        try {
          importBpmnXML(modeler, xmlContent);
          
          // Dateiname ohne Erweiterung als Diagrammname verwenden
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          setDiagramName(fileName);
          showNotification('BPMN-Datei erfolgreich importiert!', 'success');
        } catch (err) {
          console.error('Fehler beim Import der BPMN-Datei:', err);
          showNotification('Fehler beim Import der BPMN-Datei', 'error');
        }
      }
    };
    reader.readAsText(file);
    
    // Input zurücksetzen, damit derselbe File nochmal selektiert werden kann
    e.target.value = '';
  };

  // Benachrichtigung anzeigen
  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (modeler) {
        try {
          const canvas = modeler.get('canvas');
          if (canvas) {
            canvas.zoom('fit-viewport', 'auto');
            setZoom(canvas.zoom());
          }
        } catch (err) {
          console.error("Fehler beim Anpassen des Zoom nach Vollbildmodus:", err);
        }
      }
    }, 100);
  };

  // Funktion zum Speichern des Modells in der Datenbank
  const saveModelToDatabase = async (name: string, description: string, tags: string[] = []) => {
    try {
      if (!modeler) {
        throw new Error('BPMN-Modeler nicht initialisiert');
      }
      
      console.log('Starte Speichervorgang...');
      
      // XML und SVG exportieren
      let xml, svg;
      try {
        const xmlResult = await modeler.saveXML({ format: true });
        xml = xmlResult.xml;
        
        const svgResult = await modeler.saveSVG();
        svg = svgResult.svg;
        
        console.log('XML und SVG erfolgreich exportiert');
      } catch (exportError) {
        console.error('Fehler beim Exportieren von XML oder SVG:', exportError);
        throw new Error('Fehler beim Exportieren des Modells');
      }
      
      // Modell-ID aus dem lokalen Speicher holen (falls vorhanden)
      let currentModelData = { id: '', folderId: 'root' };
      const storedModel = localStorage.getItem('currentModel');
      if (storedModel) {
        try {
          currentModelData = JSON.parse(storedModel);
          console.log('Gespeichertes Modell gefunden, ID:', currentModelData.id);
        } catch (e) {
          console.error('Fehler beim Parsen des gespeicherten Modells:', e);
        }
      }
      
      const modelId = currentModelData.id;
      const folderId = selectedFolderId || currentModelData.folderId || 'root';
      
      console.log('Speichere Modell mit den folgenden Parametern:');
      console.log('- ID:', modelId || 'Neue ID (POST)');
      console.log('- Name:', name);
      console.log('- Ordner-ID:', folderId);
      console.log('- Tags:', tags);
      
      // API-Aufruf zum Speichern
      const method = modelId ? 'PUT' : 'POST';
      const url = modelId ? `/api/bpmn-models/${modelId}` : '/api/bpmn-models';
      
      console.log(`Sende ${method}-Anfrage an ${url}`);
      
      // TypeScript-konform definieren
      const modelData: Record<string, any> = {
        name,
        description,
        xml,
        svg,
        tags,
        folderId
      };
      
      // Nur bei PUT die ID hinzufügen
      if (modelId) {
        modelData._id = modelId;
      }
      
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modelData),
        });
        
        console.log('Antwort-Status:', response.status);
        
        const responseText = await response.text();
        console.log('Antwort-Text:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
        
        if (!response.ok) {
          let errorMessage = `Server-Fehler: ${response.status}`;
          
          try {
            if (responseText && responseText.trim()) {
              const errorData = JSON.parse(responseText);
              if (errorData.error) errorMessage = errorData.error;
              if (errorData.message) errorMessage = errorData.message;
              if (errorData.details) errorMessage += ` - ${errorData.details}`;
            }
          } catch (parseError) {
            console.error('Fehler beim Parsen der Fehlerantwort:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        let savedModel;
        try {
          savedModel = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Fehler beim Parsen der erfolgreichen Antwort:', parseError);
          throw new Error('Fehler beim Parsen der Server-Antwort');
        }
        
        console.log('Modell erfolgreich gespeichert, neue ID:', savedModel._id);
        showNotification(`Modell "${savedModel.name}" erfolgreich gespeichert`, 'success');
        
        // Aktualisiere die lokalen Daten
        localStorage.setItem('currentModel', JSON.stringify({
          id: savedModel._id,
          name: savedModel.name,
          description: savedModel.description,
          xml: savedModel.xml,
          tags: savedModel.tags || [],
          folderId: savedModel.folderId || 'root'
        }));
        
        return savedModel;
      } catch (fetchError) {
        console.error('Fehler bei der Netzwerkanfrage:', fetchError);
        throw fetchError;
      }
    } catch (error: unknown) {
      console.error('Fehler beim Speichern des Modells:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      showNotification(`Fehler beim Speichern des Modells: ${errorMessage}`, 'error');
      throw error;
    }
  };
  
  // Funktion zum Laden eines Modells aus der Datenbank
  const loadModelFromDatabase = async (modelId: string) => {
    try {
      // API-Aufruf zum Laden
      const response = await fetch(`/api/bpmn-models/${modelId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler beim Laden des Modells');
      }
      
      const model = await response.json();
      
      // XML im Modeler laden
      if (modeler && model.xml) {
        importBpmnXML(modeler, model.xml);
        showNotification(`Modell "${model.name}" erfolgreich geladen`, 'success');
      }
      
      // Aktualisiere die lokalen Daten
      localStorage.setItem('currentModel', JSON.stringify({
        id: model._id,
        name: model.name,
        description: model.description,
        xml: model.xml,
        tags: model.tags || [],
        folderId: model.folderId || 'root'
      }));
      
      return model;
    } catch (error) {
      console.error('Fehler beim Laden des Modells:', error);
      showNotification('Fehler beim Laden des Modells', 'error');
    }
  };
  
  // UI-Komponente für Modellspeicherung
  const [showSaveModelModal, setShowSaveModelModal] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("");
  const [modelDescription, setModelDescription] = useState<string>("");
  const [modelTags, setModelTags] = useState<string[]>([]);
  const [modelTagInput, setModelTagInput] = useState<string>("");
  const [allFolders, setAllFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [loadingFolders, setLoadingFolders] = useState<boolean>(false);
  const [isExistingModel, setIsExistingModel] = useState<boolean>(false);

  // Alle Ordner für den Speichern-Dialog laden
  const fetchAllFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await fetch('/api/folders/all');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Ordner');
      }
      
      const data = await response.json();
      setAllFolders(data);
      
      // Auswählen des aktuellen Ordners aus dem localStorage
      const storedModel = localStorage.getItem('currentModel');
      if (storedModel) {
        try {
          const modelData = JSON.parse(storedModel);
          if (modelData.folderId) {
            setSelectedFolderId(modelData.folderId);
          }
        } catch (e) {
          console.error('Fehler beim Parsen des gespeicherten Modells:', e);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Ordner:', error);
      showNotification('Fehler beim Laden der Ordner', 'error');
    } finally {
      setLoadingFolders(false);
    }
  };

  // Funktion zum Öffnen des Speichern-Dialogs
  const openSaveModelDialog = () => {
    // Name aus dem aktuellen Modell oder Diagrammnamen übernehmen
    const storedModel = localStorage.getItem('currentModel');
    if (storedModel) {
      try {
        const modelData = JSON.parse(storedModel);
        setModelName(modelData.name || diagramName);
        setModelDescription(modelData.description || "");
        setModelTags(modelData.tags || []);
        if (modelData.folderId) {
          setSelectedFolderId(modelData.folderId);
        }
        // Bestimmen, ob es sich um ein bestehendes Modell handelt
        setIsExistingModel(!!modelData.id);
      } catch (e) {
        console.error('Fehler beim Parsen des gespeicherten Modells:', e);
        setModelName(diagramName);
        setModelDescription("");
        setModelTags([]);
        setIsExistingModel(false);
      }
    } else {
      setModelName(diagramName);
      setModelDescription("");
      setModelTags([]);
      setIsExistingModel(false);
    }
    
    // Ordner laden
    fetchAllFolders();
    
    setShowSaveModelModal(true);
  };

  // Tag zum Modell hinzufügen
  const addTag = () => {
    if (modelTagInput.trim() && !modelTags.includes(modelTagInput.trim())) {
      setModelTags([...modelTags, modelTagInput.trim()]);
      setModelTagInput("");
    }
  };

  // Tag aus Modell entfernen
  const removeTag = (tagToRemove: string) => {
    setModelTags(modelTags.filter(tag => tag !== tagToRemove));
  };

  // Funktion zum Aktualisieren des bestehenden Modells
  const handleUpdateModel = async () => {
    if (!modelName.trim()) {
      showNotification('Bitte geben Sie einen Namen für das Modell ein', 'error');
      return;
    }
    
    try {
      // Modell-ID aus dem lokalen Speicher holen
      const storedModel = localStorage.getItem('currentModel');
      if (!storedModel) {
        showNotification('Kein bestehendes Modell gefunden', 'error');
        return;
      }
      
      const modelData = JSON.parse(storedModel);
      if (!modelData.id) {
        showNotification('Keine Modell-ID gefunden, Speicherung nicht möglich', 'error');
        return;
      }
      
      console.log('Aktualisiere bestehendes Modell mit ID:', modelData.id);
      
      // Explizit eine Modell-Aktualisierung durchführen
      if (!modeler) {
        throw new Error('BPMN-Modeler nicht initialisiert');
      }
      
      console.log('Exportiere XML und SVG...');
      const { xml } = await modeler.saveXML({ format: true });
      const { svg } = await modeler.saveSVG();
      
      const modelId = modelData.id;
      // Alternative Update-Route verwenden
      const url = `/api/bpmn-models/update`;
      
      console.log(`Sende POST-Anfrage an ${url} für Update des Modells ${modelId}`);
      
      const updateResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: modelId, // ID im Body für die Update-Route
          name: modelName,
          description: modelDescription,
          tags: modelTags,
          xml,
          svg,
          folderId: selectedFolderId,
        }),
      });
      
      console.log('Antwort-Status:', updateResponse.status);
      
      const responseText = await updateResponse.text();
      console.log('Antwort-Text:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
      
      if (!updateResponse.ok) {
        let errorMessage = `Server-Fehler: ${updateResponse.status}`;
        
        try {
          if (responseText && responseText.trim()) {
            const errorData = JSON.parse(responseText);
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.details) errorMessage += ` - ${errorData.details}`;
          }
        } catch (parseError) {
          console.error('Fehler beim Parsen der Fehlerantwort:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      try {
        // Antwort parsen
        const updatedModel = JSON.parse(responseText);
        console.log('Modell erfolgreich aktualisiert:', updatedModel);
        
        // Aktualisiere die lokalen Daten
        localStorage.setItem('currentModel', JSON.stringify({
          id: updatedModel._id,
          name: updatedModel.name,
          description: updatedModel.description,
          xml: updatedModel.xml,
          tags: updatedModel.tags || [],
          folderId: updatedModel.folderId || 'root'
        }));
        
        showNotification(`Modell "${updatedModel.name}" erfolgreich aktualisiert`, 'success');
      } catch (parseError) {
        console.error('Fehler beim Parsen der Erfolgsantwort:', parseError);
        throw new Error('Fehler beim Parsen der Server-Antwort');
      }
      
      setShowSaveModelModal(false);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Modells:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      showNotification(`Fehler beim Aktualisieren des Modells: ${errorMessage}`, 'error');
    }
  };
  
  // Funktion zum Speichern als neues Modell
  const handleSaveAsNewModel = async () => {
    if (!modelName.trim()) {
      showNotification('Bitte geben Sie einen Namen für das Modell ein', 'error');
      return;
    }
    
    // Temporär die currentModel ID aus dem localStorage entfernen
    const storedModel = localStorage.getItem('currentModel');
    let originalModelData = null;
    
    if (storedModel) {
      try {
        originalModelData = JSON.parse(storedModel);
        // Neue Kopie ohne ID erstellen
        const newModelData = { ...originalModelData, id: '' };
        localStorage.setItem('currentModel', JSON.stringify(newModelData));
      } catch (e) {
        console.error('Fehler beim Parsen des gespeicherten Modells:', e);
      }
    }
    
    // Als neues Modell speichern
    await saveModelToDatabase(modelName, modelDescription, modelTags);
    
    // Original wiederherstellen falls nötig
    if (originalModelData) {
      localStorage.setItem('currentModel', JSON.stringify(originalModelData));
    }
    
    setShowSaveModelModal(false);
  };
  
  // Funktion zum Speichern des Modells über den Dialog (jetzt mit Unterscheidung)
  const handleSaveModel = async () => {
    if (!modelName.trim()) {
      showNotification('Bitte geben Sie einen Namen für das Modell ein', 'error');
      return;
    }
    
    // Standard-Speicherverhalten (für neue Modelle)
    if (!isExistingModel) {
      await saveModelToDatabase(modelName, modelDescription, modelTags);
      setShowSaveModelModal(false);
    } else {
      // Bei bestehenden Modellen wird dieser Pfad nicht mehr genutzt,
      // da wir jetzt spezifische Buttons haben
      showNotification('Bitte wählen Sie "Aktualisieren" oder "Als Neu speichern"', 'info');
    }
  };

  return (
    <div className="bpmn-editor-container">
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">BPMN Editor</h1>
        <div className="flex gap-2">
          {status && (
            <div className="py-2 px-4 text-sm bg-gray-100 rounded-md">
              {status}
            </div>
          )}
          <Link href="/models" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm">
            Modellverwaltung
          </Link>
          <button
            onClick={() => setShowSaveModal(true)}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm"
          >
            Exportieren
          </button>
          <button
            onClick={openSaveModelDialog}
            className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm"
          >
            In Datenbank speichern
          </button>
        </div>
      </div>
      
      {/* BPMN Canvas ohne Toolbar (exakt wie auf bpmn.io) */}
      <div 
        ref={canvasRef} 
        id="canvas" 
        className="w-full h-full"
      ></div>
      
      {/* Export-Modal */}
      {showSaveModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
      </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Diagramm exportieren
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Wählen Sie das gewünschte Exportformat für Ihr BPMN-Diagramm.
          </p>
        </div>
                    
                    <div className="mt-4">
                      <label htmlFor="diagram-name" className="block text-sm font-medium text-gray-700">
                        Dateiname
                      </label>
                      <input
                        type="text"
                        id="diagram-name"
                        value={diagramName}
                        onChange={(e) => setDiagramName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={exportXML}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Als BPMN-XML speichern
                </button>
                <button
                  type="button"
                  onClick={exportSVG}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Als SVG speichern
                </button>
                <button
                  type="button"
                  onClick={exportPNG}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Als PNG speichern
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modell Speichern Dialog */}
      {showSaveModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isExistingModel ? 'Modell bearbeiten' : 'Neues Modell speichern'}
            </h2>
            
            <div className="mb-4">
              <label htmlFor="model-name" className="block text-sm font-medium text-gray-700 mb-1">
                Modellname:
              </label>
              <input
                type="text"
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Name des Modells"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="model-description" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung:
              </label>
              <textarea
                id="model-description"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Beschreibung des Modells"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="folder-select" className="block text-sm font-medium text-gray-700 mb-1">
                Ordner:
              </label>
              <select
                id="folder-select"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                disabled={loadingFolders}
              >
                <option value="root">Hauptverzeichnis</option>
                {allFolders.map((folder) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.path}{folder.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="model-tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags:
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  id="model-tags"
                  value={modelTagInput}
                  onChange={(e) => setModelTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 border border-gray-300 rounded-l-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Tag hinzufügen (Enter drücken)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-r-md"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelTags.map((tag, index) => (
                  <div key={index} className="bg-blue-500 text-white rounded-md px-2 py-1 flex items-center text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-white hover:text-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSaveModelModal(false)}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
              >
                Abbrechen
              </button>
              
              {isExistingModel ? (
                <>
                  <button
                    onClick={handleUpdateModel}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                  >
                    Aktualisieren
                  </button>
                  <button
                    onClick={handleSaveAsNewModel}
                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                  >
                    Als Neu speichern
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSaveModel}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md"
                >
                  Speichern
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Benachrichtigungen */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="h-5 w-5 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {notification.message}
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
