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

  // Générer le HTML d'un bloc
  const renderBlock = (block: LayoutBlock): string => {
    // Vérifier la visibilité
    if (!block.visible || (block.visibleIf && !evaluateCondition(block.visibleIf))) {
      return '';
    }

    const style = `
      position: absolute;
      left: ${block.x}mm;
      top: ${block.y}mm;
      width: ${block.width}mm;
      height: ${block.height}mm;
      font-size: ${block.style.fontSize}pt;
      font-family: ${block.style.fontFamily};
      font-weight: ${block.style.fontWeight};
      font-style: ${block.style.fontStyle};
      text-align: ${block.style.textAlign};
      color: ${block.style.color};
      background-color: ${block.style.backgroundColor};
      border: ${block.style.borderWidth}px solid ${block.style.borderColor};
      border-radius: ${block.style.borderRadius}px;
      padding: ${block.style.padding}mm;
      line-height: ${block.style.lineHeight};
      z-index: ${block.zIndex};
      overflow: hidden;
    `;

    let content = '';

    switch (block.type) {
      case 'header':
        content = `
          <div style="display: flex; justify-content: space-between; width: 100%; height: 100%;">
            <div>${resolveBinding(block.bindings.left || '')}</div>
            <div>${resolveBinding(block.bindings.right || '')}</div>
          </div>
        `;
        break;

      case 'footer':
        content = `
          <div style="display: flex; justify-content: space-between; width: 100%; height: 100%; align-items: center;">
            <div>${resolveBinding(block.bindings.left || '')}</div>
            <div>${resolveBinding(block.bindings.right || '')}</div>
          </div>
        `;
        break;

      case 'intent':
        content = `
          <div>
            <strong>À l'attention de :</strong><br>
            ${resolveBinding(block.bindings.civility || '')} ${resolveBinding(block.bindings.name || '')}<br>
            ${resolveBinding(block.bindings.company || '')}<br>
            ${resolveBinding(block.bindings.address || '')}
          </div>
        `;
        break;

      case 'text':
        content = block.content ? resolveBinding(block.content) : '';
        break;

      case 'letter':
        content = resolveBinding(block.bindings.text || '');
        break;

      case 'table_tech':
      case 'table_agent':
        if (block.tableConfig) {
          content = renderTable(block, dataContext);
        }
        break;

      case 'totals':
        content = `
          <div style="text-align: right;">
            <div>Sous-total HT : ${dataContext.totals.global.ht.toFixed(2)} CHF</div>
            <div>TVA (${settings.tvaPct}%) : ${dataContext.totals.global.tva.toFixed(2)} CHF</div>
            <div style="font-weight: bold; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
              <strong>Total TTC : ${dataContext.totals.global.ttc.toFixed(2)} CHF</strong>
            </div>
          </div>
        `;
        break;

      case 'signatures':
        content = `
          <div style="display: flex; justify-content: space-between; width: 100%; height: 100%;">
            <div style="border: 1px solid #ccc; padding: 8px; width: 45%; height: 100%;">
              <div style="font-weight: bold; margin-bottom: 10px;">${resolveBinding(block.bindings.vendorTitle || 'Le vendeur')}</div>
              <div style="margin-top: auto; font-size: 8pt;">
                Le ${resolveBinding(block.bindings.date || '')}, à ${resolveBinding(block.bindings.location || '')}
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

    // En-tête du tableau
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: inherit;">
        <thead>
          <tr style="background-color: #f5f5f5;">
    `;
    
    config.columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .forEach(col => {
        tableHTML += `<th style="border: 1px solid #ddd; padding: 4px; text-align: ${col.align}; width: ${col.width}${col.widthUnit};">${col.label}</th>`;
      });
    
    tableHTML += `</tr></thead><tbody>`;

    // Corps du tableau
    dataset.forEach((item: any) => {
      tableHTML += '<tr>';
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
          
          tableHTML += `<td style="border: 1px solid #ddd; padding: 4px; text-align: ${col.align};">${value}</td>`;
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
            width: ${210 - layout.page.margins.left - layout.page.margins.right}mm;
            height: ${297 - layout.page.margins.top - layout.page.margins.bottom}mm;
          }
          .page-content {
            position: relative;
            width: 100%;
            height: 100%;
          }
          /* Éviter les coupures dans les tableaux */
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
          td, th { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        </style>
      </head>
      <body>
        <div class="page-content">
          ${blocksHTML}
        </div>
      </body>
    </html>
  `;
};

/**
 * Construit un DOM A4 à partir d'un layout JSON + données.
 * Retourne un <div data-a4-root> prêt pour PREVIEW et EXPORT (même DOM).
 */
export async function buildDomFromLayout(
  layoutId: string,
  quote: Quote,
  settings: Settings
): Promise<HTMLDivElement> {
  const root = document.createElement("div");
  root.setAttribute("data-a4-root", "true");
  // A4 strict
  root.style.width = "210mm";
  root.style.minHeight = "297mm";
  root.style.margin = "0 auto";
  root.style.background = "#ffffff";
  root.style.color = "#000000";
  root.style.fontFamily = "Arial, sans-serif";
  root.style.fontSize = "12px";
  root.style.lineHeight = "1.4";
  root.style.padding = "20mm";

  // Générer le contenu HTML basé sur le devis
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  const colors = settings.templateColors || {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#059669',
    titleColor: '#000000',
    subtitleColor: '#666666',
    textColor: '#000000',
    mutedTextColor: '#666666',
    background: '#ffffff',
    cardBackground: '#fafafa',
    headerBackground: '#f8fafc',
    tableHeader: '#f5f5f5',
    tableHeaderText: '#000000',
    tableRow: '#ffffff',
    tableRowAlt: '#f8fafc',
    tableBorder: '#e2e8f0',
    badgeUnique: '#059669',
    badgeMensuel: '#7c3aed',
    badgeText: '#ffffff',
    totalCardBorder: '#2563eb',
    totalUniqueBackground: '#f0f9ff',
    totalMensuelBackground: '#faf5ff',
    grandTotalBackground: '#f8fafc',
    grandTotalBorder: '#2563eb',
    borderPrimary: '#e2e8f0',
    borderSecondary: '#f1f5f9',
    separatorColor: '#e2e8f0',
    letterHeaderColor: '#2563eb',
    letterDateColor: '#666666',
    letterSubjectColor: '#2563eb',
    letterSignatureColor: '#000000',
    signatureBoxBorder: '#e2e8f0',
    signatureBoxBackground: '#fafafa',
    signatureTitleColor: '#2563eb',
    signatureTextColor: '#666666'
  };

  root.innerHTML = `
    <!-- En-tête avec logo et adresses -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; gap: 20px;">
      <!-- Logo et vendeur (gauche) -->
      <div style="flex: 1; max-width: 45%;">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 15px;" />` : ''}
        ${settings.sellerInfo?.name ? `
          <div style="font-size: 11pt; color: ${colors.textColor};">
            <p style="font-weight: bold; color: ${colors.letterHeaderColor || colors.primary}; margin: 4px 0; font-size: 12pt;">${settings.sellerInfo.name}</p>
            ${settings.sellerInfo.title ? `<p style="color: ${colors.subtitleColor}; margin: 2px 0;">${settings.sellerInfo.title}</p>` : ''}
            ${settings.sellerInfo.email ? `<p style="margin: 2px 0; color: ${colors.textColor};">${settings.sellerInfo.email}</p>` : ''}
            ${settings.sellerInfo.phone ? `<p style="margin: 2px 0; color: ${colors.textColor};">${settings.sellerInfo.phone}</p>` : ''}
            ${settings.sellerInfo.location ? `<p style="margin: 2px 0; color: ${colors.mutedTextColor};">${settings.sellerInfo.location}</p>` : ''}
          </div>
        ` : ''}
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
      <h1 style="font-size: 24pt; font-weight: bold; color: ${colors.titleColor}; margin: 0 0 8px 0;">${settings.pdfTitle || 'DEVIS'}</h1>
      <p style="font-size: 14pt; margin: 4px 0; color: ${colors.subtitleColor};">Devis N° ${quote.ref}</p>
      <p style="color: ${colors.letterDateColor || colors.mutedTextColor}; margin: 4px 0;">Date: ${new Date(quote.date).toLocaleDateString('fr-CH')}</p>
    </div>

    ${settings.letterTemplate?.enabled ? `
      <!-- Lettre de présentation -->
      <div class="section" style="margin: 20px 0 30px 0; page-break-inside: avoid; background: ${colors.cardBackground}; padding: 20px; border-radius: 8px; border: 1px solid ${colors.borderSecondary};">
        <div style="text-align: ${settings.letterTemplate.textAlignment || 'left'}; font-size: 11pt; line-height: 1.6; color: ${colors.textColor};">
          <div style="margin-bottom: 20px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.subject ? 'bold' : 'normal'}; color: ${colors.letterSubjectColor || colors.primary}; margin: 8px 0; font-size: 13pt;">
              ${settings.letterTemplate.subject}
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.opening ? 'bold' : 'normal'}; margin: 8px 0; color: ${colors.textColor};">
              ${settings.letterTemplate.civility} ${quote.client},
            </p>
            <p style="margin: 8px 0; color: ${colors.textColor};">
              ${settings.letterTemplate.opening}
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.body ? 'bold' : 'normal'}; margin: 8px 0; white-space: pre-wrap; color: ${colors.textColor};">
              ${settings.letterTemplate.body}
            </p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.closing ? 'bold' : 'normal'}; margin: 8px 0; color: ${colors.textColor};">
              ${settings.letterTemplate.closing}
            </p>
          </div>
          
          <div style="text-align: right; margin-top: 20px;">
            <p style="color: ${colors.letterSignatureColor || colors.textColor}; font-style: italic;">
              ${settings.sellerInfo?.name || ''}
            </p>
          </div>
        </div>
      </div>
    ` : ''}

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

    ${settings.letterTemplate?.enabled ? `
      <!-- Lettre de présentation -->
      <div class="section" style="margin: 30px 0; page-break-inside: avoid;">
        <div style="text-align: ${settings.letterTemplate.textAlignment || 'left'}; font-size: 11pt; line-height: 1.6;">
          <div style="margin-bottom: 20px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.subject ? 'bold' : 'normal'}; color: ${colors.letterSubjectColor || colors.primary}; margin: 8px 0; font-size: 12pt;">
              ${settings.letterTemplate.subject}
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.opening ? 'bold' : 'normal'}; margin: 8px 0;">
              ${settings.letterTemplate.civility} ${quote.client},
            </p>
            <p style="margin: 8px 0;">
              ${settings.letterTemplate.opening}
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.body ? 'bold' : 'normal'}; margin: 8px 0; white-space: pre-wrap;">
              ${settings.letterTemplate.body}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-weight: ${settings.letterTemplate.boldOptions?.closing ? 'bold' : 'normal'}; margin: 8px 0;">
              ${settings.letterTemplate.closing}
            </p>
          </div>
        </div>
      </div>
    ` : ''}

    ${quote.comment ? `
      <!-- Commentaire -->
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
        <h4 style="font-weight: bold; margin-bottom: 8px; color: ${colors.primary};">Commentaires</h4>
        <p style="margin: 0; white-space: pre-wrap;">${quote.comment}</p>
      </div>
    ` : ''}

    <!-- Signatures -->
    <div class="section" style="margin: 40px 0 20px 0; page-break-inside: avoid;">
      <h3 style="font-weight: bold; font-size: 14pt; color: ${colors.titleColor}; margin-bottom: 20px; text-align: center;">
        Validation du devis
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: stretch;">
        <!-- Signature vendeur -->
        <div style="border: 2px solid ${colors.signatureBoxBorder}; border-radius: 12px; padding: 20px; background: ${colors.signatureBoxBackground}; min-height: 120px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-weight: bold; margin: 0 0 10px 0; color: ${colors.signatureTitleColor}; font-size: 12pt; text-align: center;">
              Le vendeur
            </h4>
            <div style="text-align: center; color: ${colors.signatureTextColor}; font-size: 10pt; margin-bottom: 15px;">
              <p style="margin: 2px 0;">Le ${new Date().toLocaleDateString('fr-CH')}</p>
              <p style="margin: 2px 0;">à ${settings.sellerInfo?.location || 'Genève'}</p>
            </div>
          </div>
          <div style="text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-end;">
            ${settings.sellerInfo?.signature ? `
              <img src="${settings.sellerInfo.signature}" alt="Signature vendeur" style="max-height: 50px; margin: 10px auto;" />
            ` : `
              <div style="border-bottom: 1px solid ${colors.borderSecondary}; height: 50px; margin: 10px 0;"></div>
            `}
            <p style="margin: 5px 0; font-weight: bold; color: ${colors.signatureTextColor}; font-size: 10pt;">
              ${settings.sellerInfo?.name || 'Nom du vendeur'}
            </p>
          </div>
        </div>
        
        <!-- Signature client -->
        <div style="border: 2px solid ${colors.signatureBoxBorder}; border-radius: 12px; padding: 20px; background: ${colors.signatureBoxBackground}; min-height: 120px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-weight: bold; margin: 0 0 10px 0; color: ${colors.signatureTitleColor}; font-size: 12pt; text-align: center;">
              Le client
            </h4>
            <div style="text-align: center; color: ${colors.signatureTextColor}; font-size: 10pt; margin-bottom: 15px;">
              <p style="margin: 2px 0;">Date : _______________</p>
            </div>
          </div>
          <div style="text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-end;">
            ${quote.clientSignature ? `
              <img src="${quote.clientSignature}" alt="Signature client" style="max-height: 50px; margin: 10px auto;" />
            ` : `
              <div style="border-bottom: 1px solid ${colors.borderSecondary}; height: 50px; margin: 10px 0;"></div>
            `}
            <p style="margin: 5px 0; color: ${colors.signatureTextColor}; font-size: 10pt;">
              Nom et signature du client
            </p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: ${colors.mutedTextColor}; font-size: 9pt; font-style: italic;">
        En signant ce devis, le client accepte les conditions générales de vente
      </div>
    </div>

    <!-- Pied de page -->
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${colors.separatorColor || colors.borderSecondary}; text-align: center; color: ${colors.mutedTextColor || colors.secondary}; font-size: 10pt;">
      <p style="margin: 0;">${settings.pdfFooter || 'Mentions légales - #NousRendonsLaSuisseSure'}</p>
    </div>
  `;

  // Règles anti-débordement/coupures
  const style = document.createElement("style");
  style.textContent = `
    @page { size: A4; margin: 12mm; }
    [data-a4-root] { max-width: 190mm; }
    table { table-layout: fixed; width: 100%; word-break: break-word; }
    thead { display: table-header-group; } 
    tfoot { display: table-footer-group; }
    tr, td, th { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
    .hard-break { page-break-before: always; }
  `;
  root.prepend(style);

  return root;
}

/**
 * Exporte un DOM en PDF A4 via html2pdf.js (binaire fiable).
 * Guard : blob.size >= 10KB pour éviter les pages blanches.
 */
export async function exportDomToPdf(dom: HTMLElement, filename: string): Promise<Blob> {
  const worker = html2pdf()
    .set({
      margin: [12, 12, 12, 12],
      filename,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    })
    .from(dom);

  const blob = await worker.outputPdf("blob");
  if (!blob || blob.size < 10000) {
    throw new Error("Échec PDF: taille trop petite (<10KB). Vérifier le DOM/ressources.");
  }
  return blob;
}

/**
 * Récupère le layout approprié pour un devis selon sa variante
 */
export const getLayoutForQuote = (quote: Quote, settings: Settings): PDFLayoutConfig => {
  // Déterminer la variante du devis
  const hasTech = quote.items.some(i => i.kind === 'TECH');
  const hasAgent = quote.items.some(i => i.kind === 'AGENT');
  
  let variant: LayoutVariant;
  if (hasTech && hasAgent) {
    variant = 'mixte';
  } else if (hasAgent) {
    variant = 'agent';
  } else {
    variant = 'technique';
  }
  
  // Récupérer le layout actif pour cette variante
  const activeLayoutId = settings.activePDFLayouts?.[variant];
  
  if (activeLayoutId && settings.pdfLayouts?.[variant]) {
    const layouts = settings.pdfLayouts[variant];
    const activeLayout = layouts.find(l => l.id === activeLayoutId);
    if (activeLayout) {
      return activeLayout;
    }
  }
  
  // Fallback sur le layout par défaut
  return getDefaultLayoutForVariant(variant);
};