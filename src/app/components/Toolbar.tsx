'use client';

import { useRef, useState } from 'react';
import { saveAs } from 'file-saver';

interface ToolbarProps {
  xml: string | null;
  modeler: any;
}

export default function Toolbar({ xml, modeler }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyMessage, setCopyMessage] = useState<string>('');

  // Export as SVG (Vector Format)
  const handleExportSVG = async () => {
    if (!modeler) return;
    
    try {
      const { svg } = await modeler.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, 'bpmn-diagram.svg');
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
  };

  // Export as PNG (Raster Format)
  const handleExportPNG = async () => {
    try {
      const svgElement = document.querySelector('.bjs-container svg');
      if (svgElement) {
        // Get SVG content
        const serializer = new XMLSerializer();
        const svgXml = serializer.serializeToString(svgElement);
        
        // Create SVG data URL
        const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        // Create canvas and context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create an image from the SVG data URL
          const img = new Image();
          img.onload = () => {
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to PNG data URL
            canvas.toBlob((blob) => {
              if (blob) {
                saveAs(blob, 'bpmn-diagram.png');
              }
              URL.revokeObjectURL(url);
            }, 'image/png');
          };
          
          // Set the source of the image
          img.src = url;
        }
      }
    } catch (err) {
      console.error('Error exporting PNG:', err);
    }
  };

  // Export as EMF for PowerPoint (Enhanced Metafile Format)
  const handleExportEMF = async () => {
    try {
      if (!modeler) return;
      
      const { svg } = await modeler.saveSVG();
      
      // Create a new form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/svg-to-emf';
      form.target = '_blank';
      
      // Add SVG content to form
      const svgInput = document.createElement('input');
      svgInput.type = 'hidden';
      svgInput.name = 'svg';
      svgInput.value = svg;
      form.appendChild(svgInput);
      
      // Add form to document and submit
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (err) {
      console.error('Error exporting EMF:', err);
    }
  };

  // Copy to clipboard for PowerPoint
  const handleCopyForPowerPoint = async () => {
    try {
      if (!modeler) return;
      
      const { svg } = await modeler.saveSVG();
      
      // For modern browsers using the Clipboard API
      if (navigator.clipboard) {
        // Create a Blob from the SVG
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
        
        try {
          // Create a ClipboardItem for the SVG
          const clipboardItem = new ClipboardItem({
            'image/svg+xml': svgBlob
          });
          
          // Write the ClipboardItem to the clipboard
          await navigator.clipboard.write([clipboardItem]);
          
          setCopyMessage('Diagram copied! Paste in PowerPoint using Ctrl+V');
          setTimeout(() => setCopyMessage(''), 3000);
        } catch (e) {
          console.error('Clipboard API failed:', e);
          
          // Fallback: Copy SVG as text
          await navigator.clipboard.writeText(svg);
          setCopyMessage('SVG code copied! In PowerPoint, use "Insert > Pictures > This Device" and select the saved SVG file');
          setTimeout(() => setCopyMessage(''), 5000);
        }
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = svg;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopyMessage('SVG code copied! Save as .svg file and insert into PowerPoint');
        setTimeout(() => setCopyMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error copying for PowerPoint:', err);
      setCopyMessage('Error copying diagram');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  };

  // Import BPMN file
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && modeler) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          modeler.importXML(content).catch((err: any) => {
            console.error('Error importing BPMN diagram', err);
          });
          
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-gray-100 p-4 flex flex-col border-b border-gray-300">
      <div className="flex space-x-4 mb-2">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          onClick={handleImport}
        >
          Import BPMN
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".bpmn,.xml"
          className="hidden"
        />
        
        <button
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          onClick={handleExportSVG}
          disabled={!xml}
        >
          Export as SVG
        </button>
        
        <button
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          onClick={handleExportPNG}
          disabled={!xml}
        >
          Export as PNG
        </button>
        
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          onClick={handleCopyForPowerPoint}
          disabled={!xml}
        >
          Copy for PowerPoint
        </button>
      </div>
      
      {copyMessage && (
        <div className="bg-blue-100 text-blue-800 p-2 rounded mt-2">
          {copyMessage}
        </div>
      )}
      
      <div className="mt-2 text-sm text-gray-600">
        <p>PowerPoint Instructions:</p>
        <ol className="list-decimal pl-5">
          <li>Export your diagram as SVG or copy it using "Copy for PowerPoint"</li>
          <li>In PowerPoint, go to Insert → Pictures → This Device (or use Paste if copied)</li>
          <li>Select the SVG file or paste the copied content</li>
          <li>To edit as shapes, right-click → Convert to Shape (when available)</li>
        </ol>
      </div>
      
      {/* Help Tab Content */}
      {xml && (
        <div className="mt-4 p-4 border-t border-gray-300">
          <h3 className="font-bold mb-4">Help</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold mb-2">Export Formats</h4>
              <ul className="space-y-2">
                <li><span className="font-medium">SVG Export:</span> Good for High-Quality Presentations</li>
                <li><span className="font-medium">PNG Export:</span> Good for Simple Presentations</li>
                <li><span className="font-medium">Copy to Clipboard:</span> Fastest Way to Insert</li>
                <li><span className="font-medium">Edit in PowerPoint:</span> Right-click → Convert to Shape</li>
                <li><span className="font-medium">Resize in PowerPoint:</span> Maintain Aspect Ratio for Best Results</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Keyboard Shortcuts</h4>
              <ul className="space-y-2">
                <li><span className="font-medium">Undo:</span> Ctrl + Z</li>
                <li><span className="font-medium">Redo:</span> Ctrl + Y or Ctrl + Shift + Z</li>
                <li><span className="font-medium">Copy:</span> Ctrl + C</li>
                <li><span className="font-medium">Paste:</span> Ctrl + V</li>
                <li><span className="font-medium">Cut:</span> Ctrl + X</li>
                <li><span className="font-medium">Select All:</span> Ctrl + A</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">BPMN Basics</h4>
              <ul className="space-y-2">
                <li><span className="font-medium">Activities:</span> Tasks, Sub-Processes</li>
                <li><span className="font-medium">Events:</span> Start, End, Intermediate</li>
                <li><span className="font-medium">Gateways:</span> Exclusive, Inclusive, Parallel</li>
                <li><span className="font-medium">Connections:</span> Sequence Flows, Message Flows</li>
                <li><span className="font-medium">Pools & Lanes:</span> Organize by Participants</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 