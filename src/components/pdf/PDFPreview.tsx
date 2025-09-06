import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileDown, Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals } from '@/utils/calculations';
import { Quote, Settings } from '@/types';

interface PDFPreviewProps {
  quote: Quote;
  settings: Settings;
}

const PDFPreviewContent = ({ quote, settings }: PDFPreviewProps) => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  
  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6" style={{ fontFamily: 'serif' }}>
      {/* En-tête */}
      <div className="text-center border-b-2 border-gray-300 pb-4">
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold text-gray-800">{settings.pdfTitle}</h1>
        <p className="text-gray-600">Devis N° {quote.ref}</p>
        <p className="text-gray-500">Date: {new Date(quote.date).toLocaleDateString('fr-CH')}</p>
      </div>

      {/* Informations client */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Client</h3>
          <div className="space-y-1">
            <p className="font-medium">{quote.addresses.contact.company}</p>
            <p>{quote.addresses.contact.name}</p>
            <p>{quote.addresses.contact.street}</p>
            <p>{quote.addresses.contact.postalCode} {quote.addresses.contact.city}</p>
            <p>{quote.addresses.contact.country}</p>
            {quote.addresses.contact.email && <p className="text-blue-600">{quote.addresses.contact.email}</p>}
            {quote.addresses.contact.phone && <p>{quote.addresses.contact.phone}</p>}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Détails</h3>
          <div className="space-y-1">
            {quote.site && <p><span className="font-medium">Site:</span> {quote.site}</p>}
            {quote.contact && <p><span className="font-medium">Contact:</span> {quote.contact}</p>}
            {quote.canton && <p><span className="font-medium">Canton:</span> {quote.canton}</p>}
            <p><span className="font-medium">TVA:</span> {settings.tvaPct}%</p>
          </div>
        </div>
      </div>

      {/* Tableau des prestations */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-800">Détail des prestations</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Référence</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Mode</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Qté</th>
              <th className="border border-gray-300 px-3 py-2 text-right">PU TTC</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-3 py-2">{item.type}</td>
                <td className="border border-gray-300 px-3 py-2">{item.reference}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{item.qty}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{item.puTTC?.toFixed(2)} CHF</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                  {item.totalTTC?.toFixed(2)} CHF{item.mode === 'mensuel' ? '/mois' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unique */}
        {totals.unique.totalTTC > 0 && (
          <div className="border border-gray-300 p-4">
            <h4 className="font-semibold mb-3 text-gray-800">Achat unique</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{totals.unique.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({settings.tvaPct}%):</span>
                <span>{totals.unique.tva.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total TTC:</span>
                <span>{totals.unique.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        )}

        {/* Mensuel */}
        {totals.mensuel.totalTTC > 0 && (
          <div className="border border-gray-300 p-4">
            <h4 className="font-semibold mb-3 text-gray-800">Abonnement mensuel</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({settings.tvaPct}%):</span>
                <span>{totals.mensuel.tva.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total TTC:</span>
                <span>{totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total général */}
      <div className="border-2 border-gray-400 p-4 bg-gray-50">
        <h4 className="font-bold text-xl mb-3 text-center text-gray-800">TOTAL GÉNÉRAL</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total HT</p>
            <p className="text-lg font-semibold">{totals.global.htAfterDiscount.toFixed(2)} CHF</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">TVA totale</p>
            <p className="text-lg font-semibold">{totals.global.tva.toFixed(2)} CHF</p>
          </div>
        </div>
        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-2xl font-bold text-gray-800">
            {totals.global.totalTTC.toFixed(2)} CHF
          </p>
          {totals.mensuel.totalTTC > 0 && (
            <p className="text-lg text-green-600 mt-2">
              + {totals.mensuel.totalTTC.toFixed(2)} CHF/mois
            </p>
          )}
        </div>
      </div>

      {/* Commentaire */}
      {quote.comment && (
        <div>
          <h4 className="font-semibold text-lg mb-3 text-gray-800">Commentaires</h4>
          <div className="border border-gray-300 p-4 bg-gray-50">
            <p className="whitespace-pre-wrap">{quote.comment}</p>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-sm text-gray-500 border-t pt-4 mt-8">
        <p>{settings.pdfFooter}</p>
        <p className="mt-2">Devis valable 30 jours - Conditions générales disponibles sur demande</p>
      </div>
    </div>
  );
};

const PDFPreview = () => {
  const { currentQuote, settings } = useStore();

  if (!currentQuote) return null;

  const downloadPDF = () => {
    // Simple téléchargement via impression du navigateur
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Devis ${currentQuote.ref}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print { body { margin: 0; } }
              .preview-content { max-width: 800px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="preview-content">
              ${document.querySelector('.pdf-preview-content')?.innerHTML || ''}
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mr-2">
          <Eye className="h-4 w-4 mr-2" />
          Prévisualiser PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévisualisation du PDF</DialogTitle>
          <DialogDescription>
            Aperçu du devis avant téléchargement
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-end space-x-2">
            <Button onClick={downloadPDF} className="bg-primary hover:bg-primary/90">
              <FileDown className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
          
          <div className="pdf-preview-content border rounded-lg p-4 bg-white max-h-[70vh] overflow-y-auto">
            <PDFPreviewContent quote={currentQuote} settings={settings} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview;