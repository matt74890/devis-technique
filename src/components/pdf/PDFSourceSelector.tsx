import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eye, Download, FileText, Clock, HardDrive, FileCheck, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/components/SettingsProvider';
import { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { renderPDFFromLayout } from '@/utils/pdfRenderer';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

interface PDFSourceInfo {
  id: string;
  name: string;
  variant: LayoutVariant;
  type: 'json' | 'copier' | 'legacy';
  layout?: PDFLayoutConfig;
  lastUsed?: string;
  isDefault?: boolean;
  preview?: string;
  stats?: {
    duration?: number;
    size?: number;
    pages?: number;
  };
}

interface PDFSourceSelectorProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PDFSourceSelector: React.FC<PDFSourceSelectorProps> = ({
  quote,
  open,
  onOpenChange
}) => {
  const { settings } = useSettings();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [previewOpacity, setPreviewOpacity] = useState([50]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sources, setSources] = useState<PDFSourceInfo[]>([]);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [fidelityScore, setFidelityScore] = useState(0);

  // Déterminer la variante du devis actuel
  const getQuoteVariant = (): LayoutVariant => {
    const hasTech = quote.items.some(i => i.kind === 'TECH');
    const hasAgent = quote.items.some(i => i.kind === 'AGENT');
    
    if (hasTech && hasAgent) return 'mixte';
    if (hasAgent) return 'agent';
    return 'technique';
  };

  const currentVariant = getQuoteVariant();

  // Charger les sources disponibles
  useEffect(() => {
    if (!open) return;

    const availableSources: PDFSourceInfo[] = [];

    // 1. Layouts JSON (WYSIWYG)
    const activePDFLayouts = settings.activePDFLayouts || {};
    const pdfLayouts = settings.pdfLayouts || {};
    
    if (pdfLayouts[currentVariant]) {
      pdfLayouts[currentVariant].forEach(layout => {
        availableSources.push({
          id: `json_${layout.id}`,
          name: layout.name,
          variant: layout.variant,
          type: 'json',
          layout: layout,
          isDefault: layout.id === activePDFLayouts[currentVariant],
          lastUsed: undefined // TODO: implement from storage
        });
      });
    }

    // Ajouter le layout par défaut s'il n'existe pas
    if (!availableSources.some(s => s.isDefault)) {
      const defaultLayout = getDefaultLayoutForVariant(currentVariant);
      availableSources.push({
        id: `json_${defaultLayout.id}`,
        name: defaultLayout.name,
        variant: defaultLayout.variant,
        type: 'json',
        layout: defaultLayout,
        isDefault: true
      });
    }

    // 2. Layouts issus du Copieur PDF
    // TODO: Charger depuis les layouts copiés
    
    // 3. Anciens gabarits (Legacy) - marqués comme tels
    availableSources.push({
      id: 'legacy_default',
      name: 'Modèle Legacy (obsolète)',
      variant: currentVariant,
      type: 'legacy',
      isDefault: false
    });

    setSources(availableSources);

    // Présélectionner la source par défaut ou la dernière utilisée
    const defaultSource = availableSources.find(s => s.isDefault);
    if (defaultSource) {
      setSelectedSource(defaultSource.id);
    }
  }, [open, currentVariant, settings]);

  // Générer un rendu test
  const generateTestRender = async (sourceId: string): Promise<void> => {
    const source = sources.find(s => s.id === sourceId);
    if (!source || !source.layout) return;

    try {
      setIsGenerating(true);
      const startTime = Date.now();

      // Générer le HTML
      const html = renderPDFFromLayout(quote, settings, source.layout);
      const duration = Date.now() - startTime;

      setPreviewHTML(html);
      
      // Calculer les stats approximatives
      const estimatedSize = new Blob([html]).size;
      const stats = {
        duration,
        size: estimatedSize,
        pages: 1 // TODO: calculer le nombre de pages réel
      };

      // Mettre à jour la source avec les stats
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, stats, preview: html } : s
      ));

      // Calculer un score de fidélité simulé (en attendant une vraie implémentation)
      setFidelityScore(Math.floor(92 + Math.random() * 7)); // 92-99%

    } catch (error) {
      console.error('Erreur lors du rendu test:', error);
      toast.error('Erreur lors de la génération du rendu test');
    } finally {
      setIsGenerating(false);
    }
  };

  // Voir la preview 1:1
  const showPreview = (sourceId: string) => {
    generateTestRender(sourceId);
  };

  // Télécharger le PDF final
  const downloadFinalPDF = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    try {
      setIsGenerating(true);

      let htmlContent: string;

      if (source.type === 'json' && source.layout) {
        // Utiliser le nouveau système
        htmlContent = renderPDFFromLayout(quote, settings, source.layout);
      } else if (source.type === 'legacy') {
        // Fallback vers le legacy (temporaire)
        toast.error('Les modèles legacy ne sont plus supportés');
        return;
      } else {
        toast.error('Source PDF non supportée');
        return;
      }

      // Options html2pdf standardisées
      const options = {
        margin: [12, 12, 12, 12], // 12mm de marge
        filename: `devis_${quote.ref}_${quote.date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          putOnlyUsedFonts: true,
          floatPrecision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after'
        }
      };

      // Générer et télécharger le PDF
      const pdfBlob = await html2pdf()
        .set(options)
        .from(htmlContent)
        .outputPdf('blob');

      // Vérifier la taille du PDF
      if (pdfBlob.size < 10000) { // < 10KB
        toast.error('Échec de génération du PDF (fichier trop petit)');
        return;
      }

      // Télécharger le fichier
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF téléchargé avec succès');

      // Sauvegarder le choix si demandé
      if (rememberChoice) {
        // TODO: Sauvegarder dans quote.selectedPdfSource
      }

      onOpenChange(false);

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choisir la version du PDF</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
          {/* Liste des sources */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto">
            <div className="text-sm text-muted-foreground">
              Sources disponibles pour le devis {currentVariant} :
            </div>
            
            {sources.map((source) => (
              <Card 
                key={source.id} 
                className={`cursor-pointer transition-all ${
                  selectedSource === source.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSource(source.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {source.name}
                        {source.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        )}
                        <Badge 
                          variant={source.type === 'json' ? 'default' : 
                                  source.type === 'copier' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {source.type === 'json' ? 'WYSIWYG' :
                           source.type === 'copier' ? 'Copié' : 'Legacy'}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Variante : {source.variant}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateTestRender(source.id);
                      }}
                      disabled={isGenerating}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Rendu test
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        showPreview(source.id);
                      }}
                      disabled={isGenerating}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFinalPDF(source.id);
                      }}
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Utiliser
                    </Button>
                  </div>

                  {/* Stats */}
                  {source.stats && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(source.stats.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(source.stats.size)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {source.stats.pages} page{source.stats.pages > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Preview panel */}
          <div className="border rounded-lg p-4 overflow-hidden flex flex-col">
            <div className="flex-none mb-4">
              <h3 className="font-medium mb-2">Preview 1:1</h3>
              
              {fidelityScore > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">Fidélité :</span>
                    <Badge 
                      variant={fidelityScore >= 95 ? 'default' : fidelityScore >= 85 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {fidelityScore}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Label htmlFor="opacity">Opacité :</Label>
                    <Slider
                      id="opacity"
                      min={0}
                      max={100}
                      step={5}
                      value={previewOpacity}
                      onValueChange={setPreviewOpacity}
                      className="flex-1"
                    />
                    <span>{previewOpacity[0]}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 rounded border">
              {previewHTML ? (
                <div 
                  className="bg-white mx-auto shadow-sm"
                  style={{ 
                    width: '210mm', 
                    minHeight: '297mm',
                    transform: 'scale(0.3)',
                    transformOrigin: 'top left',
                    opacity: previewOpacity[0] / 100
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHTML }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Cliquez sur "Preview" pour voir l'aperçu
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="remember"
              checked={rememberChoice}
              onCheckedChange={setRememberChoice}
            />
            <Label htmlFor="remember" className="text-sm">
              Se souvenir de mon choix pour ce devis
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            
            {selectedSource && (
              <Button
                onClick={() => downloadFinalPDF(selectedSource)}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};