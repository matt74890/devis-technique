import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDown, Eye, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/components/SettingsProvider';
import { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { renderPDFFromLayout, getLayoutForQuote } from '@/utils/pdfRenderer';
import { PDFSourceSelector } from './PDFSourceSelector';
import { toast } from 'sonner';
import { useState } from 'react';

interface PDFPreviewProps {
  quote: Quote;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ quote }) => {
  const { settings } = useSettings();
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Déterminer la variante du devis actuel
  const getQuoteVariant = (): LayoutVariant => {
    const hasTech = quote.items.some(i => i.kind === 'TECH');
    const hasAgent = quote.items.some(i => i.kind === 'AGENT');
    
    if (hasTech && hasAgent) return 'mixte';
    if (hasAgent) return 'agent';
    return 'technique';
  };

  const currentVariant = getQuoteVariant();

  // Récupérer le layout actif
  const activeLayout = getLayoutForQuote ? getLayoutForQuote(quote, settings) : getDefaultLayoutForVariant(currentVariant);

  // Générer le HTML pour la preview
  const generatePreviewHTML = (): string => {
    if (!activeLayout) {
      return '<div>Erreur : Aucun layout disponible</div>';
    }
    
    return renderPDFFromLayout(quote, settings, activeLayout);
  };

  // Ouvrir le sélecteur de PDF
  const handleDownloadPDF = () => {
    if (!activeLayout) {
      toast.error('Aucun layout PDF actif. Veuillez configurer un layout dans les paramètres.');
      return;
    }
    
    setSelectorOpen(true);
  };

  const previewHTML = generatePreviewHTML();


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aperçu PDF - Variante {currentVariant}</span>
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Prévisualisation PDF - {activeLayout?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-auto h-96">
                    <div 
                      className="bg-white p-4 shadow-lg mx-auto"
                      style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.8)', transformOrigin: 'top' }}
                      dangerouslySetInnerHTML={{ __html: previewHTML }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={handleDownloadPDF} 
                size="sm"
                disabled={!activeLayout}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="flex-1 text-sm text-muted-foreground">
              {activeLayout ? (
                <>
                  <div className="font-medium text-foreground mb-1">Layout actif : {activeLayout.name}</div>
                  <div>Le PDF généré utilisera le layout JSON configuré. La prévisualisation et le téléchargement sont identiques.</div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Aucun layout actif configuré. Veuillez configurer un layout dans les paramètres.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PDFSourceSelector
        quote={quote}
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />
    </div>
  );
};

export default PDFPreview;