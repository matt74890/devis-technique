import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, GripVertical, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Temporary types until layout types are fully integrated
interface TableColumn {
  id: string;
  label: string;
  dataKey: string;
  width: number;
  widthType: 'px' | '%' | 'mm';
  alignment: 'left' | 'center' | 'right';
  format: 'text' | 'number' | 'currency' | 'date' | 'time';
  visible: boolean;
  sortable: boolean;
}

interface TableConfig {
  columns: TableColumn[];
  width: number;
  widthType: 'px' | '%' | 'mm';
  showHeader: boolean;
  repeatHeaderOnNewPage: boolean;
  showTotals: boolean;
  preventRowBreak: boolean;
}

interface TableDesignerProps {
  config: TableConfig;
  onChange: (config: TableConfig) => void;
  tableName: string;
  availableTokens: string[];
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  config,
  onChange,
  tableName,
  availableTokens
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: `col_${Date.now()}`,
      label: 'Nouvelle colonne',
      dataKey: '',
      width: 20,
      widthType: '%',
      alignment: 'left',
      format: 'text',
      visible: true,
      sortable: false
    };

    onChange({
      ...config,
      columns: [...config.columns, newColumn]
    });
  };

  const removeColumn = (index: number) => {
    onChange({
      ...config,
      columns: config.columns.filter((_, i) => i !== index)
    });
  };

  const updateColumn = (index: number, updates: Partial<TableColumn>) => {
    const newColumns = [...config.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange({
      ...config,
      columns: newColumns
    });
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...config.columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    onChange({
      ...config,
      columns: newColumns
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveColumn(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const updateTableConfig = (updates: Partial<TableConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Configurateur de tableau: {tableName}
          <Button size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter colonne
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration générale du tableau */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="table-width">Largeur du tableau</Label>
            <div className="flex gap-2">
              <Input
                id="table-width"
                type="number"
                value={config.width}
                onChange={(e) => updateTableConfig({ width: Number(e.target.value) })}
                className="flex-1"
              />
              <Select 
                value={config.widthType} 
                onValueChange={(value: 'px' | '%' | 'mm') => updateTableConfig({ widthType: value })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">px</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Options d'affichage</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showHeader}
                  onCheckedChange={(checked) => updateTableConfig({ showHeader: checked })}
                />
                <Label>Afficher l'en-tête</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.repeatHeaderOnNewPage}
                  onCheckedChange={(checked) => updateTableConfig({ repeatHeaderOnNewPage: checked })}
                />
                <Label>Répéter l'en-tête sur nouvelle page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showTotals}
                  onCheckedChange={(checked) => updateTableConfig({ showTotals: checked })}
                />
                <Label>Afficher les totaux</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.preventRowBreak}
                  onCheckedChange={(checked) => updateTableConfig({ preventRowBreak: checked })}
                />
                <Label>Éviter coupure des lignes</Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Configuration des colonnes */}
        <div className="space-y-4">
          <h4 className="font-medium">Colonnes du tableau</h4>
          
          {config.columns.map((column, index) => (
            <Card 
              key={column.id}
              className="p-4"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2 mt-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <Badge variant="outline">{index + 1}</Badge>
                </div>
                
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Libellé</Label>
                    <Input
                      value={column.label}
                      onChange={(e) => updateColumn(index, { label: e.target.value })}
                      placeholder="Nom de la colonne"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Source de données</Label>
                    <Select
                      value={column.dataKey}
                      onValueChange={(value) => updateColumn(index, { dataKey: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un token" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token} value={token}>
                            {token}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Largeur</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={column.width}
                        onChange={(e) => updateColumn(index, { width: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <Select
                        value={column.widthType}
                        onValueChange={(value: 'px' | '%' | 'mm') => updateColumn(index, { widthType: value })}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="px">px</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                          <SelectItem value="mm">mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Alignement</Label>
                    <Select
                      value={column.alignment}
                      onValueChange={(value: 'left' | 'center' | 'right') => updateColumn(index, { alignment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="center">Centre</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={column.format}
                      onValueChange={(value: 'text' | 'number' | 'currency' | 'date' | 'time') => updateColumn(index, { format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte</SelectItem>
                        <SelectItem value="number">Nombre</SelectItem>
                        <SelectItem value="currency">Devise (CHF)</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="time">Heure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={column.visible}
                        onCheckedChange={(checked) => updateColumn(index, { visible: checked })}
                      />
                      <Label>Visible</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={column.sortable}
                        onCheckedChange={(checked) => updateColumn(index, { sortable: checked })}
                      />
                      <Label>Triable</Label>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => removeColumn(index)}>
                      <Minus className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};