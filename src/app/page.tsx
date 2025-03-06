'use client';

import { useState, useEffect } from 'react';
import BpmnEditor from './components/BpmnEditor';
import Toolbar from './components/Toolbar';
import ThemeSelector from './components/ThemeSelector';
import PropertiesPanel from './components/PropertiesPanel';

export default function Home() {
  const [xml, setXml] = useState<string | null>(null);
  const [modeler, setModeler] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [theme, setTheme] = useState<string>('light');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Load default empty BPMN diagram on component mount
  useEffect(() => {
    const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="412" y="240" width="36" height="36" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    setXml(defaultDiagram);
  }, []);

  const handleBpmnChange = (newXml: string) => {
    setXml(newXml);
  };

  // Determine background color based on theme
  const bgColor = theme === 'dark' ? 'bg-gray-900' : theme === 'blue' ? 'bg-blue-50' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const headerBg = theme === 'dark' ? 'bg-gray-800' : theme === 'blue' ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-500 to-indigo-600';

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${bgColor} ${textColor}`}>
      <header className={`${headerBg} text-white p-4 shadow-lg flex justify-between items-center`}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl font-bold tracking-wide">BPMNify Pro</h1>
        </div>
        <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
      </header>
      
      <div className="flex-grow flex">
        {/* Main workspace */}
        <div className="flex flex-col flex-grow">
          <Toolbar xml={xml} modeler={modeler} theme={theme} />
          
          <div className="flex-grow relative overflow-hidden">
            {xml && (
              <div className="absolute inset-0">
                <BpmnEditor 
                  xml={xml} 
                  onChange={handleBpmnChange} 
                  setModeler={setModeler}
                  theme={theme}
                  onElementSelect={setSelectedElement}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar - Properties Panel */}
        {sidebarOpen && (
          <div 
            className={`w-80 ${theme === 'dark' ? 'bg-gray-800' : theme === 'blue' ? 'bg-blue-100' : 'bg-gray-100'} 
                       p-4 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} shadow-inner overflow-y-auto`}
          >
            <PropertiesPanel selectedElement={selectedElement} modeler={modeler} theme={theme} />
          </div>
        )}
        
        {/* Sidebar toggle button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 ${sidebarOpen ? 'translate-x-0' : '-translate-x-6'} 
                     ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'} 
                     p-1 rounded-l-md shadow-md transition-transform duration-300 z-10`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Status bar */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-400' : theme === 'blue' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'} 
                      py-1 px-4 text-xs flex justify-between items-center`}>
        <div>
          {selectedElement ? `Selected: ${selectedElement.type || 'Unknown'} (${selectedElement.id || 'No ID'})` : 'No element selected'}
        </div>
        <div>
          Ready to export to PowerPoint
        </div>
      </div>
    </div>
  );
}
