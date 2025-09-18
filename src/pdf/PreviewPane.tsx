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
      
      // Build render data
      const renderData = buildRenderData(quote, template, settings);
      
      // Generate HTML
      const html = compiledTemplate(renderData);
      setHtmlContent(html);
      
      // Update iframe
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.onload = () => {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();
          }
        };
        iframe.src = 'about:blank';
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'aperçu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const renderData = buildRenderData(quote, template, settings);
      
      // Debug: Log des données avant envoi
      console.log('🔍 Données PDF à envoyer:', {
        meta: renderData.meta,
        seller: renderData.seller,
        client: renderData.client,
        tech: { itemsCount: renderData.tech.items.length, totals: renderData.tech.totals },
        agent: { itemsCount: renderData.agent.items.length, totals: renderData.agent.totals },
        totals: renderData.totals,
        addresses: renderData.addresses
      });
      
      // Call Supabase Edge Function
      const response = await fetch('https://kwtdirfmdakbwwjxdynu.supabase.co/functions/v1/render-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dGRpcmZtZGFrYnd3anhkeW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg4NzcsImV4cCI6MjA3Mjc0NDg3N30.IdBjhaty0vlnpCztwu2lAMeR2FXt5FhJSwvQ4aJ8hQQ`
        },
        body: JSON.stringify({ renderData, templateId: template.id })
      });
      
      if (response.ok) {
        console.log('✅ PDF généré avec succès');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis_${renderData.meta.quoteRef}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur PDF:', { status: response.status, error: errorText });
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
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