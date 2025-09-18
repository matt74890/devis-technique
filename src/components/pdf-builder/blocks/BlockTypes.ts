import type { Quote, Settings } from '@/types';

export interface PDFBlock {
  id: string;
  type: BlockType;
  name: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: BlockStyle;
  content?: any;
  visible?: boolean;
}

export type BlockType = 
  | 'header' 
  | 'client-info' 
  | 'quote-details' 
  | 'items-table' 
  | 'totals' 
  | 'signature' 
  | 'text'
  | 'image'
  | 'spacer'
  | 'page-break';

export interface BlockStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface BlockRenderContext {
  quote: Quote;
  settings: Settings;
  pageWidth: number;
  pageHeight: number;
  currentPage: number;
}

export interface BlockDefinition {
  type: BlockType;
  name: string;
  icon: string;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  render: (block: PDFBlock, context: BlockRenderContext) => string;
  configure?: (block: PDFBlock) => React.ReactNode;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  'header': {
    type: 'header',
    name: 'En-tête',
    icon: 'Layout',
    defaultSize: { width: 100, height: 15 },
    minSize: { width: 50, height: 10 },
    render: (block, context) => `
      <div class="flex justify-between items-center p-4 border-b">
        <div>
          ${context.settings.logoUrl ? `<img src="${context.settings.logoUrl}" alt="Logo" class="h-12">` : ''}
          <h1 class="text-2xl font-bold">${context.settings.sellerInfo.name}</h1>
        </div>
        <div class="text-right">
          <div class="text-lg font-semibold">DEVIS N° ${context.quote.ref}</div>
          <div>Date: ${new Date(context.quote.date).toLocaleDateString('fr-CH')}</div>
        </div>
      </div>
    `
  },
  
  'client-info': {
    type: 'client-info',
    name: 'Informations client',
    icon: 'User',
    defaultSize: { width: 48, height: 25 },
    minSize: { width: 30, height: 15 },
    render: (block, context) => `
      <div class="p-4 border rounded">
        <h3 class="font-bold mb-2">Informations client</h3>
        <div><strong>Client:</strong> ${context.quote.client}</div>
        <div><strong>Site:</strong> ${context.quote.site || 'N/A'}</div>
        <div><strong>Contact:</strong> ${context.quote.contact || 'N/A'}</div>
        ${context.quote.addresses?.contact?.email ? `<div><strong>Email:</strong> ${context.quote.addresses.contact.email}</div>` : ''}
        ${context.quote.addresses?.contact?.phone ? `<div><strong>Tél:</strong> ${context.quote.addresses.contact.phone}</div>` : ''}
      </div>
    `
  },
  
  'quote-details': {
    type: 'quote-details',
    name: 'Détails devis',
    icon: 'FileText',
    defaultSize: { width: 48, height: 20 },
    minSize: { width: 30, height: 15 },
    render: (block, context) => `
      <div class="p-4 bg-gray-50 rounded">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Référence:</strong> ${context.quote.ref}</div>
          <div><strong>Date:</strong> ${new Date(context.quote.date).toLocaleDateString('fr-CH')}</div>
          <div><strong>Canton:</strong> ${context.quote.canton || 'N/A'}</div>
          <div><strong>Validité:</strong> 30 jours</div>
        </div>
      </div>
    `
  },
  
  'items-table': {
    type: 'items-table',
    name: 'Tableau des articles',
    icon: 'Table', 
    defaultSize: { width: 100, height: 40 },
    minSize: { width: 80, height: 30 },
    render: (block, context) => {
      const items = context.quote.items;
      if (!items.length) return '<div class="text-center p-4 text-gray-500">Aucun article</div>';
      
      return `
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Description</th>
                <th class="border p-2 text-center">Quantité</th>
                <th class="border p-2 text-right">Prix unitaire</th>
                <th class="border p-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td class="border p-2">${item.reference || item.type || 'Article'}</td>
                  <td class="border p-2 text-center">${item.qty || 1}</td>
                  <td class="border p-2 text-right">${(item.unitPriceValue || 0).toFixed(2)} ${context.settings.currency.symbol}</td>
                  <td class="border p-2 text-right">${(item.lineTTC || 0).toFixed(2)} ${context.settings.currency.symbol}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  },
  
  'totals': {
    type: 'totals',
    name: 'Totaux',
    icon: 'Calculator',
    defaultSize: { width: 50, height: 25 },
    minSize: { width: 40, height: 20 },
    render: (block, context) => {
      const totals = context.quote.items.reduce((acc, item) => {
        acc.ht += item.lineTTC || 0;
        return acc;
      }, { ht: 0, tva: 0, ttc: 0 });
      
      totals.tva = totals.ht * (context.settings.tvaPct / 100);
      totals.ttc = totals.ht + totals.tva;
      
      return `
        <div class="ml-auto w-96 p-4 border rounded bg-gray-50">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Sous-total HT:</span>
              <span>${totals.ht.toFixed(2)} ${context.settings.currency.symbol}</span>
            </div>
            <div class="flex justify-between">
              <span>TVA (${context.settings.tvaPct}%):</span>
              <span>${totals.tva.toFixed(2)} ${context.settings.currency.symbol}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total TTC:</span>
              <span>${totals.ttc.toFixed(2)} ${context.settings.currency.symbol}</span>
            </div>
          </div>
        </div>
      `;
    }
  },
  
  'signature': {
    type: 'signature',
    name: 'Signatures',
    icon: 'PenTool',
    defaultSize: { width: 100, height: 30 },
    minSize: { width: 60, height: 20 },
    render: (block, context) => `
      <div class="grid grid-cols-2 gap-8 p-4">
        <div class="text-center">
          <div class="border-t border-gray-400 pt-2 mt-16">
            <strong>Signature du client</strong>
            <br><small>Bon pour accord</small>
          </div>
        </div>
        <div class="text-center">
          <div class="border-t border-gray-400 pt-2 mt-16">
            <strong>${context.settings.sellerInfo.name}</strong>
            <br><small>Signature du vendeur</small>
          </div>
        </div>
      </div>
    `
  },
  
  'text': {
    type: 'text',
    name: 'Texte libre',
    icon: 'Type',
    defaultSize: { width: 100, height: 15 },
    minSize: { width: 20, height: 5 },
    render: (block, context) => `
      <div class="p-4" style="${block.style ? `
        color: ${block.style.color || '#000'};
        font-size: ${block.style.fontSize || 14}px;
        font-weight: ${block.style.fontWeight || 'normal'};
        text-align: ${block.style.textAlign || 'left'};
      ` : ''}">
        ${block.content?.text || 'Texte à personnaliser...'}
      </div>
    `
  },
  
  'image': {
    type: 'image',
    name: 'Image',
    icon: 'Image',
    defaultSize: { width: 30, height: 20 },
    minSize: { width: 10, height: 10 },
    render: (block, context) => `
      <div class="text-center p-4">
        ${block.content?.src ? 
          `<img src="${block.content.src}" alt="${block.content.alt || 'Image'}" class="max-w-full h-auto">` :
          `<div class="border-2 border-dashed border-gray-300 p-8 text-gray-500">
            Cliquez pour ajouter une image
          </div>`
        }
      </div>
    `
  },
  
  'spacer': {
    type: 'spacer',
    name: 'Espace',
    icon: 'Minus',
    defaultSize: { width: 100, height: 5 },
    minSize: { width: 100, height: 1 },
    render: (block, context) => `
      <div style="height: ${block.size.height}%;"></div>
    `
  },
  
  'page-break': {
    type: 'page-break',
    name: 'Saut de page',
    icon: 'FileX',
    defaultSize: { width: 100, height: 2 },
    minSize: { width: 100, height: 2 },
    render: (block, context) => `
      <div style="page-break-before: always;"></div>
    `
  }
};