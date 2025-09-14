import html2pdf from "html2pdf.js";
import type { Quote, Settings } from '@/types';
import { calculateQuoteTotals } from './calculations';
import { renderAgentDescriptionToPDF, hasAgentDescriptionContent } from './agentDescriptionRenderer';

/**
 * Système de rendu PDF professionnel avec pagination stricte
 * Respecte l'ordre obligatoire des pages et les règles de coupure
 */

interface PDFPage {
  type: 'presentation' | 'description' | 'devis';
  content: string;
  breakAfter: boolean;
}

export class ProfessionalPDFRenderer {
  private quote: Quote;
  private settings: Settings;
  private totals: any;
  private colors: any;

  constructor(quote: Quote, settings: Settings) {
    this.quote = quote;
    this.settings = settings;
    this.totals = calculateQuoteTotals(quote, settings.tvaPct);
    this.colors = this.getColors();
  }

  private getColors() {
    return this.settings.templateColors || {
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
  }

  /**
   * Point d'entrée principal - génère le DOM avec l'ordre strict des pages
   */
  public async generateDOM(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.setAttribute('data-a4-root', 'true');
    
    // Injecter les styles CSS professionnels
    const style = document.createElement("style");
    style.textContent = this.getProfessionalCSS();
    container.prepend(style);

    const pages = this.buildPages();
    
    // Générer les pages dans l'ordre strict
    for (const page of pages) {
      const pageElement = document.createElement('div');
      pageElement.className = `pdf-page page-${page.type}`;
      if (page.breakAfter) {
        pageElement.classList.add('page-break-after');
      }
      pageElement.innerHTML = page.content;
      container.appendChild(pageElement);
    }

    return container;
  }

  /**
   * Construction des pages dans l'ordre obligatoire
   */
  private buildPages(): PDFPage[] {
    const pages: PDFPage[] = [];

    // 1. PAGE PRÉSENTATION (obligatoire si activée)
    if (this.settings.letterTemplate?.enabled) {
      pages.push({
        type: 'presentation',
        content: this.renderPresentationPage(),
        breakAfter: true
      });
    }

    // 2. PAGE DESCRIPTION DES PRESTATIONS (si agent et contenu présent)
    const variant = this.getQuoteVariant();
    if (variant === 'agent' && this.settings.agentDescription?.enabled && 
        hasAgentDescriptionContent(this.quote.agentDescription)) {
      pages.push({
        type: 'description',
        content: this.renderDescriptionPage(),
        breakAfter: true
      });
    }

    // 3. PAGES DEVIS (tableaux, récap, signatures)
    pages.push({
      type: 'devis',
      content: this.renderDevisPages(),
      breakAfter: false
    });

    return pages;
  }

  /**
   * CSS professionnel avec règles de pagination strictes
   */
  private getProfessionalCSS(): string {
    return `
      /* Gabarit A4 avec marges sécurisées */
      @page { 
        size: A4; 
        margin: 12mm; 
      }
      
      html, body { 
        height: auto !important; 
        margin: 0;
        padding: 0;
      }
      
      [data-a4-root] {
        font-family: Arial, sans-serif;
        color: ${this.colors.textColor};
        background: ${this.colors.background};
        max-width: 186mm; /* A4 - 2*12mm marges */
        margin: 0 auto;
      }

      /* Sections qui ne doivent jamais être coupées */
      .page-intro, .page-description, .block-signatures, .block-totaux, .resume-cartouches {
        break-inside: avoid; 
        page-break-inside: avoid;
      }

      /* Page présentation = toujours 1/1 */
      .page-presentation {
        page-break-before: always;
        page-break-after: always;
        min-height: 273mm; /* A4 - marges */
        max-height: 273mm;
        overflow: hidden;
        position: relative;
      }

      /* Page description = page entière */
      .page-description {
        page-break-before: always;
        page-break-after: always;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      /* Tableaux : en-têtes répétés + lignes non coupées */
      .table-devis { 
        width: 100%; 
        border-collapse: collapse;
        margin: 15px 0;
        border: 1px solid ${this.colors.tableBorder};
      }
      
      .table-devis thead { 
        display: table-header-group;
        background: ${this.colors.tableHeader} !important;
      }
      
      .table-devis tfoot { 
        display: table-footer-group; 
      }
      
      .table-devis tr { 
        break-inside: avoid; 
        page-break-inside: avoid; 
      }

      /* Éviter les coupures dans les cellules multi-lignes */
      .table-devis td, .table-devis th { 
        break-inside: avoid; 
        page-break-inside: avoid;
        padding: 8px;
        border: 1px solid ${this.colors.tableBorder};
        vertical-align: middle;
      }

      .table-devis thead th {
        background: ${this.colors.tableHeader} !important;
        color: ${this.colors.tableHeaderText} !important;
        font-weight: bold;
      }

      .table-devis tbody tr:nth-child(even) {
        background: ${this.colors.tableRowAlt};
      }

      .table-devis tbody tr:nth-child(odd) {
        background: ${this.colors.tableRow};
      }

      /* Cartouches récap sur une même page */
      .resume-cartouches {
        break-inside: avoid;
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
        margin: 30px 0;
      }
      
      .resume-cartouches > .cartouche { 
        break-inside: avoid;
        background: ${this.colors.cardBackground};
        border: 2px solid ${this.colors.primary};
        border-radius: 8px;
        padding: 15px;
        min-width: 200px;
        text-align: center;
      }

      /* Signatures toujours sur la même page */
      .block-signatures { 
        page-break-before: avoid; 
        page-break-after: avoid;
        break-inside: avoid;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 30px;
      }

      .signature-block {
        border: 1px solid ${this.colors.signatureBoxBorder};
        background: ${this.colors.signatureBoxBackground};
        padding: 15px;
        border-radius: 6px;
        min-height: 80px;
      }

      .signature-name {
        font-weight: bold;
        color: ${this.colors.signatureTitleColor};
        margin-bottom: 5px;
      }

      .signature-title {
        color: ${this.colors.signatureTextColor};
        font-size: 12px;
        margin-bottom: 10px;
      }

      .signature-image {
        max-height: 40px;
        max-width: 120px;
        margin-top: 10px;
      }

      /* Template répété : en-tête sur chaque page */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 0;
        border-bottom: 2px solid ${this.colors.primary};
        margin-bottom: 20px;
      }

      .page-header .logo {
        max-height: 60px;
      }

      .page-header .info {
        text-align: right;
        font-size: 10pt;
      }

      /* Pagination visible */
      .page-footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid ${this.colors.separatorColor};
        color: ${this.colors.mutedTextColor};
        font-size: 10pt;
      }

      /* Badges */
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        color: ${this.colors.badgeText};
      }

      .badge--unique { background: ${this.colors.badgeUnique}; }
      .badge--mensuel { background: ${this.colors.badgeMensuel}; }
      .badge--agent { background: ${this.colors.badgeAgent}; }

      /* Remarque importante */
      .important-note {
        margin-top: 20px;
        padding: 10px;
        background: #f9f9f9;
        border-left: 4px solid ${this.colors.accent};
        font-size: 11px;
        color: ${this.colors.mutedTextColor};
        break-inside: avoid;
      }

      /* Utilitaires de coupure */
      .no-break { 
        break-inside: avoid !important; 
        page-break-inside: avoid !important; 
      }
      
      .page-break-after { 
        page-break-after: always !important; 
      }
      
      .page-break-before { 
        page-break-before: always !important; 
      }
    `;
  }

  /**
   * Rendu de la page de présentation (1/1 strict)
   */
  private renderPresentationPage(): string {
    const template = this.settings.letterTemplate;
    if (!template?.enabled) return '';

    return `
      <div class="presentation-content">
        ${this.renderPageHeader()}
        
        <div style="margin: 40px 0;">
          <div style="text-align: ${template.textAlignment || 'left'};">
            <div style="margin-bottom: 30px;">
              <div style="font-size: 14pt; color: ${this.colors.letterSubjectColor}; margin-bottom: 20px; ${template.boldOptions?.subject ? 'font-weight: bold;' : ''}">
                ${this.replacePlaceholders(template.subject)}
              </div>
              
              <div style="margin-bottom: 20px; ${template.boldOptions?.opening ? 'font-weight: bold;' : ''}">
                ${this.replacePlaceholders(template.opening)}
              </div>
              
              <div style="line-height: 1.6; margin-bottom: 20px; ${template.boldOptions?.body ? 'font-weight: bold;' : ''}">
                ${this.replacePlaceholders(template.body)}
              </div>
              
              <div style="${template.boldOptions?.closing ? 'font-weight: bold;' : ''}">
                ${this.replacePlaceholders(template.closing)}
              </div>
            </div>
          </div>
        </div>

        <!-- Signature vendeur en bas de page -->
        <div style="position: absolute; bottom: 40px; left: 0;">
          <div class="signature-block" style="width: 200px;">
            <div class="signature-name">${this.settings.sellerInfo?.name || ''}</div>
            <div class="signature-title">${this.settings.sellerInfo?.title || ''}</div>
            ${this.settings.sellerInfo?.signature ? 
              `<img src="${this.settings.sellerInfo.signature}" class="signature-image" alt="Signature" />` : 
              '<div style="border-bottom: 1px dotted #ccc; height: 30px; margin-top: 10px;"></div>'
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu de la page description des prestations
   */
  private renderDescriptionPage(): string {
    if (!hasAgentDescriptionContent(this.quote.agentDescription)) return '';
    
    return `
      <div class="description-content">
        ${this.renderPageHeader()}
        ${renderAgentDescriptionToPDF(this.quote.agentDescription!)}
      </div>
    `;
  }

  /**
   * Rendu des pages de devis (tableaux, récap, signatures)
   */
  private renderDevisPages(): string {
    const variant = this.getQuoteVariant();
    let content = `<div class="devis-content">${this.renderPageHeader()}`;

    // Informations client
    content += this.renderClientInfo();

    // Tableaux selon la variante
    if (variant === 'technique' || variant === 'mixte') {
      const techItems = this.quote.items.filter(item => item.kind === 'TECH');
      if (techItems.length > 0) {
        content += this.renderTechTable(techItems);
      }
    }

    if (variant === 'agent' || variant === 'mixte') {
      const agentItems = this.quote.items.filter(item => item.kind === 'AGENT');
      if (agentItems.length > 0) {
        content += this.renderAgentTable(agentItems);
      }
    }

    // Cartouches récap et total général
    content += this.renderTotalsSection();

    // Remarque importante
    if (this.settings.importantNote?.trim()) {
      content += `
        <div class="important-note">
          <strong>Remarque importante :</strong><br>
          ${this.settings.importantNote.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    // Signatures
    content += this.renderSignatures();

    content += '</div>';
    return content;
  }

  /**
   * En-tête répété sur chaque page
   */
  private renderPageHeader(): string {
    return `
      <div class="page-header">
        <div>
          ${this.settings.logoUrl ? 
            `<img src="${this.settings.logoUrl}" class="logo" alt="Logo" />` : 
            `<div style="font-size: 18pt; font-weight: bold; color: ${this.colors.primary};">GPA Sécurité</div>`
          }
        </div>
        <div class="info">
          <div style="font-weight: bold;">Devis n° ${this.quote.ref}</div>
          <div>Date : ${new Date(this.quote.date).toLocaleDateString('fr-CH')}</div>
          ${this.settings.sellerInfo?.name ? `<div>${this.settings.sellerInfo.name}</div>` : ''}
          ${this.settings.sellerInfo?.phone ? `<div>${this.settings.sellerInfo.phone}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Informations client
   */
  private renderClientInfo(): string {
    return `
      <div class="client-info no-break" style="margin-bottom: 30px;">
        <h3 style="color: ${this.colors.titleColor}; border-bottom: 1px solid ${this.colors.separatorColor}; padding-bottom: 5px;">
          À l'attention de :
        </h3>
        <div style="margin-left: 10px;">
          <div><strong>${this.quote.clientCivility} ${this.quote.client}</strong></div>
          ${this.quote.site ? `<div>Site : ${this.quote.site}</div>` : ''}
          ${this.quote.contact ? `<div>Contact : ${this.quote.contact}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Tableau technique avec en-têtes répétés
   */
  private renderTechTable(items: any[]): string {
    const title = `
      <h3 style="color: ${this.colors.primary}; background: ${this.colors.headerBackground}; padding: 8px; border-radius: 4px; margin: 20px 0 10px 0;">
        ■ MATÉRIEL ET PRESTATIONS TECHNIQUES
      </h3>
    `;

    const table = `
      <table class="table-devis">
        <thead>
          <tr>
            <th style="width: 20%;">Type</th>
            <th style="width: 30%;">Référence produit</th>
            <th style="width: 10%;">Mode</th>
            <th style="width: 8%;">Qté</th>
            <th style="width: 16%;">Prix unit. TTC</th>
            <th style="width: 16%;">Total TTC</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.type}</td>
              <td>${item.reference}</td>
              <td style="text-align: center;">
                <span class="badge badge--${item.mode}">${item.mode}</span>
              </td>
              <td style="text-align: center;">${item.qty || 1}</td>
              <td style="text-align: right;">${(item.puTTC || 0).toFixed(2)} CHF</td>
              <td style="text-align: right;">${(item.totalTTC || 0).toFixed(2)} CHF</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    return title + table;
  }

  /**
   * Tableau agent avec en-têtes répétés
   */
  private renderAgentTable(items: any[]): string {
    const title = `
      <h3 style="color: ${this.colors.badgeAgent}; background: ${this.colors.headerBackground}; padding: 8px; border-radius: 4px; margin: 20px 0 10px 0;">
        ■ PLANNING DES VACATIONS
      </h3>
    `;

    const table = `
      <table class="table-devis">
        <thead>
          <tr>
            <th style="width: 12%;">Date début</th>
            <th style="width: 8%;">H début</th>
            <th style="width: 12%;">Date fin</th>
            <th style="width: 8%;">H fin</th>
            <th style="width: 15%;">Type agent</th>
            <th style="width: 8%;">H norm.</th>
            <th style="width: 8%;">H nuit</th>
            <th style="width: 8%;">H dim.</th>
            <th style="width: 8%;">H JF</th>
            <th style="width: 8%;">CHF/h</th>
            <th style="width: 10%;">Total TTC</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : ''}</td>
              <td style="text-align: center;">${item.timeStart || ''}</td>
              <td>${item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : ''}</td>
              <td style="text-align: center;">${item.timeEnd || ''}</td>
              <td>${item.agentType || ''}</td>
              <td style="text-align: center;">${(item.hoursNormal || 0).toFixed(1)}h</td>
              <td style="text-align: center;">${(item.hoursNight || 0).toFixed(1)}h</td>
              <td style="text-align: center;">${(item.hoursSunday || 0).toFixed(1)}h</td>
              <td style="text-align: center;">${(item.hoursHoliday || 0).toFixed(1)}h</td>
              <td style="text-align: right;">${(item.rateCHFh || 0).toFixed(2)}</td>
              <td style="text-align: right;">${(item.lineTTC || 0).toFixed(2)} CHF</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    return title + table;
  }

  /**
   * Section des totaux avec cartouches alignés
   */
  private renderTotalsSection(): string {
    const cartouches: string[] = [];

    // Technique unique
    if (this.totals.unique.totalTTC > 0) {
      cartouches.push(`
        <div class="cartouche">
          <div style="font-weight: bold; color: ${this.colors.badgeUnique}; margin-bottom: 5px;">TECHNIQUE UNIQUE</div>
          <div style="font-size: 18pt; font-weight: bold;">${this.totals.unique.totalTTC.toFixed(2)} CHF</div>
        </div>
      `);
    }

    // Technique mensuel
    if (this.totals.mensuel.totalTTC > 0) {
      cartouches.push(`
        <div class="cartouche">
          <div style="font-weight: bold; color: ${this.colors.badgeMensuel}; margin-bottom: 5px;">TECHNIQUE MENSUEL</div>
          <div style="font-size: 18pt; font-weight: bold;">${this.totals.mensuel.totalTTC.toFixed(2)} CHF</div>
        </div>
      `);
    }

    // Agent
    if (this.totals.agents.totalTTC > 0) {
      cartouches.push(`
        <div class="cartouche">
          <div style="font-weight: bold; color: ${this.colors.badgeAgent}; margin-bottom: 5px;">AGENT</div>
          <div style="font-size: 18pt; font-weight: bold;">${this.totals.agents.totalTTC.toFixed(2)} CHF</div>
        </div>
      `);
    }

    // Total général
    const totalGeneral = `
      <div class="cartouche" style="border-color: ${this.colors.grandTotalBorder}; background: ${this.colors.grandTotalBackground};">
        <div style="font-weight: bold; color: ${this.colors.titleColor}; margin-bottom: 5px;">TOTAL GÉNÉRAL</div>
        <div style="font-size: 22pt; font-weight: bold; color: ${this.colors.primary};">${this.totals.global.totalTTC.toFixed(2)} CHF</div>
        <div style="font-size: 10pt; color: ${this.colors.mutedTextColor}; margin-top: 5px;">
          HT: ${this.totals.global.htAfterDiscount.toFixed(2)} CHF • TVA: ${this.totals.global.tva.toFixed(2)} CHF
        </div>
      </div>
    `;

    return `
      <div class="resume-cartouches">
        ${cartouches.join('')}
        ${totalGeneral}
      </div>
    `;
  }

  /**
   * Bloc signatures
   */
  private renderSignatures(): string {
    return `
      <div class="block-signatures">
        <div class="signature-block">
          <div class="signature-name">Le prestataire</div>
          <div class="signature-title">GPA Sécurité</div>
          ${this.settings.sellerInfo?.signature ? 
            `<img src="${this.settings.sellerInfo.signature}" class="signature-image" alt="Signature vendeur" />` : 
            '<div style="border-bottom: 1px dotted #ccc; height: 30px; margin-top: 10px;"></div>'
          }
          <div style="margin-top: 10px; font-size: 10pt;">
            Date : ${new Date().toLocaleDateString('fr-CH')}<br>
            Lieu : ${this.settings.sellerInfo?.location || 'Genève'}
          </div>
        </div>
        
        <div class="signature-block">
          <div class="signature-name">Le client</div>
          <div class="signature-title">${this.quote.clientCivility} ${this.quote.client}</div>
          ${this.quote.clientSignature ? 
            `<img src="${this.quote.clientSignature}" class="signature-image" alt="Signature client" />` : 
            '<div style="border-bottom: 1px dotted #ccc; height: 30px; margin-top: 10px;"></div>'
          }
          <div style="margin-top: 10px; font-size: 10pt;">
            Date : ___________<br>
            Nom et signature :
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Détermine la variante du devis
   */
  private getQuoteVariant(): 'technique' | 'agent' | 'mixte' {
    const hasTech = this.quote.items.some(item => item.kind === 'TECH');
    const hasAgent = this.quote.items.some(item => item.kind === 'AGENT');
    
    if (hasTech && hasAgent) return 'mixte';
    if (hasAgent) return 'agent';
    return 'technique';
  }

  /**
   * Remplace les placeholders dans le texte
   */
  private replacePlaceholders(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\{\{client\.name\}\}/g, this.quote.client || '')
      .replace(/\{\{client\.civility\}\}/g, this.quote.clientCivility || '')
      .replace(/\{\{quote\.ref\}\}/g, this.quote.ref || '')
      .replace(/\{\{quote\.date\}\}/g, new Date(this.quote.date).toLocaleDateString('fr-CH'))
      .replace(/\{\{seller\.name\}\}/g, this.settings.sellerInfo?.name || '')
      .replace(/\{\{seller\.title\}\}/g, this.settings.sellerInfo?.title || '')
      .replace(/\{\{quote\.site\}\}/g, this.quote.site || '')
      .replace(/\{\{quote\.contact\}\}/g, this.quote.contact || '');
  }
}

/**
 * Fonction d'export pour compatibilité
 */
export async function renderProfessionalPDF(
  quote: Quote,
  settings: Settings
): Promise<HTMLElement> {
  const renderer = new ProfessionalPDFRenderer(quote, settings);
  return await renderer.generateDOM();
}

/**
 * Export PDF avec options html2pdf unifiées
 */
export async function exportProfessionalPDF(
  quote: Quote,
  settings: Settings,
  filename?: string
): Promise<void> {
  const dom = await renderProfessionalPDF(quote, settings);
  
  const options = {
    pagebreak: { mode: ['css', 'avoid-all'] },
    margin: [12, 12, 12, 12], // mm
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      allowTaint: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      compress: true 
    },
    printBackground: true,
    preferCSSPageSize: true
  };

  const finalFilename = filename || `Devis_${quote.ref}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  await html2pdf().from(dom).set(options).save(finalFilename);
}