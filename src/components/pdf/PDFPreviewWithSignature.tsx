import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
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

      // Créer le contenu HTML complet avec les nouvelles spécifications
      const htmlContent = generateOptimizedPDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Add to DOM temporarily
      document.body.appendChild(tempDiv);
      
      const opt = {
        margin: 12, // 12mm margins as specified
        filename: `${quoteType.replace(/\s+/g, '_')}_${currentQuote.ref}_${currentQuote.client.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1200,
          windowHeight: 1600,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
          precision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],  
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
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

      const htmlContent = generateOptimizedPDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      // Call the edge function to convert HTML to DOCX
      const { data, error } = await supabase.functions.invoke('convert-pdf-to-docx', {
        body: { 
          htmlContent,
          filename: `${quoteType.replace(/\s+/g, '_')}_${currentQuote.ref}_${currentQuote.client.replace(/\s+/g, '_')}.docx`
        }
      });

      if (error) throw error;

      // Create blob from base64 data
      const binaryString = atob(data.docxBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document Word téléchargé avec succès');
    } catch (error) {
      console.error('Erreur génération Word:', error);
      toast.error('Erreur lors de la génération du Word');
    }
  };

  const PreviewContent = () => (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div dangerouslySetInnerHTML={{ __html: generateOptimizedPDFHTML(quoteWithCalculatedItems, settings, totals, quoteType) }} />
    </div>
  );

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

// Fonction optimisée pour générer le HTML du PDF avec format A4 et toutes les améliorations
const generateOptimizedPDFHTML = (quote: Quote, settings: Settings, totals: any, quoteType: string): string => {
  const colors = settings.templateColors || {
    primary: '#000000',
    secondary: '#666666',
    accent: '#333333',
    titleColor: '#000000',
    subtitleColor: '#666666',
    textColor: '#000000',
    mutedTextColor: '#999999',
    background: '#ffffff',
    cardBackground: '#ffffff',
    headerBackground: '#ffffff',
    tableHeader: '#f5f5f5',
    tableHeaderText: '#000000',
    tableRow: '#ffffff',
    tableRowAlt: '#f9f9f9',
    tableBorder: '#cccccc'
  };

  const hasTechItems = quote.items.some(item => item.kind === 'TECH');
  const hasAgentItems = quote.items.some(item => item.kind === 'AGENT');
  const isAgentOnly = hasAgentItems && !hasTechItems;
  const isMixed = hasTechItems && hasAgentItems;

  // Choisir la bonne lettre de présentation
  const letterTemplate = (isAgentOnly || isMixed) && settings.agentSettings?.agentLetterTemplate?.enabled
    ? settings.agentSettings.agentLetterTemplate
    : settings.letterTemplate;

  // Helper pour le nom complet du contact
  const getContactFullName = () => {
    if (quote.contactFirstName && quote.contactLastName) {
      return `${quote.contactFirstName} ${quote.contactLastName}`;
    }
    return quote.contact || quote.addresses?.contact?.name || '';
  };

  // Helper pour le nom de famille seulement
  const getContactLastName = () => {
    return quote.contactLastName || quote.contact?.split(' ').pop() || quote.addresses?.contact?.name?.split(' ').pop() || '';
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* CSS Reset et Format A4 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { 
          size: A4;
          margin: 12mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: ${colors.textColor};
          background: ${colors.background};
        }
        
        /* Conteneur principal avec largeur fixe A4 */
        .main-container {
          width: 100%;
          max-width: 190mm; /* 210mm - 2*12mm marges */
          margin: 0 auto;
          background: white;
        }
        
        /* En-têtes et pieds de page */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${colors.secondary};
          margin-bottom: 15px;
        }
        
        .page-header .logo-section {
          display: flex;
          align-items: center;
          flex: 1;
        }
        
        .page-header .ref-section {
          text-align: right;
          font-weight: bold;
          color: ${colors.titleColor};
        }
        
        .page-footer {
          position: fixed;
          bottom: 12mm;
          right: 12mm;
          font-size: 9px;
          color: ${colors.secondary};
        }
        
        /* Gestion des coupures de page */
        .page-break-before { page-break-before: always; }
        .page-break-after { page-break-after: always; }
        .page-break-avoid { page-break-inside: avoid; }
        .section { page-break-inside: avoid; page-break-before: auto; page-break-after: auto; }
        
        /* Tableaux avec anti-débordement */
        table {
          table-layout: fixed;
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr, td, th { page-break-inside: avoid; }
        
        th, td {
          border: 1px solid ${colors.tableBorder};
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        th {
          background-color: ${colors.tableHeader};
          color: ${colors.tableHeaderText};
          font-weight: bold;
          font-size: 11px;
        }
        
        /* Largeurs de colonnes fixes pour éviter le débordement */
        .items-table th:nth-child(1), .items-table td:nth-child(1) { width: 12%; } /* Type */
        .items-table th:nth-child(2), .items-table td:nth-child(2) { width: 25%; } /* Référence */
        .items-table th:nth-child(3), .items-table td:nth-child(3) { width: 8%; }  /* Mode */
        .items-table th:nth-child(4), .items-table td:nth-child(4) { width: 8%; }  /* Qté */
        .items-table th:nth-child(5), .items-table td:nth-child(5) { width: 12%; } /* PU HT */
        .items-table th:nth-child(6), .items-table td:nth-child(6) { width: 12%; } /* PU TTC */
        .items-table th:nth-child(7), .items-table td:nth-child(7) { width: 10%; } /* Remise */
        .items-table th:nth-child(8), .items-table td:nth-child(8) { width: 13%; } /* Total TTC */
        
        /* Éléments larges avec protection débordement */
        .wide-element {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Images et signatures */
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Signatures alignées sur une ligne */
        .signatures-section {
          display: flex;
          width: 100%;
          margin-top: 30px;
          page-break-inside: avoid;
        }
        
        .signature-column {
          flex: 1;
          padding: 0 10px;
        }
        
        .signature-date-line {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 15px;
          font-size: 11px;
        }
        
        /* Client info box - seulement sur certaines pages */
        .client-info-box {
          border: 1px solid ${colors.secondary};
          padding: 12px;
          margin: 10px 0;
          background: ${colors.cardBackground};
        }
        
        .client-info-box h4 {
          font-weight: bold;
          margin-bottom: 8px;
          color: ${colors.titleColor};
        }
        
        /* Styles pour les sections */
        .section-header {
          font-size: 16px;
          font-weight: bold;
          color: ${colors.titleColor};
          margin: 20px 0 10px 0;
          border-bottom: 2px solid ${colors.primary};
          padding-bottom: 5px;
        }
        
        /* Totaux */
        .totals-section {
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid ${colors.tableBorder};
        }
        
        .total-row.grand-total {
          font-weight: bold;
          border-bottom: 2px solid ${colors.primary};
          margin-top: 10px;
        }
        
        /* Numérotation des pages */
        @media print {
          @page { @bottom-right { content: "Page " counter(page) " / " counter(pages); } }
        }
      </style>
    </head>
    <body>
      <div class="main-container">
  `;

  let pageNumber = 1;
  const totalPages = calculateTotalPages(quote, letterTemplate, hasAgentItems);

  // Fonction helper pour générer l'en-tête de page
  const generatePageHeader = (currentPage: number) => `
    <div class="page-header">
      <div class="logo-section">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 40px; margin-right: 15px;">` : ''}
        ${settings.sellerInfo?.name ? `
          <div>
            <div style="font-weight: bold; font-size: 13px;">${settings.sellerInfo.name}</div>
            ${settings.sellerInfo.title ? `<div style="font-size: 10px; color: ${colors.subtitleColor};">${settings.sellerInfo.title}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="ref-section">
        Réf. devis : ${quote.ref || 'Non définie'}
      </div>
    </div>
  `;

  // PAGE 1: Lettre de présentation (si activée)
  if (letterTemplate?.enabled) {
    const letterDate = new Date().toLocaleDateString('fr-FR');
    const clientAddress = quote.addresses.contact;
    
    html += `
      <div class="section">
        ${generatePageHeader(pageNumber)}
        
        <div style="margin-bottom: 30px;">
          <div style="text-align: right; margin: 15px 0; font-weight: 500;">
            Le ${letterDate}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}
          </div>
          
          <!-- Client info box - seulement sur page de présentation -->
          <div class="client-info-box">
            <h4>À l'attention de :</h4>
            ${clientAddress.company ? `<div style="font-weight: bold;">${clientAddress.company}</div>` : ''}
            <div>${clientAddress.name}</div>
            <div>${clientAddress.street}</div>
            <div>${clientAddress.postalCode} ${clientAddress.city}</div>
          </div>
          
          <div style="margin: 20px 0; font-weight: 600;">
            <strong>Objet:</strong> ${letterTemplate.subject}
          </div>
          
          <div style="margin: 20px 0; line-height: 1.6;">
            <div style="margin-bottom: 15px;">
              ${quote.clientCivility === 'Madame' ? `Chère Madame ${getContactLastName()}` : `Cher Monsieur ${getContactLastName()}`},
            </div>
            
            <p style="${letterTemplate.boldOptions?.opening ? 'font-weight: bold;' : ''} margin-bottom: 12px;">${letterTemplate.opening.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.opening ? 'font-weight: bold;' : '') + ' margin-bottom: 12px;">')}</p>
            <p style="${letterTemplate.boldOptions?.body ? 'font-weight: bold;' : ''} margin-bottom: 12px;">${letterTemplate.body.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.body ? 'font-weight: bold;' : '') + ' margin-bottom: 12px;">')}</p>
            <p style="${letterTemplate.boldOptions?.closing ? 'font-weight: bold;' : ''} margin-bottom: 12px;">${letterTemplate.closing.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.closing ? 'font-weight: bold;' : '') + ' margin-bottom: 12px;">')}</p>
            
            <div style="margin-top: 25px;">
              <p>Veuillez agréer, ${quote.clientCivility === 'Madame' ? `Madame ${getContactLastName()}` : `Monsieur ${getContactLastName()}`}, l'expression de nos salutations distinguées.</p>
            </div>
          </div>
          
          <!-- Signature vendeur sur lettre -->
          <div style="margin-top: 40px; text-align: right;">
            ${settings.sellerInfo?.signature ? `
              <div style="margin-bottom: 10px;">
                <img src="${settings.sellerInfo.signature}" alt="Signature vendeur" style="max-width: 120px; max-height: 50px;">
              </div>
            ` : ''}
            <div style="font-weight: bold;">${settings.sellerInfo?.name || ''}</div>
            <div>${settings.sellerInfo?.title || ''}</div>
          </div>
        </div>
      </div>
    `;
    pageNumber++;
  }

  // PAGE: Description de la prestation (pour agents, SANS cadre client)
  if (hasAgentItems && quote.agentServiceDescription) {
    html += `
      <div class="page-break-before section">
        ${generatePageHeader(pageNumber)}
        
        <div class="section-header">Description de la prestation</div>
        
        <div style="margin: 20px 0;">
          <div style="margin-bottom: 15px;"><strong>Nature de la prestation :</strong> ${quote.agentServiceDescription.naturePrestation || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Lieu de prestation :</strong> ${quote.agentServiceDescription.lieuPrestation || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Période :</strong> ${quote.agentServiceDescription.periode || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Horaires :</strong> ${quote.agentServiceDescription.horaires || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Tenue :</strong> ${quote.agentServiceDescription.tenue || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Pause :</strong> ${quote.agentServiceDescription.pause || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Déplacement :</strong> ${quote.agentServiceDescription.deplacement || ''}</div>
          <div style="margin-bottom: 15px;"><strong>Remarque :</strong> ${quote.agentServiceDescription.remarque || ''}</div>
        </div>
      </div>
    `;
    pageNumber++;
  }

  // PAGE: Devis principal avec tableaux
  html += `
    <div class="${pageNumber > 1 ? 'page-break-before' : ''} section">
      ${generatePageHeader(pageNumber)}
      
      <div class="section-header">${quoteType}</div>
  `;

  // Sections techniques si présentes
  if (hasTechItems) {
    const techUniqueItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'unique');
    const techMensuelItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'mensuel');

    if (techUniqueItems.length > 0) {
      html += `
        <div class="section" style="margin: 20px 0;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: ${colors.titleColor};">Prestations uniques</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Référence</th>
                <th>Mode</th>
                <th>Qté</th>
                <th>PU HT</th>
                <th>PU TTC</th>
                <th>Remise</th>
                <th>Total TTC</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      techUniqueItems.forEach((item, index) => {
        html += `
          <tr style="background-color: ${index % 2 === 0 ? colors.tableRow : colors.tableRowAlt};">
            <td class="wide-element">${item.type || ''}</td>
            <td class="wide-element">${item.reference || ''}</td>
            <td>Unique</td>
            <td style="text-align: right;">${item.qty || 1}</td>
            <td style="text-align: right;">${(item.puHT || 0).toFixed(2)} CHF</td>
            <td style="text-align: right;">${(item.puTTC || 0).toFixed(2)} CHF</td>
            <td style="text-align: right;">${item.lineDiscountPct ? `${item.lineDiscountPct}%` : '-'}</td>
            <td style="text-align: right; font-weight: bold;">${(item.totalTTC || 0).toFixed(2)} CHF</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    if (techMensuelItems.length > 0) {
      html += `
        <div class="section" style="margin: 20px 0;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: ${colors.titleColor};">Prestations mensuelles</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Référence</th>
                <th>Mode</th>
                <th>Qté</th>
                <th>PU HT</th>
                <th>PU TTC</th>
                <th>Remise</th>
                <th>Total TTC</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      techMensuelItems.forEach((item, index) => {
        html += `
          <tr style="background-color: ${index % 2 === 0 ? colors.tableRow : colors.tableRowAlt};">
            <td class="wide-element">${item.type || ''}</td>
            <td class="wide-element">${item.reference || ''}</td>
            <td>Mensuel</td>
            <td style="text-align: right;">${item.qty || 1}</td>
            <td style="text-align: right;">${(item.puHT || 0).toFixed(2)} CHF</td>
            <td style="text-align: right;">${(item.puTTC || 0).toFixed(2)} CHF</td>
            <td style="text-align: right;">${item.lineDiscountPct ? `${item.lineDiscountPct}%` : '-'}</td>
            <td style="text-align: right; font-weight: bold;">${(item.totalTTC || 0).toFixed(2)} CHF</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Section agents si présentes
  if (hasAgentItems) {
    const agentItems = quote.items.filter(item => item.kind === 'AGENT');
    
    html += `
      <div class="section" style="margin: 20px 0;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: ${colors.titleColor};">Prestations Agents</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Type Agent</th>
              <th>Date/Horaires</th>
              <th>Heures</th>
              <th>Taux CHF/h</th>
              <th>Déplacement</th>
              <th>Total HT</th>
              <th>Total TTC</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    agentItems.forEach((item, index) => {
      const startDate = item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-FR') : '';
      const endDate = item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-FR') : '';
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      const timeRange = `${item.timeStart || ''} - ${item.timeEnd || ''}`;
      
      html += `
        <tr style="background-color: ${index % 2 === 0 ? colors.tableRow : colors.tableRowAlt};">
          <td class="wide-element">${item.reference || ''}</td>
          <td>${item.agentType || ''}</td>
          <td style="font-size: 10px;">
            ${dateRange}<br/>
            ${timeRange}
          </td>
          <td style="text-align: right; font-size: 10px;">
            Normal: ${(item.hoursNormal || 0).toFixed(1)}h<br/>
            Nuit: ${(item.hoursNight || 0).toFixed(1)}h<br/>
            Dimanche: ${(item.hoursSunday || 0).toFixed(1)}h<br/>
            Férié: ${(item.hoursHoliday || 0).toFixed(1)}h
          </td>
          <td style="text-align: right;">${(item.rateCHFh || 0).toFixed(2)}</td>
          <td style="text-align: right;">${(item.travelCHF || 0).toFixed(2)} CHF</td>
          <td style="text-align: right;">${(item.lineHT || 0).toFixed(2)} CHF</td>
          <td style="text-align: right; font-weight: bold;">${(item.lineTTC || 0).toFixed(2)} CHF</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;

    // Note majoration agents si définie
    if (settings.agentSettings?.majorationNote) {
      html += `
        <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; font-size: 11px;">
          <strong>Note importante :</strong> ${settings.agentSettings.majorationNote}
        </div>
      `;
    }
  }

  html += `
    </div>
  `;
  
  pageNumber++;

  // PAGE FINALE: Totaux avec cadre client en haut à droite + signatures alignées
  html += `
    <div class="page-break-before section">
      ${generatePageHeader(pageNumber)}
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div class="section-header" style="margin: 0;">Totaux</div>
        
        <!-- Client info box - seulement sur page totaux en haut à droite -->
        <div class="client-info-box" style="width: 300px; margin: 0;">
          <h4>Client :</h4>
          ${quote.addresses.contact.company ? `<div style="font-weight: bold;">${quote.addresses.contact.company}</div>` : ''}
          <div>${quote.addresses.contact.name}</div>
          <div>${quote.addresses.contact.street}</div>
          <div>${quote.addresses.contact.postalCode} ${quote.addresses.contact.city}</div>
          ${quote.addresses.contact.email ? `<div>Email: ${quote.addresses.contact.email}</div>` : ''}
          ${quote.addresses.contact.phone ? `<div>Tél: ${quote.addresses.contact.phone}</div>` : ''}
        </div>
      </div>
      
      <div class="totals-section">
  `;

  // Affichage des totaux selon le type de devis
  if (hasTechItems) {
    if (quote.items.some(item => item.kind === 'TECH' && item.mode === 'unique')) {
      html += `
        <div style="margin-bottom: 15px;">
          <h4 style="color: ${colors.titleColor}; margin-bottom: 8px;">Prestations uniques</h4>
          <div class="total-row">
            <span>Sous-total HT :</span>
            <span>${totals.unique.subtotalHT.toFixed(2)} CHF</span>
          </div>
          ${totals.unique.discountHT > 0 ? `
            <div class="total-row">
              <span>Remise :</span>
              <span>-${totals.unique.discountHT.toFixed(2)} CHF</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Total HT :</span>
            <span>${totals.unique.htAfterDiscount.toFixed(2)} CHF</span>
          </div>
          <div class="total-row">
            <span>TVA (${settings.tvaPct}%) :</span>
            <span>${totals.unique.tva.toFixed(2)} CHF</span>
          </div>
          <div class="total-row" style="font-weight: bold;">
            <span>Total TTC :</span>
            <span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
          </div>
        </div>
      `;
    }

    if (quote.items.some(item => item.kind === 'TECH' && item.mode === 'mensuel')) {
      html += `
        <div style="margin-bottom: 15px;">
          <h4 style="color: ${colors.titleColor}; margin-bottom: 8px;">Prestations mensuelles</h4>
          <div class="total-row">
            <span>Sous-total HT :</span>
            <span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
          </div>
          ${totals.mensuel.discountHT > 0 ? `
            <div class="total-row">
              <span>Remise :</span>
              <span>-${totals.mensuel.discountHT.toFixed(2)} CHF</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Total HT :</span>
            <span>${totals.mensuel.htAfterDiscount.toFixed(2)} CHF</span>
          </div>
          <div class="total-row">
            <span>TVA (${settings.tvaPct}%) :</span>
            <span>${totals.mensuel.tva.toFixed(2)} CHF</span>
          </div>
          <div class="total-row" style="font-weight: bold;">
            <span>Total TTC :</span>
            <span>${totals.mensuel.totalTTC.toFixed(2)} CHF</span>
          </div>
        </div>
      `;
    }
  }

  if (hasAgentItems) {
    html += `
      <div style="margin-bottom: 15px;">
        <h4 style="color: ${colors.titleColor}; margin-bottom: 8px;">Prestations Agents</h4>
        <div class="total-row">
          <span>Total HT :</span>
          <span>${totals.agents.subtotalHT.toFixed(2)} CHF</span>
        </div>
        <div class="total-row">
          <span>TVA (${settings.tvaPct}%) :</span>
          <span>${totals.agents.tva.toFixed(2)} CHF</span>
        </div>
        <div class="total-row" style="font-weight: bold;">
          <span>Total TTC :</span>
          <span>${totals.agents.totalTTC.toFixed(2)} CHF</span>
        </div>
      </div>
    `;
  }

  // Grand total
  html += `
        <div class="total-row grand-total" style="font-size: 16px; background: ${colors.headerBackground}; padding: 10px;">
          <span>TOTAL GÉNÉRAL TTC :</span>
          <span>${totals.global.totalTTC.toFixed(2)} CHF</span>
        </div>
      </div>
      
      <!-- Signatures alignées sur une seule ligne -->
      <div class="signatures-section">
        <div class="signature-column">
          <h4 style="text-align: center; margin-bottom: 15px; color: ${colors.titleColor};">Vendeur</h4>
          ${settings.sellerInfo?.signature ? `
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${settings.sellerInfo.signature}" alt="Signature vendeur" style="max-width: 120px; max-height: 50px;">
            </div>
          ` : ''}
          <div style="text-align: center; font-weight: bold;">${settings.sellerInfo?.name || ''}</div>
          <div style="text-align: center; font-size: 11px;">${settings.sellerInfo?.title || ''}</div>
          <div class="signature-date-line">
            <span>Fait à ${settings.sellerInfo?.location || 'Genève'}, le ${new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        
        <div class="signature-column">
          <h4 style="text-align: center; margin-bottom: 15px; color: ${colors.titleColor};">Client</h4>
          ${quote.clientSignature ? `
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${quote.clientSignature.dataUrl}" alt="Signature client" style="max-width: 120px; max-height: 50px;">
            </div>
            <div style="text-align: center; font-weight: bold;">${getContactFullName()}</div>
            <div class="signature-date-line">
              <span>Fait à ${quote.clientSignature.location || settings.sellerInfo?.location || 'Genève'}, le ${quote.clientSignature.date}</span>
            </div>
          ` : `
            <div style="height: 50px; border: 1px solid ${colors.secondary}; margin-bottom: 10px;"></div>
            <div style="text-align: center; font-weight: bold;">${getContactFullName()}</div>
            <div class="signature-date-line">
              <span>Signature et date</span>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
};

// Helper pour calculer le nombre total de pages
const calculateTotalPages = (quote: Quote, letterTemplate: any, hasAgentItems: boolean): number => {
  let pages = 1; // Page principale du devis
  
  if (letterTemplate?.enabled) pages++; // Page lettre de présentation
  if (hasAgentItems && quote.agentServiceDescription) pages++; // Page description
  pages++; // Page totaux/signatures
  
  return pages;
};

export default PDFPreviewWithSignature;