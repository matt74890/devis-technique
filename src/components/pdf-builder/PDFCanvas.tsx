import React, { useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, RotateCcw } from 'lucide-react';
import { PDFBlock, BLOCK_DEFINITIONS, BlockRenderContext } from './blocks/BlockTypes';
import type { Quote, Settings } from '@/types';

interface PDFTemplate {
  id: string;
  name: string;
  variant: 'technique' | 'agent' | 'mixte';
  blocks: PDFBlock[];
}

interface PDFCanvasProps {
  template: PDFTemplate;
  selectedBlockId: string | null;
  zoom: number;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (blockId: string, updates: Partial<PDFBlock>) => void;
  showPreview: boolean;
  quote: Quote | null;
  settings: Settings;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  template,
  selectedBlockId,
  zoom,
  onBlockSelect,
  onBlockUpdate,
  showPreview,
  quote,
  settings
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    startPos: { x: number; y: number };
    blockId: string;
    initialPos: { x: number; y: number };
  } | null>(null);

  // Dimensions de la page A4 en pixels (approximatif)
  const pageWidth = 595;
  const pageHeight = 842;
  const scaledWidth = (pageWidth * zoom) / 100;
  const scaledHeight = (pageHeight * zoom) / 100;

  const handleMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    if (showPreview) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const block = template.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    dragRef.current = {
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      blockId,
      initialPos: { ...block.position }
    };
    
    onBlockSelect(blockId);
  }, [showPreview, template.blocks, onBlockSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current?.isDragging) return;
    
    const deltaX = e.clientX - dragRef.current.startPos.x;
    const deltaY = e.clientY - dragRef.current.startPos.y;
    
    // Convertir les pixels en pourcentage
    const deltaXPercent = (deltaX / scaledWidth) * 100;
    const deltaYPercent = (deltaY / scaledHeight) * 100;
    
    const newPosition = {
      x: Math.max(0, Math.min(100, dragRef.current.initialPos.x + deltaXPercent)),
      y: Math.max(0, Math.min(100, dragRef.current.initialPos.y + deltaYPercent))
    };
    
    onBlockUpdate(dragRef.current.blockId, { position: newPosition });
  }, [scaledWidth, scaledHeight, onBlockUpdate]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.isDragging = false;
      dragRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (dragRef.current?.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  const renderBlock = (block: PDFBlock) => {
    if (!quote) return null;
    
    const definition = BLOCK_DEFINITIONS[block.type];
    if (!definition) return null;
    
    const context: BlockRenderContext = {
      quote,
      settings,
      pageWidth,
      pageHeight,
      currentPage: 1
    };
    
    const blockStyle = {
      position: 'absolute' as const,
      left: `${block.position.x}%`,
      top: `${block.position.y}%`,
      width: `${block.size.width}%`,
      height: `${block.size.height}%`,
      minHeight: `${(definition.minSize.height / 100) * scaledHeight}px`,
      zIndex: selectedBlockId === block.id ? 10 : 1,
    };
    
    if (showPreview) {
      return (
        <div
          key={block.id}
          style={blockStyle}
          className="overflow-hidden"
          dangerouslySetInnerHTML={{ __html: definition.render(block, context) }}
        />
      );
    }
    
    return (
      <div
        key={block.id}
        style={blockStyle}
        className={`
          border-2 border-dashed overflow-hidden cursor-move
          ${selectedBlockId === block.id 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onMouseDown={(e) => handleMouseDown(e, block.id)}
        onClick={(e) => {
          e.stopPropagation();
          onBlockSelect(block.id);
        }}
      >
        {/* Handle de déplacement */}
        {selectedBlockId === block.id && (
          <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
            <Move className="h-3 w-3" />
            <span>{block.name}</span>
          </div>
        )}
        
        {/* Contenu du bloc */}
        <div 
          className="w-full h-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: definition.render(block, context) }}
        />
        
        {/* Overlay pour les interactions */}
        {!showPreview && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>
    );
  };

  return (
    <div className="flex justify-center">
      <Card 
        ref={canvasRef}
        className="relative bg-white shadow-lg"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          minWidth: scaledWidth,
          minHeight: scaledHeight,
        }}
        onClick={() => !showPreview && onBlockSelect(null)}
      >
        {/* Grille de fond */}
        {!showPreview && (
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: `${scaledWidth / 20}px ${scaledHeight / 20}px`
            }}
          />
        )}
        
        {/* Rendu des blocs */}
        {template.blocks
          .filter(block => block.visible !== false)
          .map(renderBlock)}
        
        {/* Message si aucun bloc */}
        {template.blocks.length === 0 && !showPreview && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Template vide</div>
              <div className="text-sm">Ajoutez des blocs depuis la palette de gauche</div>
            </div>
          </div>
        )}
        
        {/* Message si pas de devis en aperçu */}
        {!quote && showPreview && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Aucun devis</div>
              <div className="text-sm">Créez un devis pour voir l'aperçu</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};