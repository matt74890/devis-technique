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

// Fonction unifiée qui génère le HTML complet du devis avec styles inline
const renderDevisHTML = (quote: Quote, settings: Settings): string => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  const colors = settings.templateColors || { primary: '#2563eb', secondary: '#64748b', accent: '#059669' };
  
  return `
    <div style="max-width: 210mm; margin: 0 auto; background: white; color: black; padding: 20mm; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4;">
      <!-- En-tête avec logo et adresses -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <!-- Logo et vendeur (gauche) -->
        <div style="flex: 1;">
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 15px;" />` : ''}
          ${settings.sellerInfo?.name ? `
            <div style="font-size: 11pt;">
              <p style="font-weight: bold; color: ${colors.primary}; margin: 4px 0;">${settings.sellerInfo.name}</p>
              ${settings.sellerInfo.title ? `<p style="color: #666; margin: 2px 0;">${settings.sellerInfo.title}</p>` : ''}
              ${settings.sellerInfo.email ? `<p style="margin: 2px 0;">${settings.sellerInfo.email}</p>` : ''}
              ${settings.sellerInfo.phone ? `<p style="margin: 2px 0;">${settings.sellerInfo.phone}</p>` : ''}
            </div>
          ` : ''}
        </div>
        
        <!-- Adresse client (droite) -->
        <div style="text-align: right;">
          <div>
            <p style="font-weight: bold; font-size: 14pt; margin: 4px 0;">${quote.addresses.contact.company}</p>
            <p style="margin: 2px 0;">${quote.addresses.contact.name}</p>
            <p style="margin: 2px 0;">${quote.addresses.contact.street}</p>
            <p style="margin: 2px 0;">${quote.addresses.contact.postalCode} ${quote.addresses.contact.city}</p>
            <p style="margin: 2px 0;">${quote.addresses.contact.country}</p>
            ${quote.addresses.contact.email ? `<p style="font-size: 10pt; color: ${colors.secondary}; margin: 2px 0;">${quote.addresses.contact.email}</p>` : ''}
            ${quote.addresses.contact.phone ? `<p style="font-size: 10pt; margin: 2px 0;">${quote.addresses.contact.phone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Titre du devis -->
      <div style="text-align: center; padding: 20px 0; border-top: 3px solid ${colors.primary}; border-bottom: 1px solid ${colors.secondary};">
        <h1 style="font-size: 24pt; font-weight: bold; color: ${colors.primary}; margin: 0 0 8px 0;">${settings.pdfTitle}</h1>
        <p style="font-size: 14pt; margin: 4px 0; color: ${colors.secondary};">Devis N° ${quote.ref}</p>
        <p style="color: #666; margin: 4px 0;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</p>
      </div>

      ${(quote.site || quote.contact || quote.canton) ? `
        <!-- Informations complémentaires -->
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="font-weight: bold; margin-bottom: 8px; color: ${colors.primary}; font-size: 12pt;">Détails du projet</h3>
          <div style="font-size: 10pt;">
            ${quote.site ? `<p style="margin: 4px 0;"><span style="font-weight: bold;">Site:</span> ${quote.site}</p>` : ''}
            ${quote.contact ? `<p style="margin: 4px 0;"><span style="font-weight: bold;">Contact:</span> ${quote.contact}</p>` : ''}
            ${quote.canton ? `<p style="margin: 4px 0;"><span style="font-weight: bold;">Canton:</span> ${quote.canton}</p>` : ''}
          </div>
        </div>
      ` : ''}

      ${quote.items.some(item => item.kind === 'TECH') ? `
        <!-- Prestations TECH -->
        <div style="margin: 20px 0;">
          <h3 style="font-weight: bold; font-size: 14pt; color: ${colors.primary}; margin-bottom: 10px;">Prestations techniques</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.secondary};">
            <thead>
              <tr style="background: ${colors.primary}; color: white;">
                <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Type</th>
                <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Référence</th>
                <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">Mode</th>
                <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">Qté</th>
                <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">PU TTC</th>
                <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.filter(item => item.kind === 'TECH').map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                  <td style="padding: 6px; border: 1px solid ${colors.secondary};">${item.type}</td>
                  <td style="padding: 6px; border: 1px solid ${colors.secondary};">${item.reference}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid ${colors.secondary};">
                    <span style="padding: 2px 6px; border-radius: 3px; font-size: 9pt; background: ${item.mode === 'mensuel' ? colors.accent : colors.secondary}; color: white;">
                      ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                    </span>
                  </td>
                  <td style="padding: 6px; text-align: center; border: 1px solid ${colors.secondary};">${item.qty}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid ${colors.secondary};">${item.puTTC?.toFixed(2)} CHF</td>
                  <td style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary}; color: ${colors.primary};">
                    ${item.totalTTC?.toFixed(2)} CHF${item.mode === 'mensuel' ? '/mois' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${quote.items.some(item => item.kind === 'AGENT') ? `
        <!-- Prestations AGENT -->
        <div style="margin: 20px 0;">
          <h3 style="font-weight: bold; font-size: 14pt; color: ${colors.primary}; margin-bottom: 10px;">Prestations d'agents de sécurité</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.secondary}; font-size: 9pt;">
            <thead>
              <tr style="background: ${colors.primary}; color: white;">
                <th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Date début</th>
                <th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Heure début</th>
                <th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Date fin</th>
                <th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Heure fin</th>
                <th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Type</th>
                <th style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">H norm.</th>
                <th style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">H nuit</th>
                <th style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">H dim.</th>
                <th style="padding: 6px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">H JF</th>
                <th style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">Tarif CHF/h</th>
                <th style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">Dépl.</th>
                <th style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">HT</th>
                <th style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">TVA</th>
                <th style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">TTC</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.filter(item => item.kind === 'AGENT').map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                  <td style="padding: 4px; border: 1px solid ${colors.secondary};">
                    ${item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-'}
                  </td>
                  <td style="padding: 4px; border: 1px solid ${colors.secondary};">${item.timeStart || '-'}</td>
                  <td style="padding: 4px; border: 1px solid ${colors.secondary};">
                    ${item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-'}
                  </td>
                  <td style="padding: 4px; border: 1px solid ${colors.secondary};">${item.timeEnd || '-'}</td>
                  <td style="padding: 4px; border: 1px solid ${colors.secondary};">${item.agentType || '-'}</td>
                  <td style="padding: 4px; text-align: center; border: 1px solid ${colors.secondary};">
                    ${item.hoursNormal?.toFixed(1) || '0.0'}
                  </td>
                  <td style="padding: 4px; text-align: center; border: 1px solid ${colors.secondary};">
                    ${item.hoursNight?.toFixed(1) || '0.0'}
                  </td>
                  <td style="padding: 4px; text-align: center; border: 1px solid ${colors.secondary};">
                    ${item.hoursSunday?.toFixed(1) || '0.0'}
                  </td>
                  <td style="padding: 4px; text-align: center; border: 1px solid ${colors.secondary};">
                    ${item.hoursHoliday?.toFixed(1) || '0.0'}
                  </td>
                  <td style="padding: 4px; text-align: right; border: 1px solid ${colors.secondary};">
                    ${item.rateCHFh?.toFixed(2) || '0.00'}
                  </td>
                  <td style="padding: 4px; text-align: right; border: 1px solid ${colors.secondary};">
                    ${item.travelCHF?.toFixed(2) || '0.00'}
                  </td>
                  <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">
                    ${item.lineHT?.toFixed(2) || '0.00'}
                  </td>
                  <td style="padding: 4px; text-align: right; border: 1px solid ${colors.secondary};">
                    ${item.lineTVA?.toFixed(2) || '0.00'}
                  </td>
                  <td style="padding: 4px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary}; color: ${colors.primary};">
                    ${item.lineTTC?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Règles appliquées pour les agents -->
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 10pt; margin-top: 10px;">
            <h4 style="font-weight: bold; margin-bottom: 8px; color: ${colors.primary};">Règles appliquées</h4>
            <div>
              <p style="margin: 4px 0;"><span style="font-weight: bold;">Heures de nuit:</span> ${settings.agentSettings?.nightStartTime || '23:00'} → ${settings.agentSettings?.nightEndTime || '06:00'} (+${settings.agentSettings?.nightMarkupPct || 10}%)</p>
              <p style="margin: 4px 0;"><span style="font-weight: bold;">Dimanche/JF:</span> ${settings.agentSettings?.sundayStartTime || '06:00'} → ${settings.agentSettings?.sundayEndTime || '23:00'} (+${settings.agentSettings?.sundayMarkupPct || 10}%)</p>
              <p style="margin: 4px 0;"><span style="font-weight: bold;">Jours fériés:</span> +${settings.agentSettings?.holidayMarkupPct || 10}%</p>
              <p style="margin: 4px 0;"><span style="font-weight: bold;">Règle spéciale:</span> Passage à 23h/06h pile = 1h pleine</p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Totaux -->
      <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
        ${totals.unique.totalTTC > 0 ? `
          <!-- Unique -->
          <div style="flex: 1; min-width: 200px; padding: 15px; border-radius: 8px; border: 2px solid ${colors.secondary}; background: #f8fafc;">
            <h4 style="font-weight: bold; margin-bottom: 10px; color: ${colors.primary};">Achat unique</h4>
            <div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.unique.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.unique.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14pt; padding-top: 8px; border-top: 1px solid ${colors.secondary}; color: ${colors.primary};">
                <span>Total TTC:</span>
                <span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${totals.mensuel.totalTTC > 0 ? `
          <!-- Mensuel -->
          <div style="flex: 1; min-width: 200px; padding: 15px; border-radius: 8px; border: 2px solid ${colors.accent}; background: #f0fdf4;">
            <h4 style="font-weight: bold; margin-bottom: 10px; color: ${colors.accent};">Abonnement mensuel</h4>
            <div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.mensuel.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14pt; padding-top: 8px; border-top: 1px solid ${colors.accent}; color: ${colors.accent};">
                <span>Total TTC:</span>
                <span>${totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${totals.agents.totalTTC > 0 ? `
          <!-- Agents -->
          <div style="flex: 1; min-width: 200px; padding: 15px; border-radius: 8px; border: 2px solid #f59e0b; background: #fefbf3;">
            <h4 style="font-weight: bold; margin-bottom: 10px; color: #f59e0b;">Agents de sécurité</h4>
            <div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.agents.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.agents.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14pt; padding-top: 8px; border-top: 1px solid #f59e0b; color: #f59e0b;">
                <span>Total TTC:</span>
                <span>${totals.agents.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Total général -->
      <div style="padding: 20px; border-radius: 8px; text-align: center; border: 3px solid ${colors.primary}; background: linear-gradient(135deg, ${colors.primary}08, ${colors.accent}08); margin: 20px 0;">
        <h4 style="font-weight: bold; font-size: 18pt; margin-bottom: 15px; color: ${colors.primary};">TOTAL GÉNÉRAL</h4>
        <div style="display: flex; gap: 20px; margin-bottom: 15px; justify-content: center;">
          <div>
            <p style="font-size: 10pt; color: ${colors.secondary}; margin-bottom: 4px;">Total HT</p>
            <p style="font-size: 16pt; font-weight: bold; color: ${colors.primary};">${totals.global.htAfterDiscount.toFixed(2)} CHF</p>
          </div>
          <div>
            <p style="font-size: 10pt; color: ${colors.secondary}; margin-bottom: 4px;">TVA totale</p>
            <p style="font-size: 16pt; font-weight: bold; color: ${colors.primary};">${totals.global.tva.toFixed(2)} CHF</p>
          </div>
        </div>
        <div style="padding-top: 15px; border-top: 2px solid ${colors.primary};">
          <p style="font-size: 24pt; font-weight: bold; color: ${colors.primary};">
            ${totals.global.totalTTC.toFixed(2)} CHF
          </p>
          ${totals.mensuel.totalTTC > 0 ? `
            <p style="font-size: 16pt; font-weight: bold; margin-top: 8px; color: ${colors.accent};">
              + ${totals.mensuel.totalTTC.toFixed(2)} CHF/mois
            </p>
          ` : ''}
        </div>
      </div>

      ${quote.comment ? `
        <!-- Commentaire -->
        <div style="margin: 20px 0;">
          <h4 style="font-weight: bold; font-size: 14pt; margin-bottom: 10px; color: ${colors.primary};">Commentaires</h4>
          <div style="padding: 15px; border-radius: 8px; border: 1px solid ${colors.secondary}; background: #f8fafc;">
            <p style="white-space: pre-wrap;">${quote.comment}</p>
          </div>
        </div>
      ` : ''}

      <!-- Pied de page -->
      <div style="text-align: center; font-size: 10pt; padding-top: 20px; margin-top: 30px; border-top: 2px solid ${colors.primary}; color: ${colors.secondary};">
        <p style="font-weight: bold;">${settings.pdfFooter}</p>
        <p style="margin-top: 8px;">Devis valable 30 jours - Conditions générales disponibles sur demande</p>
      </div>
    </div>
  `;
};

const PDFPreviewContent = ({ quote, settings }: PDFPreviewProps) => {
  const htmlContent = renderDevisHTML(quote, settings);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

const PDFPreview = () => {
  const { currentQuote, settings } = useStore();

  if (!currentQuote) return null;

  const downloadPDF = async () => {
    try {
      // Generate the same HTML used for preview
      const htmlContent = renderDevisHTML(currentQuote, settings);
      
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: `devis-${currentQuote.ref}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
          allowTaint: false,
          removeContainer: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generate PDF as blob and force download
      const pdfBlob = await html2pdf().set(options).from(tempDiv).outputPdf('blob');
      
      // Clean up temporary element
      document.body.removeChild(tempDiv);
      
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
      // Generate the same HTML used for preview
      const htmlContent = renderDevisHTML(currentQuote, settings);

      // Créer un document HTML complet avec styles Word-compatibles
      const wordHtmlContent = `
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
            div { margin: 6pt 0; }
          </style>
        </head>
        <body>
          ${htmlContent.replace(/style="[^"]*"/g, '')}
        </body>
        </html>
      `;

      const blob = new Blob([wordHtmlContent], { 
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