import html2pdf from "html2pdf.js";
import type { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutBlock, TableColumn, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { calculateQuoteTotals } from './calculations';

/**
 * Fonction PRINCIPALE de rendu PDF optimisée selon les spécifications utilisateur
 * Page présentation 1/1, badges centrés, multi-pages avec en-têtes, totaux alignés, remarque paramétrable
 */
export const renderPDFFromLayout = (
  quote: Quote,
  settings: Settings,
  layout: PDFLayoutConfig
): string => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  
  // Injecter la feuille de styles PDF dédiée
  const cssLink = `<link rel="stylesheet" href="/src/components/pdf/pdf-print.css" />`;
  
  // Helper de formatage monétaire
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} CHF`;
  
  // Helper de formatage de date
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-CH');
  
  // En-tête PDF réutilisable pour toutes les pages
  const renderHeader = (pageTitle: string) => `
    <div class="pdf-header">
      <div class="pdf-header__logo">GPA</div>
      <div class="pdf-header__meta">
        <div>${quote.client || ''}</div>
        <div>${settings?.sellerInfo?.name || ''}</div>
        <div>${pageTitle}</div>
      </div>
    </div>
  `;
  
  // Bloc signature réutilisable
  const renderSignatureBlock = (title: string, name: string, titleText: string, signatureUrl?: string) => `
    <div class="sig-block">
      <h5>${title}</h5>
      <div class="identity">${name}</div>
      <div class="title">${titleText}</div>
      ${signatureUrl ? 
        `<img class="sig-image" src="${signatureUrl}" alt="Signature" />` : 
        `<div class="sig-pad">Signature</div>`
      }
    </div>
  `;
  
  // Rendu des badges parfaitement centrés
  const renderBadge = (type: 'unique' | 'mensuel' | 'agent', text: string) => 
    `<span class="badge badge--${type}">${text}</span>`;
  
  // Rendu d'un tableau avec badges centrés et pagination
  const renderTable = (items: any[], title: string, variant: string) => {
    if (!items || items.length === 0) return '';
    
    let tableHTML = `
      <table class="avoid-break">
        <thead>
          <tr>
            <th style="width: 15%;">Type</th>
            <th style="width: 25%;">Référence</th>
            <th style="width: 15%;">Mode</th>
            <th style="width: 15%;">Quantité</th>
            <th style="width: 15%;">Prix unit.</th>
            <th style="width: 15%;">Total HT</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    items.forEach((item) => {
      const badgeType = item.mode === 'unique' ? 'unique' : 
                       item.mode === 'mensuel' ? 'mensuel' : 'agent';
      const badgeText = item.mode === 'unique' ? 'Unique' : 
                       item.mode === 'mensuel' ? 'Mensuel' : 'Agent';
      
      tableHTML += `
        <tr>
          <td>${item.type || ''}</td>
          <td>${item.reference || ''}</td>
          <td>${renderBadge(badgeType as any, badgeText)}</td>
          <td>${item.qty || ''}</td>
          <td>${item.puHT ? formatCurrency(item.puHT) : ''}</td>
          <td>${item.totalHT_net ? formatCurrency(item.totalHT_net) : ''}</td>
        </tr>
      `;
    });
    
    tableHTML += `</tbody></table>`;
    return tableHTML;
  };
  
  // Rendu des sous-totaux alignés sur une ligne
  const renderSubTotals = () => {
    const hasTech = quote.items.some(item => item.kind === 'TECH');
    const hasAgents = quote.items.some(item => item.kind === 'AGENT');
    
    if (!hasTech && !hasAgents) return '';
    
    let totalsHTML = '<div class="totals-row">';
    
    if (hasTech) {
      const uniqueItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'unique');
      const mensuelItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'mensuel');
      
      if (uniqueItems.length > 0) {
        totalsHTML += `
          <div class="totals-card">
            <h4>Technique Unique</h4>
            <div class="line">
              <span>Sous-total HT:</span>
              <span>${formatCurrency(totals.unique.subtotalHT)}</span>
            </div>
            <div class="line">
              <span>TVA (${settings.tvaPct}%):</span>
              <span>${formatCurrency(totals.unique.tva)}</span>
            </div>
            <div class="line">
              <strong>Total TTC:</strong>
              <strong>${formatCurrency(totals.unique.totalTTC)}</strong>
            </div>
          </div>
        `;
      }
      
      if (mensuelItems.length > 0) {
        totalsHTML += `
          <div class="totals-card">
            <h4>Technique Mensuel</h4>
            <div class="line">
              <span>Sous-total HT:</span>
              <span>${formatCurrency(totals.mensuel.subtotalHT)}</span>
            </div>
            <div class="line">
              <span>TVA (${settings.tvaPct}%):</span>
              <span>${formatCurrency(totals.mensuel.tva)}</span>
            </div>
            <div class="line">
              <strong>Total TTC:</strong>
              <strong>${formatCurrency(totals.mensuel.totalTTC)}</strong>
            </div>
          </div>
        `;
      }
    }
    
    if (hasAgents) {
      totalsHTML += `
        <div class="totals-card">
          <h4>Agents Sécurité</h4>
          <div class="line">
            <span>Sous-total HT:</span>
            <span>${formatCurrency(totals.agents.subtotalHT)}</span>
          </div>
          <div class="line">
            <span>TVA (${settings.tvaPct}%):</span>
            <span>${formatCurrency(totals.agents.tva)}</span>
          </div>
          <div class="line">
            <strong>Total TTC:</strong>
            <strong>${formatCurrency(totals.agents.totalTTC)}</strong>
          </div>
        </div>
      `;
    }
    
    totalsHTML += '</div>';
    return totalsHTML;
  };
  
  // PAGE 1: PRÉSENTATION avec signature vendeur (1/1 stricte)
  const coverPageHTML = `
    <div class="pdf-a4 cover-page">
      ${renderHeader(`Le ${formatDate(quote.date)}`)}
      
      <div class="cover-body page-content">
        ${settings.letterTemplate?.enabled ? renderLetterContent() : renderSimpleCoverContent()}
      </div>
      
      <div class="cover-signatures keep-together">
        ${renderSignatureBlock(
          "Le Vendeur",
          settings?.sellerInfo?.name || '',
          settings?.sellerInfo?.title || '',
          settings?.sellerInfo?.signature
        )}
        ${renderSignatureBlock(
          "Le Client",
          quote.client || '',
          quote.clientCivility || 'Monsieur',
          undefined
        )}
      </div>
    </div>
    <div class="force-break"></div>
  `;
  
  // Contenu de la lettre ou présentation simple
  function renderLetterContent() {
    if (!settings.letterTemplate?.enabled) return renderSimpleCoverContent();
    
    const template = settings.letterTemplate;
    return `
      <div style="margin: 20mm 0;">
        <div style="text-align: right; margin-bottom: 15mm;">
          <div>Genève, le ${formatDate(quote.date)}</div>
        </div>
        
        <div style="margin-bottom: 15mm;">
          <div><strong>À l'attention de :</strong></div>
          <div>${template.civility} ${quote.client}</div>
          <div>${template.companyName}</div>
        </div>
        
        <div style="margin-bottom: 10mm;">
          <div style="font-weight: ${template.boldOptions.subject ? 'bold' : 'normal'}; text-align: ${template.textAlignment};">
            <strong>Objet :</strong> ${template.subject}
          </div>
        </div>
        
        <div style="text-align: ${template.textAlignment}; line-height: 1.6; margin-bottom: 8mm;">
          <p style="font-weight: ${template.boldOptions.opening ? 'bold' : 'normal'};">
            ${template.civility},
          </p>
          <p style="font-weight: ${template.boldOptions.opening ? 'bold' : 'normal'};">
            ${template.opening}
          </p>
          <p style="font-weight: ${template.boldOptions.body ? 'bold' : 'normal'};">
            ${template.body}
          </p>
          <p style="font-weight: ${template.boldOptions.closing ? 'bold' : 'normal'};">
            ${template.closing}
          </p>
        </div>
      </div>
    `;
  }
  
  function renderSimpleCoverContent() {
    return `
      <div style="margin: 30mm 0; text-align: center;">
        <h1 style="font-size: 24pt; color: #FFD400; margin-bottom: 20mm;">DEVIS TECHNIQUE</h1>
        <div style="font-size: 14pt; line-height: 2;">
          <div><strong>Client :</strong> ${quote.client}</div>
          <div><strong>Site :</strong> ${quote.site}</div>
          <div><strong>Contact :</strong> ${quote.contact}</div>
          <div><strong>Date :</strong> ${formatDate(quote.date)}</div>
          <div><strong>Référence :</strong> ${quote.ref}</div>
        </div>
      </div>
    `;
  }
  
  // PAGES DE DEVIS avec en-têtes répétés
  const techItems = quote.items.filter(item => item.kind === 'TECH');
  const agentItems = quote.items.filter(item => item.kind === 'AGENT');
  
  let devisHTML = '';
  
  if (techItems.length > 0) {
    devisHTML += `
      <div class="pdf-a4">
        ${renderHeader(`Devis N° ${quote.ref} — Technique`)}
        <div class="page-content">
          <h2>Prestations Techniques</h2>
          ${renderTable(techItems, 'Technique', 'technique')}
        </div>
      </div>
      <div class="force-break"></div>
    `;
  }
  
  if (agentItems.length > 0) {
    devisHTML += `
      <div class="pdf-a4">
        ${renderHeader(`Devis N° ${quote.ref} — Agents`)}
        <div class="page-content">
          <h2>Prestations Agents</h2>
          ${renderTable(agentItems, 'Agents', 'agent')}
        </div>
      </div>
      <div class="force-break"></div>
    `;
  }
  
  // PAGE TOTAUX ET SIGNATURES (même page garantie)
  const totalsHTML = `
    <div class="pdf-a4">
      ${renderHeader(`Devis N° ${quote.ref} — Totaux`)}
      <div class="page-content">
        <div class="totals-section keep-together">
          ${renderSubTotals()}
          
          <div class="grand-total keep-together">
            TOTAL GÉNÉRAL TTC : ${formatCurrency(totals.global.totalTTC)}
          </div>
          
          ${(settings?.pdfSettings?.importantRemark ?? '').trim() ? 
            `<div class="final-remark">${settings.pdfSettings.importantRemark}</div>` : 
            ''
          }
        </div>
        
        <div class="final-block keep-together">
          <div class="cover-signatures">
            ${renderSignatureBlock(
              "Le Vendeur",
              settings?.sellerInfo?.name || '',
              settings?.sellerInfo?.title || '',
              settings?.sellerInfo?.signature
            )}
            ${renderSignatureBlock(
              "Le Client", 
              quote.client || '',
              quote.clientCivility || 'Monsieur',
              quote.clientSignature ? `data:image/png;base64,${quote.clientSignature}` : undefined
            )}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // ASSEMBLAGE FINAL
  const fullHTML = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Devis ${quote.ref}</title>
        ${cssLink}
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            color: #111827;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div id="pdf-root">
          ${coverPageHTML}
          ${devisHTML}
          ${totalsHTML}
        </div>
      </body>
    </html>
  `;
  
  return fullHTML;
};

// Export vers PDF avec optimisations
export const exportToPDF = async (quote: Quote, settings: Settings, layout: PDFLayoutConfig) => {
  try {
    const htmlContent = renderPDFFromLayout(quote, settings, layout);
    
    // Créer temporairement l'élément dans le DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    const opt = {
      margin: [12, 10, 12, 10], // marges sécurisées
      filename: `devis_${quote.ref}_${new Date(quote.date).toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { 
        mode: ['css', 'legacy'],
        before: '.force-break',
        avoid: ['.avoid-break', '.keep-together', '.keep-with-next']
      }
    };
    
    await html2pdf().set(opt).from(tempDiv.querySelector('#pdf-root')!).save();
    
    // Nettoyer
    document.body.removeChild(tempDiv);
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
};

// Legacy function for compatibility
export const buildDomFromLayout = async (
  layoutId: string,
  quote: Quote,
  settings: Settings
): Promise<HTMLElement> => {
  // Simuler un layout simple pour compatibilité
  const simpleLayout: PDFLayoutConfig = {
    id: layoutId,
    name: 'Layout par défaut',
    variant: 'technique' as LayoutVariant,
    blocks: [],
    visibilityRules: {},
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 12, right: 10, bottom: 12, left: 10 },
      grid: 10,
      unit: 'mm'
    },
    metadata: {
      description: 'Layout par défaut',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true
    }
  };
  
  const htmlContent = renderPDFFromLayout(quote, settings, simpleLayout);
  
  // Créer un élément DOM à partir du HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const container = doc.querySelector('#pdf-root') || doc.body;
  
  // Créer un nouvel élément avec l'attribut attendu
  const element = document.createElement('div');
  element.setAttribute('data-a4-root', 'true');
  element.innerHTML = container.innerHTML;
  
  return element;
};