import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, Layout, Eye, EyeOff } from 'lucide-react';
import { PDFBlock, BlockStyle } from './blocks/BlockTypes';

interface BlockPropertiesPanelProps {
  block: PDFBlock;
  onUpdate: (updates: Partial<PDFBlock>) => void;
}

export const BlockPropertiesPanel: React.FC<BlockPropertiesPanelProps> = ({
  block,
  onUpdate
}) => {
  const updateStyle = (styleUpdates: Partial<BlockStyle>) => {
    onUpdate({
      style: {
        ...block.style,
        ...styleUpdates
      }
    });
  };

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Informations générales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Layout className="h-4 w-4 mr-2" />
            Général
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="block-name" className="text-sm">Nom du bloc</Label>
            <Input
              id="block-name"
              value={block.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Visible</Label>
            <Switch
              checked={block.visible !== false}
              onCheckedChange={(visible) => onUpdate({ visible })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Position et taille */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Position et Taille</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X (%)</Label>
              <Input
                type="number"
                value={Math.round(block.position.x)}
                onChange={(e) => onUpdate({
                  position: { ...block.position, x: Number(e.target.value) }
                })}
                min={0}
                max={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Y (%)</Label>
              <Input
                type="number"
                value={Math.round(block.position.y)}
                onChange={(e) => onUpdate({
                  position: { ...block.position, y: Number(e.target.value) }
                })}
                min={0}
                max={100}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Largeur (%)</Label>
              <Input
                type="number"
                value={Math.round(block.size.width)}
                onChange={(e) => onUpdate({
                  size: { ...block.size, width: Number(e.target.value) }
                })}
                min={10}
                max={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hauteur (%)</Label>
              <Input
                type="number"
                value={Math.round(block.size.height)}
                onChange={(e) => onUpdate({
                  size: { ...block.size, height: Number(e.target.value) }
                })}
                min={5}
                max={100}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Couleur de fond</Label>
            <Input
              type="color"
              value={block.style?.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="mt-1 h-8"
            />
          </div>
          
          <div>
            <Label className="text-xs">Couleur du texte</Label>
            <Input
              type="color"
              value={block.style?.color || '#000000'}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="mt-1 h-8"
            />
          </div>
          
          <div>
            <Label className="text-xs">Taille de police</Label>
            <div className="mt-1">
              <Slider
                value={[block.style?.fontSize || 14]}
                onValueChange={([fontSize]) => updateStyle({ fontSize })}
                min={8}
                max={48}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {block.style?.fontSize || 14}px
              </div>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Alignement du texte</Label>
            <Select
              value={block.style?.textAlign || 'left'}
              onValueChange={(textAlign) => updateStyle({ textAlign: textAlign as any })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Poids de police</Label>
            <Select
              value={block.style?.fontWeight || 'normal'}
              onValueChange={(fontWeight) => updateStyle({ fontWeight: fontWeight as any })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Gras</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Marge interne</Label>
            <div className="mt-1">
              <Slider
                value={[block.style?.padding || 0]}
                onValueChange={([padding]) => updateStyle({ padding })}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {block.style?.padding || 0}px
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu spécifique au type de bloc */}
      {block.type === 'text' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Contenu texte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={block.content?.text || ''}
              onChange={(e) => updateContent({ text: e.target.value })}
              placeholder="Saisissez votre texte..."
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Type de bloc */}
      <div className="pt-4 border-t">
        <Badge variant="secondary" className="text-xs">
          Type: {block.type}
        </Badge>
      </div>
    </div>
  );
};