import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { Quote } from '@/types';
import { PdfTemplateConfig } from '@/types/pdf';
import { buildRenderData } from './buildRenderData';
import { registerPdfHelpers } from './helpers';
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
      const renderData = buildRenderData(quote, template);
      
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
      const renderData = buildRenderData(quote, template);
      
      // Call PDF render endpoint (to be implemented)
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderData, templateId: template.id })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis_${renderData.meta.quoteRef}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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