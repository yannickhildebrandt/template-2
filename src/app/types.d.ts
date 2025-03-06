declare module 'file-saver';
declare module 'bpmn-js-properties-panel';
declare module '@bpmn-io/element-template-chooser';
declare module 'camunda-bpmn-moddle/resources/camunda';
declare module 'bpmn-js/lib/Modeler' {
  export default class Modeler {
    constructor(options: any);
    importXML(xml: string): Promise<any>;
    saveXML(options?: any): Promise<{xml: string}>;
    saveSVG(options?: any): Promise<{svg: string}>;
    get(name: string): any;
    destroy(): void;
  }
}

declare module 'react-bpmn'; 