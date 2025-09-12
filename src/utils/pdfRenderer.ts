import { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutBlock, TableColumn } from '@/types/layout';
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