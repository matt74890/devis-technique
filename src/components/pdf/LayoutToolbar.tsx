import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Grid, Table, Save } from 'lucide-react';

interface LayoutToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  onShowTableDesigner: () => void;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  onShowTableDesigner
}) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-card border-b">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Zoom:</Label>
        <Select value={zoom.toString()} onValueChange={(value) => onZoomChange(Number(value))}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="125">125%</SelectItem>
            <SelectItem value="150">150%</SelectItem>
            <SelectItem value="200">200%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-2">
        <Label className="text-sm">Grille:</Label>
        <Button
          size="sm"
          variant={showGrid ? "default" : "outline"}
          onClick={() => onToggleGrid(!showGrid)}
        >
          <Grid className="h-4 w-4 mr-1" />
          {showGrid ? "Masquer" : "Afficher"}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={onShowTableDesigner}>
        <Table className="h-4 w-4 mr-2" />
        Configurer tableaux
      </Button>

      <div className="flex-1" />

      <Button size="sm" variant="outline">
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder
      </Button>
    </div>
  );
};