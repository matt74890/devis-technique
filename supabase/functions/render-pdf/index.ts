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
    const { renderData, templateId } = await req.json();

    if (!renderData) {
      return new Response(JSON.stringify({ error: 'Missing renderData' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Debug: Log des données reçues
    console.log('📥 Données reçues dans render-pdf:', {
      meta: renderData.meta,
      seller: renderData.seller,
      client: renderData.client,
      techItemsCount: renderData.tech?.items?.length || 0,
      agentItemsCount: renderData.agent?.items?.length || 0,
      totals: renderData.totals
    });

    // Improved Handlebars-like template replacement
    const templateHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${renderData.meta?.quoteType || 'Devis'} - ${renderData.meta?.quoteRef || ''}</title>
    <style>
        :root {
            --page-margin: ${renderData.theme?.page?.marginMm || 12}mm;
            --font-family: "${renderData.theme?.page?.fontFamily || 'Arial, sans-serif'}";
            --font-size: ${renderData.theme?.page?.fontSize || 12}pt;
            --c-text: ${renderData.theme?.color?.text || '#1a1a1a'};
            --c-muted: ${renderData.theme?.color?.muted || '#6b7280'};
            --c-accent: ${renderData.theme?.color?.accent || '#ffdd00'};
            --c-border: ${renderData.theme?.color?.border || '#e5e7eb'};
            --c-table-header: ${renderData.theme?.color?.tableHeaderBg || '#f9fafb'};
            --c-zebra: ${renderData.theme?.color?.zebraBg || '#f9fafb'};
            --badge-h: ${renderData.theme?.badge?.heightPx || 20}px;
            --badge-radius: ${renderData.theme?.badge?.radiusPx || 10}px;
        }

        @page { size: A4; margin: var(--page-margin); }
        * { box-sizing: border-box; }
        body { 
            font-family: var(--font-family); 
            font-size: var(--font-size); 
            line-height: 1.4; 
            color: var(--c-text); 
            margin: 0; 
            padding: 0; 
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 8px;
            border-bottom: 3px solid var(--c-accent);
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: var(--badge-h);
            line-height: var(--badge-h);
            padding: 0 8px;
            background: var(--c-accent);
            color: var(--c-text);
            border-radius: var(--badge-radius);
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid var(--c-border);
            margin-bottom: 24px;
        }
        
        th, td { 
            padding: 8px; 
            border: 1px solid var(--c-border); 
            break-inside: avoid; 
        }
        
        th { 
            background: var(--c-table-header); 
            font-weight: bold; 
        }
        
        .totals-table { 
            margin-left: auto; 
            width: 300px; 
            border: none;
        }
        
        .totals-table th, .totals-table td { 
            border: none; 
            padding: 4px 8px; 
        }
        
        .total-final { 
            font-weight: bold; 
            border-top: 2px solid var(--c-accent); 
        }
    </style>
</head>
<body>
    <div class="page-header">
        ${renderData.seller?.logoUrl ? `<img src="${renderData.seller.logoUrl}" alt="Logo" style="max-height: 60px;">` : ''}
        <div style="font-size: 24px; font-weight: bold;">${renderData.seller?.company || 'GPA'}</div>
        <div style="text-align: right;">
            <div>${renderData.meta?.quoteType || 'Devis'}</div>
            <div><strong>Réf: ${renderData.meta?.quoteRef || '—'}</strong></div>
            <div>${renderData.meta?.date || ''}</div>
        </div>
    </div>

    <div style="margin: 24px 0;">
        <div><strong>${renderData.client?.civility || ''} ${renderData.client?.fullName || ''}</strong></div>
        ${renderData.client?.company ? `<div>${renderData.client.company}</div>` : ''}
        ${renderData.addresses?.contact?.street ? `<div>${renderData.addresses.contact.street}</div>` : ''}
        ${renderData.addresses?.contact?.postalCode && renderData.addresses?.contact?.city ? `<div>${renderData.addresses.contact.postalCode} ${renderData.addresses.contact.city}</div>` : ''}
    </div>

    <div style="margin: 24px 0;">
        ${renderData.content?.introHtml || ''}
    </div>

    ${renderData.tech?.items?.length ? `
    <h3>Devis technique <span class="badge">TECH</span></h3>
    <table>
        <thead>
            <tr>
                <th>Réf</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th><th>Total TTC</th>
            </tr>
        </thead>
        <tbody>
            ${renderData.tech.items.map((item: any) => `
            <tr>
                <td>${item.reference || ''}</td>
                <td>${item.type || ''} ${item.mode === 'mensuel' ? '<span class="badge">MENSUEL</span>' : item.mode === 'unique' ? '<span class="badge">UNIQUE</span>' : ''}</td>
                <td style="text-align: center;">${item.qty || 0}</td>
                <td style="text-align: right;">${(item.puHT || 0).toFixed(2)} CHF</td>
                <td style="text-align: right;">${(item.totalHT_net || 0).toFixed(2)} CHF</td>
                <td style="text-align: right;">${(item.totalTTC || 0).toFixed(2)} CHF</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    ${renderData.agent?.items?.length ? `
    <h3>Devis agent <span class="badge">AGENT</span></h3>
    <table>
        <thead>
            <tr>
                <th>Nature</th><th>Type</th><th>Début</th><th>Fin</th><th>H. norm.</th><th>H. maj.</th><th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${renderData.agent.items.map((item: any) => `
            <tr>
                <td>${item.reference || ''}</td>
                <td>${item.agentType || ''}</td>
                <td style="text-align: center;">${item.start || ''}</td>
                <td style="text-align: center;">${item.end || ''}</td>
                <td style="text-align: center;">${item.hoursNormal || 0}</td>
                <td style="text-align: center;">${item.hoursExtra || 0}</td>
                <td style="text-align: right;">${(item.totalHT_net || 0).toFixed(2)} CHF</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <table class="totals-table">
        <tr><th>Total HT</th><td style="text-align: right;">${(renderData.totals?.ht || 0).toFixed(2)} CHF</td></tr>
        <tr><th>TVA (8.1%)</th><td style="text-align: right;">${(renderData.totals?.vat || 0).toFixed(2)} CHF</td></tr>
        <tr class="total-final"><th>Total TTC</th><td style="text-align: right;">${(renderData.totals?.ttc || 0).toFixed(2)} CHF</td></tr>
    </table>

    ${renderData.totals?.remark ? `
    <div style="margin-top: 16px; padding: 8px; background: #f8f9fa; border-left: 3px solid var(--c-accent);">
        ${renderData.totals.remark}
    </div>
    ` : ''}

    ${renderData.seller?.signatureUrl ? `
    <div style="margin-top: 40px; text-align: right;">
        <div>Signature:</div>
        <img src="${renderData.seller.signatureUrl}" alt="Signature" style="max-height: 80px; margin-top: 10px;">
        <div style="margin-top: 5px;">${renderData.seller?.name || ''}</div>
        <div>${renderData.seller?.title || ''}</div>
    </div>
    ` : ''}
</body>
</html>`;

    console.log('✅ HTML généré, longueur:', templateHtml.length);

    // Return HTML for download as PDF
    const filename = `devis_${renderData.meta?.quoteRef || 'sans-ref'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(templateHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
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