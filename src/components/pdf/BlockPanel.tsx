import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  FileText, 
  User, 
  Table, 
  Calculator, 
  PenTool, 
  Type, 
  Image, 
  Minus,
  Clock,
  Building
} from 'lucide-react';
import { LayoutBlock } from '@/types/layout';

interface BlockPanelProps {
  onAddBlock: (blockType: LayoutBlock['type']) => void;
}

export const BlockPanel: React.FC<BlockPanelProps> = ({ onAddBlock }) => {
  const blockTypes: Array<{
    type: LayoutBlock['type'];
    label: string;
    icon: React.ReactNode;
    description: string;
    category: string;
  }> = [
    // Blocs de structure
    { type: 'header', label: 'En-tête', icon: <Layout className="h-4 w-4" />, description: 'Logo + réf + date', category: 'Structure' },
    { type: 'footer', label: 'Pied de page', icon: <FileText className="h-4 w-4" />, description: 'Pagination + mentions', category: 'Structure' },
    
    // Blocs de contenu
    { type: 'intent', label: 'À l\'intention de', icon: <User className="h-4 w-4" />, description: 'Adresse client', category: 'Contenu' },
    { type: 'letter', label: 'Lettre de présentation', icon: <FileText className="h-4 w-4" />, description: 'Texte d\'introduction', category: 'Contenu' },
    { type: 'description', label: 'Description prestation', icon: <Building className="h-4 w-4" />, description: 'Détails agents', category: 'Contenu' },
    
    // Tableaux
    { type: 'table_tech', label: 'Tableau TECH', icon: <Table className="h-4 w-4" />, description: 'Articles techniques', category: 'Tableaux' },
    { type: 'table_agent', label: 'Tableau AGENT', icon: <Clock className="h-4 w-4" />, description: 'Vacations agents', category: 'Tableaux' },
    
    // Totaux et signatures
    { type: 'totals', label: 'Totaux', icon: <Calculator className="h-4 w-4" />, description: 'HT/TVA/TTC', category: 'Totaux' },
    { type: 'signatures', label: 'Signatures', icon: <PenTool className="h-4 w-4" />, description: 'Vendeur / Client', category: 'Totaux' },
    
    // Éléments graphiques
    { type: 'text', label: 'Étiquette texte', icon: <Type className="h-4 w-4" />, description: 'Texte libre', category: 'Éléments' },
    { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" />, description: 'Logo/cachet', category: 'Éléments' },
    { type: 'separator', label: 'Séparateur', icon: <Minus className="h-4 w-4" />, description: 'Ligne de séparation', category: 'Éléments' }
  ];

  const categories = ['Structure', 'Contenu', 'Tableaux', 'Totaux', 'Éléments'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Blocs disponibles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const categoryBlocks = blockTypes.filter(b => b.category === category);
          
          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
              <div className="space-y-1">
                {categoryBlocks.map((blockType) => (
                  <Button
                    key={blockType.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 hover:bg-muted"
                    onClick={() => onAddBlock(blockType.type)}
                  >
                    <div className="flex items-start space-x-2 text-left">
                      <div className="flex-shrink-0 mt-0.5">
                        {blockType.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{blockType.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {blockType.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              {category !== 'Éléments' && <Separator className="mt-2" />}
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Glissez-déposez les blocs sur le canvas pour les ajouter à votre mise en page.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};