// src/components/pdf/renderPDFFromLayout.ts
import type { Quote, Settings } from "@/types";
import { buildDomFromLayout } from "@/utils/pdfRenderer";

/**
 * Source de vérité UNIQUE pour la preview et l'export PDF.
 * Construit le DOM A4 depuis le layout JSON actif.
 */
export async function renderPDFFromLayout(
  quote: Quote,
  settings: Settings,
  variant: "technique" | "agent" | "mixte",
): Promise<HTMLElement> {
  // Pour l'instant, utiliser le système actuel en attendant la refonte complète des layouts
  const layoutId = `default-${variant}`;
  
  try {
    const dom = await buildDomFromLayout(layoutId, quote, settings);
    return dom; // <div data-a4-root>…</div>
  } catch (error) {
    const err = new Error("Aucun layout actif pour cette variante (Paramètres → PDF → Disposition)");
    (err as any).code = "NO_ACTIVE_LAYOUT";
    throw err;
  }
}