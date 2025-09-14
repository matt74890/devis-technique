import type { Quote } from '@/types';

/**
 * Remplace les placeholders dans un texte par les valeurs réelles du client
 */
export function replacePlaceholders(text: string, quote?: Quote): string {
  if (!text || !quote) return text;

  // Extraire le nom et prénom du client depuis la chaîne "contact"
  const clientName = quote.client || '';
  const contactName = quote.contact || '';
  
  // Parser le nom complet (supposer format "Prénom Nom" ou juste "Nom")
  const nameParts = contactName.trim().split(' ');
  const firstName = nameParts.length > 1 ? nameParts[0] : '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : contactName;
  const fullName = contactName || clientName;

  // Mapping des placeholders
  const placeholders: Record<string, string> = {
    '{{CLIENT_PRENOM}}': firstName,
    '{{CLIENT_NOM}}': lastName,
    '{{CLIENT_NOM_COMPLET}}': fullName,
    '{{CLIENT_CIVILITE}}': quote.clientCivility || 'Monsieur',
    '{{CLIENT_ENTREPRISE}}': clientName
  };

  // Remplacer tous les placeholders dans le texte
  let result = text;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  return result;
}

/**
 * Vérifie si un texte contient des placeholders
 */
export function hasPlaceholders(text: string): boolean {
  return /\{\{[A-Z_]+\}\}/.test(text);
}

/**
 * Extrait tous les placeholders présents dans un texte
 */
export function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{[A-Z_]+\}\}/g);
  return matches ? Array.from(new Set(matches)) : [];
}