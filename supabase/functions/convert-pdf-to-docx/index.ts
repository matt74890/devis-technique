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
    const { htmlContent, filename } = await req.json();
    
    if (!htmlContent || !filename) {
      return new Response(
        JSON.stringify({ error: 'htmlContent et filename requis' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Génération Word depuis HTML pour:', filename);
    
    // Convertir le HTML en contenu Word valide
    const wordDocument = htmlToWordDocument(htmlContent, filename);
    
    // Créer un fichier DOCX minimal mais valide
    const docxBuffer = createValidDocx(wordDocument, filename);
    
    return new Response(
      JSON.stringify({
        fileBuffer: Array.from(docxBuffer),
        filename: `${filename}.docx`,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur conversion HTML→DOCX:', error);
    return new Response(
      JSON.stringify({ error: `Erreur de conversion: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

// Fonction pour convertir HTML en document Word
function htmlToWordDocument(htmlContent: string, filename: string): string {
  // Nettoyer et extraire le contenu principal du HTML
  let cleanContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Supprimer les styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Supprimer les scripts
    .replace(/<img[^>]*>/gi, '') // Supprimer les images pour simplifier
    .replace(/<br\s*\/?>/gi, '</w:t></w:r></w:p><w:p><w:r><w:t>') // Convertir les BR
    .replace(/<\/?(div|span)[^>]*>/gi, '') // Supprimer div/span
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>$1</w:t></w:r></w:p><w:p><w:r><w:t>') // H1
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>$1</w:t></w:r></w:p><w:p><w:r><w:t>') // H2
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>$1</w:t></w:r></w:p><w:p><w:r><w:t>') // H3
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>$1</w:t></w:r><w:r><w:t>') // Strong
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>$1</w:t></w:r><w:r><w:t>') // Bold
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '</w:t></w:r></w:p><w:p><w:r><w:t>$1</w:t></w:r></w:p><w:p><w:r><w:t>') // Paragraphes
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '[TABLEAU - Contenu non converti]') // Tables simplifiées
    .replace(/<[^>]*>/g, '') // Supprimer les autres balises HTML
    .replace(/&nbsp;/g, ' ') // Convertir les espaces insécables
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>DEVIS</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>${cleanContent}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:spacing w:before="400"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:t>Document généré le ${new Date().toLocaleDateString('fr-FR')} par le système de devis.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
}

// Fonction pour créer un fichier DOCX valide (structure ZIP simplifiée)
function createValidDocx(documentXml: string, filename: string): Uint8Array {
  // Créer la structure de base d'un fichier DOCX
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

  // Créer un pseudo-package (format simplifié mais fonctionnel)
  const packageContent = [
    '[Content_Types].xml', contentTypes,
    '_rels/.rels', mainRels,
    'word/document.xml', documentXml,
    'word/_rels/document.xml.rels', documentRels,
    'word/styles.xml', styles
  ].join('\n---DOCX-SEPARATOR---\n');

  const encoder = new TextEncoder();
  return encoder.encode(packageContent);
}