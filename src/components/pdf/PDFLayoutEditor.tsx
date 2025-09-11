import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, Copy, Trash2, Download, Upload, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useStore } from '@/store/useStore';
import { PDFLayoutConfig, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { PDFCanvas } from './PDFCanvas';
import { BlockPanel } from './BlockPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { LayoutToolbar } from './LayoutToolbar';
import { TableDesigner } from './TableDesigner';

const PDFLayoutEditor: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<LayoutVariant>('technique');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const [showTableDesigner, setShowTableDesigner] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  // Obtenir les layouts pour la variante sélectionnée
  const layouts = settings.pdfLayouts || {};
  const currentLayouts = layouts[selectedVariant] || [];
  const activeLayoutId = settings.activePDFLayouts?.[selectedVariant] || 'default';
  const currentLayout = currentLayouts.find(l => l.id === activeLayoutId) || getDefaultLayoutForVariant(selectedVariant);

  const handleVariantChange = (variant: LayoutVariant) => {
    setSelectedVariant(variant);
    setSelectedBlockId(null);
  };

  const handleCreateNewLayout = () => {
    if (!newLayoutName.trim()) {
      toast.error('Veuillez saisir un nom pour la nouvelle mise en page');
      return;
    }
    
    const newLayout: PDFLayoutConfig = {
      ...getDefaultLayoutForVariant(selectedVariant),
      id: crypto.randomUUID(),
      name: newLayoutName,
      metadata: {
        ...getDefaultLayoutForVariant(selectedVariant).metadata,
        isDefault: false
      }
    };
    
    const updatedLayouts = {
      ...layouts,
      [selectedVariant]: [...currentLayouts, newLayout]
    };
    
    updateSettings({ 
      pdfLayouts: updatedLayouts,
      activePDFLayouts: {
        ...settings.activePDFLayouts,
        [selectedVariant]: newLayout.id
      }
    });
    
    setNewLayoutName('');
    toast.success('Nouvelle mise en page créée');
  };

  const handleDuplicateLayout = () => {
    if (!currentLayout) return;
    
    const duplicatedLayout: PDFLayoutConfig = {
      ...currentLayout,
      id: crypto.randomUUID(),
      name: `${currentLayout.name} (copie)`,
      metadata: {
        ...currentLayout.metadata,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    const updatedLayouts = {
      ...layouts,
      [selectedVariant]: [...currentLayouts, duplicatedLayout]
    };
    
    updateSettings({ 
      pdfLayouts: updatedLayouts,
      activePDFLayouts: {
        ...settings.activePDFLayouts,
        [selectedVariant]: duplicatedLayout.id
      }
    });
    
    toast.success('Mise en page dupliquée');
  };

  const handleDeleteLayout = () => {
    if (!currentLayout || currentLayout.metadata.isDefault) {
      toast.error('Impossible de supprimer la mise en page par défaut');
      return;
    }
    
    const updatedLayouts = {
      ...layouts,
      [selectedVariant]: currentLayouts.filter(l => l.id !== currentLayout.id)
    };
    
    // Si on supprime la mise en page active, passer à la première disponible
    let newActiveId = 'default';
    if (updatedLayouts[selectedVariant].length > 0) {
      newActiveId = updatedLayouts[selectedVariant][0].id;
    }
    
    updateSettings({ 
      pdfLayouts: updatedLayouts,
      activePDFLayouts: {
        ...settings.activePDFLayouts,
        [selectedVariant]: newActiveId
      }
    });
    
    toast.success('Mise en page supprimée');
  };

  const handleLayoutSelect = (layoutId: string) => {
    updateSettings({
      activePDFLayouts: {
        ...settings.activePDFLayouts,
        [selectedVariant]: layoutId
      }
    });
  };

  const handleUpdateLayout = (updates: Partial<PDFLayoutConfig>) => {
    const updatedLayout = { ...currentLayout, ...updates };
    
    const updatedLayouts = {
      ...layouts,
      [selectedVariant]: currentLayouts.map(l => 
        l.id === currentLayout.id ? updatedLayout : l
      )
    };
    
    updateSettings({ pdfLayouts: updatedLayouts });
  };

  const exportLayout = () => {
    if (!currentLayout) return;
    
    const dataStr = JSON.stringify(currentLayout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout_${currentLayout.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Mise en page exportée');
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layoutData = JSON.parse(e.target?.result as string) as PDFLayoutConfig;
        layoutData.id = crypto.randomUUID(); // Nouvel ID
        layoutData.name = `${layoutData.name} (importé)`;
        layoutData.metadata.createdAt = new Date().toISOString();
        layoutData.metadata.updatedAt = new Date().toISOString();
        layoutData.metadata.isDefault = false;
        
        const updatedLayouts = {
          ...layouts,
          [selectedVariant]: [...currentLayouts, layoutData]
        };
        
        updateSettings({ pdfLayouts: updatedLayouts });
        toast.success('Mise en page importée');
      } catch (error) {
        toast.error('Erreur lors de l\'importation - fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const selectedBlock = currentLayout.blocks.find(b => b.id === selectedBlockId) || null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Éditeur de disposition PDF</h1>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="variant-select">Variante:</Label>
            <Select value={selectedVariant} onValueChange={handleVariantChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technique">Devis Technique</SelectItem>
                <SelectItem value="agent">Devis Agent</SelectItem>
                <SelectItem value="mixte">Devis Mixte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="layout-select">Mise en page:</Label>
            <Select value={activeLayoutId} onValueChange={handleLayoutSelect}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentLayouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id}>
                    {layout.name}
                  </SelectItem>
                ))}
                <SelectItem value="default">Par défaut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle mise en page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="layout-name">Nom de la mise en page</Label>
                  <Input
                    id="layout-name"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Ma nouvelle mise en page"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={handleCreateNewLayout}>Créer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" onClick={handleDuplicateLayout}>
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>

          <Button size="sm" variant="outline" onClick={exportLayout}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importLayout}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>

          <Button size="sm" variant="destructive" onClick={handleDeleteLayout} disabled={currentLayout?.metadata.isDefault}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <LayoutToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        onShowTableDesigner={() => setShowTableDesigner(true)}
      />

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Blocks */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <BlockPanel onAddBlock={(blockType) => {
              // TODO: Implement add block functionality
              console.log('Add block:', blockType);
            }} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Canvas */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <PDFCanvas
              layout={currentLayout}
              zoom={zoom}
              showGrid={showGrid}
              gridSize={gridSize}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlock={(blockId, updates) => {
                const updatedBlocks = currentLayout.blocks.map(block =>
                  block.id === blockId ? { ...block, ...updates } : block
                );
                handleUpdateLayout({ blocks: updatedBlocks });
              }}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Properties */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <PropertiesPanel
              selectedBlock={selectedBlock}
              onUpdateBlock={(updates) => {
                if (!selectedBlock) return;
                const updatedBlocks = currentLayout.blocks.map(block =>
                  block.id === selectedBlock.id ? { ...block, ...updates } : block
                );
                handleUpdateLayout({ blocks: updatedBlocks });
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Table Designer Dialog */}
      <Dialog open={showTableDesigner} onOpenChange={setShowTableDesigner}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurateur de tableaux</DialogTitle>
          </DialogHeader>
          <TableDesigner />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDFLayoutEditor;