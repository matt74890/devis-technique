import { QuoteItem, Quote, QuoteTotals } from '@/types';

export const calculateQuoteItem = (
  item: QuoteItem, 
  tvaPct: number, 
  isPerLineDiscount: boolean
): QuoteItem => {
  const tvaMultiplier = 1 + (tvaPct / 100);
  
  // Valeurs par défaut pour les calculs
  const qty = item.qty || 1;
  const unitPriceValue = item.unitPriceValue || 0;
  const lineDiscountPct = item.lineDiscountPct || 0;
  
  // Calcul PU HT et TTC
  let puHT: number, puTTC: number;
  
  if (item.unitPriceMode === 'HT') {
    puHT = unitPriceValue;
    puTTC = puHT * tvaMultiplier;
  } else {
    puTTC = unitPriceValue;
    puHT = puTTC / tvaMultiplier;
  }
  
  // Calcul totaux bruts
  const totalHT_brut = puHT * qty;
  const totalTTC_brut = puTTC * qty;
  
  // Calcul remise ligne (si mode per_line)
  const discountHT = isPerLineDiscount ? 
    totalHT_brut * (lineDiscountPct / 100) : 0;
  
  // Calcul totaux nets
  const totalHT_net = totalHT_brut - discountHT;
  const totalTTC = totalHT_net * tvaMultiplier;
  
  return {
    ...item,
    puHT,
    puTTC,
    totalHT_brut,
    discountHT,
    totalHT_net,
    totalTTC
  };
};

export const calculateQuoteTotals = (quote: Quote, tvaPct: number): QuoteTotals => {
  const tvaMultiplier = 1 + (tvaPct / 100);
  
  // Séparer les items unique vs mensuel
  const uniqueItems = quote.items.filter(item => item.mode === 'unique');
  const mensuelItems = quote.items.filter(item => item.mode === 'mensuel');
  
  // Calculs pour unique
  const uniqueSubtotalHT = uniqueItems.reduce((sum, item) => sum + (item.totalHT_net || 0), 0);
  const uniqueDiscountHT = quote.discountMode === 'per_line' 
    ? uniqueItems.reduce((sum, item) => sum + (item.discountHT || 0), 0)
    : 0;
  
  // Calculs pour mensuel
  const mensuelSubtotalHT = mensuelItems.reduce((sum, item) => sum + (item.totalHT_net || 0), 0);
  const mensuelDiscountHT = quote.discountMode === 'per_line'
    ? mensuelItems.reduce((sum, item) => sum + (item.discountHT || 0), 0)
    : 0;
  
  // Calculs globaux
  const globalSubtotalHT = uniqueSubtotalHT + mensuelSubtotalHT;
  const globalDiscountHT = quote.discountMode === 'global' 
    ? globalSubtotalHT * ((quote.discountPct || 0) / 100)
    : 0;
  
  // Si remise globale, répartition proportionnelle
  let uniqueGlobalDiscountHT = 0;
  let mensuelGlobalDiscountHT = 0;
  
  if (quote.discountMode === 'global' && globalSubtotalHT > 0) {
    const uniqueRatio = uniqueSubtotalHT / globalSubtotalHT;
    const mensuelRatio = mensuelSubtotalHT / globalSubtotalHT;
    
    uniqueGlobalDiscountHT = globalDiscountHT * uniqueRatio;
    mensuelGlobalDiscountHT = globalDiscountHT * mensuelRatio;
  }
  
  // Totaux finaux par section
  const uniqueHtAfterDiscount = uniqueSubtotalHT - (uniqueDiscountHT + uniqueGlobalDiscountHT);
  const uniqueTva = uniqueHtAfterDiscount * (tvaPct / 100);
  const uniqueTotalTTC = uniqueHtAfterDiscount + uniqueTva;
  
  const mensuelHtAfterDiscount = mensuelSubtotalHT - (mensuelDiscountHT + mensuelGlobalDiscountHT);
  const mensuelTva = mensuelHtAfterDiscount * (tvaPct / 100);
  const mensuelTotalTTC = mensuelHtAfterDiscount + mensuelTva;
  
  // Totaux globaux finaux
  const globalHtAfterDiscount = globalSubtotalHT - globalDiscountHT;
  const globalTva = globalHtAfterDiscount * (tvaPct / 100);
  const globalTotalTTC = globalHtAfterDiscount + globalTva;
  
  return {
    unique: {
      subtotalHT: uniqueSubtotalHT,
      discountHT: uniqueDiscountHT + uniqueGlobalDiscountHT,
      htAfterDiscount: uniqueHtAfterDiscount,
      tva: uniqueTva,
      totalTTC: uniqueTotalTTC
    },
    mensuel: {
      subtotalHT: mensuelSubtotalHT,
      discountHT: mensuelDiscountHT + mensuelGlobalDiscountHT,
      htAfterDiscount: mensuelHtAfterDiscount,
      tva: mensuelTva,
      totalTTC: mensuelTotalTTC
    },
    global: {
      subtotalHT: globalSubtotalHT,
      globalDiscountHT,
      htAfterDiscount: globalHtAfterDiscount,
      tva: globalTva,
      totalTTC: globalTotalTTC
    }
  };
};