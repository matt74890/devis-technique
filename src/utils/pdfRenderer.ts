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

  // PAGE 1: LETTRE DE PRÉSENTATION (si activée)
  if (settings.letterTemplate?.enabled) {
    const letterPage = document.createElement('div');
    letterPage.style.cssText = `
      width: 210mm;
      min-height: 297mm;
      page-break-after: always;
      padding: 20mm;
      font-family: Arial, sans-serif;
      background: ${colors.background};
      color: ${colors.textColor};
      box-sizing: border-box;
    `;

    letterPage.innerHTML = `
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
        
        <!-- Signature -->
        <div style="margin-top: 40px; text-align: right;">
          <div style="color: ${colors.letterSignatureColor}; font-style: italic; font-size: 11pt;">
            ${settings.sellerInfo?.name || ''}
          </div>
          ${settings.sellerInfo?.signature ? `
            <div style="margin-top: 10px;">
              <img src="${settings.sellerInfo.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
            </div>
          ` : ''}
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
      <h1 style="font-size: 24pt; font-weight: bold; color: ${colors.titleColor}; margin: 0 0 8px 0;">${settings.pdfTitle || 'DEVIS'}</h1>
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
                  <span style="padding: 2px 6px; border-radius: 3px; font-size: 9pt; background: ${item.mode === 'mensuel' ? colors.badgeMensuel : colors.badgeUnique}; color: ${colors.badgeText};">
                    ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                  </span>
                </td>
                <td style="padding: 6px; text-align: center; border: 1px solid ${colors.secondary};">${item.qty || 1}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.secondary};">${(item.puTTC || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.secondary};">${(item.totalTTC || 0).toFixed(2)} CHF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${quote.items.some(item => item.kind === 'AGENT') ? `
      <!-- Services AGENT -->
      <div style="margin: 20px 0;">
        <h3 style="font-weight: bold; font-size: 14pt; color: ${colors.primary}; margin-bottom: 10px;">Services agent</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.secondary};">
          <thead>
            <tr style="background: ${colors.primary}; color: white;">
              <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid ${colors.secondary};">Description</th>
              <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${colors.secondary};">Durée (h)</th>
              <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">Tarif/h</th>
              <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid ${colors.secondary};">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.filter(item => item.kind === 'AGENT').map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                <td style="padding: 6px; border: 1px solid ${colors.secondary};">
                  <div style="font-weight: bold;">${item.reference}</div>
                  <div style="font-size: 9pt; color: ${colors.mutedTextColor};">${item.type}</div>
                  <span style="display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 8pt; background: ${colors.badgeAgent}; color: ${colors.badgeText}; margin-top: 4px;">
                    Agent
                  </span>
                </td>
                <td style="padding: 6px; text-align: center; border: 1px solid ${colors.secondary};">${item.qty || 1}h</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.secondary};">${(item.rateCHFh || item.puTTC || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                <td style="padding: 6px; text-align: right; border: 1px solid ${colors.secondary};">${(item.totalTTC || 0).toFixed(2)} CHF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Totaux -->
    <div style="margin: 30px 0; display: flex; justify-content: flex-end;">
      <div style="background: ${colors.cardBackground}; padding: 20px; border-radius: 8px; border: 2px solid ${colors.primary}; min-width: 300px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <h3 style="color: ${colors.primary}; margin: 0; font-size: 14pt;">RÉCAPITULATIF</h3>
        </div>
        
        <div style="border-bottom: 1px solid ${colors.borderSecondary}; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Sous-total HT:</span>
            <span>${totals.global.htAfterDiscount.toFixed(2)} CHF</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>TVA (${settings.tvaPct}%):</span>
            <span>${totals.global.tva.toFixed(2)} CHF</span>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16pt; color: ${colors.primary};">
          <span>TOTAL TTC:</span>
          <span>${totals.global.totalTTC.toFixed(2)} CHF</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 40px; page-break-inside: avoid;">
      <h3 style="color: ${colors.primary}; margin-bottom: 20px; text-align: center;">Signatures</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div style="border: 2px solid ${colors.signatureBoxBorder}; padding: 15px; background: ${colors.signatureBoxBackground}; border-radius: 8px; min-height: 120px;">
          <div style="font-weight: bold; color: ${colors.signatureTitleColor}; margin-bottom: 20px; text-align: center;">Le Vendeur</div>
          <div style="margin-top: 60px; text-align: center; color: ${colors.signatureTextColor}; font-size: 9pt;">
            Nom et signature
          </div>
        </div>
        <div style="border: 2px solid ${colors.signatureBoxBorder}; padding: 15px; background: ${colors.signatureBoxBackground}; border-radius: 8px; min-height: 120px;">
          <div style="font-weight: bold; color: ${colors.signatureTitleColor}; margin-bottom: 20px; text-align: center;">Le Client</div>
          <div style="margin-top: 60px; text-align: center; color: ${colors.signatureTextColor}; font-size: 9pt;">
            Nom et signature
          </div>
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