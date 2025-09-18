import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Table, Type, Image as ImageIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { PDFLayoutConfig, LayoutBlock } from '@/types/layout';

interface MappingAssistantProps {
  analyzedLayout: PDFLayoutConfig | null;
  onMappingComplete: (layout: PDFLayoutConfig) => void;
}

const AVAILABLE_TOKENS = [
  // Devis
  { category: 'Devis', token: '{{quoteRef}}', description: 'Référence du devis' },
  { category: 'Devis', token: '{{quoteDate}}', description: 'Date du devis' },
  { category: 'Devis', token: '{{site}}', description: 'Site d\'intervention' },
  { category: 'Devis', token: '{{canton}}', description: 'Canton' },
  
  // Client
  { category: 'Client', token: '{{client.company}}', description: 'Entreprise' },
  { category: 'Client', token: '{{client.lastName}}', description: 'Nom de famille' },
  { category: 'Client', token: '{{client.firstName}}', description: 'Prénom' },
  { category: 'Client', token: '{{client.address}}', description: 'Adresse' },
  { category: 'Client', token: '{{client.postalCode}}', description: 'Code postal' },
  { category: 'Client', token: '{{client.city}}', description: 'Ville' },
  
  // Totaux
  { category: 'Totaux', token: '{{totals.tech.ht}}', description: 'Total technique HT' },
  { category: 'Totaux', token: '{{totals.tech.tva}}', description: 'TVA technique' },
  { category: 'Totaux', token: '{{totals.tech.ttc}}', description: 'Total technique TTC' },
  { category: 'Totaux', token: '{{totals.agents.ht}}', description: 'Total agents HT' },
  { category: 'Totaux', token: '{{totals.agents.ttc}}', description: 'Total agents TTC' },
  { category: 'Totaux', token: '{{totals.global.ht}}', description: 'Total général HT' },
  { category: 'Totaux', token: '{{totals.global.tva}}', description: 'TVA totale' },
  { category: 'Totaux', token: '{{totals.global.ttc}}', description: 'Total général TTC' },
  
  // Pagination
  { category: 'Pagination', token: '{{currentPage}}', description: 'Page actuelle' },
  { category: 'Pagination', token: '{{totalPages}}', description: 'Nombre total de pages' },
];

export const MappingAssistant: React.FC<MappingAssistantProps> = ({
  analyzedLayout,
  onMappingComplete
}) => {
  const [mappedLayout, setMappedLayout] = useState<PDFLayoutConfig | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mappingProgress, setMappingProgress] = useState(0);

  useEffect(() => {
    if (analyzedLayout) {
      setMappedLayout({ ...analyzedLayout });
      calculateMappingProgress(analyzedLayout);
    }
  }, [analyzedLayout]);

  const calculateMappingProgress = (layout: PDFLayoutConfig) => {
    const totalBlocks = layout.blocks.length;
    const mappedBlocks = layout.blocks.filter(block => 
      block.bindings && Object.keys(block.bindings).some(key => 
        block.bindings![key].includes('{{')
      )
    ).length;
    
    setMappingProgress(totalBlocks > 0 ? (mappedBlocks / totalBlocks) * 100 : 0);
  };

  const filteredTokens = AVAILABLE_TOKENS.filter(token =>
    token.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateBlockBinding = (blockId: string, bindingKey: string, value: string) => {
    if (!mappedLayout) return;

    const updatedLayout = {
      ...mappedLayout,
      blocks: mappedLayout.blocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            bindings: {
              ...block.bindings,
              [bindingKey]: value
            }
          };
        }
        return block;
      })
    };

    setMappedLayout(updatedLayout);
    calculateMappingProgress(updatedLayout);
  };

  const applyToken = (token: string) => {
    if (selectedBlock && mappedLayout) {
      // For table blocks, convert type if needed
      if (selectedBlock.type === 'table_tech' || selectedBlock.type === 'table_agent') {
        if (token === '{{items.tech}}' || token === '{{items.agent}}') {
          toast.success('Token tableau appliqué');
        }
        return;
      }

      // For other blocks, update first available binding
      const bindingKeys = Object.keys(selectedBlock.bindings || {});
      if (bindingKeys.length > 0) {
        updateBlockBinding(selectedBlock.id, bindingKeys[0], token);
        toast.success('Token appliqué');
      }
    }
  };

  const handleSaveMapping = () => {
    if (!mappedLayout) return;
    onMappingComplete(mappedLayout);
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'table_tech':
      case 'table_agent': return <Table className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (!analyzedLayout) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Veuillez d'abord analyser un PDF pour commencer le mapping
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Blocs détectés */}
      <Card>
        <CardHeader>
          <CardTitle>Blocs détectés</CardTitle>
          <CardDescription>
            Sélectionnez un bloc pour le mapper à vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression du mapping</span>
              <Badge variant="secondary">{Math.round(mappingProgress)}%</Badge>
            </div>
            
            <ScrollArea className="h-96 w-full">
              <div className="space-y-2">
                {mappedLayout?.blocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedBlock?.id === block.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedBlock(block)}
                  >
                    <div className="flex items-start gap-3">
                      {getBlockIcon(block.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{block.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {block.x}×{block.y}mm
                          </Badge>
                        </div>
                        
                        {block.bindings && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(block.bindings).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <code className="bg-muted px-1 rounded text-xs">
                                  {typeof value === 'string' ? value.slice(0, 30) : String(value).slice(0, 30)}
                                  {(typeof value === 'string' ? value.length : String(value).length) > 30 ? '...' : ''}
                                </code>
                              </div>
                            ))}
                          </div>
                        )}

                        {(block.type === 'table_tech' || block.type === 'table_agent') && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Type: {block.type === 'table_tech' ? 'Technique' : 'Agent'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Assistant de mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Assistant de mapping</CardTitle>
          <CardDescription>
            Tokens disponibles pour remplacer le contenu statique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedBlock ? (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getBlockIcon(selectedBlock.type)}
                    <span className="font-medium">
                      Bloc sélectionné: {selectedBlock.type}
                    </span>
                  </div>

                  {selectedBlock.bindings && Object.entries(selectedBlock.bindings).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key}</Label>
                      <Input
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => updateBlockBinding(selectedBlock.id, key, e.target.value)}
                        placeholder="Contenu ou token..."
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Rechercher un token..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2">
                      {Object.entries(
                        filteredTokens.reduce((acc, token) => {
                          if (!acc[token.category]) acc[token.category] = [];
                          acc[token.category].push(token);
                          return acc;
                        }, {} as Record<string, typeof filteredTokens>)
                      ).map(([category, tokens]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm mb-2">{category}</h4>
                          <div className="space-y-1 mb-4">
                            {tokens.map((token) => (
                              <div
                                key={token.token}
                                className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/50"
                                onClick={() => applyToken(token.token)}
                              >
                                <div>
                                  <code className="text-xs font-mono bg-muted px-1 rounded">
                                    {token.token}
                                  </code>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {token.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Button onClick={handleSaveMapping} className="w-full" disabled={mappingProgress < 50}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer le mapping
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Sélectionnez un bloc à gauche pour commencer le mapping
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};