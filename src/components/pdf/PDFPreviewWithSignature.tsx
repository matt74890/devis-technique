import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileDown, Eye, PenTool, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals, calculateQuoteItem } from '@/utils/calculations';
import { calculateAgentVacation } from '@/utils/agentCalculations';
import { Quote, Settings } from '@/types';
import { toast } from 'sonner';
import ClientSignature from '@/components/signature/ClientSignature';
import AgentServiceDescription from '@/components/agent/AgentServiceDescription';
import html2pdf from 'html2pdf.js';

const PDFPreviewWithSignature = () => {
  const { currentQuote, settings } = useStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showAgentDescription, setShowAgentDescription] = useState(false);

  if (!currentQuote) return null;

  // Calculer les éléments avec leurs valeurs
  const calculatedItems = currentQuote.items.map(item => {
    if (item.kind === 'AGENT') {
      return calculateAgentVacation(item, settings);
    } else {
      return calculateQuoteItem(item, settings.tvaPct, currentQuote.discountMode === 'per_line', settings);
    }
  });

  const quoteWithCalculatedItems = { ...currentQuote, items: calculatedItems };
  const totals = calculateQuoteTotals(quoteWithCalculatedItems, settings.tvaPct);

  // Déterminer le type de devis
  const hasTechItems = currentQuote.items.some(item => item.kind === 'TECH');
  const hasAgentItems = currentQuote.items.some(item => item.kind === 'AGENT');
  
  let quoteType = '';
  if (hasTechItems && hasAgentItems) {
    quoteType = 'Devis Technique et Agent';
  } else if (hasAgentItems) {
    quoteType = 'Devis Agent';
  } else {
    quoteType = 'Devis Technique';
  }

  const downloadPDF = async () => {
    try {
      // Validation
      if (!currentQuote.ref) {
        toast.error('Veuillez renseigner une référence pour le devis');
        return;
      }
      if (!currentQuote.client) {
        toast.error('Veuillez sélectionner ou renseigner un client');
        return;
      }
      if (currentQuote.items.length === 0) {
        toast.error('Veuillez ajouter au moins une ligne au devis');
        return;
      }

      toast.loading('Génération du PDF...');

      // Créer le contenu HTML complet
      const htmlContent = generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = 'black';
      
      // Add to DOM temporarily
      document.body.appendChild(tempDiv);
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `devis_${currentQuote.ref}_${currentQuote.client?.replace(/\s+/g, '_') || 'client'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Generate and download PDF
      await html2pdf().set(opt).from(tempDiv).save();
      
      // Cleanup
      document.body.removeChild(tempDiv);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const downloadWord = async () => {
    try {
      // Validation
      if (!currentQuote.ref) {
        toast.error('Veuillez renseigner une référence pour le devis');
        return;
      }
      if (!currentQuote.client) {
        toast.error('Veuillez sélectionner ou renseigner un client');
        return;
      }
      if (currentQuote.items.length === 0) {
        toast.error('Veuillez ajouter au moins une ligne au devis');
        return;
      }

      toast.loading('Conversion en Word...');

      // Créer le contenu HTML complet
      const htmlContent = generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      // Appel de l'edge function pour convertir en Word
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('convert-pdf-to-docx', {
        body: {
          htmlContent,
          filename: `devis_${currentQuote.ref}_${currentQuote.client?.replace(/\s+/g, '_') || 'client'}`
        }
      });

      if (error) throw error;

      // Télécharger le fichier Word
      const blob = new Blob([new Uint8Array(data.fileBuffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis_${currentQuote.ref}_${currentQuote.client?.replace(/\s+/g, '_') || 'client'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Document Word téléchargé avec succès');
    } catch (error) {
      console.error('Erreur conversion Word:', error);
      toast.error('Erreur lors de la conversion en Word');
    }
  };

  const PreviewContent = () => {
    try {
      const htmlContent = generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      return (
        <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      );
    } catch (error) {
      console.error('Erreur génération aperçu PDF:', error);
      return (
        <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
          <p>Erreur lors de la génération de l'aperçu</p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Bouton Description Agent (si agents présents) */}
      {hasAgentItems && (
        <Dialog open={showAgentDescription} onOpenChange={setShowAgentDescription}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Description Agent</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Description de la prestation Agent</DialogTitle>
            </DialogHeader>
            <AgentServiceDescription />
          </DialogContent>
        </Dialog>
      )}

      {/* Bouton Signature Client */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <PenTool className="h-4 w-4" />
            <span>Signature Client</span>
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Signature du client</DialogTitle>
            </DialogHeader>
            <ClientSignature onCancel={() => setShowSignature(false)} />
          </DialogContent>
      </Dialog>

      {/* Bouton Aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Aperçu</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du {quoteType.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <PreviewContent />
        </DialogContent>
      </Dialog>

      {/* Bouton PDF */}
      <Button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 text-white">
        <FileDown className="h-4 w-4 mr-2" />
        PDF
      </Button>

      {/* Bouton Word */}
      <Button onClick={downloadWord} className="bg-blue-600 hover:bg-blue-700 text-white">
        <FileDown className="h-4 w-4 mr-2" />
        Word
      </Button>

      {/* Affichage signature client si présente */}
      {currentQuote.clientSignature && (
        <div className="w-full mt-4 p-4 border rounded-lg bg-green-50">
          <h4 className="font-medium mb-2">✓ Client signé</h4>
          <p className="text-sm text-gray-600">
            Signé le {currentQuote.clientSignature.date}
            {currentQuote.clientSignature.location && ` à ${currentQuote.clientSignature.location}`}
          </p>
        </div>
      )}
    </div>
  );
};

// Fonction pour générer le HTML du PDF
const generatePDFHTML = (quote: Quote, settings: Settings, totals: any, quoteType: string): string => {
  try {
    const colors = settings.templateColors || {
      primary: '#000000',
      secondary: '#666666',
      accent: '#333333',
      titleColor: '#000000',
      subtitleColor: '#666666',
      textColor: '#000000'
    };

    const hasTechItems = quote.items?.some(item => item.kind === 'TECH') || false;
    const hasAgentItems = quote.items?.some(item => item.kind === 'AGENT') || false;

    // Obtenir le nom d'affichage du client avec protection contre les valeurs nulles
    const contactInfo = quote.addresses?.contact || {};
    const clientDisplayName = (contactInfo as any).first_name && (contactInfo as any).last_name 
      ? `${(contactInfo as any).first_name} ${(contactInfo as any).last_name}`
      : (contactInfo as any).name || quote.client || 'Client non défini';

  let html = `
    <style>
      @page { size: A4; margin: 10mm; }
      body { 
        font-family: Arial, sans-serif; 
        color: ${colors.textColor}; 
        line-height: 1.4; 
        margin: 0;
        padding: 0;
      }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
      th { background: #f5f5f5; font-weight: bold; }
      .header { text-align: center; margin-bottom: 30px; }
      .client-info { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid ${colors.primary}; }
      .totals { background: #f0f0f0; padding: 10px; font-weight: bold; }
      .signature-area { display: flex; justify-content: space-between; margin-top: 30px; }
      .signature-box { width: 48%; text-align: center; }
    </style>
    
    <div class="header">
      ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 15px;">` : ''}
      <h1 style="color: ${colors.titleColor}; margin: 15px 0;">${quoteType}</h1>
      <div style="font-size: 14px; color: ${colors.secondary};">
        Réf: ${quote.ref} | Date: ${new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>

    <div class="client-info">
      <h3 style="margin-top: 0; color: ${colors.primary};">À l'attention de :</h3>
      <strong>${clientDisplayName}</strong>
      ${quote.addresses?.contact?.company ? `<br>Entreprise: ${quote.addresses.contact.company}` : ''}
      ${quote.addresses?.contact?.street ? `<br>${quote.addresses.contact.street}` : ''}
      ${quote.addresses?.contact?.city ? `<br>${quote.addresses.contact.city}` : ''}
      ${quote.addresses?.contact?.email ? `<br>Email: ${quote.addresses.contact.email}` : ''}
      ${quote.addresses?.contact?.phone ? `<br>Tél: ${quote.addresses.contact.phone}` : ''}
    </div>
  `;

  // Lettre de présentation
  const letterTemplate = settings.letterTemplate;
  if (letterTemplate?.enabled) {
    html += `
      <div class="avoid-break">
        <h2 style="color: ${colors.primary};">${letterTemplate.subject || 'Proposition'}</h2>
        <div style="white-space: pre-line; margin: 20px 0; line-height: 1.6;">
          ${letterTemplate.opening ? letterTemplate.opening + '\n\n' : ''}
          ${letterTemplate.body || ''}
          ${letterTemplate.closing ? '\n\n' + letterTemplate.closing : ''}
        </div>
      </div>
    `;
  }

  // Items TECH
  if (hasTechItems) {
    html += `
      <div class="page-break avoid-break">
        <h2 style="color: ${colors.primary}; margin: 25px 0 15px 0;">Devis Technique</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th style="width: 12%;">Qté</th>
              <th style="width: 15%;">Prix Unit. HT</th>
              <th style="width: 23%;">Total HT</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    quote.items.filter(item => item.kind === 'TECH').forEach(item => {
      const totalHT = (item.qty || 1) * (item.puHT || 0);
      html += `
        <tr>
          <td>${item.type} - ${item.reference}</td>
          <td style="text-align: center;">${item.qty || 1}</td>
          <td style="text-align: right;">${(item.puHT || 0).toFixed(2)}€</td>
          <td style="text-align: right;">${(item.totalHT_net || totalHT).toFixed(2)}€</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Items AGENT
  if (hasAgentItems) {
    html += `
      <div class="page-break avoid-break">
        <h2 style="color: ${colors.primary}; margin: 25px 0 15px 0;">Devis Agent</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Prestation</th>
              <th style="width: 15%;">Période</th>
              <th style="width: 12%;">Nb jours</th>
              <th style="width: 15%;">Prix/jour HT</th>
              <th style="width: 18%;">Total HT</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    quote.items.filter(item => item.kind === 'AGENT').forEach(item => {
      const startDate = item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-FR') : '';
      const endDate = item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-FR') : '';
      const period = startDate && endDate ? `${startDate} - ${endDate}` : 'À définir';
      const hoursPerDay = 8; // Estimation
      const totalDays = Math.ceil((item.hoursTotal || 0) / hoursPerDay);
      
      html += `
        <tr>
          <td>${item.type} - ${item.reference}</td>
          <td style="text-align: center;">${period}</td>
          <td style="text-align: center;">${totalDays}</td>
          <td style="text-align: right;">${(item.rateCHFh || 0).toFixed(2)}€/h</td>
          <td style="text-align: right;">${(item.lineHT || 0).toFixed(2)}€</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Totaux
  html += `
    <div class="avoid-break" style="margin-top: 30px;">
      <h2 style="color: ${colors.primary}; margin-bottom: 15px;">Récapitulatif</h2>
      <div class="client-info">
        <strong>${clientDisplayName}</strong><br>
        ${quote.addresses?.contact?.company ? `${quote.addresses.contact.company}<br>` : ''}
        ${quote.addresses?.contact?.street ? `${quote.addresses.contact.street}<br>` : ''}
        ${quote.addresses?.contact?.city ? `${quote.addresses.contact.city}` : ''}
      </div>
      
      <div class="totals" style="text-align: right; margin-top: 20px;">
        <div>Total HT: ${totals.totalHT.toFixed(2)}€</div>
        <div>TVA (${settings.tvaPct}%): ${totals.totalTVA.toFixed(2)}€</div>
        <div style="font-size: 18px; border-top: 2px solid ${colors.primary}; padding-top: 10px; margin-top: 10px;">
          <strong>Total TTC: ${totals.totalTTC.toFixed(2)}€</strong>
        </div>
      </div>
    </div>
  `;

  // Signatures
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const currentLocation = settings.sellerInfo?.location || 'Paris';
  
  html += `
    <div class="signature-area" style="margin-top: 40px;">
      <div class="signature-box">
        <div style="margin-bottom: 20px;"><strong>Vendeur</strong></div>
        <div style="margin-bottom: 40px;">Le ${currentDate} à ${currentLocation}</div>
        <div style="border-bottom: 1px solid #333; width: 200px; margin: 0 auto;"></div>
        <div style="margin-top: 5px; font-size: 12px;">${settings.sellerInfo?.name || ''}</div>
      </div>
      
      <div class="signature-box">
        <div style="margin-bottom: 20px;"><strong>Client</strong></div>
        ${quote.clientSignature ? `
          <div style="margin-bottom: 5px;">Signé le ${quote.clientSignature.date}</div>
          ${quote.clientSignature.location ? `<div style="margin-bottom: 15px;">à ${quote.clientSignature.location}</div>` : ''}
          <img src="${quote.clientSignature.dataUrl}" alt="Signature client" style="max-height: 60px; border: 1px solid #ddd;">
        ` : `
          <div style="margin-bottom: 40px;">Le ${currentDate} à ${currentLocation}</div>
          <div style="border-bottom: 1px solid #333; width: 200px; margin: 0 auto;"></div>
          <div style="margin-top: 5px; font-size: 12px;">Signature</div>
        `}
      </div>
    </div>
  `;

  html += `</div>`;
  
  return html;
  } catch (error) {
    console.error('Erreur génération HTML PDF:', error);
    return '<div>Erreur lors de la génération du PDF</div>';
  }
};

export default PDFPreviewWithSignature;