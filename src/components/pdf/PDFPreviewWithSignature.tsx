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

      // Créer le contenu HTML complet
      const htmlContent = generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = '210mm';
      tempDiv.style.minHeight = '297mm';
      tempDiv.style.padding = '10mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = 'black';
      
      // Add to DOM temporarily
      document.body.appendChild(tempDiv);
      
      const opt = {
        margin: [12, 12, 12, 12],
        filename: `${quoteType.replace(/\s+/g, '_')}_${currentQuote.ref}_${currentQuote.client.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 1.2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1400,
          windowHeight: 1800,
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
      
      // Force download instead of opening in new tab
      const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = opt.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Cleanup
      document.body.removeChild(tempDiv);
      
      toast.success('PDF téléchargé');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const downloadWord = () => {
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

      const htmlContent = generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType);
      
      
      // Create Word-compatible RTF document
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 
${htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '')}
}`;
      
      // Use RTF MIME type for better Word compatibility
      const blob = new Blob([rtfContent], {
        type: 'application/rtf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use .rtf extension for best Word compatibility
      link.download = `${quoteType.replace(/\s+/g, '_')}_${currentQuote.ref}_${currentQuote.client.replace(/\s+/g, '_')}.rtf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Word téléchargé');
    } catch (error) {
      console.error('Erreur génération Word:', error);
      toast.error('Erreur lors de la génération du Word');
    }
  };

  const PreviewContent = () => (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 space-y-6 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div dangerouslySetInnerHTML={{ __html: generatePDFHTML(quoteWithCalculatedItems, settings, totals, quoteType) }} />
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

// Fonction pour générer le HTML du PDF/Word
const generatePDFHTML = (quote: Quote, settings: Settings, totals: any, quoteType: string): string => {
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

  console.log('Génération PDF - Items:', quote.items?.length || 0, 'Tech:', hasTechItems, 'Agent:', hasAgentItems);
  console.log('Génération PDF - Totaux:', totals);
  console.log('Génération PDF - QuoteType:', quoteType);

  // Choisir la bonne lettre de présentation
  const letterTemplate = (isAgentOnly || isMixed) && settings.agentSettings?.agentLetterTemplate?.enabled
    ? settings.agentSettings.agentLetterTemplate
    : settings.letterTemplate;

  let pageCount = 1;
  const totalPages = (letterTemplate?.enabled ? 1 : 0) + (hasAgentItems && quote.agentServiceDescription ? 1 : 0) + 1;

  let html = `
    <style>
      @page { 
        margin: 0; 
        @bottom-center { 
          content: counter(page) " / " counter(pages); 
          font-size: 10px; 
          color: ${colors.secondary}; 
        }
      }
      .page-number { 
        position: fixed; 
        bottom: 10mm; 
        right: 15mm; 
        font-size: 10px; 
        color: ${colors.secondary}; 
        z-index: 1000; 
      }
    </style>
    <div style="font-family: Arial, sans-serif; color: ${colors.textColor}; background: ${colors.background}; width: 100%; overflow: visible;">
  `;

  // Lettre de présentation (si activée)
  if (letterTemplate?.enabled) {
    const letterDate = new Date().toLocaleDateString('fr-FR');
    const clientAddress = quote.addresses.contact;
    
    html += `
      <div class="page-number">Page ${pageCount} / ${totalPages}</div>
      <div style="margin-bottom: 40px; padding: 20px; background: ${colors.headerBackground}; border-radius: 8px; page-break-after: always;">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 20px;">` : ''}
        
        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 18px; color: ${colors.titleColor};">${letterTemplate.companyName || settings.sellerInfo?.name || ''}</div>
          <div style="margin-top: 10px; color: ${colors.subtitleColor};">${letterTemplate.companyAddress || ''}</div>
          <div style="margin-top: 10px; color: ${colors.textColor};">
            <div>${letterTemplate.contactName || settings.sellerInfo?.name || ''} - ${letterTemplate.contactTitle || settings.sellerInfo?.title || ''}</div>
            <div>Tél: ${letterTemplate.contactPhone || settings.sellerInfo?.phone || ''}</div>
            <div>Email: ${letterTemplate.contactEmail || settings.sellerInfo?.email || ''}</div>
          </div>
        </div>
        
        <div style="text-align: right; margin: 20px 0; font-weight: 500; color: ${colors.textColor};">
          Le ${letterDate}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}
        </div>
        
        <div style="margin: 20px 0; color: ${colors.textColor};">
          <div style="font-weight: bold;">À l'attention de :</div>
          <div style="margin-top: 10px;">
            ${clientAddress.company ? `<div style="font-weight: bold;">${clientAddress.company}</div>` : ''}
            <div>${clientAddress.name}</div>
            <div>${clientAddress.street}</div>
            <div>${clientAddress.postalCode} ${clientAddress.city}</div>
          </div>
        </div>
        
        <div style="margin: 30px 0; font-weight: 600; color: ${colors.titleColor};">
          <strong>Objet:</strong> ${letterTemplate.subject}
        </div>
        
        <div style="margin: 20px 0; line-height: 1.6; text-align: ${letterTemplate.textAlignment || 'left'};">
          <div style="margin-bottom: 20px;">
            ${quote.clientCivility === 'Madame' ? `Chère Madame ${quote.addresses.contact.name.split(' ').pop()}` : `Cher Monsieur ${quote.addresses.contact.name.split(' ').pop()}`},
          </div>
          
          <p style="${letterTemplate.boldOptions?.opening ? 'font-weight: bold;' : ''}">${letterTemplate.opening.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.opening ? 'font-weight: bold;' : '') + '">')}</p>
          <p style="${letterTemplate.boldOptions?.body ? 'font-weight: bold;' : ''}">${letterTemplate.body.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.body ? 'font-weight: bold;' : '') + '">')}</p>
          <p style="${letterTemplate.boldOptions?.closing ? 'font-weight: bold;' : ''}">${letterTemplate.closing.replace(/\n/g, '</p><p style="' + (letterTemplate.boldOptions?.closing ? 'font-weight: bold;' : '') + '">')}</p>
          
          <div style="margin-top: 30px;">
            <p>Veuillez agréer, ${quote.clientCivility === 'Madame' ? `Madame ${quote.addresses.contact.name.split(' ').pop()}` : `Monsieur ${quote.addresses.contact.name.split(' ').pop()}`}, l'expression de nos salutations distinguées.</p>
          </div>
        </div>
        
        <!-- Signature vendeur sur lettre -->
        <div style="margin-top: 50px; display: flex; justify-content: flex-end;">
          <div style="text-align: right;">
            <div style="border-bottom: 1px solid ${colors.primary}; width: 200px; height: 60px; margin-bottom: 10px;"></div>
            <div style="font-size: 12px; color: ${colors.textColor};">
              ${new Date().toLocaleDateString('fr-FR')}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}
            </div>
            <div style="font-size: 12px; color: ${colors.textColor}; margin-top: 5px;">
              Signature du vendeur
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Page Description de la prestation (pour les agents) - avec même template
  if (hasAgentItems && quote.agentServiceDescription) {
    const desc = quote.agentServiceDescription;
    html += `
      <div class="page-number">Page ${pageCount} / ${totalPages}</div>
      <div style="page-break-inside: avoid; page-break-after: always;">
        <!-- En-tête de la description -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div style="flex: 1;">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 15px;">` : ''}
            ${settings.sellerInfo?.name ? `
              <div style="font-weight: bold; color: ${colors.titleColor}; font-size: 16px;">${settings.sellerInfo.name}</div>
              ${settings.sellerInfo.title ? `<div style="color: ${colors.subtitleColor};">${settings.sellerInfo.title}</div>` : ''}
              ${settings.sellerInfo.email ? `<div>${settings.sellerInfo.email}</div>` : ''}
              ${settings.sellerInfo.phone ? `<div>${settings.sellerInfo.phone}</div>` : ''}
            ` : ''}
          </div>
          
          <div style="text-align: right; border: 2px solid ${colors.primary}; padding: 15px; border-radius: 8px; background: ${colors.cardBackground}; min-height: 120px;">
            <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 10px; text-align: center;">DEVIS N° ${quote.ref}</div>
            <div style="color: ${colors.subtitleColor}; margin-bottom: 15px; text-align: center;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</div>
            <div style="border-top: 1px solid ${colors.secondary}; padding-top: 10px;">
              <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 8px;">CLIENT:</div>
              ${quote.addresses.contact.company ? `<div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${quote.addresses.contact.company}</div>` : ''}
              <div style="font-size: 13px; margin-bottom: 2px;">${quote.addresses.contact.name}</div>
              <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.street}</div>
              <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.postalCode} ${quote.addresses.contact.city}</div>
              <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.country}</div>
              ${quote.addresses.contact.email ? `<div style="font-size: 11px; color: ${colors.subtitleColor}; margin-bottom: 1px;">${quote.addresses.contact.email}</div>` : ''}
              ${quote.addresses.contact.phone ? `<div style="font-size: 11px; color: ${colors.subtitleColor};">${quote.addresses.contact.phone}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Titre -->
        <div style="text-align: center; padding: 20px 0; border-top: 3px solid ${colors.primary}; border-bottom: 1px solid ${colors.secondary}; margin: 20px 0;">
          <h1 style="color: ${colors.primary}; font-size: 28px; margin: 0; font-weight: bold;">Description de la prestation</h1>
        </div>
        
        <!-- Contenu description -->
        <div style="margin: 30px 0; padding: 20px; background: ${colors.cardBackground}; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div><strong>Nature de la prestation:</strong> ${desc.naturePrestation || ''}</div>
            <div><strong>Lieu de prestation:</strong> ${desc.lieuPrestation || ''}</div>
            <div><strong>Période:</strong> ${desc.periode || ''}</div>
            <div><strong>Horaires:</strong> ${desc.horaires || ''}</div>
            <div><strong>Tenue:</strong> ${desc.tenue || ''}</div>
            <div><strong>Pause:</strong> ${desc.pause || ''}</div>
            <div><strong>Déplacement:</strong> ${desc.deplacement || ''}</div>
          </div>
          
          ${desc.remarque ? `<div><strong>Remarque:</strong><br>${desc.remarque}</div>` : ''}
        </div>
      </div>
    `;
  }

  // DEBUT DU DEVIS PRINCIPAL - Page du devis avec toutes les informations
  html += `
    <div class="page-number">Page ${pageCount} / ${totalPages}</div>
    <div style="page-break-inside: avoid;">
      <!-- En-tête du devis -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div style="flex: 1;">
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 15px;">` : ''}
          ${settings.sellerInfo?.name ? `
            <div style="font-weight: bold; color: ${colors.titleColor}; font-size: 16px;">${settings.sellerInfo.name}</div>
            ${settings.sellerInfo.title ? `<div style="color: ${colors.subtitleColor};">${settings.sellerInfo.title}</div>` : ''}
            ${settings.sellerInfo.email ? `<div>${settings.sellerInfo.email}</div>` : ''}
            ${settings.sellerInfo.phone ? `<div>${settings.sellerInfo.phone}</div>` : ''}
          ` : ''}
        </div>
        
        <div style="text-align: right; border: 2px solid ${colors.primary}; padding: 15px; border-radius: 8px; background: ${colors.cardBackground}; min-height: 120px;">
          <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 10px; text-align: center;">DEVIS N° ${quote.ref}</div>
          <div style="color: ${colors.subtitleColor}; margin-bottom: 15px; text-align: center;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</div>
          <div style="border-top: 1px solid ${colors.secondary}; padding-top: 10px;">
            <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 8px;">CLIENT:</div>
            ${quote.addresses.contact.company ? `<div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${quote.addresses.contact.company}</div>` : ''}
            <div style="font-size: 13px; margin-bottom: 2px;">${quote.addresses.contact.name}</div>
            <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.street}</div>
            <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.postalCode} ${quote.addresses.contact.city}</div>
            <div style="font-size: 12px; color: ${colors.textColor}; margin-bottom: 1px;">${quote.addresses.contact.country}</div>
            ${quote.addresses.contact.email ? `<div style="font-size: 11px; color: ${colors.subtitleColor}; margin-bottom: 1px;">${quote.addresses.contact.email}</div>` : ''}
            ${quote.addresses.contact.phone ? `<div style="font-size: 11px; color: ${colors.subtitleColor};">${quote.addresses.contact.phone}</div>` : ''}
          </div>
        </div>
      </div>
  `;

  // Titre du devis
  html += `
      <!-- Titre du devis -->
      <div style="text-align: center; padding: 20px 0; border-top: 3px solid ${colors.primary}; border-bottom: 1px solid ${colors.secondary}; margin: 20px 0;">
        <h1 style="color: ${colors.primary}; font-size: 28px; margin: 0; font-weight: bold;">${quoteType}</h1>
        <p style="color: ${colors.subtitleColor}; font-size: 18px; margin: 5px 0; font-weight: 600;">Devis N° ${quote.ref}</p>
        <p style="color: ${colors.mutedTextColor}; font-size: 14px;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</p>
      </div>
  `;

  // Informations complémentaires
  if (quote.site || quote.contact || quote.canton) {
    html += `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: ${colors.primary}; margin-bottom: 10px;">Détails du projet</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          ${quote.site ? `<div><strong>Site:</strong> ${quote.site}</div>` : ''}
          ${quote.contact ? `<div><strong>Contact:</strong> ${quote.contact}</div>` : ''}
          ${quote.canton ? `<div><strong>Canton:</strong> ${quote.canton}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Prestations TECH
  if (hasTechItems) {
    html += `
      <div style="margin: 30px 0;">
        <h3 style="color: ${colors.primary}; font-size: 18px; margin-bottom: 15px;">
          ${isMixed ? 'Prestations techniques' : 'Prestations'}
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.tableBorder};">
          <thead>
            <tr style="background: ${colors.tableHeader}; color: ${colors.tableHeaderText};">
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: left;">Type</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: left;">Référence</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: center;">Mode</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: center;">Qté</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: right;">PU TTC</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 10px; text-align: right;">Total TTC</th>
            </tr>
          </thead>
          <tbody>
    `;

    quote.items.filter(item => item.kind === 'TECH').forEach((item, index) => {
      html += `
        <tr style="background: ${index % 2 === 0 ? colors.tableRowAlt : colors.tableRow};">
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px;">${item.type}</td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px;">${item.reference}</td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center;">
            <span style="background: ${item.mode === 'mensuel' ? colors.accent : colors.secondary}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">
              ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
            </span>
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center;">${item.qty || 0}</td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right;">${(item.puTTC || 0).toFixed(2)} CHF</td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-weight: bold; color: ${colors.primary};">
            ${(item.totalTTC || 0).toFixed(2)} CHF${item.mode === 'mensuel' ? '/mois' : ''}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Prestations AGENT 
  if (hasAgentItems) {
    html += `
      <div style="margin: 30px 0;">
        <h3 style="color: ${colors.primary}; font-size: 18px; margin-bottom: 15px;">
          ${isMixed ? 'Prestations d\'agents de sécurité' : 'Prestations d\'agents'}
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.tableBorder};">
          <thead>
            <tr style="background: ${colors.tableHeader}; color: ${colors.tableHeaderText};">
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: left; font-size: 10px;">Type</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: left; font-size: 10px;">Date début</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: left; font-size: 10px;">Heure début</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: left; font-size: 10px;">Date fin</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: left; font-size: 10px;">Heure fin</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center; font-size: 10px;">H norm.</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center; font-size: 10px;">H nuit</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center; font-size: 10px;">H dim.</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: center; font-size: 10px;">H JF</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">Tarif CHF/h</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">Nuit</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">Dim/JF</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">Dépl.</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">HT</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">TVA</th>
              <th style="border: 1px solid ${colors.tableBorder}; padding: 8px; text-align: right; font-size: 10px;">TTC</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Filtrer les items agents qui ont des valeurs (heures > 0 ou déplacement > 0)
    const agentItemsWithValues = quote.items.filter(item => 
      item.kind === 'AGENT' && (
        (item.hoursNormal || 0) > 0 || 
        (item.hoursNight || 0) > 0 || 
        (item.hoursSunday || 0) > 0 || 
        (item.hoursHoliday || 0) > 0 ||
        (item.travelCHF || 0) > 0
      )
    );

    // Grouper les vacations similaires
    const groupedAgentItems = [];
    const processedItems = new Set();
    
    agentItemsWithValues.forEach((item, index) => {
      if (processedItems.has(index)) return;
      
      // Chercher des items similaires
      const similarItems = [item];
      const baseKey = `${item.agentType || ''}_${item.rateCHFh || 0}_${item.travelCHF || 0}`;
      
      for (let i = index + 1; i < agentItemsWithValues.length; i++) {
        const otherItem = agentItemsWithValues[i];
        const otherKey = `${otherItem.agentType || ''}_${otherItem.rateCHFh || 0}_${otherItem.travelCHF || 0}`;
        
        if (baseKey === otherKey && 
           (otherItem.hoursNormal || 0) === (item.hoursNormal || 0) &&
           (otherItem.hoursNight || 0) === (item.hoursNight || 0) &&
           (otherItem.hoursSunday || 0) === (item.hoursSunday || 0) &&
           (otherItem.hoursHoliday || 0) === (item.hoursHoliday || 0)) {
          similarItems.push(otherItem);
          processedItems.add(i);
        }
      }
      
      processedItems.add(index);
      
      if (similarItems.length > 1) {
        // Créer une entrée groupée
        const totalHT = similarItems.reduce((sum, item) => sum + (item.lineHT || 0), 0);
        const totalTVA = similarItems.reduce((sum, item) => sum + (item.lineTVA || 0), 0);
        const totalTTC = similarItems.reduce((sum, item) => sum + (item.lineTTC || 0), 0);
        
        const dates = similarItems.map(item => {
          const start = item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '';
          const end = item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '';
          return start === end ? start : `${start} → ${end}`;
        }).join(', ');
        
        groupedAgentItems.push({
          ...item,
          dateRange: dates,
          count: similarItems.length,
          lineHT: totalHT,
          lineTVA: totalTVA,
          lineTTC: totalTTC,
          isGrouped: true
        });
      } else {
        groupedAgentItems.push(item);
      }
    });

    groupedAgentItems.forEach((item, index) => {
      const nightRate = ((item.rateCHFh || 0) * (1 + (settings.agentSettings?.nightMarkupPct || 10) / 100));
      const sundayHolidayRate = ((item.rateCHFh || 0) * (1 + (settings.agentSettings?.sundayMarkupPct || 10) / 100));
      
      html += `
        <tr style="background: ${index % 2 === 0 ? colors.tableRowAlt : colors.tableRow};">
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; font-size: 9px;">
            ${item.agentType || '-'}${item.isGrouped ? ` (×${item.count})` : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; font-size: 9px;">
            ${item.isGrouped ? item.dateRange : (item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-')}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; font-size: 9px;">
            ${item.isGrouped ? '-' : (item.timeStart || '-')}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; font-size: 9px;">
            ${item.isGrouped ? '-' : (item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-')}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; font-size: 9px;">
            ${item.isGrouped ? '-' : (item.timeEnd || '-')}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: center; font-size: 9px;">
            ${(item.hoursNormal || 0) > 0 ? (item.hoursNormal || 0).toFixed(1) : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: center; font-size: 9px;">
            ${(item.hoursNight || 0) > 0 ? (item.hoursNight || 0).toFixed(1) : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: center; font-size: 9px;">
            ${(item.hoursSunday || 0) > 0 ? (item.hoursSunday || 0).toFixed(1) : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: center; font-size: 9px;">
            ${(item.hoursHoliday || 0) > 0 ? (item.hoursHoliday || 0).toFixed(1) : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px;">
            ${(item.rateCHFh || 0).toFixed(2)}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px;">
            ${nightRate.toFixed(2)}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px;">
            ${sundayHolidayRate.toFixed(2)}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px;">
            ${(item.travelCHF || 0) > 0 ? (item.travelCHF || 0).toFixed(2) : ''}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px; font-weight: bold;">
            ${(item.lineHT || 0).toFixed(2)}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px;">
            ${(item.lineTVA || 0).toFixed(2)}
          </td>
          <td style="border: 1px solid ${colors.tableBorder}; padding: 6px; text-align: right; font-size: 9px; font-weight: bold; color: ${colors.primary};">
            ${(item.lineTTC || 0).toFixed(2)}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 11px;">
          <h4 style="color: ${colors.primary}; margin-bottom: 10px;">Informations importantes</h4>
          <p style="margin-bottom: 10px; font-weight: bold;">${settings.agentSettings?.majorationNote || `Les heures entre ${settings.agentSettings?.nightStartTime || '23:00'} et ${settings.agentSettings?.nightEndTime || '06:00'} ainsi que les dimanches et jours fériés sont majorées de ${settings.agentSettings?.nightMarkupPct || 10}%.`}</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><strong>Heures de nuit:</strong> ${settings.agentSettings?.nightStartTime || '23:00'} → ${settings.agentSettings?.nightEndTime || '06:00'} (+${settings.agentSettings?.nightMarkupPct || 10}%)</div>
            <div><strong>Dimanche/JF:</strong> ${settings.agentSettings?.sundayStartTime || '06:00'} → ${settings.agentSettings?.sundayEndTime || '23:00'} (+${settings.agentSettings?.sundayMarkupPct || 10}%)</div>
            <div><strong>Jours fériés:</strong> +${settings.agentSettings?.holidayMarkupPct || 10}%</div>
          </div>
        </div>
      </div>
    `;
  }

  // Totaux - CENTRÉS AU MILIEU DE LA PAGE
  html += `
      <!-- Totaux centrés -->
      <div style="display: flex; justify-content: center; margin: 30px 0;">
        <div style="display: grid; grid-template-columns: repeat(${totals.unique.totalTTC > 0 && totals.mensuel.totalTTC > 0 && totals.agents.totalTTC > 0 ? '3' : totals.unique.totalTTC > 0 && totals.mensuel.totalTTC > 0 || totals.unique.totalTTC > 0 && totals.agents.totalTTC > 0 || totals.mensuel.totalTTC > 0 && totals.agents.totalTTC > 0 ? '2' : '1'}, 1fr); gap: 20px; max-width: 900px;">
  `;

  // Total TECH unique
  if (totals.unique.totalTTC > 0) {
    html += `
      <div style="border: 2px solid ${colors.secondary}; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <h4 style="color: ${colors.primary}; margin-bottom: 15px; font-weight: bold;">Achat unique</h4>
        <div style="space-y: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Sous-total HT:</span><span>${totals.unique.subtotalHT.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>TVA (${settings.tvaPct}%):</span><span>${totals.unique.tva.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.secondary}; padding-top: 8px; color: ${colors.primary};">
            <span>Total TTC:</span><span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
          </div>
        </div>
      </div>
    `;
  }

  // Total TECH mensuel
  if (totals.mensuel.totalTTC > 0) {
    html += `
      <div style="border: 2px solid ${colors.accent}; background: #f0fdf4; padding: 15px; border-radius: 8px;">
        <h4 style="color: ${colors.accent}; margin-bottom: 15px; font-weight: bold;">Abonnement mensuel</h4>
        <div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Sous-total HT:</span><span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>TVA (${settings.tvaPct}%):</span><span>${totals.mensuel.tva.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.accent}; padding-top: 8px; color: ${colors.accent};">
            <span>Total TTC:</span><span>${totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
          </div>
        </div>
      </div>
    `;
  }

  // Total AGENT avec couleur personnalisable
  if (totals.agents.totalTTC > 0) {
    const agentTableColor = settings.templateColors?.agentTableColor || '#f59e0b';
    html += `
      <div style="border: 2px solid ${agentTableColor}; background: #fefbf3; padding: 15px; border-radius: 8px;">
        <h4 style="color: ${agentTableColor}; margin-bottom: 15px; font-weight: bold;">${isMixed ? 'Agents de sécurité' : 'Prestations d\'agents'}</h4>
        <div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Sous-total HT:</span><span>${totals.agents.subtotalHT.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>TVA (${settings.tvaPct}%):</span><span>${totals.agents.tva.toFixed(2)} CHF</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${agentTableColor}; padding-top: 8px; color: ${agentTableColor};">
            <span>Total TTC:</span><span>${totals.agents.totalTTC.toFixed(2)} CHF</span>
          </div>
        </div>
      </div>
    `;
  }

  html += `        </div>
      </div>

      <!-- Total général centré -->
      <div style="display: flex; justify-content: center; margin: 30px 0;">
        <div style="text-align: center; padding: 25px; border: 3px solid ${colors.primary}; border-radius: 8px; background: linear-gradient(135deg, ${colors.primary}08, ${colors.accent}08); max-width: 600px; width: 100%;">
          <h4 style="color: ${colors.primary}; font-size: 24px; font-weight: bold; margin-bottom: 20px;">TOTAL GÉNÉRAL</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
            <div>
              <p style="color: ${colors.secondary}; margin-bottom: 5px;">Total HT</p>
              <p style="font-size: 20px; font-weight: bold; color: ${colors.primary};">${totals.global.htAfterDiscount.toFixed(2)} CHF</p>
            </div>
            <div>
              <p style="color: ${colors.secondary}; margin-bottom: 5px;">TVA totale</p>
              <p style="font-size: 20px; font-weight: bold; color: ${colors.primary};">${totals.global.tva.toFixed(2)} CHF</p>
            </div>
          </div>
          <div style="border-top: 2px solid ${colors.primary}; padding-top: 15px;">
            <p style="font-size: 32px; font-weight: bold; color: ${colors.primary}; margin: 0;">
              ${totals.global.totalTTC.toFixed(2)} CHF
            </p>
            ${totals.mensuel.totalTTC > 0 ? `
              <p style="font-size: 20px; font-weight: bold; color: ${colors.accent}; margin-top: 10px;">
                + ${totals.mensuel.totalTTC.toFixed(2)} CHF/mois
              </p>
            ` : ''}
          </div>
        </div>
      </div>
  `;

  // Commentaire
  if (quote.comment) {
    html += `
      <div style="margin: 30px 0;">
        <h4 style="color: ${colors.primary}; font-size: 16px; margin-bottom: 15px;">Commentaires</h4>
        <div style="border: 1px solid ${colors.secondary}; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap; margin: 0;">${quote.comment}</p>
        </div>
      </div>
    `;
  }

  // Signatures - AVEC LA SIGNATURE DU VENDEUR À DROITE
  html += `
    <div style="margin-top: 50px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div style="border: 1px solid ${colors.primary}; background: ${colors.background}; padding: 20px; border-radius: 8px; min-height: 120px;">
          <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">CLIENT</div>
          <div style="color: ${colors.textColor}; margin-bottom: 15px;">
            ${quote.addresses.contact.name}<br>
            ${quote.addresses.contact.company || ''}
          </div>
          
          ${quote.clientSignature ? `
            <div style="margin: 10px 0;">
              <img src="${quote.clientSignature.dataUrl}" alt="Signature client" style="max-width: 150px; max-height: 60px; border: 1px solid #ddd;">
            </div>
            <div style="font-size: 12px; color: ${colors.textColor};">
              ${quote.clientSignature.date}${quote.clientSignature.location ? ` à ${quote.clientSignature.location}` : ''}
            </div>
          ` : `
            <div style="border-top: 1px solid ${colors.primary}; margin-top: 20px; padding-top: 8px; font-size: 12px; color: ${colors.textColor};">
              Date et lieu: _______________
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: ${colors.textColor};">
              Signature du client
            </div>
          `}
        </div>
        
        <div style="border: 1px solid ${colors.primary}; background: ${colors.background}; padding: 20px; border-radius: 8px; min-height: 120px;">
          <div style="font-weight: bold; color: ${colors.primary}; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">VENDEUR</div>
          <div style="color: ${colors.textColor}; margin-bottom: 15px;">
            ${settings.sellerInfo?.name || ''}<br>
            ${settings.sellerInfo?.title || ''}<br>
            ${settings.sellerInfo?.phone || ''}
          </div>
          <div style="border-bottom: 1px solid ${colors.primary}; width: 200px; height: 60px; margin: 15px 0;"></div>
          <div style="font-size: 12px; color: ${colors.textColor};">
            ${new Date().toLocaleDateString('fr-FR')}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}
          </div>
          <div style="font-size: 12px; color: ${colors.textColor}; margin-top: 5px;">
            Signature du vendeur
          </div>
        </div>
      </div>
    </div>

    <!-- Pied de page -->
    <div style="text-align: center; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 2px solid ${colors.primary}; color: ${colors.secondary};">
      Document généré le ${new Date().toLocaleDateString('fr-CH')} par ${settings.sellerInfo?.name || ''}
    </div>

    </div> <!-- Fin du devis principal -->
  `;

  return html;
};

export default PDFPreviewWithSignature;