import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { emailContent, email_raw } = await req.json();
    const content = emailContent || email_raw;
    
    if (!content) {
      throw new Error('Email content is required');
    }

    console.log('Processing email extraction for:', content.substring(0, 100) + '...');

    const prompt = `Tu es un extracteur de devis techniques. 
Retourne STRICTEMENT un JSON valide (aucun texte avant/après). 
Si une info est inconnue, mets "" (texte) ou 0 (nombre) ou false (booléen) ou [] (liste).

Schéma cible :
{
  "quote": {
    "ref": "",
    "date": "YYYY-MM-DD",
    "client": "",
    "site": "",
    "contact": "",
    "canton": "",
    "comment": "",
    "discountMode": "none",
    "discountPct": 0,
    "feesInstallHT": 0,
    "feesDossierHT": 0,
    "clientDetails": {
      "company": "",
      "name": "",
      "email": "",
      "phone": "",
      "street": "",
      "city": "",
      "postalCode": "",
      "country": "Suisse"
    },
    "subscriptions": {
      "raccordement50TTC": false,
      "raccordement109TTC": false
    },
    "items": [
      {
        "type": "Caméra|Détecteur|Centrale|Enregistreur|Serveur|Alimentation|Câblage|Installation|Autre",
        "reference": "",
        "mode": "unique|mensuel",
        "qty": 1,
        "unitPriceValue": 0,
        "unitPriceMode": "TTC|HT",
        "lineDiscountPct": 0
      }
    ]
  }
}

Règles :
- Date : si absente, mets "".
- Informations client (clientDetails) : extraire nom/prénom, entreprise, email, téléphone, adresse complète (rue, ville, code postal)
- Subscriptions :
  • "raccordement 50", "raccordement alarme", "50 TTC/mois" → subscriptions.raccordement50TTC = true
  • "interventions illimitées", "illimité", "109 TTC/mois" → subscriptions.raccordement109TTC = true
- Items (matériel/prestations) :
  • type ∈ {Caméra, Détecteur, Centrale, Enregistreur, Serveur, Alimentation, Câblage, Installation, Autre}
  • reference : après "réf."/"ref"/"modèle"/"SKU"
  • qty : nombre après "x" / "Qté" / "quantité"
  • unitPriceValue : montant détecté
  • unitPriceMode : "TTC" si "TTC", "HT" si "HT", sinon "TTC"
  • mode : "mensuel" si "/mois", "mensuel", "abonnement", sinon "unique"
- Remises :
  • "remise globale X%" → discountMode="global", discountPct=X
  • "-X% sur [produit]" → discountMode="per_line", lineDiscountPct=X sur la/les lignes concernées
- Frais :
  • "frais d'installation Y HT" → feesInstallHT=Y
  • "frais de dossier Z HT" → feesDossierHT=Z
- En-tête (client, site, contact, canton, ref, comment) : capture si présent, sinon "".
- Ne pas inventer. Si incertain → vide/0/false.
- Nombres avec point décimal (ex: 120.50).

Texte à analyser :
---
${content}
---

Réponse attendue : JSON UNIQUEMENT.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: 'Réponds uniquement en JSON strict selon le schéma de devis existant (pas de texte libre).' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0,
        response_format: { "type": "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const extractedContent = data.choices[0].message.content.trim();

    console.log('Raw AI response:', extractedContent);

    // Try to parse JSON and validate structure
    let parsedData;
    try {
      parsedData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Try to extract JSON from text if AI added extra content
      const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Second JSON Parse Error:', secondParseError);
          throw new Error('Invalid JSON response from AI');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    console.log('Successfully parsed quote data:', JSON.stringify(parsedData, null, 2));

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in extract-email-to-quote function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});