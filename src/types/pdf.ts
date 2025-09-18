export type PdfBrand = {
  logoUrl?: string;
  sellerName?: string;
  sellerTitle?: string;
  sellerSignatureUrl?: string;
  theme: {
    page: { marginMm: number; fontFamily: string; fontSize: number };
    color: { text: string; muted: string; accent: string; border: string; tableHeaderBg: string; zebraBg: string };
    radius: { sm: number; md: number };
    gap: { xs: number; sm: number; md: number; lg: number };
    badge: { heightPx: number; radiusPx: number };
  };
};

export type PdfContent = {
  introHtml: string;                // lettre de présentation
  remark: string;                   // remarque sous total
  missionsTemplate: {
    showIfAgent: boolean;
    hideEmptyFields: boolean;
    labels?: Record<string,string>; // surcharges de libellés
  };
};

export type PdfLayout = {
  sectionsOrder: Array<'intro'|'missions'|'tech'|'agent'|'closing'>;
  intro: {
    showSellerSignatureOnIntro: boolean;
  };
  tech: {
    title: { show: boolean; text: string; badge?: string };
    table: {
      repeatHeaderEachPage: boolean;
      zebra: boolean;
      border: string;                 // ex: "1px solid var(--c-border)"
      columns: string[];              // ex: ["reference","type","qty","puHT","vat","totalHT_net","totalTTC"]
      labels?: Record<string,string>; // libellés par colonne
      colAlign?: Record<string,'left'|'right'|'center'>;
    };
  };
  agent: {
    title: { show: boolean; text: string; badge?: string };
    table: {
      repeatHeaderEachPage: boolean;
      zebra: boolean;
      border: string;
      columns: string[];              // ex: ["reference","agentType","start","end","hoursNormal","hoursExtra","rateCHFh","totalHT_net"]
      labels?: Record<string,string>;
      colAlign?: Record<string,'left'|'right'|'center'>;
    };
  };
  closing: {
    keepTogether: boolean;            // totaux+signatures jamais coupés
    separators?: 'accent'|'hairline'|'none';
  };
};

export type PdfTemplateConfig = {
  id: string;
  name: string;            // ex: "GPA – Classique"
  engine: 'handlebars';
  brand: PdfBrand;
  content: PdfContent;
  layout: PdfLayout;
  cssOverrides?: string;   // CSS additionnel optionnel
};