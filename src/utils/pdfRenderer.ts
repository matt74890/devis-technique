import html2pdf from "html2pdf.js";
import type { Quote, Settings } from '@/types';
import { PDFLayoutConfig, LayoutBlock, TableColumn, LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { calculateQuoteTotals } from './calculations';

// Injecter les styles CSS pour l'impression
const ensurePrintStyles = () => {
  if (!document.getElementById('pdf-print-styles')) {
    const link = document.createElement('link');
    link.id = 'pdf-print-styles';
    link.rel = 'stylesheet';
    link.href = '/src/components/pdf/pdf-print.css';
    document.head.appendChild(link);
  }
};

/**
 * Fonction unique de rendu PDF basée sur les layouts JSON
 * Source unique pour Preview ET Téléchargement 
 */
export const renderPDFFromLayout = (
  quote: Quote,
  settings: Settings,
  layout: PDFLayoutConfig
): string => {
  ensurePrintStyles();
  
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  
  // Déterminer le type de devis pour le titre
  const hasTech = quote.items.some(i => i.kind === 'TECH');
  const hasAgent = quote.items.some(i => i.kind === 'AGENT');
  
  let devisTitle = 'DEVIS';
  if (hasTech && hasAgent) {
    devisTitle = 'DEVIS TECHNIQUE & AGENT';
  } else if (hasTech) {
    devisTitle = 'DEVIS TECHNIQUE';
  } else if (hasAgent) {
    devisTitle = 'DEVIS AGENT';
  }
  
  // Contexte de données pour la liaison
  const dataContext = {
    // Données de base
    quoteRef: quote.ref,
    quoteDate: new Date(quote.date).toLocaleDateString('fr-CH'),
    client: quote.client,
    site: quote.site || '',
    contact: quote.contact || '',
    clientCivility: quote.clientCivility,
    devisTitle,
    
    // Items séparés par type
    items: {
      tech: quote.items.filter(item => item.kind === 'TECH'),
      agent: quote.items.filter(item => item.kind === 'AGENT'),
      all: quote.items
    },
    
    // Totaux calculés
    totals: {
      unique: {
        ht: totals.unique.htAfterDiscount,
        tva: totals.unique.tva,
        ttc: totals.unique.totalTTC
      },
      mensuel: {
        ht: totals.mensuel.htAfterDiscount,
        tva: totals.mensuel.tva,
        ttc: totals.mensuel.totalTTC
      },
      agents: {
        ht: totals.agents.subtotalHT,
        tva: totals.agents.tva,
        ttc: totals.agents.totalTTC
      },
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
    hasTech,
    hasAgents: hasAgent,
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
            return match;
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

  // Formatter les montants avec les couleurs du thème
  const formatAmount = (amount: number): string => {
    return `CHF ${amount.toFixed(2).replace('.', ',')}`;
  };

  // Générer l'en-tête PDF standardisé
  const renderPDFHeader = (refText: string): string => {
    return `
      <div class="pdf-header">
        <div class="pdf-header__logo" style="color: ${settings.templateColors?.primary || '#FFD400'};">
          ${settings.sellerInfo?.name || 'GPA'}
        </div>
        <div class="pdf-header__meta" style="color: ${settings.templateColors?.textColor || '#111827'};">
          <div>${quote.client || ''}</div>
          <div>${settings.sellerInfo?.name || ''}</div>
          <div>${refText}</div>
        </div>
      </div>
    `;
  };

  // Générer la lettre de présentation
  const renderCoverLetter = (): string => {
    if (!settings.letterTemplate?.enabled) return '';
    
    const template = settings.letterTemplate;
    
    return `
      <div class="cover-body page-content">
        <div style="text-align: center; margin-bottom: 8mm;">
          <h1 class="pdf-title" style="color: ${settings.templateColors?.titleColor || '#111827'};">
            ${devisTitle}
          </h1>
          <p style="font: 600 14px/1.2 'Inter', sans-serif; color: ${settings.templateColors?.subtitleColor || '#6B7280'};">
            N° ${quote.ref} - ${dataContext.quoteDate}
          </p>
        </div>
        
        <div style="font: 400 12px/1.6 'Inter', sans-serif; color: ${settings.templateColors?.textColor || '#111827'};">
          <p style="margin-bottom: 6mm;">
            ${template.civility} ${quote.client || 'Client'},
          </p>
          
          <div style="font-weight: ${template.boldOptions.opening ? '600' : '400'}; margin-bottom: 6mm;">
            ${template.opening}
          </div>
          
          <div style="font-weight: ${template.boldOptions.body ? '600' : '400'}; margin-bottom: 6mm; text-align: ${template.textAlignment};">
            ${template.body}
          </div>
          
          <div style="font-weight: ${template.boldOptions.closing ? '600' : '400'}; margin-bottom: 8mm;">
            ${template.closing}
          </div>
        </div>
      </div>
    `;
  };

  // Générer les signatures
  const renderSignatures = (): string => {
    return `
      <div class="cover-signatures keep-together">
        <div class="sig-block">
          <h5 style="color: ${settings.templateColors?.signatureTitleColor || '#111827'};">Le Vendeur</h5>
          <div class="identity" style="color: ${settings.templateColors?.textColor || '#111827'};">
            ${settings.sellerInfo?.name || ''}
          </div>
          <div class="title" style="color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">
            ${settings.sellerInfo?.title || ''}
          </div>
          ${settings.sellerInfo?.signature ? 
            `<img class="sig-image" src="${settings.sellerInfo.signature}" alt="Signature vendeur" />` :
            `<div class="sig-pad" style="border-color: ${settings.templateColors?.borderSecondary || '#D1D5DB'};">Signature vendeur</div>`
          }
        </div>
        <div class="sig-block">
          <h5 style="color: ${settings.templateColors?.signatureTitleColor || '#111827'};">Le Client</h5>
          <div class="identity" style="color: ${settings.templateColors?.textColor || '#111827'};">
            ${quote.client || ''}
          </div>
          <div class="title" style="color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">
            ${quote.clientCivility || 'Monsieur/Madame'}
          </div>
          ${quote.clientSignature ? 
            `<img class="sig-image" src="${quote.clientSignature}" alt="Signature client" />` :
            `<div class="sig-pad" style="border-color: ${settings.templateColors?.borderSecondary || '#D1D5DB'};">Signature client</div>`
          }
        </div>
      </div>
    `;
  };

  // Générer la page de présentation complète
  const renderCoverPage = (): string => {
    return `
      <section class="pdf-a4 cover-page avoid-break">
        ${renderPDFHeader(`Le ${dataContext.quoteDate}`)}
        ${renderCoverLetter()}
        ${renderSignatures()}
      </section>
      <div class="force-break"></div>
    `;
  };

  // Générer les tableaux avec les bonnes données
  const renderQuoteTables = (): string => {
    let tablesHTML = '';
    
    // Tableau technique si il y a des items techniques
    if (dataContext.hasTech) {
      tablesHTML += renderTechnicalTable();
    }
    
    // Tableau agent si il y a des items agents
    if (dataContext.hasAgents) {
      tablesHTML += renderAgentTable();
    }
    
    return tablesHTML;
  };

  // Générer le tableau technique
  const renderTechnicalTable = (): string => {
    const techItems = dataContext.items.tech;
    if (techItems.length === 0) return '';
    
    const rowsHTML = techItems.map(item => {
      const badgeClass = item.mode === 'unique' ? 'badge' : 'badge badge--muted';
      const badgeText = item.mode === 'unique' ? 'Unique' : 'Mensuel';
      
      return `
        <tr style="border-bottom: 1px solid ${settings.templateColors?.tableBorder || '#E5E7EB'};">
          <td style="color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            ${item.reference}
          </td>
          <td style="color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            ${item.type || ''}
          </td>
          <td style="text-align: center; padding: 3mm 2mm;">
            <span class="${badgeClass}" style="background: ${item.mode === 'unique' ? settings.templateColors?.badgeUnique || '#FFD400' : settings.templateColors?.badgeMensuel || '#E5E7EB'}; color: ${settings.templateColors?.badgeText || '#111827'};">
              ${badgeText}
            </span>
          </td>
          <td style="text-align: center; color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            ${item.qty || 1}
          </td>
          <td style="text-align: right; color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            ${formatAmount(item.puHT || 0)}
          </td>
          <td style="text-align: right; color: ${settings.templateColors?.textColor || '#111827'}; font-weight: 600; padding: 3mm 2mm;">
            ${formatAmount(item.totalHT_net || 0)}
          </td>
        </tr>
      `;
    }).join('');
    
    return `
      <section class="pdf-a4 avoid-break">
        ${renderPDFHeader(`Devis N° ${quote.ref} - ${dataContext.quoteDate}`)}
        <div class="page-content">
          <h2 class="pdf-title" style="color: ${settings.templateColors?.titleColor || '#111827'};">
            Prestations Techniques
          </h2>
          <table class="pdf-table keep-together" style="border: 2px solid ${settings.templateColors?.tableBorder || '#E5E7EB'}; background: ${settings.templateColors?.cardBackground || '#ffffff'};">
            <thead>
              <tr style="background: ${settings.templateColors?.tableHeader || '#F9FAFB'};">
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: left;">Référence</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: left;">Type</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: center;">Mode</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: center;">Qté</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: right;">PU HT</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: right;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };

  // Générer le tableau agent avec données de vacation
  const renderAgentTable = (): string => {
    const agentItems = dataContext.items.agent;
    if (agentItems.length === 0) return '';
    
    const rowsHTML = agentItems.map(item => {
      return `
        <tr style="border-bottom: 1px solid ${settings.templateColors?.tableBorder || '#E5E7EB'};">
          <td style="color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            <div class="agent-data">
              <div style="font-weight: 600;">${item.agentType || 'Agent'}</div>
              <div style="font-size: 9px; color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">
                ${item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : ''} 
                ${item.timeStart || ''} - ${item.timeEnd || ''}
              </div>
            </div>
          </td>
          <td style="text-align: center; padding: 3mm 2mm;">
            <span class="badge badge--agent" style="background: ${settings.templateColors?.badgeAgent || '#10B981'}; color: #ffffff;">
              Agent
            </span>
          </td>
          <td style="text-align: center; color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            <div class="agent-hours">
              <div>${(item.hoursTotal || 0).toFixed(1)}h</div>
              ${item.hoursNight ? `<div style="font-size: 9px; color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">Nuit: ${item.hoursNight.toFixed(1)}h</div>` : ''}
              ${item.hoursSunday ? `<div style="font-size: 9px; color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">Dim: ${item.hoursSunday.toFixed(1)}h</div>` : ''}
              ${item.hoursHoliday ? `<div style="font-size: 9px; color: ${settings.templateColors?.mutedTextColor || '#6B7280'};">Fér: ${item.hoursHoliday.toFixed(1)}h</div>` : ''}
            </div>
          </td>
          <td style="text-align: right; color: ${settings.templateColors?.textColor || '#111827'}; padding: 3mm 2mm;">
            ${formatAmount(item.rateCHFh || 0)}/h
          </td>
          <td style="text-align: right; color: ${settings.templateColors?.textColor || '#111827'}; font-weight: 600; padding: 3mm 2mm;">
            ${formatAmount(item.lineHT || 0)}
          </td>
        </tr>
      `;
    }).join('');
    
    return `
      <section class="pdf-a4 avoid-break">
        ${renderPDFHeader(`Devis N° ${quote.ref} - ${dataContext.quoteDate}`)}
        <div class="page-content">
          <h2 class="pdf-title" style="color: ${settings.templateColors?.titleColor || '#111827'};">
            Prestations Agent
          </h2>
          <table class="pdf-table keep-together" style="border: 2px solid ${settings.templateColors?.tableBorder || '#E5E7EB'}; background: ${settings.templateColors?.cardBackground || '#ffffff'};">
            <thead>
              <tr style="background: ${settings.templateColors?.tableHeader || '#F9FAFB'};">
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: left;">Vacation</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: center;">Type</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: center;">Heures</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: right;">Tarif</th>
                <th style="color: ${settings.templateColors?.tableHeaderText || '#111827'}; font-weight: 700; padding: 4mm 2mm; text-align: right;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };

  // Générer les sous-totaux conditionnels et centrés
  const renderTotalsSection = (): string => {
    const cards = [];
    
    // Carte Technique Unique si données
    if (dataContext.totals.unique.ttc > 0) {
      cards.push(`
        <div class="totals-card" style="border-color: ${settings.templateColors?.totalCardBorder || '#FFD400'}; background: ${settings.templateColors?.totalUniqueBackground || '#ffffff'};">
          <h4 style="color: ${settings.templateColors?.primary || '#FFD400'};">TECHNIQUE UNIQUE</h4>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>Sous-total HT:</span>
            <span>${formatAmount(dataContext.totals.unique.ht)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>TVA ${settings.tvaPct}%:</span>
            <span>${formatAmount(dataContext.totals.unique.tva)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'}; font-weight: 700;">
            <span>Total TTC:</span>
            <span>${formatAmount(dataContext.totals.unique.ttc)}</span>
          </div>
        </div>
      `);
    }
    
    // Carte Technique Mensuel si données
    if (dataContext.totals.mensuel.ttc > 0) {
      cards.push(`
        <div class="totals-card" style="border-color: ${settings.templateColors?.totalCardBorder || '#FFD400'}; background: ${settings.templateColors?.totalMensuelBackground || '#ffffff'};">
          <h4 style="color: ${settings.templateColors?.primary || '#FFD400'};">TECHNIQUE MENSUEL</h4>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>Sous-total HT:</span>
            <span>${formatAmount(dataContext.totals.mensuel.ht)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>TVA ${settings.tvaPct}%:</span>
            <span>${formatAmount(dataContext.totals.mensuel.tva)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'}; font-weight: 700;">
            <span>Total TTC:</span>
            <span>${formatAmount(dataContext.totals.mensuel.ttc)}</span>
          </div>
        </div>
      `);
    }
    
    // Carte Agent si données
    if (dataContext.totals.agents.ttc > 0) {
      cards.push(`
        <div class="totals-card" style="border-color: ${settings.templateColors?.totalCardBorder || '#FFD400'}; background: ${settings.templateColors?.cardBackground || '#ffffff'};">
          <h4 style="color: ${settings.templateColors?.primary || '#FFD400'};">AGENT</h4>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>Sous-total HT:</span>
            <span>${formatAmount(dataContext.totals.agents.ht)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'};">
            <span>TVA ${settings.tvaPct}%:</span>
            <span>${formatAmount(dataContext.totals.agents.tva)}</span>
          </div>
          <div class="line" style="color: ${settings.templateColors?.textColor || '#374151'}; font-weight: 700;">
            <span>Total TTC:</span>
            <span>${formatAmount(dataContext.totals.agents.ttc)}</span>
          </div>
        </div>
      `);
    }
    
    const importantRemark = settings.pdfSettings?.importantRemark || 
      "Les heures de nuit, dimanche et jours fériés sont majorées de 10 % selon la CCT.";
    
    return `
      <section class="pdf-a4 avoid-break">
        ${renderPDFHeader(`Devis N° ${quote.ref} - ${dataContext.quoteDate}`)}
        <div class="page-content">
          <div class="totals-section keep-together">
            <div class="totals-row">
              ${cards.join('')}
            </div>
            <div class="grand-total keep-together" style="border-color: ${settings.templateColors?.grandTotalBorder || '#FFD400'}; background: ${settings.templateColors?.grandTotalBackground || '#ffffff'}; color: ${settings.templateColors?.primary || '#FFD400'};">
              TOTAL GÉNÉRAL TTC : ${formatAmount(dataContext.totals.global.ttc)}
            </div>
            ${importantRemark ? `<div class="final-remark" style="color: ${settings.templateColors?.mutedTextColor || '#374151'};">${importantRemark}</div>` : ''}
          </div>
          <div class="final-block keep-together">
            ${renderSignatures()}
          </div>
        </div>
      </section>
    `;
  };

  // Assemblage final du PDF
  const finalHTML = `
    <div id="pdf-root" class="content-zone">
      ${renderCoverPage()}
      ${renderQuoteTables()}
      ${renderTotalsSection()}
    </div>
  `;

  return finalHTML;
};

// Fonction d'export PDF avec les bonnes options
export const exportToPDF = async (html: string, quote: Quote): Promise<void> => {
  const element = document.getElementById('pdf-root');
  if (!element) {
    console.error('Element pdf-root not found');
    return;
  }

  const opt = {
    margin: [10, 12, 10, 12], // Marges en mm
    filename: `devis_${quote.ref}_${new Date(quote.date).toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true,
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.force-break',
      after: '.page-break-after',
      avoid: ['.avoid-break', '.keep-together']
    }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error('Impossible d\'exporter le PDF');
  }
};

// Fonction buildDomFromLayout simplifiée pour compatibilité
export const buildDomFromLayout = async (
  layoutId: string,
  quote: Quote, 
  settings: Settings
): Promise<HTMLElement> => {
  // Pour l'instant, utiliser le nouveau système
  const layout = getDefaultLayoutForVariant('technique'); // Utiliser un layout par défaut
  const htmlString = renderPDFFromLayout(quote, settings, layout);
  
  // Créer un container temporaire
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  return tempDiv.firstElementChild as HTMLElement;
};