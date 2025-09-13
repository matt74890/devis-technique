import html2pdf from "html2pdf.js";
import type { Quote, Settings } from '@/types';
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
              <div style="font-weight: bold; margin-bottom: 10px;">${resolveBinding(block.bindings.clientTitle || 'Le client')}</div>
              <div style="margin-top: auto; font-size: 8pt;">
                Nom et signature :
              </div>
            </div>
          </div>
        `;
        break;

      case 'description':
        content = Object.entries(block.bindings)
          .filter(([key, value]) => value && key !== 'text')
          .map(([key, value]) => `<div><strong>${key.charAt(0).toUpperCase() + key.slice(1)} :</strong> ${resolveBinding(value)}</div>`)
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
            margin: ${layout.page.margins.top}mm ${layout.page.margins.right}mm ${layout.page.margins.bottom}mm ${layout.page.margins.left}mm;
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
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#7c3aed',
    titleColor: '#1e293b',
    subtitleColor: '#475569',
    textColor: '#334155',
    mutedTextColor: '#64748b',
    background: '#ffffff',
    cardBackground: '#f8fafc',
    headerBackground: '#f1f5f9',
    tableHeader: '#e2e8f0',
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

  // CSS GLOBAL A4 selon spécifications exactes
  const style = document.createElement("style");
  style.textContent = `
    /* Mise en page A4 stricte avec marges imprimables */
    @page {
      size: A4;
      margin: 15mm;
    }
    [data-a4-root] { 
      max-width: 180mm; 
      margin: 0 auto; 
      background: ${colors.background || '#ffffff'};
      color: ${colors.textColor || '#333'};
    }
    .intro-page { 
      page-break-after: always !important; 
      min-height: 267mm !important;
      max-height: 267mm !important;
      overflow: hidden !important;
    } /* Présentation = 1 page */

    /* Badges : centrage vertical/ horizontal garanti */
    .badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 4px 12px !important;
      line-height: 1.2 !important;
      vertical-align: middle !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      min-height: 24px !important;
      font-weight: 600 !important;
      text-align: center !important;
      box-sizing: border-box !important;
      white-space: nowrap !important;
    }
    .badge--agent { background: ${colors.badgeAgent || '#8b5cf6'} !important; color: ${colors.badgeText || '#ffffff'} !important; }
    .badge--unique { background: ${colors.badgeUnique || '#10b981'} !important; color: ${colors.badgeText || '#ffffff'} !important; }
    .badge--mensuel { background: ${colors.badgeMensuel || '#f59e0b'} !important; color: ${colors.badgeText || '#ffffff'} !important; }

    /* Signatures : image/canvas bien visibles sous les noms/titres */
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; page-break-inside: avoid; }
    .signature-block { margin-top: 8mm; }
    .signature-name { font-weight: 600; }
    .signature-title { color: #6b7280; font-size: 12px; }
    .signature-image { margin-top: 6mm; max-height: 28mm; max-width: 80mm; }

    /* Tableaux multi-pages stables */
    table { 
      border-collapse: collapse; 
      width: 100%; 
      page-break-inside: auto;
      margin: 10px 0;
      border: 1px solid ${colors.tableBorder || '#e5e7eb'};
    }
    thead { 
      display: table-header-group;
      background: ${colors.tableHeader || '#f8fafc'} !important;
    }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; }
    td, th { 
      page-break-inside: avoid;
      padding: 8px 10px;
      border: 1px solid ${colors.tableBorder || '#e5e7eb'};
      vertical-align: middle;
    }
    tbody tr { page-break-inside: avoid; page-break-after: auto; }
    tbody tr:nth-child(even) { background: ${colors.tableRowAlt || '#f8fafc'}; }
    tbody tr:nth-child(odd) { background: ${colors.tableRow || '#ffffff'}; }
    .no-break { page-break-inside: avoid; }

    /* Cadres de résumé/signatures non coupés */
    .box, .recap, .signatures, .totals-section { page-break-inside: avoid; }
    
    /* Styles spécifiques pour les cellules de tableau */
    .cell { 
      padding: 8px 10px; 
      border: 1px solid ${colors.tableBorder || '#e5e7eb'}; 
      vertical-align: middle; 
      color: ${colors.textColor || '#333'};
    }
    .th { 
      background: ${colors.tableHeader || '#f8fafc'} !important; 
      font-weight: 700; 
      color: ${colors.tableHeaderText || '#333'} !important; 
    }
    
    /* Conteneurs de totaux centrés */
    .totals-container { 
      display: flex; 
      justify-content: center; 
      gap: 20px; 
      flex-wrap: wrap; 
      margin: 30px 0; 
      page-break-inside: avoid;
    }
    .total-box { 
      background: ${colors.cardBackground || '#f8fafc'}; 
      padding: 15px; 
      border-radius: 8px; 
      border: 2px solid ${colors.primary || '#2563eb'}; 
      min-width: 250px; 
      text-align: center; 
      page-break-inside: avoid;
    }
  `;
  container.prepend(style);

  // PAGE 1: LETTRE DE PRÉSENTATION (si activée)
  if (settings.letterTemplate?.enabled) {
    const letterPage = document.createElement('div');
    letterPage.className = 'intro-page a4';
    letterPage.innerHTML = `
      <div class="content">
        <!-- En-tête avec logo et vendeur -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid ${colors.primary};">
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

        <!-- Signatures en bas de page -->
        <div class="signatures">
          <div class="signature-block">
            <div>Le Vendeur</div>
            <div class="signature-name">${settings.sellerInfo?.name || ''}</div>
            <div class="signature-title">${settings.sellerInfo?.title || ''}</div>
            ${settings.sellerInfo?.signature ? `<img class="signature-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" />` : ''}
          </div>
          <div class="signature-block">
            <div>Le Client</div>
            <div class="signature-name">${quote.client}</div>
            <div class="signature-title">${quote.clientCivility || ''}</div>
            <div class="signature-image" style="border: 1px dashed #ccc; min-height: 28mm; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic;">Signature client</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(letterPage);
  }

  // PAGE 2+: DEVIS
  const quotePage = document.createElement('div');
  quotePage.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    font-family: Arial, sans-serif;
    background: ${colors.background};
    color: ${colors.textColor};
    box-sizing: border-box;
  `;

  quotePage.innerHTML = `
    <!-- En-tête du devis -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid ${colors.borderSecondary};">
      <!-- Logo et vendeur (gauche) -->
      <div style="flex: 0 0 auto; max-width: 50%;">
        ${settings.logoUrl ? `
          <div style="margin-bottom: 15px;">
            <img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px; max-width: 100%; object-fit: contain;" />
          </div>
        ` : ''}
        <div>
          <p style="font-weight: bold; font-size: 12pt; margin: 2px 0; color: ${colors.letterHeaderColor};">${settings.sellerInfo?.name || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor}; font-size: 10pt;">${settings.sellerInfo?.title || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor}; font-size: 10pt;">${settings.sellerInfo?.email || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor}; font-size: 10pt;">${settings.sellerInfo?.phone || ''}</p>
          <p style="font-size: 10pt; color: ${colors.letterDateColor}; margin-top: 8px;">Le ${new Date().toLocaleDateString('fr-CH')}</p>
        </div>
      </div>
      
      <!-- Adresse client (droite) -->
      <div style="flex: 1; max-width: 45%; text-align: right;">
        <div>
          <p style="font-weight: bold; font-size: 14pt; margin: 4px 0; color: ${colors.titleColor};">${quote.addresses?.contact?.company || quote.client}</p>
          <p style="margin: 2px 0; color: ${colors.textColor};">${quote.addresses?.contact?.name || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor};">${quote.addresses?.contact?.street || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor};">${quote.addresses?.contact?.postalCode || ''} ${quote.addresses?.contact?.city || ''}</p>
          <p style="margin: 2px 0; color: ${colors.textColor};">${quote.addresses?.contact?.country || ''}</p>
          ${quote.addresses?.contact?.email ? `<p style="font-size: 10pt; color: ${colors.mutedTextColor}; margin: 2px 0;">${quote.addresses.contact.email}</p>` : ''}
          ${quote.addresses?.contact?.phone ? `<p style="font-size: 10pt; margin: 2px 0; color: ${colors.textColor};">${quote.addresses.contact.phone}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Titre du devis -->
    <div style="text-align: center; padding: 20px 0; border-top: 3px solid ${colors.primary}; border-bottom: 1px solid ${colors.borderSecondary}; margin-bottom: 20px;">
      <h1 style="font-size: 24pt; font-weight: bold; color: ${colors.titleColor}; margin: 0 0 8px 0;">
        ${(() => {
          const hasTech = quote.items.some(item => item.kind === 'TECH');
          const hasAgent = quote.items.some(item => item.kind === 'AGENT');
          if (hasTech && hasAgent) return 'DEVIS TECHNIQUE & AGENT';
          if (hasAgent) return 'DEVIS AGENT';
          return 'DEVIS TECHNIQUE';
        })()}
      </h1>
      <p style="font-size: 14pt; margin: 4px 0; color: ${colors.subtitleColor};">Devis N° ${quote.ref}</p>
      <p style="color: ${colors.letterDateColor || colors.mutedTextColor}; margin: 4px 0;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</p>
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
        <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">
          <thead>
            <tr style="background: ${colors.tableHeader || '#f8fafc'}; color: ${colors.tableHeaderText || '#334155'};">
              <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">Type</th>
              <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">Référence</th>
              <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">Mode</th>
              <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">Qté</th>
              <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">PU TTC</th>
              <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.filter(item => item.kind === 'TECH').map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? (colors.tableRow || '#ffffff') : (colors.tableRowAlt || '#f8fafc')}; page-break-inside: avoid;">
                <td style="padding: 6px; border: 1px solid ${colors.tableBorder || '#e2e8f0'}; color: ${colors.textColor || '#334155'};">${item.type}</td>
                <td style="padding: 6px; border: 1px solid ${colors.tableBorder || '#e2e8f0'}; color: ${colors.textColor || '#334155'};">${item.reference}</td>
                <td style="padding: 6px; text-align: center; border: 1px solid ${colors.tableBorder || '#e2e8f0'};">
                  <span class="badge badge--${item.mode === 'mensuel' ? 'mensuel' : 'unique'}">
                    ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                  </span>
                </td>
                <td style="padding: 6px; text-align: center; border: 1px solid ${colors.tableBorder || '#e2e8f0'}; color: ${colors.textColor || '#334155'};">${item.qty || 1}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.tableBorder || '#e2e8f0'}; color: ${colors.textColor || '#334155'};">${(item.puTTC || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.tableBorder || '#e2e8f0'}; color: ${colors.textColor || '#334155'};">${(item.totalTTC || 0).toFixed(2)} CHF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${quote.items.some(item => item.kind === 'AGENT') ? `
      <!-- Services AGENT -->
      <div style="margin: 20px 0;">
        <h2 style="text-align:center; margin: 8mm 0 4mm 0;">Devis Agent</h2>
        <div style="text-align:center; color:#6b7280; margin-bottom:8mm;">
          Devis N° ${quote.ref} — Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}
        </div>
        <table class="table-agent">
          <thead>
            <tr>
              <th class="cell th">Description</th>
              <th class="cell th">Type</th>
              <th class="cell th">Date début</th>
              <th class="cell th">Heure début</th>
              <th class="cell th">Date fin</th>
              <th class="cell th">Heure fin</th>
              <th class="cell th">Heures normales</th>
              <th class="cell th">Heures majorées</th>
              <th class="cell th">Tarif/h</th>
              <th class="cell th">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.filter(item => item.kind === 'AGENT').map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? (colors.tableRowAlt || '#f8fafc') : (colors.tableRow || '#ffffff')}; page-break-inside: avoid;">
                <td class="cell" style="color: ${colors.textColor || '#334155'};">
                  <div style="font-weight: bold;">${item.reference}</div>
                  <span class="badge badge--agent">Agent</span>
                </td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${item.agentType || item.type}</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-'}</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${item.timeStart || '-'}</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-'}</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${item.timeEnd || '-'}</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${(item.hoursNormal || 0).toFixed(2)} h</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${((item.hoursNight || 0) + (item.hoursSunday || 0) + (item.hoursHoliday || 0)).toFixed(2)} h</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${(item.rateCHFh || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                <td class="cell" style="color: ${colors.textColor || '#334155'};">${(item.lineTTC || item.totalTTC || 0).toFixed(2)} CHF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Totaux séparés par catégorie -->
    <div class="totals-section">
      ${totals.unique.subtotalHT > 0 ? `
        <div class="totals-container">
          <div class="total-box">
            <h4 style="color: ${colors.primary}; margin: 0 0 10px 0; font-size: 12pt;">TECHNIQUE UNIQUE</h4>
            <div style="text-align: left; font-size: 10pt;">
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.unique.subtotalHT.toFixed(2)} CHF</span>
              </div>
              ${totals.unique.discountHT > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Remise:</span>
                  <span>-${totals.unique.discountHT.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Net HT:</span>
                  <span>${totals.unique.htAfterDiscount.toFixed(2)} CHF</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.unique.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid ${colors.borderSecondary}; padding-top: 5px; margin-top: 5px; color: ${colors.primary};">
                <span>Total TTC:</span>
                <span>${totals.unique.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${totals.mensuel.subtotalHT > 0 ? `
        <div class="totals-container">
          <div class="total-box">
            <h4 style="color: ${colors.primary}; margin: 0 0 10px 0; font-size: 12pt;">TECHNIQUE MENSUEL</h4>
            <div style="text-align: left; font-size: 10pt;">
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
              </div>
              ${totals.mensuel.discountHT > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Remise:</span>
                  <span>-${totals.mensuel.discountHT.toFixed(2)} CHF</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Net HT:</span>
                  <span>${totals.mensuel.htAfterDiscount.toFixed(2)} CHF</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.mensuel.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid ${colors.borderSecondary}; padding-top: 5px; margin-top: 5px; color: ${colors.primary};">
                <span>Total TTC:</span>
                <span>${totals.mensuel.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${totals.agents.subtotalHT > 0 ? `
        <div class="totals-container">
          <div class="total-box">
            <h4 style="color: ${colors.primary}; margin: 0 0 10px 0; font-size: 12pt;">AGENT</h4>
            <div style="text-align: left; font-size: 10pt;">
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.agents.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.agents.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid ${colors.borderSecondary}; padding-top: 5px; margin-top: 5px; color: ${colors.primary};">
                <span>Total TTC:</span>
                <span>${totals.agents.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Total général -->
      <div class="totals-container" style="margin-top: 20px;">
        <div class="total-box" style="border: 3px solid ${colors.primary}; background: ${colors.grandTotalBackground};">
          <h3 style="color: ${colors.primary}; margin: 0; font-size: 14pt;">TOTAL GÉNÉRAL</h3>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16pt; color: ${colors.primary}; margin-top: 10px;">
            <span>TOTAL TTC:</span>
            <span>${totals.global.totalTTC.toFixed(2)} CHF</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 40px; page-break-inside: avoid;">
      <h3 style="color: ${colors.primary}; margin-bottom: 20px; text-align: center;">Signatures</h3>
      <div class="signatures">
        <div class="signature-block">
          <div>Le Vendeur</div>
          <div class="signature-name">${settings.sellerInfo?.name || ''}</div>
          <div class="signature-title">${settings.sellerInfo?.title || ''}</div>
          ${settings.sellerInfo?.signature ? `<img class="signature-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" />` : ''}
        </div>
        <div class="signature-block">
          <div>Le Client</div>
          <div class="signature-name">${quote.client}</div>
          <div class="signature-title">${quote.clientCivility || ''}</div>
          <div class="signature-image" style="border: 1px dashed #ccc; min-height: 28mm; display: flex; align-items: center; justify-content: center; color: #999; font-style: italic;">Signature client</div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(quotePage);

  return container;
};

export async function exportDomToPdf(dom: HTMLElement, filename: string): Promise<Blob> {
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };

  try {
    const pdf = await html2pdf().set(opt).from(dom).outputPdf('blob');
    return pdf;
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
}