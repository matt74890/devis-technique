import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals, calculateQuoteItem } from '@/utils/calculations';
import { calculateAgentVacation } from '@/utils/agentCalculations';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { PDFPreview } from './PDFPreview';

const RecapScreen = () => {
  const { currentQuote, settings } = useStore();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  if (!currentQuote) return null;

  // Calculate all items
  const calculatedItems = currentQuote.items.map(item => {
    if (item.kind === 'AGENT') {
      return calculateAgentVacation(item, settings);
    } else {
      return calculateQuoteItem(item, settings.tvaPct, currentQuote.discountMode === 'per_line', settings);
    }
  });

  const quoteWithCalculatedItems = { ...currentQuote, items: calculatedItems };
  const totals = calculateQuoteTotals(quoteWithCalculatedItems, settings.tvaPct);

  const getQuoteType = () => {
    const hasTech = calculatedItems.some(i => i.kind === 'TECH');
    const hasAgent = calculatedItems.some(i => i.kind === 'AGENT');
    const hasService = calculatedItems.some(i => i.kind === 'SERVICE');
    
    if (hasTech && hasAgent) return 'Mixte';
    if (hasAgent) return 'Agent';
    if (hasService) return 'Service';
    return 'Technique';
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentQuote, null, 2));
    toast.success('JSON copié dans le presse-papier');
  };

  const downloadJSON = () => {
    const filename = `devis_${currentQuote.ref || 'sans_ref'}_${new Date().toISOString().slice(0,10)}.json`;
    const blob = new Blob([JSON.stringify(currentQuote, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON téléchargé');
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Récapitulatif du devis</h2>
          <p className="text-muted-foreground">Source de vérité unique - Toutes les données normalisées</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyJSON} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copier JSON
          </Button>
          <Button onClick={downloadJSON} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Télécharger JSON
          </Button>
          <Button variant="outline" onClick={() => setShowPdfPreview(!showPdfPreview)}>
            <FileText className="w-4 h-4 mr-2" />
            {showPdfPreview ? 'Masquer PDF' : 'Aperçu PDF'}
          </Button>
        </div>
      </div>

      {/* En-tête du devis */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Référence</label>
            <p className="font-semibold">{currentQuote.ref || 'Non définie'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <p>{format(new Date(currentQuote.date), 'dd/MM/yyyy', { locale: fr })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <Badge variant="outline">{getQuoteType()}</Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Client</label>
            <p>{currentQuote.addresses.contact.name || currentQuote.client || 'Non défini'}</p>
            {currentQuote.addresses.contact.company && (
              <p className="text-sm text-muted-foreground">{currentQuote.addresses.contact.company}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Technique */}
      {calculatedItems.filter(i => i.kind === 'TECH').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prestations techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Réf</th>
                    <th className="text-left p-2">Désignation</th>
                    <th className="text-left p-2">Qté</th>
                    <th className="text-right p-2">PU HT</th>
                    <th className="text-right p-2">TVA</th>
                    <th className="text-right p-2">Total HT</th>
                    <th className="text-right p-2">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.filter(i => i.kind === 'TECH').map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.reference}</td>
                      <td className="p-2">{item.type}</td>
                      <td className="p-2">{item.qty}</td>
                      <td className="text-right p-2">{item.puHT?.toFixed(2)} CHF</td>
                      <td className="text-right p-2">{settings.tvaPct}%</td>
                      <td className="text-right p-2">{item.totalHT_net?.toFixed(2)} CHF</td>
                      <td className="text-right p-2">{item.totalTTC?.toFixed(2)} CHF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent */}
      {calculatedItems.filter(i => i.kind === 'AGENT').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prestations agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nature</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Date début</th>
                    <th className="text-left p-2">Heure début</th>
                    <th className="text-left p-2">Date fin</th>
                    <th className="text-left p-2">Heure fin</th>
                    <th className="text-right p-2">H. normales</th>
                    <th className="text-right p-2">H. majorées</th>
                    <th className="text-right p-2">Tarif/h</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.filter(i => i.kind === 'AGENT').map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.reference}</td>
                      <td className="p-2">{item.agentType}</td>
                      <td className="p-2">{item.dateStart}</td>
                      <td className="p-2">{item.timeStart}</td>
                      <td className="p-2">{item.dateEnd}</td>
                      <td className="p-2">{item.timeEnd}</td>
                      <td className="text-right p-2">{item.hoursNormal?.toFixed(1)}</td>
                      <td className="text-right p-2">{((item.hoursNight || 0) + (item.hoursSunday || 0) + (item.hoursHoliday || 0)).toFixed(1)}</td>
                      <td className="text-right p-2">{item.rateCHFh} CHF</td>
                      <td className="text-right p-2">{item.lineTTC?.toFixed(2)} CHF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totaux */}
      <Card>
        <CardHeader>
          <CardTitle>Totaux</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total HT:</span>
              <span className="font-semibold">{totals.global.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({settings.tvaPct}%):</span>
              <span className="font-semibold">{totals.global.tva.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total TTC:</span>
              <span className="font-bold text-lg">{totals.global.totalTTC.toFixed(2)} CHF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON brut */}
      <Card>
        <CardHeader>
          <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Données JSON brutes
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {jsonOpen ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(currentQuote, null, 2)}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Aperçu PDF */}
      {showPdfPreview && (
        <PDFPreview onClose={() => setShowPdfPreview(false)} />
      )}
    </div>
  );
};

export default RecapScreen;