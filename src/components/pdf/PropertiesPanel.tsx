import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Eye, EyeOff, Trash2, Copy } from 'lucide-react';
import { LayoutBlock } from '@/types/layout';

interface PropertiesPanelProps {
  selectedBlock: LayoutBlock | null;
  onUpdateBlock: (updates: Partial<LayoutBlock>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  onUpdateBlock
}) => {
  if (!selectedBlock) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Propriétés</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm text-center">
            Sélectionnez un bloc pour voir ses propriétés
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateStyle = (styleUpdates: Partial<LayoutBlock['style']>) => {
    onUpdateBlock({
      style: { ...selectedBlock.style, ...styleUpdates }
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Propriétés</CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateBlock({ visible: !selectedBlock.visible })}
            >
              {selectedBlock.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateBlock({ locked: !selectedBlock.locked })}
            >
              {selectedBlock.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {selectedBlock.type}
          </Badge>
          {selectedBlock.locked && <Badge variant="destructive" className="text-xs">Verrouillé</Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 overflow-y-auto">
        {/* Position et dimensions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Position & Dimensions (mm)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={selectedBlock.x}
                onChange={(e) => onUpdateBlock({ x: Number(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={selectedBlock.y}
                onChange={(e) => onUpdateBlock({ y: Number(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Largeur</Label>
              <Input
                type="number"
                value={selectedBlock.width}
                onChange={(e) => onUpdateBlock({ width: Number(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Hauteur</Label>
              <Input
                type="number"
                value={selectedBlock.height}
                onChange={(e) => onUpdateBlock({ height: Number(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Style de texte */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Style de texte</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Taille (pt)</Label>
              <Input
                type="number"
                value={selectedBlock.style.fontSize}
                onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Couleur</Label>
              <Input
                type="color"
                value={selectedBlock.style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Police</Label>
            <Select 
              value={selectedBlock.style.fontFamily} 
              onValueChange={(value) => updateStyle({ fontFamily: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <Label className="text-xs">Poids</Label>
              <Select 
                value={selectedBlock.style.fontWeight} 
                onValueChange={(value: 'normal' | 'bold') => updateStyle({ fontWeight: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Gras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Style</Label>
              <Select 
                value={selectedBlock.style.fontStyle} 
                onValueChange={(value: 'normal' | 'italic') => updateStyle({ fontStyle: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Alignement</Label>
            <Select 
              value={selectedBlock.style.textAlign} 
              onValueChange={(value: any) => updateStyle({ textAlign: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
                <SelectItem value="justify">Justifié</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Apparence */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Apparence</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Fond</Label>
              <Input
                type="color"
                value={selectedBlock.style.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Bordure</Label>
              <Input
                type="number"
                value={selectedBlock.style.borderWidth}
                onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })}
                className="h-8"
                placeholder="Épaisseur"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Couleur bordure</Label>
              <Input
                type="color"
                value={selectedBlock.style.borderColor}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Rayon</Label>
              <Input
                type="number"
                value={selectedBlock.style.borderRadius}
                onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })}
                className="h-8"
                placeholder="px"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Contenu */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Contenu</Label>
          
          {selectedBlock.type === 'text' && (
            <div>
              <Label className="text-xs">Texte</Label>
              <Textarea
                value={selectedBlock.content || ''}
                onChange={(e) => onUpdateBlock({ content: e.target.value })}
                rows={3}
                className="text-sm"
                placeholder="Saisissez votre texte..."
              />
            </div>
          )}

          {/* Liaisons de données */}
          <div>
            <Label className="text-xs">Liaisons de données</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Utilisez des tokens comme {{quoteRef}}, {{client.name}}
            </div>
            {Object.entries(selectedBlock.bindings).map(([key, value]) => (
              <div key={key} className="mb-2">
                <Label className="text-xs capitalize">{key}</Label>
                <Input
                  value={value}
                  onChange={(e) => {
                    const newBindings = { ...selectedBlock.bindings };
                    newBindings[key] = e.target.value;
                    onUpdateBlock({ bindings: newBindings });
                  }}
                  className="h-8 text-xs"
                  placeholder={`{{token.${key}}}`}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Conditions d'affichage */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Conditions d'affichage</Label>
          <div>
            <Label className="text-xs">Visible si</Label>
            <Input
              value={selectedBlock.visibleIf || ''}
              onChange={(e) => onUpdateBlock({ visibleIf: e.target.value })}
              className="h-8 text-xs"
              placeholder="Ex: hasTech, isFirstPage"
            />
          </div>
        </div>

        <Separator />

        {/* Z-Index et actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Calque</Label>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Ordre (Z-Index)</Label>
            <Input
              type="number"
              value={selectedBlock.zIndex}
              onChange={(e) => onUpdateBlock({ zIndex: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};