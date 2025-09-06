// Types pour l'application de devis techniques

export interface Settings {
  tvaPct: number;
  priceInputModeDefault: 'TTC' | 'HT';
  logoUrl?: string;
  pdfTitle: string;
  pdfFooter: string;
  defaultComment: string;
  subscriptions: Subscription[];
  types: string[];
  models: PriceModel[];
  defaults: {
    feesInstallHT?: number;
    feesDossierHT?: number;
    showFeesAsLines: boolean;
  };
}

export interface Subscription {
  id: string;
  label: string;
  puTTC: number;
  active: boolean;
  defaultType: string;
  defaultRef: string;
}

export interface PriceModel {
  id: string;
  type: string;
  reference: string;
  unitPrice: number;
  priceMode: 'TTC' | 'HT';
}

export interface Quote {
  id: string;
  ref: string;
  date: string;
  client: string;
  site: string;
  contact: string;
  canton: string;
  comment: string;
  discountMode: 'per_line' | 'global';
  discountPct: number;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  type: string;
  reference: string;
  mode: 'unique' | 'mensuel';
  qty: number;
  unitPriceValue: number;
  unitPriceMode: 'TTC' | 'HT';
  lineDiscountPct: number;
  // Computed values
  puHT: number;
  puTTC: number;
  totalHT_brut: number;
  discountHT: number;
  totalHT_net: number;
  totalTTC: number;
}

export interface QuoteTotals {
  unique: {
    subtotalHT: number;
    discountHT: number;
    htAfterDiscount: number;
    tva: number;
    totalTTC: number;
  };
  mensuel: {
    subtotalHT: number;
    discountHT: number;
    htAfterDiscount: number;
    tva: number;
    totalTTC: number;
  };
  global: {
    subtotalHT: number;
    globalDiscountHT: number;
    htAfterDiscount: number;
    tva: number;
    totalTTC: number;
  };
}