import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileDown, Calculator, Euro } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals } from '@/utils/calculations';
import { toast } from 'sonner';
import PDFPreview from '@/components/pdf/PDFPreview';

const RecapScreen = () => {
  const { currentQuote, settings } = useStore();

  if (!currentQuote) return null;

  const totals = calculateQuoteTotals(currentQuote, settings.tvaPct);
  
  const generatePDF = () => {
    console.log('Début génération PDF');
    
    // Validation des données requises
    if (!currentQuote.ref) {
      console.log('Erreur: Référence manquante');
      toast.error('Veuillez renseigner une référence pour le devis');
      return;
    }
    
    if (!currentQuote.client) {
      console.log('Erreur: Client manquant');  
      toast.error('Veuillez sélectionner ou renseigner un client');
      return;
    }
    
    if (currentQuote.items.length === 0) {
      console.log('Erreur: Aucune ligne dans le devis');
      toast.error('Veuillez ajouter au moins une ligne au devis');
      return;
    }
    
    console.log('Validation passée, génération du PDF');
    
    // Créer le contenu HTML pour la génération PDF
    const colors = settings.templateColors || { 
      // Couleurs principales
      primary: '#000000',
      secondary: '#666666', 
      accent: '#333333',
      
      // Couleurs de texte
      titleColor: '#000000',
      subtitleColor: '#666666',
      textColor: '#000000',
      mutedTextColor: '#999999',
      
      // Couleurs de fond
      background: '#ffffff',
      cardBackground: '#ffffff',
      headerBackground: '#ffffff',
      
      // Couleurs de tableau
      tableHeader: '#f5f5f5',
      tableHeaderText: '#000000',
      tableRow: '#ffffff',
      tableRowAlt: '#f9f9f9',
      tableBorder: '#cccccc',
      
      // Couleurs des badges
      badgeUnique: '#666666',
      badgeMensuel: '#666666',
      badgeText: '#ffffff',
      
      // Couleurs des totaux
      totalCardBorder: '#cccccc',
      totalUniqueBackground: '#ffffff',
      totalMensuelBackground: '#ffffff',
      grandTotalBackground: '#f5f5f5',
      grandTotalBorder: '#000000',
      
      // Couleurs des bordures et séparateurs
      borderPrimary: '#000000',
      borderSecondary: '#cccccc',
      separatorColor: '#e0e0e0',
      
      // Couleurs spécifiques à la lettre
      letterHeaderColor: '#000000',
      letterDateColor: '#000000',
      letterSubjectColor: '#000000',
      letterSignatureColor: '#000000',
      
      // Couleurs des signatures
      signatureBoxBorder: '#000000',
      signatureBoxBackground: '#ffffff',
      signatureTitleColor: '#000000',
      signatureTextColor: '#666666'
    };
    
    // Fonction pour récupérer les valeurs de mise en page avec des valeurs par défaut
    const getLayoutValue = (section: string, property: string, defaultValue: string) => {
      return settings.pdfLayout?.[section]?.[property] || defaultValue;
    };
    
    // Fonction pour récupérer la police sélectionnée
    const getFontFamily = () => {
      const fontMap: { [key: string]: string } = {
        'inter': 'Inter, sans-serif',
        'dm-sans': 'DM Sans, sans-serif',
        'nunito-sans': 'Nunito Sans, sans-serif',
        'source-sans-pro': 'Source Sans Pro, sans-serif',
        'work-sans': 'Work Sans, sans-serif',
        'lato': 'Lato, sans-serif',
        'rubik': 'Rubik, sans-serif',
        'open-sans': 'Open Sans, sans-serif'
      };
      
      return fontMap[settings.selectedFont || 'dm-sans'] || 'DM Sans, sans-serif';
    };
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${settings.letterTemplate?.enabled ? 'Lettre et Devis' : 'Devis'} ${currentQuote.ref}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: ${getFontFamily()}; 
              margin: 0; 
              padding: 4px; 
              color: ${colors.textColor};
              background: ${colors.background};
              font-size: 9px;
              line-height: 1.2;
              font-weight: 300;
            }
            @media print { 
              body { margin: 0; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
              @page { 
                margin: 8mm; 
                size: A4;
                @bottom-center {
                  content: counter(page);
                  font-size: 10px;
                  color: ${colors.mutedTextColor};
                }
              }
            }
            .container { max-width: 800px; margin: 0 auto; }
            .letter-container { 
              margin-bottom: 6px; 
              padding-bottom: 6px; 
              border-bottom: 1px solid ${colors.borderPrimary}; 
              background: ${colors.headerBackground};
              padding: 6px;
              border-radius: 3px;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${getLayoutValue('header', 'marginBottom', '4')}px; }
            .logo { height: ${getLayoutValue('logo', 'height', '28')}px; margin-bottom: ${getLayoutValue('logo', 'marginBottom', '2')}px; margin-top: ${getLayoutValue('logo', 'marginTop', '0')}px; }
            .seller-info { flex: 1; }
            .client-info { text-align: right; max-width: 280px; }
            .title-section { 
              text-align: center; 
              padding: ${getLayoutValue('title', 'padding', '2')}px 0; 
              border-top: 1px solid ${colors.borderPrimary}; 
              border-bottom: 1px solid ${colors.borderSecondary}; 
              margin: ${getLayoutValue('title', 'margin', '2')}px 0;
              background: ${colors.headerBackground};
              border-radius: 2px;
            }
            .title { color: ${colors.titleColor}; font-size: ${getLayoutValue('title', 'fontSize', '14')}px; font-weight: 600; margin: 0; font-family: ${getFontFamily()}; letter-spacing: 0.2px; }
            .subtitle { color: ${colors.subtitleColor}; font-size: ${getLayoutValue('header', 'fontSize', '9')}px; margin: 1px 0 0 0; font-family: ${getFontFamily()}; font-weight: 400; }
            .project-details { 
              background: ${colors.cardBackground}; 
              padding: 3px; 
              border-radius: 2px; 
              margin: 3px 0; 
              border: 1px solid ${colors.borderSecondary};
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: ${getLayoutValue('table', 'margin', '2')}px 0; 
              border: 1px solid ${colors.tableBorder}; 
            }
            th { 
              background: ${colors.tableHeader}; 
              color: ${colors.tableHeaderText}; 
              padding: ${getLayoutValue('table', 'headerPadding', '2')}px 1px; 
              text-align: left; 
              font-weight: 500;
              border: 1px solid ${colors.tableBorder};
              font-size: ${getLayoutValue('table', 'headerFontSize', '8')}px;
              font-family: ${getFontFamily()};
              letter-spacing: 0.1px;
            }
            td { 
              padding: ${getLayoutValue('table', 'cellPadding', '1')}px 1px; 
              border: 1px solid ${colors.tableBorder}; 
              color: ${colors.textColor};
              font-size: ${getLayoutValue('table', 'cellFontSize', '8')}px;
              font-family: ${getFontFamily()};
              font-weight: 300;
            }
            tr:nth-child(even) { background: ${colors.tableRowAlt}; }
            tr:nth-child(odd) { background: ${colors.tableRow}; }
            .mode-badge { 
              padding: 3px 8px; 
              border-radius: 12px; 
              font-size: 11px; 
              color: ${colors.badgeText}; 
              font-weight: bold;
            }
            .mode-unique { background: ${colors.badgeUnique}; }
            .mode-mensuel { background: ${colors.badgeMensuel}; }
            .totals-section { display: grid; grid-template-columns: 1fr 1fr; gap: ${getLayoutValue('totals', 'gap', '2')}px; margin: ${getLayoutValue('totals', 'margin', '2')}px 0; }
            .total-card { 
              border: 1px solid ${colors.totalCardBorder}; 
              padding: ${getLayoutValue('totals', 'padding', '2')}px; 
              border-radius: 2px; 
              background: ${colors.cardBackground};
              font-size: ${getLayoutValue('totals', 'fontSize', '8')}px;
              font-family: ${getFontFamily()};
              font-weight: 400;
            }
            .total-unique { 
              border-color: ${colors.totalCardBorder}; 
              background: ${colors.totalUniqueBackground};
            }
            .total-mensuel { 
              border-color: ${colors.accent}; 
              background: ${colors.totalMensuelBackground};
            }
            .grand-total { 
              text-align: center; 
              padding: ${getLayoutValue('grandTotal', 'padding', '3')}px; 
              border: ${getLayoutValue('grandTotal', 'borderWidth', '1')}px solid ${colors.grandTotalBorder}; 
              border-radius: 2px; 
              background: ${colors.grandTotalBackground};
              margin: ${getLayoutValue('grandTotal', 'margin', '3')}px 0;
              font-size: ${getLayoutValue('grandTotal', 'fontSize', '9')}px;
              font-family: ${getFontFamily()};
              font-weight: 600;
              letter-spacing: 0.2px;
            }
            .footer { 
              text-align: center; 
              font-size: 10px; 
              color: ${colors.mutedTextColor}; 
              border-top: 1px solid ${colors.borderPrimary}; 
              padding-top: 10px; 
              margin-top: 15px; 
            }
            .comment-section { 
              margin: 10px 0; 
            }
            .comment-box { 
              border: 1px solid ${colors.borderSecondary}; 
              background: ${colors.cardBackground}; 
              padding: 8px; 
              border-radius: 4px; 
              color: ${colors.textColor};
            }
            .letter-header { margin-bottom: 30px; }
            .letter-date { 
              text-align: right; 
              margin: ${getLayoutValue('letter', 'contentMargin', '10')}px 0; 
              font-weight: 500; 
              color: ${colors.letterDateColor};
              font-size: ${getLayoutValue('letter', 'dateFontSize', '12')}px;
              font-family: ${getFontFamily()};
            }
            .letter-recipient { 
              margin: ${getLayoutValue('letter', 'contentMargin', '10')}px 0; 
              color: ${colors.textColor};
              font-size: ${getLayoutValue('letter', 'dateFontSize', '12')}px;
              font-family: ${getFontFamily()};
              line-height: 1.4;
              font-weight: 300;
            }
            .letter-subject { 
              margin: ${getLayoutValue('letter', 'contentMargin', '10')}px 0; 
              font-weight: 600; 
              color: ${colors.letterSubjectColor};
              font-size: ${getLayoutValue('letter', 'subjectFontSize', '12')}px; 
              font-family: ${getFontFamily()};
              letter-spacing: 0.2px;
            }
            .letter-content { 
              margin: ${getLayoutValue('letter', 'contentMargin', '10')}px 0; 
              line-height: ${getLayoutValue('letter', 'lineHeight', '1.5')}; 
              text-align: justify; 
              color: ${colors.textColor};
              font-size: ${getLayoutValue('letter', 'contentFontSize', '11')}px;
              font-family: ${getFontFamily()};
              font-weight: 300;
            }
            .letter-signature { 
              margin-top: 15px; 
              color: ${colors.letterSignatureColor};
              font-size: 11px;
            }
            .separator { 
              height: 1px; 
              background: ${colors.separatorColor}; 
              margin: 20px 0; 
            }
            .signatures-section {
              margin: ${getLayoutValue('signatures', 'margin', '8')}px 0 3px 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: ${getLayoutValue('signatures', 'gap', '10')}px;
            }
            .signature-box {
              border: 1px solid ${colors.signatureBoxBorder};
              background: ${colors.signatureBoxBackground};
              padding: ${getLayoutValue('signatures', 'padding', '6')}px;
              border-radius: 3px;
              min-height: ${getLayoutValue('signatures', 'minHeight', '45')}px;
            }
            .signature-title {
              font-weight: 600;
              color: ${colors.signatureTitleColor};
              margin-bottom: 3px;
              font-size: ${getLayoutValue('signatures', 'titleFontSize', '13')}px;
              font-family: ${getFontFamily()};
              letter-spacing: 0.3px;
              text-transform: uppercase;
            }
            .signature-content {
              color: ${colors.signatureTextColor};
              font-size: ${getLayoutValue('signatures', 'contentFontSize', '10')}px;
              line-height: 1.2;
              margin-bottom: 3px;
              font-family: ${getFontFamily()};
              font-weight: 300;
            }
            .signature-line {
              border-top: 1px solid ${colors.signatureBoxBorder};
              margin-top: ${getLayoutValue('signatures', 'lineMarginTop', '15')}px;
              padding-top: 3px;
              font-size: ${getLayoutValue('signatures', 'lineFontSize', '9')}px;
              color: ${colors.signatureTextColor};
              font-family: ${getFontFamily()};
              font-weight: 400;
            }
          </style>
        </head>
        <body>
          <div class="container">
    `;

    // Ajouter la lettre de présentation si activée
    if (settings.letterTemplate?.enabled) {
      const letterDate = new Date().toLocaleDateString('fr-FR');
      const clientAddress = currentQuote.addresses.contact;
      
      htmlContent += `
        <div class="letter-container">
          <div class="letter-header">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo">` : ''}
            <div style="margin-top: 20px;">
              <div style="font-weight: bold; font-size: 18px; color: ${colors.letterHeaderColor};">${settings.letterTemplate.companyName}</div>
              <div style="margin-top: 10px; color: ${colors.subtitleColor};">${settings.letterTemplate.companyAddress}</div>
              <div style="margin-top: 10px; color: ${colors.textColor};">
                <div>${settings.letterTemplate.contactName} - ${settings.letterTemplate.contactTitle}</div>
                <div>Tél: ${settings.letterTemplate.contactPhone}</div>
                <div>Email: ${settings.letterTemplate.contactEmail}</div>
              </div>
            </div>
          </div>
          
          <div class="letter-date">Le ${letterDate}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}</div>
          
          <div class="letter-recipient">
            <div style="font-weight: bold; color: ${colors.titleColor};">À l'attention de :</div>
            <div style="margin-top: 10px;">
              ${clientAddress.company ? `<div style="font-weight: bold; color: ${colors.titleColor};">${clientAddress.company}</div>` : ''}
              <div>${clientAddress.name}</div>
              <div>${clientAddress.street}</div>
              <div>${clientAddress.postalCode} ${clientAddress.city}</div>
            </div>
          </div>
          
          <div class="letter-subject" style="margin-top: ${getLayoutValue('letter', 'subjectMarginTop', '30')}px;">
            <strong>Objet:</strong> ${settings.letterTemplate.subject}
          </div>
          
          <div class="letter-content">
            <div class="letter-greeting" style="margin-bottom: 20px; color: ${colors.titleColor};">
              ${currentQuote.clientCivility === 'Madame' ? 'Chère' : 'Cher'} ${currentQuote.clientCivility} ${clientAddress.name || currentQuote.client || 'Client'},
            </div>
            
            <p>${settings.letterTemplate.opening.replace(/\n/g, '</p><p>')}</p>
            <p>${settings.letterTemplate.body.replace(/\n/g, '</p><p>')}</p>
            <p>${settings.letterTemplate.closing.replace(/\n/g, '</p><p>')}</p>
            
            <div class="letter-closing" style="margin-top: 20px; color: ${colors.textColor};">
              <p>Dans l'attente de votre retour, nous vous prions d'agréer, ${currentQuote.clientCivility} ${clientAddress.name || currentQuote.client || 'Client'}, l'expression de nos salutations distinguées.</p>
              
              <div style="margin-top: 40px;">
                <p><strong>Cordialement,</strong></p>
                
                ${settings.sellerInfo?.signature ? `
                  <div style="margin: 20px 0;">
                    <img src="${settings.sellerInfo.signature}" alt="Signature" style="max-height: 60px; object-fit: contain;" />
                  </div>
                ` : ''}
                
                <div style="margin-top: 10px;">
                  ${settings.sellerInfo?.name ? `<div style="font-weight: bold;">${settings.sellerInfo.name}</div>` : ''}
                  ${settings.sellerInfo?.title ? `<div>${settings.sellerInfo.title}</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="page-break"></div>
      `;
    }

    // Fonction pour générer l'en-tête complet
    const generateHeader = (isFirstPage = false) => `
      ${!isFirstPage ? '<div class="page-break"></div>' : ''}
      <div class="header">
        <div class="seller-info">
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo">` : ''}
          ${settings.sellerInfo?.name ? `
            <div style="margin-top: 10px;">
              <div style="font-weight: bold; color: ${colors.primary}; font-size: 14px;">${settings.sellerInfo.name}</div>
              ${settings.sellerInfo.title ? `<div style="color: ${colors.subtitleColor}; margin-top: 2px; font-size: 12px;">${settings.sellerInfo.title}</div>` : ''}
              ${settings.sellerInfo.email ? `<div style="color: ${colors.textColor}; margin-top: 2px; font-size: 11px;">${settings.sellerInfo.email}</div>` : ''}
              ${settings.sellerInfo.phone ? `<div style="color: ${colors.textColor}; margin-top: 2px; font-size: 11px;">${settings.sellerInfo.phone}</div>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="client-info">
          <div>
            <div style="font-weight: bold; font-size: 14px; color: ${colors.titleColor};">${currentQuote.addresses.contact.company}</div>
            <div style="color: ${colors.textColor}; margin-top: 2px; font-size: 12px;">${currentQuote.addresses.contact.name}</div>
            <div style="color: ${colors.textColor}; margin-top: 2px; font-size: 11px;">${currentQuote.addresses.contact.street}</div>
            <div style="color: ${colors.textColor}; margin-top: 2px; font-size: 11px;">${currentQuote.addresses.contact.postalCode} ${currentQuote.addresses.contact.city}</div>
            ${currentQuote.addresses.contact.email ? `<div style="color: ${colors.secondary}; margin-top: 2px; font-size: 11px;">${currentQuote.addresses.contact.email}</div>` : ''}
            ${currentQuote.addresses.contact.phone ? `<div style="color: ${colors.textColor}; margin-top: 2px; font-size: 11px;">${currentQuote.addresses.contact.phone}</div>` : ''}
            
            ${currentQuote.addresses.useSeparateAddresses ? `
              <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid ${colors.borderSecondary};">
                <div style="font-weight: bold; color: ${colors.primary}; font-size: 14px;">Adresse de facturation :</div>
                <div style="color: ${colors.textColor}; margin-top: 3px; font-size: 13px;">
                  <div>${currentQuote.addresses.billing.company}</div>
                  <div>${currentQuote.addresses.billing.name}</div>
                  <div>${currentQuote.addresses.billing.street}</div>
                  <div>${currentQuote.addresses.billing.postalCode} ${currentQuote.addresses.billing.city}</div>
                </div>
              </div>
              
              <div style="margin-top: 10px;">
                <div style="font-weight: bold; color: ${colors.primary}; font-size: 14px;">Adresse d'installation :</div>
                <div style="color: ${colors.textColor}; margin-top: 3px; font-size: 13px;">
                  <div>${currentQuote.addresses.installation.company}</div>
                  <div>${currentQuote.addresses.installation.name}</div>
                  <div>${currentQuote.addresses.installation.street}</div>
                  <div>${currentQuote.addresses.installation.postalCode} ${currentQuote.addresses.installation.city}</div>
                </div>
              </div>
            ` : `
              <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid ${colors.borderSecondary};">
                <div style="color: ${colors.mutedTextColor}; font-size: 13px; font-style: italic;">
                  Facturation et installation à la même adresse
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
      
      <div class="title-section">
        <h1 class="title">${settings.pdfTitle}</h1>
        <p class="subtitle">Devis N° ${currentQuote.ref}</p>
        <p style="color: ${colors.mutedTextColor};">Date: ${new Date(currentQuote.date).toLocaleDateString('fr-CH')}</p>
      </div>
      
      ${currentQuote.site || currentQuote.contact || currentQuote.canton ? `
        <div class="project-details">
          <h3 style="color: ${colors.primary}; margin: 0 0 10px 0;">Détails du projet</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 14px; color: ${colors.textColor};">
            ${currentQuote.site ? `<div><strong>Site:</strong> ${currentQuote.site}</div>` : ''}
            ${currentQuote.contact ? `<div><strong>Contact:</strong> ${currentQuote.contact}</div>` : ''}
            ${currentQuote.canton ? `<div><strong>Canton:</strong> ${currentQuote.canton}</div>` : ''}
          </div>
        </div>
      ` : ''}
    `;

    // En-tête avec logo et adresses pour le devis - seulement pour la première page
    htmlContent += generateHeader(true);

    // Pagination automatique intelligente
    const ITEMS_PER_PAGE = 15; // Nombre d'items max par page pour rester lisible
    const totalItems = currentQuote.items.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Si une seule page suffit
    if (totalPages === 1) {
      // Tableau des prestations
      htmlContent += `
        <div>
          <h3 style="color: ${colors.primary};">Détail des prestations</h3>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Référence</th>
                <th style="text-align: center;">Mode</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">PU TTC</th>
                <th style="text-align: right;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
      `;

      currentQuote.items.forEach(item => {
        htmlContent += `
          <tr>
            <td>${item.type}</td>
            <td>${item.reference}</td>
            <td style="text-align: center;">
              <span class="mode-badge ${item.mode === 'mensuel' ? 'mode-mensuel' : 'mode-unique'}">
                ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
              </span>
            </td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: right;">${item.puTTC?.toFixed(2)} CHF</td>
            <td style="text-align: right; font-weight: bold; color: ${colors.primary};">
              ${item.totalTTC?.toFixed(2)} CHF${item.mode === 'mensuel' ? '/mois' : ''}
            </td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;

      // Ajouter les totaux pour une seule page
      htmlContent += `<div class="totals-section">`;
      
      if (totals.unique.totalTTC > 0) {
        htmlContent += `
          <div class="total-card total-unique">
            <h4 style="color: ${colors.primary}; margin: 0 0 10px 0;">Achat unique</h4>
            <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
              <span>Sous-total HT:</span>
              <span>${totals.unique.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
              <span>TVA (${settings.tvaPct}%):</span>
              <span>${totals.unique.tva.toFixed(2)} CHF</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.borderSecondary}; padding-top: 8px; color: ${colors.primary};">
              <span>Total TTC:</span>
              <span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
            </div>
          </div>
        `;
      }

      if (totals.mensuel.totalTTC > 0) {
        htmlContent += `
          <div class="total-card total-mensuel">
            <h4 style="color: ${colors.accent}; margin: 0 0 10px 0;">Abonnement mensuel</h4>
            <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
              <span>Sous-total HT:</span>
              <span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
              <span>TVA (${settings.tvaPct}%):</span>
              <span>${totals.mensuel.tva.toFixed(2)} CHF</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.accent}; padding-top: 8px; color: ${colors.accent};">
              <span>Total TTC:</span>
              <span>${totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
            </div>
          </div>
        `;
      }

      htmlContent += `</div>`;

      // Total général
      htmlContent += `
        <div class="grand-total">
          <h4 style="color: ${colors.titleColor}; font-size: 18px; margin: 0 0 8px 0;">TOTAL GÉNÉRAL</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
            <div>
              <p style="margin: 0; color: ${colors.subtitleColor}; font-size: 8px;">Total HT</p>
              <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.primary};">${totals.global.htAfterDiscount.toFixed(2)} CHF</p>
            </div>
            <div>
              <p style="margin: 0; color: ${colors.subtitleColor}; font-size: 8px;">TVA totale</p>
              <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.primary};">${totals.global.tva.toFixed(2)} CHF</p>
            </div>
          </div>
          <div style="border-top: 1px solid ${colors.borderPrimary}; padding-top: 8px;">
            <p style="margin: 0; font-size: 22px; font-weight: bold; color: ${colors.primary};">
              ${totals.global.totalTTC.toFixed(2)} CHF
            </p>
            ${totals.mensuel.totalTTC > 0 ? `
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.accent};">
                + ${totals.mensuel.totalTTC.toFixed(2)} CHF/mois
              </p>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      // Pages multiples - générer chaque page
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIndex = pageIndex * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageItems = currentQuote.items.slice(startIndex, endIndex);
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;

        // Ajouter l'en-tête pour cette page (sauf la première qui l'a déjà)
        if (!isFirstPage) {
          htmlContent += generateHeader(false);
        }

        // Tableau pour cette page
        htmlContent += `
          <div>
            <h3 style="color: ${colors.primary};">Détail des prestations ${totalPages > 1 ? `(Page ${pageIndex + 1}/${totalPages})` : ''}</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Référence</th>
                  <th style="text-align: center;">Mode</th>
                  <th style="text-align: center;">Qté</th>
                  <th style="text-align: right;">PU TTC</th>
                  <th style="text-align: right;">Total TTC</th>
                </tr>
              </thead>
              <tbody>
        `;

        pageItems.forEach(item => {
          htmlContent += `
            <tr>
              <td>${item.type}</td>
              <td>${item.reference}</td>
              <td style="text-align: center;">
                <span class="mode-badge ${item.mode === 'mensuel' ? 'mode-mensuel' : 'mode-unique'}">
                  ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                </span>
              </td>
              <td style="text-align: center;">${item.qty}</td>
              <td style="text-align: right;">${item.puTTC?.toFixed(2)} CHF</td>
              <td style="text-align: right; font-weight: bold; color: ${colors.primary};">
                ${item.totalTTC?.toFixed(2)} CHF${item.mode === 'mensuel' ? '/mois' : ''}
              </td>
            </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;

        // Ajouter les totaux uniquement sur la dernière page
        if (isLastPage) {
          // Totaux
          htmlContent += `<div class="totals-section">`;
          
          if (totals.unique.totalTTC > 0) {
            htmlContent += `
              <div class="total-card total-unique">
                <h4 style="color: ${colors.primary}; margin: 0 0 10px 0;">Achat unique</h4>
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
                  <span>Sous-total HT:</span>
                  <span>${totals.unique.subtotalHT.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
                  <span>TVA (${settings.tvaPct}%):</span>
                  <span>${totals.unique.tva.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.borderSecondary}; padding-top: 8px; color: ${colors.primary};">
                  <span>Total TTC:</span>
                  <span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
                </div>
              </div>
            `;
          }

          if (totals.mensuel.totalTTC > 0) {
            htmlContent += `
              <div class="total-card total-mensuel">
                <h4 style="color: ${colors.accent}; margin: 0 0 10px 0;">Abonnement mensuel</h4>
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
                  <span>Sous-total HT:</span>
                  <span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: ${colors.textColor};">
                  <span>TVA (${settings.tvaPct}%):</span>
                  <span>${totals.mensuel.tva.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid ${colors.accent}; padding-top: 8px; color: ${colors.accent};">
                  <span>Total TTC:</span>
                  <span>${totals.mensuel.totalTTC.toFixed(2)} CHF/mois</span>
                </div>
              </div>
            `;
          }

          htmlContent += `</div>`;

          // Total général
          htmlContent += `
            <div class="grand-total">
              <h4 style="color: ${colors.titleColor}; font-size: 18px; margin: 0 0 8px 0;">TOTAL GÉNÉRAL</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                <div>
                  <p style="margin: 0; color: ${colors.subtitleColor}; font-size: 8px;">Total HT</p>
                  <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.primary};">${totals.global.htAfterDiscount.toFixed(2)} CHF</p>
                </div>
                <div>
                  <p style="margin: 0; color: ${colors.subtitleColor}; font-size: 8px;">TVA totale</p>
                  <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.primary};">${totals.global.tva.toFixed(2)} CHF</p>
                </div>
              </div>
              <div style="border-top: 1px solid ${colors.borderPrimary}; padding-top: 8px;">
                <p style="margin: 0; font-size: 22px; font-weight: bold; color: ${colors.primary};">
                  ${totals.global.totalTTC.toFixed(2)} CHF
                </p>
                ${totals.mensuel.totalTTC > 0 ? `
                  <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: ${colors.accent};">
                    + ${totals.mensuel.totalTTC.toFixed(2)} CHF/mois
                  </p>
                ` : ''}
              </div>
            </div>
          `;
        }
      }
    }

    // Commentaire
    if (currentQuote.comment) {
      htmlContent += `
        <div class="comment-section">
          <h4 style="color: ${colors.primary};">Commentaires</h4>
          <div class="comment-box">
            <p style="margin: 0; white-space: pre-wrap;">${currentQuote.comment}</p>
          </div>
        </div>
      `;
    }

    // Pied de page - supprimé, seul le numéro de page sera affiché automatiquement
    htmlContent += ``;

    // Section signatures - optimisée
    htmlContent += `
      <div class="signatures-section">
        <div class="signature-box">
          <div class="signature-title">SIGNATURE DU VENDEUR</div>
          <div class="signature-content">
            ${settings.sellerInfo?.name ? `<div><strong>${settings.sellerInfo.name}</strong></div>` : ''}
            ${settings.sellerInfo?.title ? `<div>${settings.sellerInfo.title}</div>` : ''}
          </div>
          <div class="signature-line">
            ${new Date().toLocaleDateString('fr-CH')}${settings.sellerInfo?.location ? ` à ${settings.sellerInfo.location}` : ''}
          </div>
          ${settings.sellerInfo?.signature ? `
            <div style="margin: 10px 0;">
              <img src="${settings.sellerInfo.signature}" alt="Signature" style="max-height: 50px; object-fit: contain;" />
            </div>
          ` : ''}
        </div>
        
        <div class="signature-box">
          <div class="signature-title">SIGNATURE DU CLIENT</div>
          <div class="signature-content">
            <div>${currentQuote.addresses.contact.name}</div>
          </div>
          <div class="signature-line">
            <strong>Bon pour accord</strong><br>
            Date et lieu : _________________
          </div>
        </div>
      </div>
    `;

    htmlContent += `
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    try {
      // Ouvrir une nouvelle fenêtre avec le contenu HTML formaté
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        toast.success(`${settings.letterTemplate?.enabled ? 'Lettre de présentation et devis' : 'Devis'} généré avec succès ! Utilisez Ctrl+P ou Cmd+P pour sauvegarder en PDF.`);
      } else {
        toast.error('Impossible d\'ouvrir la fenêtre de génération PDF. Vérifiez que les popups ne sont pas bloquées.');
      }
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec infos devis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Récapitulatif du devis</span>
            </div>
            <div className="flex space-x-2">
              <PDFPreview />
              <Button onClick={generatePDF} className="bg-primary hover:bg-primary-hover">
                <FileDown className="h-4 w-4 mr-2" />
                Générer PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Informations générales</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{currentQuote.ref || 'Non définie'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{currentQuote.client || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(currentQuote.date).toLocaleDateString('fr-CH')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA</p>
                  <p className="font-medium">{settings.tvaPct}%</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Adresses</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Contact</p>
                  <p className="text-sm">{currentQuote.addresses.contact.company}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.name}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.street}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.postalCode} {currentQuote.addresses.contact.city}</p>
                  {currentQuote.addresses.contact.email && (
                    <p className="text-sm text-primary">{currentQuote.addresses.contact.email}</p>
                  )}
                  {currentQuote.addresses.contact.phone && (
                    <p className="text-sm">{currentQuote.addresses.contact.phone}</p>
                  )}
                </div>
                
                {currentQuote.addresses.useSeparateAddresses && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Facturation</p>
                      <p className="text-sm">{currentQuote.addresses.billing.company}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.name}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.street}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.postalCode} {currentQuote.addresses.billing.city}</p>
                      {currentQuote.addresses.billing.email && (
                        <p className="text-sm text-success">{currentQuote.addresses.billing.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Installation</p>
                      <p className="text-sm">{currentQuote.addresses.installation.company}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.name}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.street}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.postalCode} {currentQuote.addresses.installation.city}</p>
                      {currentQuote.addresses.installation.email && (
                        <p className="text-sm text-warning">{currentQuote.addresses.installation.email}</p>
                      )}
                    </div>
                  </>
                )}
                
                {!currentQuote.addresses.useSeparateAddresses && (
                  <Badge variant="outline" className="text-xs">
                    Même adresse pour facturation et installation
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes du devis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Détail des lignes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Référence</th>
                  <th className="text-left p-2">Mode</th>
                  <th className="text-left p-2">Qté</th>
                  <th className="text-left p-2">PU TTC</th>
                  <th className="text-left p-2">Remise</th>
                  <th className="text-left p-2">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <Badge variant="outline">{item.type}</Badge>
                    </td>
                    <td className="p-2">{item.reference}</td>
                    <td className="p-2">
                      <Badge variant={item.mode === 'mensuel' ? 'default' : 'secondary'}>
                        {item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                      </Badge>
                    </td>
                    <td className="p-2">{item.qty}</td>
                    <td className="p-2">{item.puTTC.toFixed(2)} CHF</td>
                    <td className="p-2">
                      {currentQuote.discountMode === 'per_line' 
                        ? `${item.lineDiscountPct}%` 
                        : 'Globale'
                      }
                    </td>
                    <td className="p-2 font-medium">{item.totalTTC.toFixed(2)} CHF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totaux séparés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achat unique */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-primary" />
              <span>Achat unique (one-shot)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.unique.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>Remise</span>
              <span className="font-medium text-success">-{totals.unique.discountHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>HT après remise</span>
              <span className="font-medium">{totals.unique.htAfterDiscount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({settings.tvaPct}%)</span>
              <span className="font-medium">{totals.unique.tva.toFixed(2)} CHF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total TTC (Unique)</span>
              <span className="text-primary">{totals.unique.totalTTC.toFixed(2)} CHF</span>
            </div>
          </CardContent>
        </Card>

        {/* Mensuel */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-success" />
              <span>Mensuel (abonnements)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>Remise</span>
              <span className="font-medium text-success">-{totals.mensuel.discountHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>HT après remise</span>
              <span className="font-medium">{totals.mensuel.htAfterDiscount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({settings.tvaPct}%)</span>
              <span className="font-medium">{totals.mensuel.tva.toFixed(2)} CHF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total TTC (Mensuel)</span>
              <span className="text-success">{totals.mensuel.totalTTC.toFixed(2)} CHF / mois</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total général */}
      <Card className="shadow-medium bg-gradient-card border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-xl">Total général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Sous-total HT global</p>
              <p className="text-lg font-semibold">{totals.global.subtotalHT.toFixed(2)} CHF</p>
            </div>
            {currentQuote.discountMode === 'global' && (
              <div>
                <p className="text-sm text-muted-foreground">Remise globale ({currentQuote.discountPct}%)</p>
                <p className="text-lg font-semibold text-success">-{totals.global.globalDiscountHT.toFixed(2)} CHF</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">HT après remise</p>
              <p className="text-lg font-semibold">{totals.global.htAfterDiscount.toFixed(2)} CHF</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">TVA totale ({settings.tvaPct}%)</p>
              <p className="text-xl font-semibold">{totals.global.tva.toFixed(2)} CHF</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total TTC global</p>
              <p className="text-2xl font-bold text-primary">{totals.global.totalTTC.toFixed(2)} CHF</p>
            </div>
          </div>
          
          {totals.mensuel.totalTTC > 0 && (
            <div className="text-center p-4 bg-success-light rounded-lg">
              <p className="text-sm text-success font-medium">
                + {totals.mensuel.totalTTC.toFixed(2)} CHF / mois récurrent
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commentaire */}
      {currentQuote.comment && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Commentaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {currentQuote.comment}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecapScreen;