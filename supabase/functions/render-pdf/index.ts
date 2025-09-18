import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, settings } = await req.json();

    if (!html) {
      return new Response(JSON.stringify({ error: 'Missing HTML content' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Debug: Log des données reçues
    console.log('📥 HTML reçu dans render-pdf:', {
      htmlLength: html.length,
      settings: settings,
      hasHtmlTag: html.includes('<html'),
      hasBodyTag: html.includes('<body')
    });

    // Add print-optimized styles to the HTML
    const enhancedHtml = html.replace(
      /<head>/i,
      `<head>
        <style>
          html, body { margin: 0; padding: 0; }
          @page { size: A4; margin: 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          [data-pdf-section]:empty { display: none; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .totals-table, .signature-section { break-inside: avoid; page-break-inside: avoid; }
          img { max-width: 100%; height: auto; }
        </style>`
    );

    console.log('✅ HTML traité, longueur:', enhancedHtml.length);

    // For now, we'll return the HTML as PDF-ready content
    // In production, you would use a service like Puppeteer, Playwright, or WeasyPrint
    // to convert HTML to actual PDF bytes
    
    const filename = settings?.filename || `devis_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Return HTML formatted for PDF conversion
    // Note: This is a simplified approach. For production, implement actual PDF generation
    const pdfReadyHtml = `<!DOCTYPE html>
${enhancedHtml.replace('<!DOCTYPE html>', '')}`;
    
    console.log('📄 Returning PDF-ready HTML, size:', pdfReadyHtml.length, 'bytes');

    return new Response(pdfReadyHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      },
    });

  } catch (error) {
    console.error('Error rendering PDF:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});