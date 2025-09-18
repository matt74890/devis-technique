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

    // Load Handlebars template (in a real scenario, this would be loaded from storage)
    const templateHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{meta.quoteType}} - {{meta.quoteRef}}</title>
    <style>
        :root {
            --page-margin: {{theme.page.marginMm}}mm;
            --font-family: {{theme.page.fontFamily}};
            --font-size: {{theme.page.fontSize}}pt;
            --c-text: {{theme.color.text}};
            --c-muted: {{theme.color.muted}};
            --c-accent: {{theme.color.accent}};
            --c-border: {{theme.color.border}};
            --c-table-header: {{theme.color.tableHeaderBg}};
            --c-zebra: {{theme.color.zebraBg}};
            --badge-h: {{theme.badge.heightPx}}px;
            --badge-radius: {{theme.badge.radiusPx}}px;
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
        <div style="font-size: 24px; font-weight: bold;">{{seller.company}}</div>
        <div>
            <div>{{meta.quoteType}}</div>
            <div><strong>{{meta.quoteRef}}</strong></div>
            <div>{{meta.date}}</div>
        </div>
    </div>

    <div style="margin: 24px 0;">
        <div><strong>{{client.civility}} {{client.fullName}}</strong></div>
        {{#if client.company}}<div>{{client.company}}</div>{{/if}}
    </div>

    {{#if tech.items.length}}
    <h3>Devis technique <span class="badge">TECH</span></h3>
    <table>
        <thead>
            <tr>
                <th>Réf</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th><th>Total TTC</th>
            </tr>
        </thead>
        <tbody>
            {{#each tech.items}}
            <tr>
                <td>{{reference}}</td>
                <td>{{type}} {{#if badge}}<span class="badge">{{badge}}</span>{{/if}}</td>
                <td style="text-align: center;">{{qty}}</td>
                <td style="text-align: right;">{{puHT}} CHF</td>
                <td style="text-align: right;">{{totalHT_net}} CHF</td>
                <td style="text-align: right;">{{totalTTC}} CHF</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    {{#if agent.items.length}}
    <h3>Devis agent <span class="badge">AGENT</span></h3>
    <table>
        <thead>
            <tr>
                <th>Nature</th><th>Type</th><th>Début</th><th>Fin</th><th>H. norm.</th><th>H. maj.</th><th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each agent.items}}
            <tr>
                <td>{{reference}}</td>
                <td>{{agentType}}</td>
                <td style="text-align: center;">{{start}}</td>
                <td style="text-align: center;">{{end}}</td>
                <td style="text-align: center;">{{hoursNormal}}</td>
                <td style="text-align: center;">{{hoursExtra}}</td>
                <td style="text-align: right;">{{totalHT_net}} CHF</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <table class="totals-table">
        <tr><th>Total HT</th><td style="text-align: right;">{{totals.ht}} CHF</td></tr>
        <tr><th>TVA (8.1%)</th><td style="text-align: right;">{{totals.vat}} CHF</td></tr>
        <tr class="total-final"><th>Total TTC</th><td style="text-align: right;">{{totals.ttc}} CHF</td></tr>
    </table>

    {{#if totals.remark}}
    <div style="margin-top: 16px; padding: 8px; background: #f8f9fa; border-left: 3px solid var(--c-accent);">
        {{totals.remark}}
    </div>
    {{/if}}
</body>
</html>`;

    // Compile Handlebars template (simplified version for demo)
    let compiledHtml = templateHtml;
    
    // Simple variable replacement (in production, use proper Handlebars)
    const replacePlaceholders = (html: string, data: any): string => {
      return html.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], data);
        return value !== undefined ? String(value) : match;
      });
    };

    compiledHtml = replacePlaceholders(compiledHtml, renderData);

    // For demo purposes, return HTML instead of PDF
    // In production, use Puppeteer/Playwright to generate actual PDF
    const filename = `devis_${renderData.meta.quoteRef}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(compiledHtml, {
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