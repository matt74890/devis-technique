import type { QuoteItem } from '@/types';

export interface GroupedAgentVacation {
  id: string;
  agentType: string;
  rateCHFh: number;
  canton: string;
  pauseMinutes?: number;
  pausePaid?: boolean;
  travelCHF?: number;
  
  // Dates groupées
  dateStart: string;
  dateEnd: string;
  dateRange: string; // "du X au Y" ou date simple
  
  // Totaux agrégés
  hoursTotal: number;
  hoursNormal: number;
  hoursNight: number;
  hoursSunday: number;
  hoursHoliday: number;
  
  // Montants totaux
  lineHT: number;
  lineTVA: number;
  lineTTC: number;
  
  // Items originaux regroupés
  originalItems: QuoteItem[];
  
  // Description des majorations
  markupDescription?: string;
}

/**
 * Regroupe les vacations d'agent similaires en une seule ligne
 */
export function groupAgentVacations(agentItems: QuoteItem[]): GroupedAgentVacation[] {
  if (!agentItems || agentItems.length === 0) return [];

  // Groupe les items par critères similaires
  const groups = new Map<string, QuoteItem[]>();

  agentItems.forEach(item => {
    if (item.kind !== 'AGENT') return;

    // Clé de regroupement basée sur les critères importants
    const hasMarkup = (item.hoursNight || 0) > 0 || (item.hoursSunday || 0) > 0 || (item.hoursHoliday || 0) > 0;
    const groupKey = [
      item.agentType || 'Sécurité',
      item.rateCHFh || 0,
      item.canton || 'GE',
      item.pauseMinutes || 0,
      item.pausePaid ? 'paid' : 'unpaid',
      item.travelCHF || 0,
      hasMarkup ? 'markup' : 'normal' // Séparer les vacations avec/sans majorations
    ].join('|');

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  });

  // Convertir les groupes en vacations groupées
  const groupedVacations: GroupedAgentVacation[] = [];

  groups.forEach((items, groupKey) => {
    if (items.length === 0) return;

    // Trier les items par date pour créer la plage
    const sortedItems = items.sort((a, b) => {
      const dateA = new Date(a.dateStart || '');
      const dateB = new Date(b.dateStart || '');
      return dateA.getTime() - dateB.getTime();
    });

    const firstItem = sortedItems[0];
    const lastItem = sortedItems[sortedItems.length - 1];

    // Créer la description de la plage de dates
    let dateRange: string;
    if (sortedItems.length === 1) {
      dateRange = new Date(firstItem.dateStart || '').toLocaleDateString('fr-CH');
    } else {
      const startDate = new Date(firstItem.dateStart || '').toLocaleDateString('fr-CH');
      const endDate = new Date(lastItem.dateEnd || lastItem.dateStart || '').toLocaleDateString('fr-CH');
      if (startDate === endDate) {
        dateRange = startDate;
      } else {
        dateRange = `du ${startDate} au ${endDate}`;
      }
    }

    // Agréger les totaux
    const totals = items.reduce((acc, item) => ({
      hoursTotal: acc.hoursTotal + (item.hoursTotal || 0),
      hoursNormal: acc.hoursNormal + (item.hoursNormal || 0),
      hoursNight: acc.hoursNight + (item.hoursNight || 0),
      hoursSunday: acc.hoursSunday + (item.hoursSunday || 0),
      hoursHoliday: acc.hoursHoliday + (item.hoursHoliday || 0),
      lineHT: acc.lineHT + (item.lineHT || 0),
      lineTVA: acc.lineTVA + (item.lineTVA || 0),
      lineTTC: acc.lineTTC + (item.lineTTC || 0)
    }), {
      hoursTotal: 0,
      hoursNormal: 0,
      hoursNight: 0,
      hoursSunday: 0,
      hoursHoliday: 0,
      lineHT: 0,
      lineTVA: 0,
      lineTTC: 0
    });

    // Créer la description des majorations si applicable
    let markupDescription = '';
    const markupParts = [];
    if (totals.hoursNight > 0) {
      markupParts.push(`${totals.hoursNight.toFixed(1)}h nuit`);
    }
    if (totals.hoursSunday > 0) {
      markupParts.push(`${totals.hoursSunday.toFixed(1)}h dimanche`);
    }
    if (totals.hoursHoliday > 0) {
      markupParts.push(`${totals.hoursHoliday.toFixed(1)}h férié`);
    }
    if (markupParts.length > 0) {
      markupDescription = `Majorations: ${markupParts.join(', ')}`;
    }

    groupedVacations.push({
      id: `group-${groupedVacations.length}`,
      agentType: firstItem.agentType || 'Sécurité',
      rateCHFh: firstItem.rateCHFh || 0,
      canton: firstItem.canton || 'GE',
      pauseMinutes: firstItem.pauseMinutes,
      pausePaid: firstItem.pausePaid,
      travelCHF: firstItem.travelCHF,
      dateStart: firstItem.dateStart || '',
      dateEnd: lastItem.dateEnd || lastItem.dateStart || '',
      dateRange,
      ...totals,
      originalItems: items,
      markupDescription: markupDescription || undefined
    });
  });

  return groupedVacations;
}