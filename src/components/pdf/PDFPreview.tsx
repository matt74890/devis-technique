import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDown, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals } from '@/utils/calculations';
import { Quote, Settings } from '@/types';

interface PDFPreviewProps {
  quote: Quote;
  settings: Settings;
}

// Fonction unifiée qui génère le HTML du PDF selon le layout actuel
const renderDevisHTML = (quote: Quote, settings: Settings): string => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  
  // Utiliser le layout actif ou le layout par défaut
  const variant = quote.items.some(i => i.kind === 'TECH') && quote.items.some(i => i.kind === 'AGENT') 
    ? 'mixte' 
    : quote.items.some(i => i.kind === 'AGENT') 
    ? 'agent' 
    : 'technique';
    
  // TODO: Utiliser le système de layout JSON pour générer le HTML
  // Pour l'instant, HTML simplifié
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Devis ${quote.ref}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt; 
            line-height: 1.4; 
            margin: 0; 
            color: #000; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 20px; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
          }
          .totals { 
            float: right; 
            width: 200px; 
            border: 1px solid #ddd; 
            padding: 10px; 
            margin-top: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>GPA Sécurité</div>
          <div>Réf. : ${quote.ref} • ${new Date(quote.date).toLocaleDateString('fr-CH')}</div>
        </div>
        
        <div style="margin: 20px 0;">
          <h2>Devis ${variant.charAt(0).toUpperCase() + variant.slice(1)}</h2>
          <p>Client: ${quote.client}</p>
          ${quote.site ? `<p>Site: ${quote.site}</p>` : ''}
        </div>

        ${quote.items.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Article</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qté</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.reference}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                    ${item.kind === 'TECH' ? (item.totalTTC?.toFixed(2) + ' CHF') : (item.lineTTC?.toFixed(2) + ' CHF')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="totals">
          <div><strong>Total TTC: ${totals.global.totalTTC.toFixed(2)} CHF</strong></div>
        </div>

        <div style="position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 9pt; color: #666;">
          GPA SA – Sécurité privée • Page 1/1
        </div>
      </body>
    </html>
  `;
};

const PDFPreview: React.FC<PDFPreviewProps> = ({ quote, settings }) => {
  const downloadPDF = async () => {
    try {
      // Récupérer les données les plus récentes du store
      const { currentQuote, settings: currentSettings } = useStore.getState();
      const finalQuote = currentQuote || quote;
      const finalSettings = currentSettings || settings;

      const htmlContent = renderDevisHTML(finalQuote, finalSettings);
      
      // Créer un iframe temporaire pour le rendu
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '794px';
      iframe.style.height = '1123px';
      document.body.appendChild(iframe);
      
      if (!iframe.contentDocument) {
        throw new Error('Impossible de créer le document PDF');
      }

      iframe.contentDocument.open();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();

      // Attendre que le contenu soit chargé
      await new Promise(resolve => setTimeout(resolve, 500));

      // Générer le PDF avec window.print
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }

      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const previewHTML = renderDevisHTML(quote, settings);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aperçu PDF</span>
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
                    <DialogTitle>Prévisualisation PDF</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-auto h-96">
                    <div 
                      className="bg-white p-4 shadow-lg mx-auto"
                      style={{ width: '210mm', minHeight: '297mm' }}
                      dangerouslySetInnerHTML={{ __html: previewHTML }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={downloadPDF} size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Le PDF généré utilisera la disposition active définie dans les paramètres.
            La prévisualisation et le PDF téléchargé sont identiques.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFPreview;