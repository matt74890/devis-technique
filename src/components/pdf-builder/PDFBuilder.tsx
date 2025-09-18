import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, User, FileText, Table, Calculator, PenTool, Type, Image, 
  Minus, FileX, Plus, Save, Eye, Download, Trash2, Copy, Settings,
  Undo, Redo, ZoomIn, ZoomOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PDFBlock, BlockType, BLOCK_DEFINITIONS } from './blocks/BlockTypes';
import { PDFCanvas } from './PDFCanvas';
import { BlockPropertiesPanel } from './BlockPropertiesPanel';
import { toast } from 'sonner';

interface PDFTemplate {
  id: string;
  name: string;
  variant: 'technique' | 'agent' | 'mixte';
  blocks: PDFBlock[];
}

const DEFAULT_TEMPLATES: PDFTemplate[] = [
  {
    id: 'technique-simple',
    name: 'Technique - Simple',
    variant: 'technique',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        name: 'En-tête',
        icon: 'Layout',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 15 },
      },
      {
        id: 'client-1',
        type: 'client-info',
        name: 'Informations client',
        icon: 'User',
        position: { x: 0, y: 20 },
        size: { width: 48, height: 25 },
      },
      {
        id: 'quote-1',
        type: 'quote-details',
        name: 'Détails devis',
        icon: 'FileText',
        position: { x: 52, y: 20 },
        size: { width: 48, height: 25 },
      },
      {
        id: 'table-1',
        type: 'items-table',
        name: 'Articles techniques',
        icon: 'Table',
        position: { x: 0, y: 50 },
        size: { width: 100, height: 30 },
      },
      {
        id: 'totals-1',
        type: 'totals',
        name: 'Totaux',
        icon: 'Calculator',
        position: { x: 50, y: 85 },
        size: { width: 50, height: 15 },
      }
    ]
  },
  {
    id: 'agent-simple',
    name: 'Agent - Simple',
    variant: 'agent',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        name: 'En-tête',
        icon: 'Layout',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 15 },
      },
      {
        id: 'client-1',
        type: 'client-info',
        name: 'Informations client',
        icon: 'User',
        position: { x: 0, y: 20 },
        size: { width: 100, height: 20 },
      },
      {
        id: 'table-1',
        type: 'items-table',
        name: 'Prestations agent',
        icon: 'Table',
        position: { x: 0, y: 45 },
        size: { width: 100, height: 35 },
      },
      {
        id: 'totals-1',
        type: 'totals',
        name: 'Totaux',
        icon: 'Calculator',
        position: { x: 50, y: 85 },
        size: { width: 50, height: 15 },
      }
    ]
  }
];

export const PDFBuilder: React.FC = () => {
  const { currentQuote, settings } = useStore();
  const [currentTemplate, setCurrentTemplate] = useState<PDFTemplate>(DEFAULT_TEMPLATES[0]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<PDFTemplate[]>([currentTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedBlock = currentTemplate.blocks.find(b => b.id === selectedBlockId);

  const iconMap: Record<string, React.ComponentType<any>> = {
    Layout, User, FileText, Table, Calculator, PenTool, Type, Image, Minus, FileX
  };

  const addBlock = useCallback((blockType: BlockType) => {
    const definition = BLOCK_DEFINITIONS[blockType];
    const newBlock: PDFBlock = {
      id: crypto.randomUUID(),
      type: blockType,
      name: definition.name,
      icon: definition.icon,
      position: { x: 10, y: 10 },
      size: definition.defaultSize,
      visible: true
    };

    const newTemplate = {
      ...currentTemplate,
      blocks: [...currentTemplate.blocks, newBlock]
    };

    setCurrentTemplate(newTemplate);
    addToHistory(newTemplate);
    setSelectedBlockId(newBlock.id);
    toast.success(`Bloc "${definition.name}" ajouté`);
  }, [currentTemplate]);

  const updateBlock = useCallback((blockId: string, updates: Partial<PDFBlock>) => {
    const newTemplate = {
      ...currentTemplate,
      blocks: currentTemplate.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    };
    
    setCurrentTemplate(newTemplate);
    addToHistory(newTemplate);
  }, [currentTemplate]);

  const deleteBlock = useCallback((blockId: string) => {
    const newTemplate = {
      ...currentTemplate,
      blocks: currentTemplate.blocks.filter(block => block.id !== blockId)
    };
    
    setCurrentTemplate(newTemplate);
    addToHistory(newTemplate);
    setSelectedBlockId(null);
    toast.success('Bloc supprimé');
  }, [currentTemplate]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = currentTemplate.blocks.find(b => b.id === blockId);
    if (!blockToDuplicate) return;

    const newBlock: PDFBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      name: `${blockToDuplicate.name} (copie)`,
      position: {
        x: blockToDuplicate.position.x + 5,
        y: blockToDuplicate.position.y + 5
      }
    };

    const newTemplate = {
      ...currentTemplate,
      blocks: [...currentTemplate.blocks, newBlock]
    };

    setCurrentTemplate(newTemplate);
    addToHistory(newTemplate);
    setSelectedBlockId(newBlock.id);
    toast.success('Bloc dupliqué');
  }, [currentTemplate]);

  const addToHistory = (template: PDFTemplate) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(template);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentTemplate(history[newIndex]);
      toast.success('Annulé');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentTemplate(history[newIndex]);
      toast.success('Refait');
    }
  };

  const saveTemplate = () => {
    // TODO: Sauvegarder le template dans les settings
    toast.success('Template sauvegardé');
  };

  const generatePDF = () => {
    if (!currentQuote) {
      toast.error('Aucun devis sélectionné');
      return;
    }
    
    toast.success('Génération PDF en cours...');
    // TODO: Implémenter la génération PDF
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <Card className="border-b rounded-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Édition' : 'Aperçu'}
              </Button>
              <Button variant="outline" size="sm" onClick={saveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" />
                Générer PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex overflow-hidden">
        {/* Palette de blocs */}
        <Card className="w-64 border-r rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Blocs disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {Object.values(BLOCK_DEFINITIONS).map((definition) => {
                  const IconComponent = iconMap[definition.icon];
                  return (
                    <Button
                      key={definition.type}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => addBlock(definition.type)}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{definition.name}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <PDFCanvas
              template={currentTemplate}
              selectedBlockId={selectedBlockId}
              zoom={zoom}
              onBlockSelect={setSelectedBlockId}
              onBlockUpdate={updateBlock}
              showPreview={showPreview}
              quote={currentQuote}
              settings={settings}
            />
          </div>
          
          {/* Liste des blocs */}
          <Card className="border-t rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Blocs dans le template</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {currentTemplate.blocks.map((block) => {
                  const IconComponent = iconMap[block.icon];
                  return (
                    <Badge
                      key={block.id}
                      variant={selectedBlockId === block.id ? "default" : "secondary"}
                      className="cursor-pointer flex items-center gap-1 px-2 py-1"
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <IconComponent className="h-3 w-3" />
                      {block.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(block.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau de propriétés */}
        {selectedBlock && (
          <Card className="w-80 border-l rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Propriétés</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <BlockPropertiesPanel
                block={selectedBlock}
                onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};