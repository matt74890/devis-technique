import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { filename, file_base64 } = await req.json();
    
    if (!filename || !file_base64) {
      return new Response(
        JSON.stringify({ error: 'filename et file_base64 requis' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Pour cette démo, nous allons simuler une conversion
    // En production, vous devriez utiliser un service comme:
    // - CloudConvert API
    // - ILovePDF API
    // - PDF24 API
    // - Ou un service personnalisé avec LibreOffice
    
    const converterUrl = Deno.env.get('DOCX_CONVERTER_URL');
    const converterKey = Deno.env.get('DOCX_CONVERTER_KEY');
    
    if (!converterUrl) {
      // Mode fallback: retourner un document HTML avec en-têtes Word
      console.log('Mode fallback: génération HTML→DOCX locale');
      
      // Décoder le PDF base64 (non utilisé en mode fallback)
      const pdfBuffer = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
      
      // Créer un document Word basique (HTML avec en-têtes Microsoft)
      const wordContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .page-break { page-break-before: always; }
    .page-break-avoid { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px;">
    DEVIS CONVERTIT DEPUIS PDF
  </div>
  <p>Ce document a été converti depuis un PDF généré automatiquement.</p>
  <p>Nom du fichier original: ${filename}</p>
  <p>Taille du PDF: ${pdfBuffer.length} bytes</p>
  <p><strong>Note:</strong> Pour une conversion complète PDF→DOCX, configurez DOCX_CONVERTER_URL avec un service de conversion externe.</p>
  
  <div style="margin-top: 40px; padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
    <h3>Services de conversion recommandés:</h3>
    <ul>
      <li>CloudConvert API</li>
      <li>ILovePDF API</li>
      <li>PDF24 API</li>
      <li>Service personnalisé avec LibreOffice</li>
    </ul>
  </div>
</body>
</html>`;
      
      // Encoder en base64
      const encoder = new TextEncoder();
      const wordBuffer = encoder.encode(wordContent);
      const wordBase64 = btoa(String.fromCharCode(...wordBuffer));
      
      return new Response(
        JSON.stringify({
          filename: filename.replace('.pdf', '.docx'),
          file_base64: wordBase64,
          conversion_method: 'fallback_html'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mode avec service externe
    console.log('Conversion via service externe:', converterUrl);
    
    const conversionResponse = await fetch(converterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${converterKey}`,
      },
      body: JSON.stringify({
        filename,
        file_base64,
        target: 'docx'
      })
    });

    if (!conversionResponse.ok) {
      throw new Error(`Service de conversion erreur: ${conversionResponse.status}`);
    }

    const conversionResult = await conversionResponse.json();
    
    return new Response(
      JSON.stringify({
        filename: conversionResult.filename || filename.replace('.pdf', '.docx'),
        file_base64: conversionResult.file_base64,
        conversion_method: 'external_service'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur conversion PDF→DOCX:', error);
    return new Response(
      JSON.stringify({ error: `Erreur de conversion: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})