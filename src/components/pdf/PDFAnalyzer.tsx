import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Image, Table } from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFLayoutConfig, LayoutBlock } from '@/types/layout';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PDFAnalyzerProps {
  file: File | null;
  onAnalyzeComplete: (layout: PDFLayoutConfig) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

interface ExtractedElement {
  type: 'text' | 'image' | 'line' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
  };
  pageNumber: number;
}

export const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({
  file,
  onAnalyzeComplete,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [extractedElements, setExtractedElements] = useState<ExtractedElement[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const analyzePDF = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      // Step 1: Load PDF
      setCurrentStep('Chargement du PDF...');
      setProgress(10);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      setProgress(25);
      setCurrentStep(`Analyse de ${pdf.numPages} page(s)...`);

      const elements: ExtractedElement[] = [];

      // Step 2: Extract content from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setCurrentStep(`Extraction page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Extract text elements
        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            const transform = item.transform;
            elements.push({
              type: 'text',
              x: transform[4] * 0.75, // Convert to mm (approximation)
              y: (viewport.height - transform[5]) * 0.75,
              width: item.width * 0.75,
              height: item.height * 0.75,
              content: item.str,
              style: {
                fontSize: transform[0] * 0.75,
                fontFamily: item.fontName || 'Arial',
                textAlign: 'left'
              },
              pageNumber: pageNum
            });
          }
        });

        // Generate page preview (first page only)
        if (pageNum === 1) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const renderViewport = page.getViewport({ scale: 1.5 });
          
          canvas.height = renderViewport.height;
          canvas.width = renderViewport.width;

          await page.render({
            canvasContext: context!,
            viewport: renderViewport,
            canvas: canvas
          }).promise;

          setPreview(canvas.toDataURL());
        }

        setProgress(25 + (pageNum / pdf.numPages) * 50);
      }

      // Step 3: Analyze layout structure
      setCurrentStep('Analyse de la structure...');
      setProgress(80);

      const layoutBlocks = await analyzeStructure(elements);
      
      // Step 4: Generate layout config
      setCurrentStep('Génération du layout...');
      setProgress(95);

      const layoutConfig: PDFLayoutConfig = {
        id: `copie-${Date.now()}`,
        name: `Copie - ${file.name}`,
        variant: 'technique',
        page: {
          size: 'A4',
          orientation: 'portrait',
          margins: { top: 12, right: 12, bottom: 12, left: 12 },
          grid: 5,
          unit: 'mm'
        },
        blocks: layoutBlocks,
        visibilityRules: {
          hasTech: 'items.tech.length > 0',
          hasAgents: 'items.agent.length > 0'
        },
        metadata: {
          description: `Layout généré automatiquement depuis ${file.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      setExtractedElements(elements);
      setProgress(100);
      setCurrentStep('Analyse terminée !');
      
      setTimeout(() => {
        onAnalyzeComplete(layoutConfig);
        setIsAnalyzing(false);
      }, 500);

    } catch (error) {
      console.error('Erreur analyse PDF:', error);
      toast.error('Erreur lors de l\'analyse du PDF');
      setIsAnalyzing(false);
    }
  };

  const analyzeStructure = async (elements: ExtractedElement[]): Promise<LayoutBlock[]> => {
    const blocks: LayoutBlock[] = [];
    
    // Group elements by vertical position to detect rows/sections
    const sortedElements = elements
      .filter(el => el.type === 'text')
      .sort((a, b) => a.y - b.y);

    let blockId = 1;

    // Detect header (top 20% of page)
    const headerElements = sortedElements.filter(el => el.y < 60);
    if (headerElements.length > 0) {
      const headerLeft = headerElements.filter(el => el.x < 100);
      const headerRight = headerElements.filter(el => el.x >= 100);

      blocks.push({
        id: `header-${blockId++}`,
        type: 'header',
        x: 12,
        y: 10,
        width: 186,
        height: 20,
        locked: false,
        visible: true,
        zIndex: 1,
        style: {
          fontSize: 11,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: '#000000',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
          lineHeight: 1.2,
          padding: 0
        },
        bindings: {
          left: headerLeft.map(el => el.content).join(' '),
          right: headerRight.map(el => el.content).join(' ')
        }
      });
    }

    // Detect potential tables (aligned elements in rows)
    const tableElements = sortedElements.filter(el => el.y > 80 && el.y < 200);
    if (tableElements.length > 5) {
      // Group by Y position (within 3mm tolerance)
      const rows: ExtractedElement[][] = [];
      let currentRow: ExtractedElement[] = [];
      let lastY = -1;

      tableElements.forEach(el => {
        if (lastY === -1 || Math.abs(el.y - lastY) < 3) {
          currentRow.push(el);
        } else {
          if (currentRow.length > 0) rows.push([...currentRow]);
          currentRow = [el];
        }
        lastY = el.y;
      });
      
      if (currentRow.length > 0) rows.push(currentRow);

      if (rows.length > 2) {
        blocks.push({
          id: `table-${blockId++}`,
          type: 'table_tech',
          x: 12,
          y: 80,
          width: 186,
          height: 100,
          locked: false,
          visible: true,
          zIndex: 1,
          style: {
            fontSize: 10,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 0,
            lineHeight: 1.2,
            padding: 2
          },
          bindings: {},
          tableConfig: {
            dataset: 'items.tech',
            columns: [
              { id: 'ref', order: 0, label: 'Référence', binding: 'reference', width: 20, widthUnit: 'mm' as const, align: 'left' as const, visible: true },
              { id: 'label', order: 1, label: 'Désignation', binding: 'label', width: 80, widthUnit: 'mm' as const, align: 'left' as const, visible: true },
              { id: 'qty', order: 2, label: 'Qté', binding: 'quantity', width: 15, widthUnit: 'mm' as const, align: 'center' as const, visible: true },
              { id: 'price', order: 3, label: 'PU HT', binding: 'unitPrice', width: 25, widthUnit: 'mm' as const, align: 'right' as const, format: 'currency' as const, visible: true },
              { id: 'total', order: 4, label: 'Total HT', binding: 'totalHT', width: 25, widthUnit: 'mm' as const, align: 'right' as const, format: 'currency' as const, visible: true }
            ],
            repeatHeader: true,
            showTotals: true
          },
          visibleIf: 'hasTech'
        });
      }
    }

    // Detect footer (bottom 10% of page)
    const footerElements = sortedElements.filter(el => el.y > 270);
    if (footerElements.length > 0) {
      blocks.push({
        id: `footer-${blockId++}`,
        type: 'footer',
        x: 12,
        y: 277,
        width: 186,
        height: 10,
        locked: false,
        visible: true,
        zIndex: 1,
        style: {
          fontSize: 9,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          color: '#666666',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
          lineHeight: 1.2,
          padding: 0
        },
        bindings: {
          left: 'GPA SA – Sécurité privée',
          right: 'Page {{currentPage}} / {{totalPages}}'
        }
      });
    }

    return blocks;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse du PDF</CardTitle>
        <CardDescription>
          Extraction et analyse de la structure du document PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAnalyzing && (
          <Button onClick={analyzePDF} disabled={!file} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Analyser et reconstruire
          </Button>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{currentStep}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              L'analyse peut prendre quelques minutes selon la taille du PDF
            </p>
          </div>
        )}

        {extractedElements.length > 0 && (
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              {extractedElements.length} éléments détectés dans le PDF
            </AlertDescription>
          </Alert>
        )}

        {preview && (
          <div className="space-y-2">
            <h4 className="font-medium">Aperçu de la première page :</h4>
            <div className="border rounded-lg overflow-hidden bg-white">
              <img 
                src={preview} 
                alt="Aperçu PDF" 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};