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
  const colors = settings.templateColors || { primary: '#2563eb', secondary: '#64748b', accent: '#059669' };
  
  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* En-tête avec logo et adresses */}
      <div className="flex justify-between items-start mb-8">
        {/* Logo et vendeur (gauche) */}
        <div className="flex-1">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-20 mb-4" />
          )}
          {settings.sellerInfo?.name && (
            <div className="space-y-1 text-sm">
              <p className="font-semibold" style={{ color: colors.primary }}>{settings.sellerInfo.name}</p>
              {settings.sellerInfo.title && <p className="text-gray-600">{settings.sellerInfo.title}</p>}
              {settings.sellerInfo.email && <p>{settings.sellerInfo.email}</p>}
              {settings.sellerInfo.phone && <p>{settings.sellerInfo.phone}</p>}
            </div>
          )}
        </div>
        
        {/* Adresse client (droite) */}
        <div className="text-right">
          <div className="space-y-1">
            <p className="font-semibold text-lg">{quote.addresses.contact.company}</p>
            <p>{quote.addresses.contact.name}</p>
            <p>{quote.addresses.contact.street}</p>
            <p>{quote.addresses.contact.postalCode} {quote.addresses.contact.city}</p>
            <p>{quote.addresses.contact.country}</p>
            {quote.addresses.contact.email && <p className="text-sm" style={{ color: colors.secondary }}>{quote.addresses.contact.email}</p>}
            {quote.addresses.contact.phone && <p className="text-sm">{quote.addresses.contact.phone}</p>}
          </div>
        </div>
      </div>

      {/* Titre du devis */}
      <div className="text-center py-6" style={{ borderTop: `3px solid ${colors.primary}`, borderBottom: `1px solid ${colors.secondary}` }}>
        <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>{settings.pdfTitle}</h1>
        <p className="text-lg mt-2" style={{ color: colors.secondary }}>Devis N° {quote.ref}</p>
        <p className="text-gray-500">Date: {new Date(quote.date).toLocaleDateString('fr-CH')}</p>
      </div>

      {/* Informations complémentaires */}
      {(quote.site || quote.contact || quote.canton) && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Détails du projet</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {quote.site && <p><span className="font-medium">Site:</span> {quote.site}</p>}
            {quote.contact && <p><span className="font-medium">Contact:</span> {quote.contact}</p>}
            {quote.canton && <p><span className="font-medium">Canton:</span> {quote.canton}</p>}
          </div>
        </div>
      )}

      {/* Prestations TECH */}
      {quote.items.some(item => item.kind === 'TECH') && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>Prestations techniques</h3>
          <table className="w-full border-collapse" style={{ border: `1px solid ${colors.secondary}` }}>
            <thead>
              <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                <th className="px-3 py-3 text-left font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Type</th>
                <th className="px-3 py-3 text-left font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Référence</th>
                <th className="px-3 py-3 text-center font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Mode</th>
                <th className="px-3 py-3 text-center font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Qté</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>PU TTC</th>
                <th className="px-3 py-3 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.filter(item => item.kind === 'TECH').map((item, index) => (
                <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                  <td className="px-3 py-2" style={{ border: `1px solid ${colors.secondary}` }}>{item.type}</td>
                  <td className="px-3 py-2" style={{ border: `1px solid ${colors.secondary}` }}>{item.reference}</td>
                  <td className="px-3 py-2 text-center" style={{ border: `1px solid ${colors.secondary}` }}>
                    <span className="px-2 py-1 rounded text-xs" style={{ 
                      backgroundColor: item.mode === 'mensuel' ? colors.accent : colors.secondary,
                      color: 'white'
                    }}>
                      {item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center" style={{ border: `1px solid ${colors.secondary}` }}>{item.qty}</td>
                  <td className="px-3 py-2 text-right" style={{ border: `1px solid ${colors.secondary}` }}>{item.puTTC?.toFixed(2)} CHF</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}`, color: colors.primary }}>
                    {item.totalTTC?.toFixed(2)} CHF{item.mode === 'mensuel' ? '/mois' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prestations AGENT */}
      {quote.items.some(item => item.kind === 'AGENT') && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>Prestations d'agents de sécurité</h3>
          <table className="w-full border-collapse" style={{ border: `1px solid ${colors.secondary}` }}>
            <thead>
              <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Date début</th>
                <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Heure début</th>
                <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Date fin</th>
                <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Heure fin</th>
                <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Type</th>
                <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H norm.</th>
                <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H nuit</th>
                <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H dim.</th>
                <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H JF</th>
                <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Tarif CHF/h</th>
                <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Dépl.</th>
                <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>HT</th>
                <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>TVA</th>
                <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>TTC</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.filter(item => item.kind === 'AGENT').map((item, index) => (
                <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                  <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.timeStart || '-'}</td>
                  <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.timeEnd || '-'}</td>
                  <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.agentType || '-'}</td>
                  <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.hoursNormal?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.hoursNight?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.hoursSunday?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.hoursHoliday?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.rateCHFh?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.travelCHF?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.lineHT?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                    {item.lineTVA?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-2 py-2 text-right text-xs font-semibold" style={{ border: `1px solid ${colors.secondary}`, color: colors.primary }}>
                    {item.lineTTC?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Règles appliquées pour les agents */}
          <div className="bg-gray-50 p-4 rounded text-sm">
            <h4 className="font-semibold mb-2" style={{ color: colors.primary }}>Règles appliquées</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="font-medium">Heures de nuit:</span> {settings.agentSettings?.nightStartTime || '23:00'} → {settings.agentSettings?.nightEndTime || '06:00'} (+{settings.agentSettings?.nightMarkupPct || 10}%)</p>
              <p><span className="font-medium">Dimanche/JF:</span> {settings.agentSettings?.sundayStartTime || '06:00'} → {settings.agentSettings?.sundayEndTime || '23:00'} (+{settings.agentSettings?.sundayMarkupPct || 10}%)</p>
              <p><span className="font-medium">Jours fériés:</span> +{settings.agentSettings?.holidayMarkupPct || 10}%</p>
              <p><span className="font-medium">Règle spéciale:</span> Passage à 23h/06h pile = 1h pleine</p>
            </div>
          </div>
        </div>
      )}

      {/* Totaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Unique */}
        {totals.unique.totalTTC > 0 && (
          <div className="p-4 rounded-lg" style={{ border: `2px solid ${colors.secondary}`, backgroundColor: '#f8fafc' }}>
            <h4 className="font-semibold mb-3" style={{ color: colors.primary }}>Achat unique</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{totals.unique.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({settings.tvaPct}%):</span>
                <span>{totals.unique.tva.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: `1px solid ${colors.secondary}`, color: colors.primary }}>
                <span>Total TTC:</span>
                <span>{totals.unique.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        )}

        {/* Mensuel */}
        {totals.mensuel.totalTTC > 0 && (
          <div className="p-4 rounded-lg" style={{ border: `2px solid ${colors.accent}`, backgroundColor: '#f0fdf4' }}>
            <h4 className="font-semibold mb-3" style={{ color: colors.accent }}>Abonnement mensuel</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({settings.tvaPct}%):</span>
                <span>{totals.mensuel.tva.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: `1px solid ${colors.accent}`, color: colors.accent }}>
                <span>Total TTC:</span>
                <span>{totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
              </div>
            </div>
          </div>
        )}

        {/* Agents */}
        {totals.agents.totalTTC > 0 && (
          <div className="p-4 rounded-lg" style={{ border: `2px solid #f59e0b`, backgroundColor: '#fefbf3' }}>
            <h4 className="font-semibold mb-3" style={{ color: '#f59e0b' }}>Agents de sécurité</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span>{totals.agents.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({settings.tvaPct}%):</span>
                <span>{totals.agents.tva.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: `1px solid #f59e0b`, color: '#f59e0b' }}>
                <span>Total TTC:</span>
                <span>{totals.agents.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total général */}
      <div className="p-6 rounded-lg text-center" style={{ 
        border: `3px solid ${colors.primary}`, 
        background: `linear-gradient(135deg, ${colors.primary}08, ${colors.accent}08)` 
      }}>
        <h4 className="font-bold text-2xl mb-4" style={{ color: colors.primary }}>TOTAL GÉNÉRAL</h4>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <p className="text-sm" style={{ color: colors.secondary }}>Total HT</p>
            <p className="text-xl font-semibold" style={{ color: colors.primary }}>{totals.global.htAfterDiscount.toFixed(2)} CHF</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.secondary }}>TVA totale</p>
            <p className="text-xl font-semibold" style={{ color: colors.primary }}>{totals.global.tva.toFixed(2)} CHF</p>
          </div>
        </div>
        <div className="pt-4" style={{ borderTop: `2px solid ${colors.primary}` }}>
          <p className="text-3xl font-bold" style={{ color: colors.primary }}>
            {totals.global.totalTTC.toFixed(2)} CHF
          </p>
          {totals.mensuel.totalTTC > 0 && (
            <p className="text-xl font-semibold mt-2" style={{ color: colors.accent }}>
              + {totals.mensuel.totalTTC.toFixed(2)} CHF/mois
            </p>
          )}
        </div>
      </div>

      {/* Commentaire */}
      {quote.comment && (
        <div>
          <h4 className="font-semibold text-lg mb-3" style={{ color: colors.primary }}>Commentaires</h4>
          <div className="p-4 rounded-lg" style={{ border: `1px solid ${colors.secondary}`, backgroundColor: '#f8fafc' }}>
            <p className="whitespace-pre-wrap">{quote.comment}</p>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-sm pt-6 mt-8" style={{ borderTop: `2px solid ${colors.primary}`, color: colors.secondary }}>
        <p className="font-medium">{settings.pdfFooter}</p>
        <p className="mt-2">Devis valable 30 jours - Conditions générales disponibles sur demande</p>
      </div>
    </div>
  );
};

const PDFPreview = () => {
  const { currentQuote, settings } = useStore();

  if (!currentQuote) return null;

  const downloadPDF = async () => {
    try {
      const element = document.querySelector('.pdf-preview-content');
      if (!element) {
        console.error('Element PDF non trouvé');
        return;
      }

      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: `devis-${currentQuote.ref}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generate PDF as blob and force download
      const pdfBlob = await html2pdf().set(options).from(element).outputPdf('blob');
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-${currentQuote.ref}.pdf`;
      link.style.display = 'none';
      
      // Force download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors du téléchargement du PDF. Veuillez réessayer.');
    }
  };

  const downloadWord = () => {
    try {
      const element = document.querySelector('.pdf-preview-content');
      if (!element) {
        console.error('Element PDF non trouvé pour Word');
        return;
      }

      // Créer un document HTML complet avec styles Word-compatibles
      const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word">
          <meta name="Originator" content="Microsoft Word">
          <title>Devis ${currentQuote.ref}</title>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotPromptForConvert/><w:DoNotShowInsertionsAndDeletions/></w:WordDocument></xml><![endif]-->
          <style>
            @page { 
              margin: 2cm;
              size: A4 portrait; 
            }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 11pt;
              line-height: 1.2;
              margin: 0;
              color: black;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 10px 0;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            th, td { 
              border: 1pt solid #666; 
              padding: 6pt; 
              vertical-align: top;
              mso-border-alt: solid #666 0.5pt;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            h1 { font-size: 18pt; margin: 20pt 0 10pt 0; }
            h3 { font-size: 14pt; margin: 15pt 0 8pt 0; }
            h4 { font-size: 12pt; margin: 12pt 0 6pt 0; }
            p { margin: 6pt 0; }
            .space-y-4 > * + * { margin-top: 12pt; }
            .grid { display: table; width: 100%; }
            .grid > div { display: table-cell; padding: 6pt; }
          </style>
        </head>
        <body>
          ${element.innerHTML.replace(/class="[^"]*"/g, '')}
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-${currentQuote.ref}.doc`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Document Word téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement Word:', error);
      alert('Erreur lors du téléchargement du document Word. Veuillez réessayer.');
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
            <Button onClick={downloadWord} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Télécharger Word
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