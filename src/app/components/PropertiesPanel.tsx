'use client';

import { useState, useEffect } from 'react';

interface PropertiesPanelProps {
  selectedElement: any;
  modeler: any;
  theme: string;
}

export default function PropertiesPanel({ selectedElement, modeler, theme }: PropertiesPanelProps) {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Theme-specific styles
  const inputClass = theme === 'dark' 
    ? 'bg-gray-700 border-gray-600 text-white' 
    : theme === 'blue'
    ? 'bg-blue-50 border-blue-300 text-blue-900'
    : 'bg-white border-gray-300 text-gray-900';
  
  const sectionHeaderClass = theme === 'dark'
    ? 'bg-gray-700 text-gray-300'
    : theme === 'blue'
    ? 'bg-blue-200 text-blue-800'
    : 'bg-gray-200 text-gray-800';

  // Extract properties from selected element
  useEffect(() => {
    if (selectedElement && selectedElement.businessObject) {
      const { id, name } = selectedElement.businessObject;
      const props: Record<string, string> = {
        id: id || '',
        name: name || ''
      };
      
      // Add type-specific properties
      if (selectedElement.type === 'Task' || selectedElement.type.includes('Task')) {
        props.taskType = selectedElement.type;
      } else if (selectedElement.type === 'Gateway') {
        props.gatewayType = selectedElement.type;
      } else if (selectedElement.type.includes('Event')) {
        props.eventType = selectedElement.type;
      }
      
      setProperties(props);
    } else {
      setProperties({});
    }
    
    setIsEditing(null);
  }, [selectedElement]);

  const handlePropertyChange = (key: string, value: string) => {
    if (!selectedElement || !modeler) return;
    
    const modeling = modeler.get('modeling');
    
    if (key === 'name') {
      modeling.updateProperties(selectedElement.element, {
        name: value
      });
    }
    
    setProperties(prev => ({
      ...prev,
      [key]: value
    }));
    
    setIsEditing(null);
  };

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className={`mt-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <h2 className={`text-lg font-bold mb-4 pb-2 border-b ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-300'}`}>
        Element Properties
      </h2>
      
      {/* Element type header */}
      <div className={`flex items-center p-3 mb-4 rounded-md ${
        theme === 'dark' ? 'bg-blue-900/30' : theme === 'blue' ? 'bg-blue-100' : 'bg-indigo-100'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-medium">{selectedElement.type}</span>
      </div>
      
      {/* Properties list */}
      <div className={`rounded-md overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className={`${sectionHeaderClass} px-4 py-2 font-medium`}>
          Basic Properties
        </div>
        <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="px-4 py-3 flex justify-between items-center">
              <span className="capitalize font-medium">{key}:</span>
              
              {isEditing === key ? (
                <div className="flex">
                  <input
                    type="text"
                    value={value}
                    onChange={e => setProperties({ ...properties, [key]: e.target.value })}
                    className={`px-2 py-1 text-sm rounded-l border ${inputClass}`}
                    autoFocus
                  />
                  <button
                    onClick={() => handlePropertyChange(key, properties[key])}
                    className={`px-2 py-1 bg-green-500 text-white rounded-r`}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div 
                  className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : theme === 'blue' ? 'bg-blue-50' : 'bg-gray-100'} 
                  hover:bg-opacity-80 cursor-pointer flex items-center max-w-[180px] truncate`}
                  onClick={() => key !== 'id' && setIsEditing(key)}
                >
                  <span className="truncate">{value || '(empty)'}</span>
                  {key !== 'id' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Visual properties */}
      <div className={`mt-4 rounded-md overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className={`${sectionHeaderClass} px-4 py-2 font-medium`}>
          Visual Style
        </div>
        <div className={`p-4 grid grid-cols-2 gap-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <button 
            className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-center`}
            onClick={() => {
              if (!selectedElement || !modeler) return;
              const modeling = modeler.get('modeling');
              
              // Change fill color - in a real app, you might want to open a color picker
              modeling.setColor(selectedElement.element, {
                fill: '#e6f7ff',
                stroke: '#1890ff'
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Color
          </button>
          <button 
            className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-center`}
            onClick={() => {
              if (!selectedElement || !modeler) return;
              
              // In a full implementation, this would open a border style selector
              alert("Border style options would open here");
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Border
          </button>
        </div>
      </div>
    </div>
  );
} 