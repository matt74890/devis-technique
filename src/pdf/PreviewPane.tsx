import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { Quote } from '@/types';
import { PdfTemplateConfig } from '@/types/pdf';
import { buildRenderData } from './buildRenderData';
import { registerPdfHelpers } from './helpers';
import { useSettings } from '@/components/SettingsProvider';
import Handlebars from 'handlebars';

interface PreviewPaneProps {
  quote: Quote;
  template: PdfTemplateConfig;
  onDownload?: () => void;
}

export const PreviewPane = ({ quote, template, onDownload }: PreviewPaneProps) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    generatePreview();
  }, [quote, template]);

  const generatePreview = async () => {
    try {
      setLoading(true);
      
      // Register Handlebars helpers
      registerPdfHelpers();
      
      // Load template
      const templateResponse = await fetch('/src/pdf/templates/quote.handlebars');
      const templateSource = await templateResponse.text();
      
      // Compile template
      const compiledTemplate = Handlebars.compile(templateSource);
      
      // Build render data with fallback
      const renderData = buildRenderData(quote, template, settings);
      
      // Fallback sample data to prevent empty preview
      const sampleData = {
        meta: { quoteRef: 'SAMPLE-001', date: new Date().toISOString().slice(0, 10), locale: 'fr-CH', quoteType: 'Devis échantillon' },
        seller: { company: 'Votre Entreprise', name: 'Nom Vendeur', title: 'Titre', logoUrl: '', signatureUrl: '' },
        client: { civility: 'Monsieur', fullName: 'Client Exemple', company: 'Entreprise Client' },
        pricing: { currency: 'CHF', vatRate: 8.1, precision: 2 },
        tech: { items: [{ reference: 'SAMPLE', type: 'Article exemple', qty: 1, puHT: 100, totalHT_net: 100, totalTTC: 108.1 }], totals: { ht: 100, ttc: 108.1 } },
        agent: { items: [], totals: { ht: 0, ttc: 0 } },
        totals: { ht: 100, ttc: 108.1, vat: 8.1, remark: 'Données d\'exemple' },
        theme: template.brand.theme,
        layout: template.layout,
        content: template.content,
        addresses: { contact: { company: 'Entreprise Client', name: 'Client Exemple', street: 'Adresse exemple', city: 'Ville', postalCode: '1000' } }
      };

      // Use real data if available, fallback to sample
      const finalData = renderData && Object.keys(renderData).length > 5 ? renderData : sampleData;
      console.log('[Preview] Using data:', Object.keys(finalData), 'seller logo:', finalData.seller?.logoUrl);
      
      // Generate HTML with build timestamp for debugging
      const html = `<!-- build ts: ${Date.now()} -->\n${compiledTemplate(finalData)}`;
      console.log('[Preview] Generated HTML length:', html.length);
      
      setHtmlContent(html);
      
      // Update iframe using blob URL for better isolation
      if (iframeRef.current) {
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        iframeRef.current.src = blobUrl;
        
        // Clean up blob URL after load
        iframeRef.current.onload = () => {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        };
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'aperçu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      // Register Handlebars helpers
      registerPdfHelpers();
      
      // Load template
      const templateResponse = await fetch('/src/pdf/templates/quote.handlebars');
      const templateSource = await templateResponse.text();
      
      // Compile template
      const compiledTemplate = Handlebars.compile(templateSource);
      
      // Build render data with fallback
      const renderData = buildRenderData(quote, template, settings);
      
      // Fallback sample data to prevent empty PDF
      const sampleData = {
        meta: { quoteRef: 'SAMPLE-001', date: new Date().toISOString().slice(0, 10), locale: 'fr-CH', quoteType: 'Devis échantillon' },
        seller: { company: 'Votre Entreprise', name: 'Nom Vendeur', title: 'Titre', logoUrl: '', signatureUrl: '' },
        client: { civility: 'Monsieur', fullName: 'Client Exemple', company: 'Entreprise Client' },
        pricing: { currency: 'CHF', vatRate: 8.1, precision: 2 },
        tech: { items: [{ reference: 'SAMPLE', type: 'Article exemple', qty: 1, puHT: 100, totalHT_net: 100, totalTTC: 108.1 }], totals: { ht: 100, ttc: 108.1 } },
        agent: { items: [], totals: { ht: 0, ttc: 0 } },
        totals: { ht: 100, ttc: 108.1, vat: 8.1, remark: 'Données d\'exemple' },
        theme: template.brand.theme,
        layout: template.layout,
        content: template.content,
        addresses: { contact: { company: 'Entreprise Client', name: 'Client Exemple', street: 'Adresse exemple', city: 'Ville', postalCode: '1000' } }
      };

      // Use real data if available, fallback to sample
      const finalData = renderData && Object.keys(renderData).length > 5 ? renderData : sampleData;
      console.log('[PDF] renderData keys:', Object.keys(finalData), 'length:', JSON.stringify(finalData).length);
      
      // Generate HTML
      const html = compiledTemplate(finalData);
      console.log('[PDF] Generated HTML length:', html.length);
      
      if (!html || html.length < 100 || !html.includes('<html')) {
        throw new Error('Template did not render valid HTML');
      }

      // Call Supabase Edge Function with HTML
      const response = await fetch('https://kwtdirfmdakbwwjxdynu.supabase.co/functions/v1/render-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dGRpcmZtZGFrYnd3anhkeW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg4NzcsImV4cCI6MjA3Mjc0NDg3N30.IdBjhaty0vlnpCztwu2lAMeR2FXt5FhJSwvQ4aJ8hQQ`
        },
        body: JSON.stringify({ 
          html, 
          settings: { 
            filename: `devis_${finalData.meta.quoteRef}_${new Date().toISOString().slice(0, 10)}.pdf`,
            format: 'A4',
            margin: '10mm'
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur PDF:', { status: response.status, error: errorText });
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      console.log('[PDF] Received blob size:', blob.size, 'bytes');
      
      if (!blob.size || blob.size < 1000) {
        throw new Error('PDF blob is empty or too small');
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis_${finalData.meta.quoteRef}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF téléchargé avec succès');
      onDownload?.();
    } catch (error) {
      console.error('Erreur lors du téléchargement PDF:', error);
    }
  };

  return (
    <Card className="w-full">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Aperçu PDF</span>
        </div>
        <Button 
          onClick={handleDownloadPdf} 
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>
      
      <div className="relative" style={{ height: '800px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-sm text-muted-foreground">Génération de l'aperçu...</div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          style={{ 
            transform: 'scale(0.8)', 
            transformOrigin: 'top left',
            width: '125%',
            height: '125%'
          }}
          title="Aperçu PDF"
        />
      </div>
    </Card>
  );
};