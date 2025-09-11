import { QuoteItem, Settings } from '@/types';

export interface AgentHours {
  normal: number;
  night: number;
  sunday: number;
  holiday: number;
  total: number;
}

export const calculateAgentVacation = (
  item: QuoteItem,
  settings: Settings
): QuoteItem => {
  if (item.kind !== 'AGENT' || !item.dateStart || !item.timeStart || !item.dateEnd || !item.timeEnd || !item.rateCHFh) {
    return item;
  }

  const startDateTime = new Date(`${item.dateStart}T${item.timeStart}`);
  const endDateTime = new Date(`${item.dateEnd}T${item.timeEnd}`);
  
  if (endDateTime <= startDateTime) {
    return { ...item, hoursTotal: 0, hoursNormal: 0, hoursNight: 0, hoursSunday: 0, hoursHoliday: 0 };
  }

  const hours = calculateHours(startDateTime, endDateTime, item.canton || 'GE', settings);
  
  // Apply pause if not paid
  const adjustedHours = applyPause(hours, item.pauseMinutes || 0, item.pausePaid || false);
  
  // Calculate pricing
  const pricing = calculatePricing(adjustedHours, item.rateCHFh, settings, item.travelCHF || 0);
  
  return {
    ...item,
    hoursTotal: adjustedHours.total,
    hoursNormal: adjustedHours.normal,
    hoursNight: adjustedHours.night,
    hoursSunday: adjustedHours.sunday,
    hoursHoliday: adjustedHours.holiday,
    lineHT: pricing.totalHT,
    lineTVA: pricing.tva,
    lineTTC: pricing.totalTTC,
    // Map to existing fields for compatibility
    totalHT_net: pricing.totalHT,
    totalTTC: pricing.totalTTC
  };
};

const calculateHours = (
  startDateTime: Date,
  endDateTime: Date,
  canton: string,
  settings: Settings
): AgentHours => {
  const { nightStartTime, nightEndTime, sundayStartTime, sundayEndTime } = settings.agentSettings;
  const holidays = settings.agentSettings.holidays[canton] || [];
  
  let normal = 0;
  let night = 0;
  let sunday = 0;
  let holiday = 0;
  
  // Process hour by hour
  const current = new Date(startDateTime);
  
  while (current < endDateTime) {
    const nextHour = new Date(current);
    nextHour.setHours(current.getHours() + 1);
    
    const endOfPeriod = nextHour > endDateTime ? endDateTime : nextHour;
    const duration = (endOfPeriod.getTime() - current.getTime()) / (1000 * 60 * 60);
    
    const timeStr = current.toTimeString().substring(0, 5);
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's a holiday
    if (holidays.includes(dateStr)) {
      holiday += duration;
    }
    // Check if it's Sunday (and not already counted as holiday)
    else if (dayOfWeek === 0 && timeStr >= sundayStartTime && timeStr < sundayEndTime) {
      sunday += duration;
    }
    // Check if it's night time (special rule for exact 23:00 and 06:00)
    else if (isNightTime(timeStr, nightStartTime, nightEndTime)) {
      night += duration;
    }
    // Otherwise it's normal hours
    else {
      normal += duration;
    }
    
    current.setTime(nextHour.getTime());
  }
  
  const total = normal + night + sunday + holiday;
  
  return { normal, night, sunday, holiday, total };
};

const isNightTime = (timeStr: string, nightStart: string, nightEnd: string): boolean => {
  // Night period crosses midnight (e.g., 23:00 to 06:00)
  if (nightStart > nightEnd) {
    return timeStr >= nightStart || timeStr < nightEnd;
  }
  // Night period within same day
  else {
    return timeStr >= nightStart && timeStr < nightEnd;
  }
};

const applyPause = (hours: AgentHours, pauseMinutes: number, pausePaid: boolean): AgentHours => {
  if (pausePaid || pauseMinutes === 0) {
    return hours;
  }
  
  const pauseHours = pauseMinutes / 60;
  let remaining = pauseHours;
  
  // Deduct from Normal → Night → Sunday → Holiday in that order
  const adjusted = { ...hours };
  
  if (remaining > 0 && adjusted.normal > 0) {
    const deduction = Math.min(remaining, adjusted.normal);
    adjusted.normal -= deduction;
    remaining -= deduction;
  }
  
  if (remaining > 0 && adjusted.night > 0) {
    const deduction = Math.min(remaining, adjusted.night);
    adjusted.night -= deduction;
    remaining -= deduction;
  }
  
  if (remaining > 0 && adjusted.sunday > 0) {
    const deduction = Math.min(remaining, adjusted.sunday);
    adjusted.sunday -= deduction;
    remaining -= deduction;
  }
  
  if (remaining > 0 && adjusted.holiday > 0) {
    const deduction = Math.min(remaining, adjusted.holiday);
    adjusted.holiday -= deduction;
    remaining -= deduction;
  }
  
  adjusted.total = adjusted.normal + adjusted.night + adjusted.sunday + adjusted.holiday;
  
  return adjusted;
};

const calculatePricing = (
  hours: AgentHours,
  baseCHFh: number,
  settings: Settings,
  travelCHF: number = 0
): { totalHT: number; tva: number; totalTTC: number } => {
  const { nightMarkupPct, sundayMarkupPct, holidayMarkupPct } = settings.agentSettings;
  
  const normalCost = hours.normal * baseCHFh;
  const nightCost = hours.night * baseCHFh * (1 + nightMarkupPct / 100);
  const sundayCost = hours.sunday * baseCHFh * (1 + sundayMarkupPct / 100);
  const holidayCost = hours.holiday * baseCHFh * (1 + holidayMarkupPct / 100);
  
  const totalHT = normalCost + nightCost + sundayCost + holidayCost + travelCHF;
  const tva = totalHT * (settings.tvaPct / 100);
  const totalTTC = totalHT + tva;
  
  return { totalHT, tva, totalTTC };
};
