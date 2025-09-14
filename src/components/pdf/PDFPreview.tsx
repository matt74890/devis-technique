import { useEffect, useRef } from "react";
import type { Quote, Settings } from "@/types";
import { renderPDFFromLayout } from "./renderPDFFromLayout";
import { renderAgentDescriptionToPDF, hasAgentDescriptionContent } from "@/utils/agentDescriptionRenderer";

export default function PDFPreview({
  quote, settings, variant
}: { quote: Quote; settings: Settings; variant: "technique" | "agent" | "mixte" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let isCancelled = false;
    
    const loadPreview = async () => {
      const container = containerRef.current;
      if (!container || !mountedRef.current) return;
      
      // Clear previous content
      container.innerHTML = "";
      
      try {
        const dom = await renderPDFFromLayout(quote, settings, variant);
        
        // Insert agent description page if exists and has content
        if (hasAgentDescriptionContent(quote.agentDescription)) {
          const agentDescHTML = renderAgentDescriptionToPDF(quote.agentDescription!);
          if (agentDescHTML) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = agentDescHTML;
            const agentDescPage = tempDiv.firstChild as HTMLElement;
            if (agentDescPage) {
              dom.appendChild(agentDescPage);
            }
          }
        }
        
        // Check if component is still mounted and this request wasn't cancelled
        if (!isCancelled && mountedRef.current && containerRef.current) {
          containerRef.current.appendChild(dom);
        }
      } catch (e) {
        if (!isCancelled && mountedRef.current && containerRef.current) {
          containerRef.current.innerHTML =
            `<div class="text-destructive p-4">Erreur preview PDF: ${(e as Error).message}</div>`;
        }
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
    };
  }, [quote, settings, variant]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return <div ref={containerRef} className="bg-white shadow-soft rounded-md p-4" />;
}

