import html2pdf from "html2pdf.js";
import type { Quote, Settings, QuoteItem } from '@/types';
import { PDFLayoutConfig, LayoutBlock, TableColumn, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { calculateQuoteTotals } from './calculations';

/**
 * Fonction unique de rendu PDF basée sur les layouts JSON
 * Source unique pour Preview ET Téléchargement 
 */
export const renderPDFFromLayout = (
  quote: Quote,
  settings: Settings,
  layout: PDFLayoutConfig
): string => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  
  // Contexte de données pour la liaison
  const dataContext = {
    // Données de base
    quoteRef: quote.ref,
    quoteDate: new Date(quote.date).toLocaleDateString('fr-CH'),
    client: quote.client,
    site: quote.site || '',
    contact: quote.contact || '',
    clientCivility: quote.clientCivility,
    
    // Items séparés par type
    items: {
      tech: quote.items.filter(item => item.kind === 'TECH'),
      agent: quote.items.filter(item => item.kind === 'AGENT'),
      all: quote.items
    },
    
    // Totaux calculés
    totals: {
      global: {
        ht: totals.global.htAfterDiscount,
        tva: totals.global.tva,
        ttc: totals.global.totalTTC
      }
    },
    
    // Métadonnées
    currentPage: 1,
    totalPages: 1,
    
    // Conditions d'évaluation
    hasTech: quote.items.some(i => i.kind === 'TECH'),
    hasAgents: quote.items.some(i => i.kind === 'AGENT'),
    isFirstPage: true,
    isLastPage: true,
    
    // Configuration utilisateur
    settings,
    
    // Signature
    signatureDate: new Date().toLocaleDateString('fr-CH'),
    signatureLocation: settings.sellerInfo?.location || 'Genève'
  };

  // Évaluer les conditions de visibilité
  const evaluateCondition = (condition: string): boolean => {
    try {
      // Simple évaluateur de conditions
      switch (condition) {
        case 'hasTech': return dataContext.hasTech;
        case 'hasAgents': return dataContext.hasAgents;
        case 'isFirstPage': return dataContext.isFirstPage;
        case 'isLastPage': return dataContext.isLastPage;
        default: return true;
      }
    } catch {
      return true;
    }
  };

  // Résoudre les liaisons de données
  const resolveBinding = (binding: string): string => {
    if (!binding.includes('{{')) return binding;
    
    return binding.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      try {
        const keys = key.split('.');
        let value: any = dataContext;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return match; // Retourner le placeholder si la clé n'existe pas
          }
        }
        
        if (typeof value === 'number') {
          return value.toFixed(2);
        }
        
        return String(value || '');
      } catch {
        return match;
      }
    });
  };

  // Rendu d'un bloc
  const renderBlock = (block: LayoutBlock): string => {
    if (!block.visible || (block.visibleIf && !evaluateCondition(block.visibleIf))) {
      return '';
    }

    // Styles CSS du bloc
    const style = [
      `position: absolute`,
      `top: ${block.y}mm`,
      `left: ${block.x}mm`,
      `width: ${block.width}mm`,
      `height: ${block.height}mm`,
      block.style ? Object.entries(block.style).map(([k, v]) => `${k}: ${v}`).join('; ') : ''
    ].filter(Boolean).join('; ');

    // Contenu selon le type
    let content = '';
    
    switch (block.type) {
      case 'text':
        content = resolveBinding(block.bindings?.text || block.content || '');
        break;
        
      case 'header':
        // Génération d'en-tête avec logo et infos vendeur
        content = `
          <div style="display: flex; justify-content: space-between; align-items: center; height: 100%;">
            <div>
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px;" />` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold;">${settings.sellerInfo?.name || ''}</div>
              <div style="font-size: 10pt;">${settings.sellerInfo?.email || ''}</div>
              <div style="font-size: 10pt;">${settings.sellerInfo?.phone || ''}</div>
            </div>
          </div>
        `;
        break;
        
      case 'table_tech':
      case 'table_agent':
        content = renderTable(block, dataContext);
        break;
        
      case 'totals':
        // Génération de totaux
        content = `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14pt;">
              <span>Total TTC:</span>
              <span>${totals.global.totalTTC.toFixed(2)} CHF</span>
            </div>
          </div>
        `;
        break;
        
      case 'signatures':
        content = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 100%;">
            <div style="border: 1px solid #ccc; padding: 8px; height: 100%;">
              <div style="font-weight: bold; margin-bottom: 10px;">${resolveBinding(block.bindings?.sellerTitle || 'Le vendeur')}</div>
              <div style="margin-top: auto; font-size: 8pt;">
                Nom et signature :
              </div>
            </div>
            <div style="border: 1px solid #ccc; padding: 8px; width: 45%; height: 100%;">
              <div style="font-weight: bold; margin-bottom: 10px;">${resolveBinding(block.bindings?.clientTitle || 'Le client')}</div>
              <div style="margin-top: auto; font-size: 8pt;">
                Nom et signature :
              </div>
            </div>
          </div>
        `;
        break;

      case 'description':
        content = Object.entries(block.bindings || {})
          .filter(([key, value]) => value && key !== 'text')
          .map(([key, value]) => `<div><strong>${key.charAt(0).toUpperCase() + key.slice(1)} :</strong> ${resolveBinding(value as string)}</div>`)
          .join('');
        break;

      default:
        content = block.content || '';
    }

    return `<div style="${style}">${content}</div>`;
  };

  // Générer le HTML d'un tableau
  const renderTable = (block: LayoutBlock, context: any): string => {
    if (!block.tableConfig) return '';

    const config = block.tableConfig;
    const dataset = config.dataset === 'items.tech' ? context.items.tech : context.items.agent;
    
    if (!dataset || dataset.length === 0) return '';

    // En-tête du tableau avec couleurs personnalisées
    const colors = context.settings.templateColors || {};
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: inherit; page-break-inside: auto;">
        <thead style="display: table-header-group;">
          <tr style="background-color: ${colors.tableHeader || '#f5f5f5'};">
    `;
    
    config.columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .forEach(col => {
        tableHTML += `<th style="border: 1px solid ${colors.tableBorder || '#ddd'}; padding: 8px; text-align: ${col.align}; width: ${col.width}${col.widthUnit}; color: ${colors.tableHeaderText || '#333'}; font-weight: bold;">${col.label}</th>`;
      });
    
    tableHTML += `</tr></thead><tbody>`;

    // Corps du tableau avec gestion des couleurs et pagination
    dataset.forEach((item: any, index: number) => {
      const rowBg = index % 2 === 0 ? (colors.tableRow || '#ffffff') : (colors.tableRowAlt || '#f8fafc');
      tableHTML += `<tr style="background-color: ${rowBg}; page-break-inside: avoid;">`;
      config.columns
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order)
        .forEach(col => {
          let value = item[col.binding] || '';
          
          // Formatage selon le type
          if (col.format === 'currency' && typeof value === 'number') {
            value = value.toFixed(2) + ' CHF';
          } else if (col.format === 'date' && value) {
            value = new Date(value).toLocaleDateString('fr-CH');
          } else if (col.format === 'hours' && typeof value === 'number') {
            value = value.toFixed(1) + 'h';
          }
          
          tableHTML += `<td style="border: 1px solid ${colors.tableBorder || '#ddd'}; padding: 8px; text-align: ${col.align}; color: ${colors.textColor || '#333'};">${value}</td>`;
        });
      tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
  };

  // Générer le HTML complet
  const blocksHTML = layout.blocks
    .filter(block => block.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(block => renderBlock(block))
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Devis ${quote.ref}</title>
        <style>
          @page { 
            size: A4; 
            margin: ${layout.page?.margins?.top || 10}mm ${layout.page?.margins?.right || 12}mm ${layout.page?.margins?.bottom || 10}mm ${layout.page?.margins?.left || 12}mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            color: #000; 
            position: relative;
            width: 210mm;
            min-height: 297mm;
          }
        </style>
      </head>
      <body>
        ${blocksHTML}
      </body>
    </html>
  `;
};

export const buildDomFromLayout = async (
  layoutId: string,
  quote: Quote,
  settings: Settings
): Promise<HTMLElement> => {
  const colors = settings.templateColors || {
    primary: '#fbbf24',
    secondary: '#64748b',
    accent: '#7c3aed',
    titleColor: '#1e293b',
    subtitleColor: '#475569',
    textColor: '#334155',
    mutedTextColor: '#64748b',
    background: '#ffffff',
    cardBackground: '#f8fafc',
    headerBackground: '#f1f5f9',
    tableHeader: '#f8fafc',
    tableHeaderText: '#334155',
    tableRow: '#ffffff',
    tableRowAlt: '#f8fafc',
    tableBorder: '#e2e8f0',
    badgeUnique: '#10b981',
    badgeMensuel: '#f59e0b',
    badgeAgent: '#8b5cf6',
    badgeText: '#ffffff',
    totalCardBorder: '#e2e8f0',
    totalUniqueBackground: '#f0fdf4',
    totalMensuelBackground: '#fef3c7',
    grandTotalBackground: '#f8fafc',
    grandTotalBorder: '#2563eb',
    borderPrimary: '#e2e8f0',
    borderSecondary: '#f1f5f9',
    separatorColor: '#e5e7eb',
    letterHeaderColor: '#1e293b',
    letterDateColor: '#64748b',
    letterSubjectColor: '#2563eb',
    letterSignatureColor: '#475569',
    signatureBoxBorder: '#d1d5db',
    signatureBoxBackground: '#f9fafb',
    signatureTitleColor: '#374151',
    signatureTextColor: '#6b7280'
  };

  const totals = calculateQuoteTotals(quote, settings.tvaPct);

  // Créer le conteneur principal
  const container = document.createElement('div');
  container.setAttribute('data-a4-root', 'true');

  // Injecter la feuille de styles PDF spécialisée
  const pdfStyleLink = document.createElement('link');
  pdfStyleLink.rel = 'stylesheet';
  pdfStyleLink.href = '/src/components/pdf/pdf-print.css';
  if (!document.head.querySelector(`link[href="${pdfStyleLink.href}"]`)) {
    document.head.appendChild(pdfStyleLink);
  }

  // Fonction pour générer l'en-tête commun
  const generateHeader = (subtitle: string) => `
    <div class="pdf-header" style="--header-accent: ${colors.primary};">
      <div class="pdf-header__logo">GPA</div>
      <div class="pdf-header__meta">
        <div>${quote.client || ''}</div>
        <div>${settings.sellerInfo?.name || ''}</div>
        <div>${subtitle}</div>
      </div>
    </div>
  `;

  // PAGE 1: LETTRE DE PRÉSENTATION (si activée)
  if (settings.letterTemplate?.enabled) {
    const letterPage = document.createElement('div');
    letterPage.className = 'pdf-container cover-page';
    letterPage.innerHTML = `
      ${generateHeader(`Le ${new Date(quote.date).toLocaleDateString('fr-CH')}`)}
      <div class="cover-content">
        <!-- Logo et informations vendeur -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <!-- Logo (gauche) -->
          <div style="flex: 0 0 auto; max-width: 40%;">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 80px; max-width: 100%; object-fit: contain;" />` : `<div style="color: ${colors.letterHeaderColor}; font-size: 18pt; font-weight: bold;">${settings.sellerInfo?.name || 'Votre Entreprise'}</div>`}
          </div>
          
          <!-- Informations vendeur (droite) -->
          <div style="flex: 0 0 auto; max-width: 55%; text-align: right;">
            <div style="font-weight: bold; font-size: 12pt; color: ${colors.letterHeaderColor}; margin-bottom: 4px;">${settings.sellerInfo?.name || ''}</div>
            <div style="font-size: 10pt; color: ${colors.textColor}; margin: 2px 0;">${settings.sellerInfo?.title || ''}</div>
            <div style="font-size: 10pt; color: ${colors.textColor}; margin: 2px 0;">${settings.sellerInfo?.email || ''}</div>
            <div style="font-size: 10pt; color: ${colors.textColor}; margin: 2px 0;">${settings.sellerInfo?.phone || ''}</div>
            <div style="font-size: 10pt; color: ${colors.letterDateColor}; margin-top: 8px;">Le ${new Date().toLocaleDateString('fr-CH')}</div>
          </div>
        </div>

        <!-- Adresse client -->
        <div style="margin: 40px 0; text-align: right;">
          <div style="font-weight: bold; font-size: 14pt; color: ${colors.titleColor}; margin-bottom: 8px;">${quote.addresses?.contact?.company || quote.client}</div>
          <div style="color: ${colors.textColor}; margin: 2px 0;">${quote.addresses?.contact?.name || ''}</div>
          <div style="color: ${colors.textColor}; margin: 2px 0;">${quote.addresses?.contact?.street || ''}</div>
          <div style="color: ${colors.textColor}; margin: 2px 0;">${quote.addresses?.contact?.postalCode || ''} ${quote.addresses?.contact?.city || ''}</div>
          <div style="color: ${colors.textColor}; margin: 2px 0;">${quote.addresses?.contact?.country || ''}</div>
        </div>

        <!-- Référence du devis -->
        <div style="margin: 30px 0; padding: 15px; background: ${colors.cardBackground}; border-radius: 8px; border-left: 4px solid ${colors.primary};">
          <div style="font-size: 12pt; font-weight: bold; color: ${colors.primary};">Devis N° ${quote.ref}</div>
          <div style="font-size: 10pt; color: ${colors.mutedTextColor}; margin-top: 4px;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</div>
        </div>

        <!-- Contenu de la lettre -->
        <div style="line-height: 1.7; font-size: 11pt;">
          <!-- Objet -->
          <div style="margin: 25px 0;">
            <div style="font-weight: ${settings.letterTemplate.boldOptions?.subject ? 'bold' : 'normal'}; color: ${colors.letterSubjectColor}; font-size: 12pt; margin-bottom: 8px;">
              ${settings.letterTemplate.subject}
            </div>
          </div>
          
          <!-- Civilité et ouverture -->
          <div style="margin: 20px 0;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.opening ? 'bold' : 'normal'}; margin: 8px 0;">
              ${settings.letterTemplate.civility} ${quote.client},
            </p>
            <p style="margin: 12px 0;">
              ${settings.letterTemplate.opening}
            </p>
          </div>
          
          <!-- Corps de la lettre -->
          <div style="margin: 20px 0;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.body ? 'bold' : 'normal'}; white-space: pre-wrap; line-height: 1.6;">
              ${settings.letterTemplate.body}
            </p>
          </div>
          
          <!-- Clôture -->
          <div style="margin: 20px 0;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.closing ? 'bold' : 'normal'};">
              ${settings.letterTemplate.closing}
            </p>
          </div>
        </div>
      </div>

      <!-- Signatures en bas de page présentation -->
      <div class="cover-signatures">
        <div class="signature-block">
          <h5>Le Vendeur</h5>
          <div class="signature-identity">${settings.sellerInfo?.name || ''}</div>
          <div class="signature-title">${settings.sellerInfo?.title || ''}</div>
          ${settings.sellerInfo?.signature ? `<img class="signature-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" />` : '<div class="signature-placeholder">Signature vendeur</div>'}
        </div>
        <div class="signature-block">
          <h5>Le Client</h5>
          <div class="signature-identity">${quote.client}</div>
          <div class="signature-title">${quote.clientCivility || ''}</div>
          ${quote.clientSignature ? `<img class="signature-image" src="${quote.clientSignature}" alt="Signature client" />` : '<div class="signature-placeholder">Signature client</div>'}
        </div>
      </div>
    </div>
  `;

    container.appendChild(letterPage);
  }

  // PAGES DEVIS avec en-tête répété et tableaux paginés
  const createQuotePage = (itemsToDisplay: QuoteItem[], pageTitle: string) => {
    const quotePage = document.createElement('div');
    quotePage.className = 'pdf-container force-new-page';
    
    const renderBadge = (mode: string, kind: string) => {
      if (kind === 'AGENT') return '<span class="badge badge--agent">Agent</span>';
      if (mode === 'unique') return '<span class="badge badge--unique">Unique</span>';
      if (mode === 'mensuel') return '<span class="badge badge--mensuel">Mensuel</span>';
      return '<span class="badge badge--muted">-</span>';
    };

    const tableHTML = itemsToDisplay.length > 0 ? `
      <table style="--table-header: ${colors.tableHeader}; --table-border: ${colors.tableBorder}; --table-header-text: ${colors.tableHeaderText}; --table-row: ${colors.tableRow}; --table-row-alt: ${colors.tableRowAlt}; --text-color: ${colors.textColor};">
        <thead>
          <tr>
            <th style="width: 15%;">Type</th>
            <th style="width: 25%;">Référence</th>
            <th style="width: 12%;">Mode</th>
            <th style="width: 10%;">Qté</th>
            <th style="width: 15%;">Prix unit.</th>
            <th style="width: 15%;">Total HT</th>
            <th style="width: 8%;">Rem.</th>
          </tr>
        </thead>
        <tbody>
          ${itemsToDisplay.map(item => `
            <tr>
              <td>${item.type || ''}</td>
              <td>${item.reference || ''}</td>
              <td>${renderBadge(item.mode, item.kind)}</td>
              <td style="text-align: center;">${item.qty || 0}</td>
              <td style="text-align: right;">${(item.puHT || 0).toFixed(2)} CHF</td>
              <td style="text-align: right;">${(item.totalHT_net || 0).toFixed(2)} CHF</td>
              <td style="text-align: center;">${item.lineDiscountPct ? `${item.lineDiscountPct}%` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p class="text-center" style="margin: 40px 0; color: #6b7280;">Aucun élément à afficher</p>';

    quotePage.innerHTML = `
      ${generateHeader(`Devis N° ${quote.ref} — ${pageTitle}`)}
      <div class="page-content">
        <h2 style="margin: 8mm 0 4mm 0; font-size: 14px; font-weight: 700; color: ${colors.titleColor};">${pageTitle}</h2>
        ${tableHTML}
      </div>
    `;

    return quotePage;
  };

  // Créer les pages de devis selon les types d'items
  const techItems = quote.items.filter(item => item.kind === 'TECH');
  const agentItems = quote.items.filter(item => item.kind === 'AGENT');

  if (techItems.length > 0) {
    container.appendChild(createQuotePage(techItems, 'Prestations Techniques'));
  }

  if (agentItems.length > 0) {
    container.appendChild(createQuotePage(agentItems, 'Prestations d\'Agent'));
  }

  // PAGE FINALE: TOTAUX ET SIGNATURES
  const finalPage = document.createElement('div');
  finalPage.className = 'pdf-container force-new-page';
  
  // Calcul des totaux par catégorie
  const techTotal = techItems.reduce((sum, item) => sum + (item.totalTTC || 0), 0);
  const agentTotal = agentItems.reduce((sum, item) => sum + (item.totalTTC || 0), 0);
  const grandTotal = totals.global.totalTTC;

  finalPage.innerHTML = `
    ${generateHeader(`Devis N° ${quote.ref} — Récapitulatif`)}
    <div class="page-content">
      <div class="totals-section" style="--primary-color: ${colors.primary};">
        <h2 style="margin: 8mm 0 6mm 0; font-size: 16px; font-weight: 800; color: ${colors.titleColor}; text-align: center;">RÉCAPITULATIF DES TOTAUX</h2>
        
        <div class="totals-row">
          ${techTotal > 0 ? `
            <div class="total-card">
              <div class="total-card__title">Technique</div>
              <div class="total-card__amount">${techTotal.toFixed(2)} CHF</div>
            </div>
          ` : ''}
          ${agentTotal > 0 ? `
            <div class="total-card">
              <div class="total-card__title">Agent</div>
              <div class="total-card__amount">${agentTotal.toFixed(2)} CHF</div>
            </div>
          ` : ''}
        </div>
        
        <div class="grand-total">
          TOTAL GÉNÉRAL TTC : ${grandTotal.toFixed(2)} CHF
        </div>
        
        ${settings.pdfSettings?.importantRemark ? `
          <div class="important-remark">
            ${settings.pdfSettings.importantRemark}
          </div>
        ` : ''}
      </div>

      <!-- Signatures finales -->
      <div class="cover-signatures" style="margin-top: 15mm;">
        <div class="signature-block">
          <h5>Le Vendeur</h5>
          <div class="signature-identity">${settings.sellerInfo?.name || ''}</div>
          <div class="signature-title">${settings.sellerInfo?.title || ''}</div>
          ${settings.sellerInfo?.signature ? `<img class="signature-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" />` : '<div class="signature-placeholder">Signature vendeur</div>'}
        </div>
        <div class="signature-block">
          <h5>Le Client</h5>
          <div class="signature-identity">${quote.client}</div>
          <div class="signature-title">${quote.clientCivility || ''}</div>
          ${quote.clientSignature ? `<img class="signature-image" src="${quote.clientSignature}" alt="Signature client" />` : '<div class="signature-placeholder">Signature client</div>'}
        </div>
      </div>
    </div>
  `;

  container.appendChild(finalPage);

  return container;
};

export async function exportDomToPdf(dom: HTMLElement, filename: string): Promise<Blob> {
  const opt = {
    margin: [10, 12, 10, 12], // marges sécurisées pour impression
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    const pdf = await html2pdf().set(opt).from(dom).outputPdf('blob');
    return pdf;
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error('Impossible de générer le PDF. Vérifiez le contenu et réessayez.');
  }
}