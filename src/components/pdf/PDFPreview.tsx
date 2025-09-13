import { useEffect, useRef } from "react";
import type { Quote, Settings } from "@/types";
import { renderPDFFromLayout } from "./renderPDFFromLayout";

export default function PDFPreview({
  quote, settings, variant
}: { quote: Quote; settings: Settings; variant: "technique" | "agent" | "mixte" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      try {
        const dom = await renderPDFFromLayout(quote, settings, variant);
        containerRef.current.appendChild(dom);
      } catch (e) {
        containerRef.current.innerHTML =
          `<div class="text-destructive p-4">Erreur preview PDF: ${(e as Error).message}</div>`;
      }
    })();
  }, [quote, settings, variant]);

  return <div ref={containerRef} className="bg-white shadow-soft rounded-md p-4" />;
}

