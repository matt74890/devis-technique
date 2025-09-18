import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, Copy, Trash2, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useStore } from '@/store/useStore';
import { PDFCanvas } from '@/components/pdf/PDFCanvas';
import { PDFLayoutConfig, LayoutBlock, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';

const PDFLayoutScreen: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<LayoutVariant>('technique');
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const [showTableDesigner, setShowTableDesigner] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  // Utiliser le layout par défaut pour la variante sélectionnée
  const currentLayout = getDefaultLayoutForVariant(selectedVariant);
  const layoutsForVariant = [currentLayout];

  const handleCreateNewLayout = () => {
    if (!newLayoutName.trim()) {
      toast.error('Veuillez saisir un nom pour la nouvelle mise en page');
      return;
    }
    
    // TODO: Implement with store integration
    setNewLayoutName('');
    toast.success('Nouvelle mise en page créée');
  };

  const handleDuplicateLayout = () => {
    // TODO: Implement with store integration
    toast.success('Mise en page dupliquée');
  };

  const handleDeleteLayout = () => {
    // TODO: Implement with store integration
    toast.success('Mise en page supprimée');
  };

  const handleUpdateLayout = (updates: Partial<PDFLayoutConfig>) => {
    // TODO: Implement with store integration
    console.log('Update layout:', updates);
  };

  const handleBlockSelect = (block: LayoutBlock) => {
    setSelectedBlock(block);
  };

  const handleBlockUpdate = (blockId: string, updates: Partial<LayoutBlock>) => {
    if (!currentLayout) return;
    
    const updatedBlocks = currentLayout.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    
    handleUpdateLayout({ blocks: updatedBlocks });
    
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock({ ...selectedBlock, ...updates });
    }
  };

  const handleAddBlock = (blockType: LayoutBlock['type']) => {
    if (!currentLayout) return;

    const newBlock: LayoutBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      x: 20,
      y: 50,
      width: 100,
      height: 30,
      visible: true,
      locked: false,
      zIndex: currentLayout.blocks.length,
      style: {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: '#000000',
        borderRadius: 0,
        padding: 0,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        lineHeight: 1.4
      },
      content: blockType === 'text' ? 'Nouveau texte' : undefined,
      bindings: {},
      visibleIf: undefined
    };

    const updatedBlocks = [...currentLayout.blocks, newBlock];
    handleUpdateLayout({ blocks: updatedBlocks });
    setSelectedBlock(newBlock);
    toast.success('Bloc ajouté');
  };

  const exportLayout = () => {
    if (!currentLayout) return;
    
    const dataStr = JSON.stringify(currentLayout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout_${currentLayout.name}.json`;
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
        // TODO: Implement with store integration
        toast.success('Mise en page importée');
      } catch (error) {
        toast.error('Erreur lors de l\'importation');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Éditeur de mise en page PDF</h1>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="variant-select">Variante:</Label>
            <Select value={selectedVariant} onValueChange={(value: LayoutVariant) => setSelectedVariant(value)}>
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
            <Select 
              value={currentLayout?.id || 'default'} 
              onValueChange={(value) => console.log('Set active layout:', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layoutsForVariant.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id}>
                    {layout.name}
                  </SelectItem>
                ))}
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

          <Button size="sm" variant="destructive" onClick={handleDeleteLayout}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-card border-b">
        <div className="flex items-center gap-2">
          <Label>Zoom:</Label>
          <Select value={zoom.toString()} onValueChange={(value) => setZoom(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>Grille:</Label>
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? "Masquer" : "Afficher"}
          </Button>
        </div>

        <Button size="sm" onClick={() => setShowTableDesigner(true)}>
          Configurer tableaux
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Blocks */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Card className="h-full">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Blocs disponibles</h3>
                <div className="space-y-2">
                  {(['header', 'footer', 'intent', 'table_tech', 'totals', 'signatures', 'text', 'image'] as const).map((blockType) => (
                    <Button
                      key={blockType}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleAddBlock(blockType)}
                    >
                      {blockType}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Canvas */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-auto">
                <div className="flex justify-center">
                  <PDFCanvas
                    layout={currentLayout}
                    zoom={zoom}
                    showGrid={showGrid}
                    gridSize={gridSize}
                    selectedBlockId={selectedBlock?.id || null}
                    onSelectBlock={(blockId) => {
                      const block = currentLayout.blocks.find(b => b.id === blockId);
                      if (block) handleBlockSelect(block);
                      else setSelectedBlock(null);
                    }}
                    onUpdateBlock={handleBlockUpdate}
                  />
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Properties */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Card className="h-full">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Propriétés</h3>
                {selectedBlock ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Bloc sélectionné: {selectedBlock.type}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>X (mm)</Label>
                         <Input 
                           type="number" 
                           value={selectedBlock.x} 
                           onChange={(e) => handleBlockUpdate(selectedBlock.id, { x: Number(e.target.value) })}
                         />
                      </div>
                      <div>
                        <Label>Y (mm)</Label>
                         <Input 
                           type="number" 
                           value={selectedBlock.y} 
                           onChange={(e) => handleBlockUpdate(selectedBlock.id, { y: Number(e.target.value) })}
                         />
                      </div>
                      <div>
                        <Label>Largeur</Label>
                         <Input 
                           type="number" 
                           value={selectedBlock.width} 
                           onChange={(e) => handleBlockUpdate(selectedBlock.id, { width: Number(e.target.value) })}
                         />
                      </div>
                      <div>
                        <Label>Hauteur</Label>
                         <Input 
                           type="number" 
                           value={selectedBlock.height} 
                           onChange={(e) => handleBlockUpdate(selectedBlock.id, { height: Number(e.target.value) })}
                         />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sélectionnez un bloc pour voir ses propriétés</p>
                )}
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Table Designer Dialog */}
      <Dialog open={showTableDesigner} onOpenChange={setShowTableDesigner}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurateur de tableaux</DialogTitle>
          </DialogHeader>
          {/* Table designer content will be added here */}
          <div className="p-4">
            <p className="text-muted-foreground">Configurateur de tableaux en développement...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDFLayoutScreen;