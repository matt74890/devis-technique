import { PdfTemplateConfig } from "@/types/pdf";
import { Quote } from "@/types";

const sum = (arr: any[], key: string) => arr.reduce((s, i) => s + Number(i[key] || 0), 0);

export function buildRenderData(quote: Quote, tpl: PdfTemplateConfig) {
  const items = quote.items || [];
  const techItems = items.filter(i => i.kind === 'TECH' || i.kind === 'SERVICE');
  const agentItems = items.filter(i => i.kind === 'AGENT');

  const techTotals = { ht: sum(techItems, 'totalHT_net'), ttc: sum(techItems, 'totalTTC') };
  const agentTotals = { ht: sum(agentItems, 'totalHT_net'), ttc: sum(agentItems, 'totalTTC') };

  const totals = {
    ht: sum(items, 'totalHT_net'),
    ttc: sum(items, 'totalTTC'),
    vat: sum(items, 'totalTTC') - sum(items, 'totalHT_net'),
    remark: tpl.content.remark || ''
  };

  // Determine quote type
  const hasTech = techItems.length > 0;
  const hasAgent = agentItems.length > 0;
  let quoteType = '';
  if (hasTech && hasAgent) {
    quoteType = 'Devis technique & agent';
  } else if (hasAgent) {
    quoteType = 'Devis agent';
  } else if (hasTech) {
    quoteType = 'Devis technique';
  } else {
    quoteType = 'Devis';
  }

  return {
    meta: { 
      quoteRef: quote.ref || '—', 
      date: quote.date, 
      locale: 'fr-CH',
      quoteType
    },
    seller: {
      company: 'GPA',
      name: tpl.brand.sellerName || '',
      title: tpl.brand.sellerTitle || '',
      logoUrl: tpl.brand.logoUrl || '',
      signatureUrl: tpl.brand.sellerSignatureUrl || ''
    },
    client: {
      civility: quote.clientCivility || '',
      fullName: quote.client || '',
      company: quote.addresses?.contact?.company || ''
    },
    pricing: { currency: 'CHF', vatRate: 8.1, precision: 2 },
    theme: tpl.brand.theme,
    layout: tpl.layout,
    content: tpl.content,
    addresses: quote.addresses,
    agentDescription: quote.agentDescription || {},
    tech: { items: techItems, totals: techTotals },
    agent: { items: agentItems, totals: agentTotals },
    totals,
    raw: quote
  };
}