import React from 'react';
import { PDFBlock, BLOCK_DEFINITIONS, BlockRenderContext } from './blocks/BlockTypes';
import type { Quote, Settings } from '@/types';
import html2pdf from 'html2pdf.js';

interface PDFTemplate {
  id: string;
  name: string;
  variant: 'technique' | 'agent' | 'mixte';
  blocks: PDFBlock[];
}

interface SimplePDFRendererProps {
  template: PDFTemplate;
  quote: Quote;
  settings: Settings;
  onGenerate?: (pdfBlob: Blob) => void;
}

export const SimplePDFRenderer: React.FC<SimplePDFRendererProps> = ({
  template,
  quote,
  settings,
  onGenerate
}) => {
  const pageWidth = 595;
  const pageHeight = 842;

  const renderTemplate = () => {
    const context: BlockRenderContext = {
      quote,
      settings,
      pageWidth,
      pageHeight,
      currentPage: 1
    };

    const blocksHTML = template.blocks
      .filter(block => block.visible !== false)
      .sort((a, b) => a.position.y - b.position.y) // Trier par position Y
      .map(block => {
        const definition = BLOCK_DEFINITIONS[block.type];
        if (!definition) return '';

        // Convertir les positions en pixels absolus
        const left = (block.position.x / 100) * pageWidth;
        const top = (block.position.y / 100) * pageHeight;
        const width = (block.size.width / 100) * pageWidth;
        const height = (block.size.height / 100) * pageHeight;

        const blockStyle = `
          position: absolute;
          left: ${left}px;
          top: ${top}px;
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          ${block.style ? `
            background-color: ${block.style.backgroundColor || 'transparent'};
            color: ${block.style.color || '#000'};
            font-size: ${block.style.fontSize || 14}px;
            font-weight: ${block.style.fontWeight || 'normal'};
            text-align: ${block.style.textAlign || 'left'};
            padding: ${block.style.padding || 0}px;
            margin: ${block.style.margin || 0}px;
            border-radius: ${block.style.borderRadius || 0}px;
            ${block.style.borderWidth ? `
              border: ${block.style.borderWidth}px solid ${block.style.borderColor || '#000'};
            ` : ''}
          ` : ''}
        `;

        const content = definition.render(block, context);
        
        return `<div style="${blockStyle}">${content}</div>`;
      }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Devis ${quote.ref}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            
            .page {
              position: relative;
              width: ${pageWidth}px;
              min-height: ${pageHeight}px;
              background: white;
              margin: 0 auto;
              page-break-after: always;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            
            .p-4 { padding: 16px; }
            .p-2 { padding: 8px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-16 { margin-top: 64px; }
            
            .border { border: 1px solid #ddd; }
            .border-t { border-top: 1px solid #ddd; }
            .border-b { border-bottom: 1px solid #ddd; }
            .rounded { border-radius: 4px; }
            
            .bg-gray-50 { background-color: #f9f9f9; }
            .bg-gray-100 { background-color: #f3f4f6; }
            
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .space-y-2 > * + * { margin-top: 8px; }
            
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-4 { gap: 16px; }
            .gap-8 { gap: 32px; }
            
            .ml-auto { margin-left: auto; }
            .w-96 { width: 384px; }
            
            .overflow-x-auto { overflow-x: auto; }
            
            @media print {
              .page {
                margin: 0;
                box-shadow: none;
              }
              
              table {
                page-break-inside: avoid;
              }
              
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${blocksHTML}
          </div>
        </body>
      </html>
    `;
  };

  const generatePDF = async () => {
    const htmlContent = renderTemplate();
    
    const opt = {
      margin: 0,
      filename: `devis-${quote.ref}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'pt', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(htmlContent).outputPdf('blob');
      
      if (onGenerate) {
        onGenerate(pdfBlob);
      } else {
        // Téléchargement automatique
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis-${quote.ref}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  };

  // Rendu pour l'aperçu
  const previewHTML = renderTemplate();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        className="border shadow-lg bg-white"
        dangerouslySetInnerHTML={{ __html: previewHTML }}
      />
      
      <div className="mt-4 text-center">
        <button
          onClick={generatePDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Générer PDF
        </button>
      </div>
    </div>
  );
};

export default SimplePDFRenderer;