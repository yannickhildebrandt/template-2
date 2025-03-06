'use client';

import { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface BpmnEditorProps {
  xml: string;
  onChange: (xml: string) => void;
  setModeler: (modeler: any) => void;
  theme: string;
  onElementSelect: (element: any) => void;
}

export default function BpmnEditor({ 
  xml, 
  onChange, 
  setModeler, 
  theme, 
  onElementSelect 
}: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);

  useEffect(() => {
    // Initialize the modeler
    if (containerRef.current && !modelerRef.current) {
      const modeler = new BpmnModeler({
        container: containerRef.current,
        keyboard: {
          bindTo: window
        }
      });

      // Save changes when the diagram changes
      modeler.on('commandStack.changed', async () => {
        try {
          const { xml } = await modeler.saveXML({ format: true });
          onChange(xml);
        } catch (err) {
          console.error('Error saving BPMN XML:', err);
        }
      });

      // Handle element selection
      modeler.on('selection.changed', (e: any) => {
        const selectedElements = e.newSelection;
        if (selectedElements.length > 0) {
          const element = selectedElements[0];
          const businessObject = element.businessObject;
          onElementSelect({
            id: businessObject.id,
            type: businessObject.$type.replace('bpmn:', ''),
            element: element,
            businessObject: businessObject
          });
        } else {
          onElementSelect(null);
        }
      });

      modelerRef.current = modeler;
      setModeler(modeler);
    }

    // Import the XML diagram
    if (modelerRef.current && xml) {
      try {
        modelerRef.current.importXML(xml);
      } catch (err) {
        console.error('Error importing BPMN XML:', err);
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [xml, onChange, setModeler, onElementSelect]);

  // Apply theme to the BPMN editor
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Remove all theme classes
    container.classList.remove('theme-light', 'theme-dark', 'theme-blue');
    
    // Add the current theme class
    container.classList.add(`theme-${theme}`);
    
    // Apply CSS custom properties for theming
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--diagram-bg-color', '#2d3748');
      document.documentElement.style.setProperty('--diagram-stroke-color', '#e2e8f0');
      document.documentElement.style.setProperty('--diagram-fill-color', '#4a5568');
      document.documentElement.style.setProperty('--diagram-text-color', '#f7fafc');
    } else if (theme === 'blue') {
      document.documentElement.style.setProperty('--diagram-bg-color', '#ebf8ff');
      document.documentElement.style.setProperty('--diagram-stroke-color', '#2b6cb0');
      document.documentElement.style.setProperty('--diagram-fill-color', '#bee3f8');
      document.documentElement.style.setProperty('--diagram-text-color', '#2c5282');
    } else {
      document.documentElement.style.setProperty('--diagram-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--diagram-stroke-color', '#000000');
      document.documentElement.style.setProperty('--diagram-fill-color', '#f7fafc');
      document.documentElement.style.setProperty('--diagram-text-color', '#1a202c');
    }
    
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full transition-colors duration-300 ${
        theme === 'dark' ? 'shadow-inner-dark' : 'shadow-inner'
      }`}
    />
  );
} 