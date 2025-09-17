import html2pdf from "html2pdf.js";
import type { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutBlock, TableColumn, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { calculateQuoteTotals } from './calculations';
import { groupAgentVacations } from './agentVacationGrouping';

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
      service: quote.items.filter(item => item.kind === 'SERVICE'),
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
    hasServices: quote.items.some(i => i.kind === 'SERVICE'),
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
        case 'hasServices': return dataContext.hasServices;
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
      case 'table_service':
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
    let dataset;
    if (config.dataset === 'items.tech') {
      dataset = context.items.tech;
    } else if (config.dataset === 'items.agent') {
      dataset = context.items.agent;
    } else if (config.dataset === 'items.service') {
      dataset = context.items.service;
    }
    
    // Regrouper les vacations d'agent similaires
    if (config.dataset === 'items.agent' && dataset && dataset.length > 0) {
      const groupedVacations = groupAgentVacations(dataset);
      dataset = groupedVacations;
    }
    
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
          
          // Pour les vacations groupées, utiliser les champs spécifiques
          if (config.dataset === 'items.agent' && item.dateRange) {
            if (col.binding === 'dateStart') {
              value = item.dateRange; // Afficher la plage de dates au lieu de la date de début
            } else if (col.binding === 'dateEnd') {
              value = ''; // Ne pas afficher la date de fin séparément
            } else if (col.binding === 'reference' && item.markupDescription) {
              value = `${item.agentType} (${item.markupDescription})`;
            } else if (col.binding === 'reference' && !item.markupDescription) {
              value = item.agentType;
            }
          }
          
          // Formatage spécial pour les services
          if (config.dataset === 'items.service') {
            if (col.binding === 'serviceType') {
              const serviceTypes = {
                'patrouille_ouverture': 'Patrouille Ouverture',
                'patrouille_fermeture': 'Patrouille Fermeture', 
                'patrouille_exterieur': 'Patrouille Extérieur',
                'pre_vol': 'Pré-vol',
                'formation': 'Formation',
                'garde_clef': 'Garde de clef',
                'transport': 'Transport',
                'maintenance': 'Maintenance technique',
                'autre': 'Autre service'
              };
              value = serviceTypes[value] || value || 'Autre service';
            } else if (col.binding === 'durationMinutes') {
              value = value ? `${value} min` : '30 min';
            }
          }
          
          // Formatage selon le type
          if (col.format === 'currency' && typeof value === 'number') {
            value = value.toFixed(2) + ' CHF';
          } else if (col.format === 'date' && value) {
            // Si c'est déjà une chaîne de plage de dates, ne pas reformater
            if (typeof value === 'string' && value.includes('du ')) {
              // Garder tel quel
            } else {
              value = new Date(value).toLocaleDateString('fr-CH');
            }
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

export const buildDomFromLayout = (
  layoutId: string,
  quote: Quote,
  settings: Settings
): HTMLElement => {
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

  // CSS GLOBAL A4 selon spécifications exactes avec règles PDF strictes
  const style = document.createElement("style");
  style.textContent = `
    /* Mise en page A4 stricte avec marges imprimables sécurisées */
    @page {
      size: A4;
      margin: 12mm 10mm 12mm 10mm;
    }
    [data-a4-root] { 
      max-width: 190mm;
      margin: 0 auto; 
      background: ${colors.background || '#ffffff'};
      color: ${colors.textColor || '#333'};
      box-sizing: border-box;
      padding: 0;
    }
    .intro-page { 
      page-break-after: always !important; 
      height: 273mm !important;
      max-height: 273mm !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      padding: 0 !important;
    }

    /* =================== RÈGLES PDF STRICTES =================== */
    
    /* Structure de page PDF avec en-têtes répétés */
    .pdf-page {
      width: 100%;
      min-height: 273mm;
      position: relative;
      page-break-after: always;
    }
    .pdf-page:last-child {
      page-break-after: auto;
    }
    
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0 15px 0;
      border-bottom: 3px solid ${colors.primary || '#2563eb'};
      margin-bottom: 20px;
    }
    
    .pdf-content {
      min-height: calc(273mm - 120mm);
    }
    
    .pdf-footer {
      position: absolute;
      bottom: 10mm;
      width: 100%;
      text-align: center;
      color: ${colors.mutedTextColor || '#6b7280'};
      font-size: 10pt;
    }

    /* Badges */
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

    /* Tableaux avec en-têtes répétés (RÈGLES OBLIGATOIRES) */
    .table-devis { 
      width: 100% !important; 
      border-collapse: collapse !important;
      margin: 15px 0;
      border: 1px solid ${colors.tableBorder || '#e2e8f0'};
      page-break-inside: auto !important;
    }
    .table-devis thead { 
      display: table-header-group !important;
      background: ${colors.tableHeader || '#f8fafc'} !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
    .table-devis tfoot { 
      display: table-footer-group !important;
    }
    .table-devis tbody {
      page-break-inside: auto !important;
    }
    .table-devis tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .table-devis td, .table-devis th {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .table-devis th {
      padding: 8px !important;
      border: 1px solid ${colors.tableBorder || '#e2e8f0'};
      font-weight: bold;
      color: ${colors.tableHeaderText || '#334155'};
      text-align: left;
      background: ${colors.tableHeader || '#f8fafc'} !important;
    }
    .table-devis td {
      padding: 6px 8px !important;
      border: 1px solid ${colors.tableBorder || '#e2e8f0'};
      color: ${colors.textColor || '#334155'};
      vertical-align: middle;
    }
    
    /* Répétition des en-têtes de tableaux sur nouvelles pages */
    @media print {
      .table-devis thead {
        display: table-header-group !important;
      }
      .table-devis tbody {
        display: table-row-group !important;
      }
      .table-devis tfoot {
        display: table-footer-group !important;
      }
    }
    .table-devis tbody tr:nth-child(even) { 
      background: ${colors.tableRowAlt || '#f8fafc'}; 
    }
    .table-devis tbody tr:nth-child(odd) { 
      background: ${colors.tableRow || '#ffffff'}; 
    }

    /* Groupage "Sous-totaux + Total + Signatures" (RÈGLE STRICTE) */
    .closing-block {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-top: 40mm;
    }
    .keep-together { 
      page-break-inside: avoid !important; 
      break-inside: avoid !important; 
    }
    .subtotals-row { 
      display: flex; 
      gap: 8mm; 
      flex-wrap: wrap; 
      justify-content: center;
      margin-bottom: 20px;
      page-break-inside: avoid !important;
    }
    
    /* Force un saut de page si besoin */
    .force-break { 
      page-break-before: always !important; 
    }

    /* Signatures */
    .signatures { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 24px; 
      page-break-inside: avoid !important;
      margin-top: 30px;
    }
    .signature-block { margin-top: 8mm; }
    .signature-name { font-weight: 600; }
    .signature-title { color: #6b7280; font-size: 12px; }
    .signature-image { margin-top: 6mm; max-height: 28mm; max-width: 80mm; }
    
    /* Conteneurs de totaux */
    .totals-container { 
      display: flex; 
      justify-content: center; 
      gap: 20px; 
      flex-wrap: wrap; 
      margin: 20px 0;
    }
    .total-box { 
      background: ${colors.cardBackground || '#f8fafc'}; 
      padding: 15px; 
      border-radius: 8px; 
      border: 2px solid ${colors.primary || '#2563eb'}; 
      min-width: 250px; 
      text-align: center; 
    }
    
    /* Zone de contenu */
    .content-zone {
      max-width: 190mm !important;
      width: 100% !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
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

        <!-- Signatures en bas de page dans un cadre -->
        <div class="signatures" style="margin-top: 30px; border: 2px solid ${colors.borderPrimary}; border-radius: 8px; padding: 20px; background: ${colors.signatureBoxBackground};">
          <div style="display: flex; justify-content: space-between; gap: 20px;">
            <div class="signature-block" style="flex: 1; text-align: center; border-right: 1px solid ${colors.borderSecondary}; padding-right: 20px;">
              <div style="font-weight: bold; color: ${colors.signatureTitleColor}; margin-bottom: 10px; font-size: 12pt;">Le Vendeur</div>
              <div class="signature-name" style="font-size: 11pt; margin-bottom: 5px;">${settings.sellerInfo?.name || ''}</div>
              <div class="signature-title" style="font-size: 10pt; color: ${colors.signatureTextColor}; margin-bottom: 15px;">${settings.sellerInfo?.title || ''}</div>
              ${settings.sellerInfo?.signature ? `
                <img class="signature-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" style="max-height: 40px; max-width: 150px;" />
              ` : `
                <div style="border-bottom: 1px solid ${colors.signatureBoxBorder}; height: 30px; margin-top: 10px;"></div>
                <div style="font-size: 9pt; color: ${colors.signatureTextColor}; margin-top: 5px;">Nom et signature</div>
              `}
            </div>
            <div class="signature-block" style="flex: 1; text-align: center; padding-left: 20px;">
              <div style="font-weight: bold; color: ${colors.signatureTitleColor}; margin-bottom: 10px; font-size: 12pt;">Le Client</div>
              <div class="signature-name" style="font-size: 11pt; margin-bottom: 5px;">${quote.client}</div>
              <div class="signature-title" style="font-size: 10pt; color: ${colors.signatureTextColor}; margin-bottom: 15px;">${quote.clientCivility || ''}</div>
              <div class="signature-image" style="border-bottom: 1px solid ${colors.signatureBoxBorder}; height: 30px; margin-top: 10px;"></div>
              <div style="font-size: 9pt; color: ${colors.signatureTextColor}; margin-top: 5px;">Nom et signature</div>
            </div>
          </div>
        </div>
    </div>
    </div> <!-- Fermeture content-zone -->
  `;

    container.appendChild(letterPage);
  }

  // Fonction pour créer l'en-tête répétable (logo + référence + trait jaune)
  const createHeaderHTML = () => `
    <header class="pdf-header">
      <div style="display: flex; align-items: center; gap: 15px;">
        ${settings.logoUrl ? `
          <img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px; max-width: 120px; object-fit: contain;" />
        ` : `
          <div style="color: ${colors.letterHeaderColor}; font-size: 14pt; font-weight: bold;">${settings.sellerInfo?.name || 'GPA'}</div>
        `}
        <div style="font-size: 16pt; font-weight: bold; color: ${colors.primary};">
          Devis N° ${quote.ref}
        </div>
      </div>
      <div style="font-size: 10pt; color: ${colors.mutedTextColor};">
        ${new Date(quote.date).toLocaleDateString('fr-CH')}
      </div>
    </header>
  `;

  // PAGE DEVIS avec structure DOM stricte selon spécifications
  const quotePage = document.createElement('section');
  quotePage.className = 'pdf-page';
  
  quotePage.innerHTML = `
    ${createHeaderHTML()}
    
    <div class="pdf-content">
      <!-- Informations client et projet sur chaque page -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1; max-width: 45%;">
          <h3 style="color: ${colors.primary}; margin-bottom: 10px; font-size: 12pt;">Vendeur</h3>
          <div style="font-size: 10pt; color: ${colors.textColor};">
            <div style="font-weight: bold;">${settings.sellerInfo?.name || ''}</div>
            <div>${settings.sellerInfo?.title || ''}</div>
            <div>${settings.sellerInfo?.email || ''}</div>
            <div>${settings.sellerInfo?.phone || ''}</div>
          </div>
        </div>
        
        <div style="flex: 1; max-width: 45%; text-align: right;">
          <h3 style="color: ${colors.primary}; margin-bottom: 10px; font-size: 12pt;">Client</h3>
          <div style="font-size: 10pt; color: ${colors.textColor};">
            <div style="font-weight: bold;">${quote.addresses?.contact?.company || quote.client}</div>
            <div>${quote.addresses?.contact?.name || ''}</div>
            <div>${quote.addresses?.contact?.street || ''}</div>
            <div>${quote.addresses?.contact?.postalCode || ''} ${quote.addresses?.contact?.city || ''}</div>
            ${quote.addresses?.contact?.email ? `<div>${quote.addresses.contact.email}</div>` : ''}
          </div>
        </div>
      </div>

      ${(quote.site || quote.contact || quote.canton) ? `
        <div style="background: ${colors.cardBackground}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${colors.primary};">
          <h4 style="color: ${colors.primary}; margin: 0 0 8px 0; font-size: 11pt;">Détails du projet</h4>
          ${quote.site ? `<div style="margin: 4px 0; font-size: 10pt;"><strong>Site:</strong> ${quote.site}</div>` : ''}
          ${quote.contact ? `<div style="margin: 4px 0; font-size: 10pt;"><strong>Contact:</strong> ${quote.contact}</div>` : ''}
          ${quote.canton ? `<div style="margin: 4px 0; font-size: 10pt;"><strong>Canton:</strong> ${quote.canton}</div>` : ''}
        </div>
      ` : ''}

      ${quote.items.some(item => item.kind === 'TECH') ? `
        <!-- Prestations TECH avec structure tableau stricte -->
        <div style="margin: 30px 0;">
          <h3 style="color: ${colors.primary}; margin-bottom: 15px; font-size: 14pt; text-align: center;">
            Prestations techniques
          </h3>
          
          <table class="table-devis">
            <thead>
              <tr>
                <th style="width: 15%;">Type</th>
                <th style="width: 35%;">Référence</th>
                <th style="width: 12%; text-align: center;">Mode</th>
                <th style="width: 8%; text-align: center;">Qté</th>
                <th style="width: 15%; text-align: right;">PU TTC</th>
                <th style="width: 15%; text-align: right;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.filter(item => item.kind === 'TECH').map((item, index) => `
                <tr>
                  <td>${item.type}</td>
                  <td>${item.reference}</td>
                  <td style="text-align: center;">
                    <span class="badge badge--${item.mode === 'mensuel' ? 'mensuel' : 'unique'}">
                      ${item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                    </span>
                  </td>
                  <td style="text-align: center;">${item.qty || 1}</td>
                  <td style="text-align: right;">${(item.puTTC || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                  <td style="text-align: right;">${(item.totalTTC || 0).toFixed(2)} CHF</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${quote.items.some(item => item.kind === 'AGENT') ? `
        <!-- Services AGENT avec structure tableau stricte -->
        <div style="margin: 30px 0;">
          <h3 style="color: ${colors.primary}; margin-bottom: 15px; font-size: 14pt; text-align: center;">
            Services Agent
          </h3>
          
          <table class="table-devis">
            <thead>
              <tr>
                <th style="width: 20%;">Description</th>
                <th style="width: 10%;">Type</th>
                <th style="width: 10%;">Date début</th>
                <th style="width: 8%;">Heure début</th>
                <th style="width: 10%;">Date fin</th>
                <th style="width: 8%;">Heure fin</th>
                <th style="width: 10%; text-align: right;">H. normales</th>
                <th style="width: 10%; text-align: right;">H. majorées</th>
                <th style="width: 8%; text-align: right;">Tarif/h</th>
                <th style="width: 12%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.filter(item => item.kind === 'AGENT').map((item, index) => `
                <tr>
                  <td>
                    <div style="font-weight: bold; margin-bottom: 4px;">${item.reference}</div>
                    <span class="badge badge--agent">Agent</span>
                  </td>
                  <td>${item.agentType || item.type}</td>
                  <td>${item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-'}</td>
                  <td>${item.timeStart || '-'}</td>
                  <td>${item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-'}</td>
                  <td>${item.timeEnd || '-'}</td>
                  <td style="text-align: right;">${(item.hoursNormal || 0).toFixed(2)} h</td>
                  <td style="text-align: right;">${((item.hoursNight || 0) + (item.hoursSunday || 0) + (item.hoursHoliday || 0)).toFixed(2)} h</td>
                  <td style="text-align: right;">${(item.rateCHFh || item.unitPriceValue || 0).toFixed(2)} CHF</td>
                  <td style="text-align: right;">${(item.lineTTC || item.totalTTC || 0).toFixed(2)} CHF</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${quote.items.some(item => item.kind === 'SERVICE') ? `
        <!-- Services COMPLÉMENTAIRES avec structure tableau stricte -->
        <div style="margin: 30px 0;">
          <h3 style="color: ${colors.primary}; margin-bottom: 15px; font-size: 14pt; text-align: center;">
            Services Complémentaires
          </h3>
          
          <table class="table-devis">
            <thead>
              <tr>
                <th style="width: 20%;">Type de service</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 10%; text-align: center;">Patrouilles/j</th>
                <th style="width: 10%; text-align: center;">Nb jours</th>
                <th style="width: 10%; text-align: center;">Durée</th>
                <th style="width: 15%; text-align: right;">Prix unitaire</th>
                <th style="width: 15%; text-align: right;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.filter(item => item.kind === 'SERVICE').map((item, index) => {
                const serviceTypes = {
                  'patrouille_ouverture': 'Patrouille Ouverture',
                  'patrouille_fermeture': 'Patrouille Fermeture', 
                  'patrouille_exterieur': 'Patrouille Extérieur',
                  'pre_vol': 'Pré-vol',
                  'formation': 'Formation',
                  'garde_clef': 'Garde de clef',
                  'transport': 'Transport',
                  'maintenance': 'Maintenance technique',
                  'autre': 'Autre service'
                };
                const serviceTypeLabel = serviceTypes[item.serviceType] || item.serviceType || 'Autre service';
                return `
                <tr>
                  <td>${serviceTypeLabel}</td>
                  <td>${item.serviceDescription || ''}</td>
                  <td style="text-align: center;">${item.patrolsPerDay || 1}</td>
                  <td style="text-align: center;">${item.daysCount || 1}</td>
                  <td style="text-align: center;">${item.durationMinutes || 30} min</td>
                  <td style="text-align: right;">${(item.serviceUnitPrice || 0).toFixed(2)} CHF</td>
                  <td style="text-align: right;">${(item.lineTTC || 0).toFixed(2)} CHF</td>
                </tr>
              `;}).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>

    <!-- BLOC DE CLÔTURE GROUPÉ (Sous-totaux + Total + Signatures) -->
    <!-- Nouvelle page pour les totaux avec en-tête répété -->
    <div style="page-break-before: always;">
      ${createHeaderHTML()}
      
      <!-- Récapitulatif client en haut à droite -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="border: 2px solid ${colors.primary}; padding: 15px; border-radius: 8px; background: ${colors.cardBackground}; max-width: 45%;">
          <h3 style="color: ${colors.primary}; margin-bottom: 10px; font-size: 12pt; text-align: center;">Récapitulatif Client</h3>
          <div style="font-size: 10pt; color: ${colors.textColor};">
            <div style="font-weight: bold;">${quote.addresses?.contact?.company || quote.client}</div>
            <div>${quote.addresses?.contact?.name || ''}</div>
            <div>${quote.addresses?.contact?.street || ''}</div>
            <div>${quote.addresses?.contact?.postalCode || ''} ${quote.addresses?.contact?.city || ''}</div>
            ${quote.addresses?.contact?.email ? `<div>${quote.addresses.contact.email}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
    
    <div class="closing-block keep-together">
      <!-- Sous-totaux alignés horizontalement -->
      <div class="subtotals-row">
        ${totals.unique.subtotalHT > 0 ? `
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
        ` : ''}
        
        ${totals.mensuel.subtotalHT > 0 ? `
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
        ` : ''}
        
        ${totals.agents.subtotalHT > 0 ? `
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
        ` : ''}
        
        ${totals.services.subtotalHT > 0 ? `
          <div class="total-box">
            <h4 style="color: ${colors.primary}; margin: 0 0 10px 0; font-size: 12pt;">SERVICES</h4>
            <div style="text-align: left; font-size: 10pt;">
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>Sous-total HT:</span>
                <span>${totals.services.subtotalHT.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>TVA (${settings.tvaPct}%):</span>
                <span>${totals.services.tva.toFixed(2)} CHF</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid ${colors.borderSecondary}; padding-top: 5px; margin-top: 5px; color: ${colors.primary};">
                <span>Total TTC:</span>
                <span>${totals.services.totalTTC.toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- TOTAL GÉNÉRAL -->
      <div class="grand-total" style="text-align: center; margin: 30px 0 20px 0; padding: 20px; background: ${colors.grandTotalBackground}; border: 3px solid ${colors.grandTotalBorder}; border-radius: 8px;">
        <div style="font-size: 18pt; font-weight: bold; color: ${colors.primary};">
          TOTAL GÉNÉRAL TTC: ${totals.global.totalTTC.toFixed(2)} CHF
        </div>
        <div style="font-size: 10pt; color: ${colors.mutedTextColor}; margin-top: 5px;">
          TVA comprise (${settings.tvaPct}%) • ${totals.global.htAfterDiscount.toFixed(2)} CHF HT
        </div>
      </div>
      
      <!-- SIGNATURES -->
      <div class="signatures">
        <div style="border: 1px solid ${colors.signatureBoxBorder}; padding: 15px; background: ${colors.signatureBoxBackground}; border-radius: 5px;">
          <div style="font-weight: bold; margin-bottom: 10px; color: ${colors.signatureTitleColor};">Le Vendeur</div>
          <div style="font-size: 12pt; font-weight: bold; margin-bottom: 5px;">${settings.sellerInfo?.name || ''}</div>
          <div style="font-size: 10pt; margin-bottom: 10px; color: ${colors.signatureTextColor};">${settings.sellerInfo?.title || ''}</div>
          ${settings.sellerInfo?.signature ? `
            <img src="${settings.sellerInfo.signature}" alt="Signature vendeur" style="max-height: 40px; max-width: 150px; margin-top: 10px;" />
          ` : `
            <div style="margin-top: 15px; color: ${colors.signatureTextColor}; font-size: 9pt;">Nom et signature :</div>
            <div style="height: 30px; border-bottom: 1px solid ${colors.signatureBoxBorder}; margin-top: 5px;"></div>
          `}
        </div>
        
        <div style="border: 1px solid ${colors.signatureBoxBorder}; padding: 15px; background: ${colors.signatureBoxBackground}; border-radius: 5px;">
          <div style="font-weight: bold; margin-bottom: 10px; color: ${colors.signatureTitleColor};">Le Client</div>
          <div style="font-size: 12pt; font-weight: bold; margin-bottom: 5px;">${quote.client}</div>
          <div style="font-size: 10pt; margin-bottom: 10px; color: ${colors.signatureTextColor};">${quote.clientCivility || ''}</div>
          <div style="margin-top: 15px; color: ${colors.signatureTextColor}; font-size: 9pt;">Nom et signature :</div>
          <div style="height: 30px; border-bottom: 1px solid ${colors.signatureBoxBorder}; margin-top: 5px;"></div>
        </div>
      </div>
    </div>

    <footer class="pdf-footer">
      Page 1 sur 1 • Devis ${quote.ref} • ${new Date(quote.date).toLocaleDateString('fr-CH')}
    </footer>
  `;

  container.appendChild(quotePage);

  return container;
};

/**
 * Générer et télécharger le PDF (html2pdf)
 */
export const generatePDF = async (quote: Quote, settings: Settings): Promise<void> => {
  try {
    // Utiliser le nouveau layout par défaut
    const defaultLayout = getDefaultLayoutForVariant('technique');
    const htmlString = renderPDFFromLayout(quote, settings, defaultLayout);
    
    // Configuration HTML2PDF optimisée pour A4
    const options = {
      margin: [10, 8, 10, 8], // Marges en mm
      filename: `devis-${quote.ref}.pdf`,
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
      }
    };

    // Générer le PDF
    await html2pdf().set(options).from(htmlString).save();
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Version simplifiée pour débogage - export DOM uniquement
 */
export const exportDomAsPDF = async (domElement: HTMLElement, filename: string): Promise<void> => {
  try {
    const options = {
      margin: [10, 8, 10, 8],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(options).from(domElement).save();
  } catch (error) {
    console.error('Erreur exportDomAsPDF:', error);
    throw new Error(`Erreur export DOM: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};