// Types pour l'application de devis techniques

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SellerInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  signature?: string; // URL de l'image de signature
}

export interface TemplateColors {
  // Couleurs principales
  primary: string;
  secondary: string;
  accent: string;
  
  // Couleurs de texte
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  mutedTextColor: string;
  
  // Couleurs de fond
  background: string;
  cardBackground: string;
  headerBackground: string;
  
  // Couleurs de tableau
  tableHeader: string;
  tableHeaderText: string;
  tableRow: string;
  tableRowAlt: string;
  tableBorder: string;
  
  // Couleurs des badges
  badgeUnique: string;
  badgeMensuel: string;
  badgeText: string;
  
  // Couleurs des totaux
  totalCardBorder: string;
  totalUniqueBackground: string;
  totalMensuelBackground: string;
  grandTotalBackground: string;
  grandTotalBorder: string;
  
  // Couleurs des bordures et séparateurs
  borderPrimary: string;
  borderSecondary: string;
  separatorColor: string;
  
  // Couleurs spécifiques à la lettre
  letterHeaderColor: string;
  letterDateColor: string;
  letterSubjectColor: string;
  letterSignatureColor: string;
  
  // Couleurs des signatures
  signatureBoxBorder: string;
  signatureBoxBackground: string;
  signatureTitleColor: string;
  signatureTextColor: string;
}

export interface LetterTemplate {
  enabled: boolean;
  companyName: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  companyAddress: string;
  subject: string;
  civility: 'Monsieur' | 'Madame';
  opening: string;
  body: string;
  closing: string;
  textAlignment: 'left' | 'center' | 'right' | 'justify';
}

export interface Settings {
  tvaPct: number;
  priceInputModeDefault: 'TTC' | 'HT';
  currency: Currency;
  logoUrl?: string;
  pdfTitle: string;
  pdfFooter: string;
  defaultComment: string;
  pdfFontFamily: string;
  selectedFont?: string;
  fontFamily?: string;
  customFontName?: string;
  subscriptions: Subscription[];
  types: string[];
  models: PriceModel[];
  catalog: Product[];
  pdfConfig: PDFConfig;
  pdfLayout?: PDFLayout;
  letterTemplate: LetterTemplate;
  sellerInfo: SellerInfo;
  templateColors: TemplateColors;
  defaults: {
    feesInstallHT?: number;
    feesDossierHT?: number;
    showFeesAsLines: boolean;
  };
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after'; // Position du symbole
}

export interface Address {
  company: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
}

export interface Product {
  id: string;
  reference: string;
  name: string;
  description: string;
  type: string;
  priceHT: number;
  priceTTC: number;
  imageUrl?: string;
  active: boolean;
  tags: string[];
}

export interface PDFConfig {
  sections: {
    header: PDFSection;
    clientInfo: PDFSection;
    itemsTable: PDFSection;
    totals: PDFSection;
    footer: PDFSection;
    comments: PDFSection;
  };
  customTexts: {
    [key: string]: string;
  };
}

export interface PDFSection {
  enabled: boolean;
  title?: string;
  content?: string;
  fields: PDFField[];
}

export interface PDFField {
  id: string;
  label: string;
  enabled: boolean;
  text: string;
  order: number;
}

export interface PDFLayoutElement {
  [key: string]: string;
}

export interface PDFLayout {
  logo: PDFLayoutElement;
  header: PDFLayoutElement;
  title: PDFLayoutElement;
  table: PDFLayoutElement;
  totals: PDFLayoutElement;
  grandTotal: PDFLayoutElement;
  signatures: PDFLayoutElement;
  letter: PDFLayoutElement;
}

export interface Subscription {
  id: string;
  label: string;
  puTTC?: number;
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
  clientCivility: 'Monsieur' | 'Madame';
  site: string;
  contact: string;
  canton: string;
  comment: string;
  discountMode: 'per_line' | 'global';
  discountPct?: number;
  items: QuoteItem[];
  addresses: {
    contact: Address;
    billing: Address;
    installation: Address;
    useSeparateAddresses: boolean;
  };
}

export interface QuoteItem {
  id: string;
  type: string;
  reference: string;
  mode: 'unique' | 'mensuel';
  qty?: number;
  unitPriceValue?: number;
  unitPriceMode: 'TTC' | 'HT';
  lineDiscountPct?: number;
  // Computed values
  puHT?: number;
  puTTC?: number;
  totalHT_brut?: number;
  discountHT?: number;
  totalHT_net?: number;
  totalTTC?: number;
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