import { QuoteItem, Quote, QuoteTotals, Settings } from '@/types';
import { calculateAgentVacation } from './agentCalculations';

export const calculateQuoteItem = (
  item: QuoteItem, 
  tvaPct: number, 
  isPerLineDiscount: boolean,
  settings?: Settings
): QuoteItem => {
  // Handle AGENT items differently
  if (item.kind === 'AGENT' && settings) {
    return calculateAgentVacation(item, settings);
  }
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
  
  // Séparer les items par type et mode
  const techUniqueItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'unique');
  const techMensuelItems = quote.items.filter(item => item.kind === 'TECH' && item.mode === 'mensuel');
  const agentItems = quote.items.filter(item => item.kind === 'AGENT');
  
  // Calculs pour TECH unique
  const uniqueSubtotalHT = techUniqueItems.reduce((sum, item) => sum + (item.totalHT_net || 0), 0);
  const uniqueDiscountHT = quote.discountMode === 'per_line' 
    ? techUniqueItems.reduce((sum, item) => sum + (item.discountHT || 0), 0)
    : 0;
  
  // Calculs pour TECH mensuel
  const mensuelSubtotalHT = techMensuelItems.reduce((sum, item) => sum + (item.totalHT_net || 0), 0);
  const mensuelDiscountHT = quote.discountMode === 'per_line'
    ? techMensuelItems.reduce((sum, item) => sum + (item.discountHT || 0), 0)
    : 0;
  
  // Calculs pour AGENT
  const agentsSubtotalHT = agentItems.reduce((sum, item) => sum + (item.lineHT || 0), 0);
  const agentsTva = agentItems.reduce((sum, item) => sum + (item.lineTVA || 0), 0);
  const agentsTotalTTC = agentItems.reduce((sum, item) => sum + (item.lineTTC || 0), 0);
  
  // Calculs globaux (TECH seulement pour les remises)
  const techGlobalSubtotalHT = uniqueSubtotalHT + mensuelSubtotalHT;
  const globalDiscountHT = quote.discountMode === 'global' 
    ? techGlobalSubtotalHT * ((quote.discountPct || 0) / 100)
    : 0;
  
  // Total global incluant agents
  const globalSubtotalHT = techGlobalSubtotalHT + agentsSubtotalHT;
  
  // Si remise globale, répartition proportionnelle (sur TECH seulement)
  let uniqueGlobalDiscountHT = 0;
  let mensuelGlobalDiscountHT = 0;
  
  if (quote.discountMode === 'global' && techGlobalSubtotalHT > 0) {
    const uniqueRatio = uniqueSubtotalHT / techGlobalSubtotalHT;
    const mensuelRatio = mensuelSubtotalHT / techGlobalSubtotalHT;
    
    uniqueGlobalDiscountHT = globalDiscountHT * uniqueRatio;
    mensuelGlobalDiscountHT = globalDiscountHT * mensuelRatio;
  }
  
  // Totaux finaux par section TECH
  const uniqueHtAfterDiscount = uniqueSubtotalHT - (uniqueDiscountHT + uniqueGlobalDiscountHT);
  const uniqueTva = uniqueHtAfterDiscount * (tvaPct / 100);
  const uniqueTotalTTC = uniqueHtAfterDiscount + uniqueTva;
  
  const mensuelHtAfterDiscount = mensuelSubtotalHT - (mensuelDiscountHT + mensuelGlobalDiscountHT);
  const mensuelTva = mensuelHtAfterDiscount * (tvaPct / 100);
  const mensuelTotalTTC = mensuelHtAfterDiscount + mensuelTva;
  
  // Totaux globaux finaux (TECH après remises + AGENTS)
  const techTotalAfterDiscount = uniqueHtAfterDiscount + mensuelHtAfterDiscount;
  const globalHtAfterDiscount = techTotalAfterDiscount + agentsSubtotalHT;
  const globalTva = (uniqueTva + mensuelTva) + agentsTva;
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
    agents: {
      subtotalHT: agentsSubtotalHT,
      tva: agentsTva,
      totalTTC: agentsTotalTTC
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