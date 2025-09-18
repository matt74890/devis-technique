import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Eye } from 'lucide-react';
import { PreviewPane } from '@/pdf/PreviewPane';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/components/SettingsProvider';
import defaultTemplate from '@/data/pdfDefaultTemplate.json';
import { PdfTemplateConfig } from '@/types/pdf';

interface PDFPreviewProps {
  onClose: () => void;
}

export const PDFPreview = ({ onClose }: PDFPreviewProps) => {
  const currentQuote = useStore((state) => state.currentQuote);
  const { settings } = useSettings();
  
  if (!currentQuote) return null;

  const template = settings.pdf?.template || defaultTemplate as PdfTemplateConfig;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu PDF - {currentQuote.ref || 'Sans référence'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PreviewPane 
          quote={currentQuote} 
          template={template}
          onDownload={() => console.log('PDF téléchargé')}
        />
      </CardContent>
    </Card>
  );
};