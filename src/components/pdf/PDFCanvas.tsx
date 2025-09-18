import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PDFLayoutConfig, LayoutBlock } from '@/types/layout';

interface PDFCanvasProps {
  layout: PDFLayoutConfig;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<LayoutBlock>) => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  layout,
  zoom,
  showGrid,
  gridSize,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ blockId: string; offset: { x: number; y: number } } | null>(null);

  // Dimensions A4 en mm et conversion en pixels (à 96 DPI, 1mm ≈ 3.78px)
  const mmToPx = 3.78;
  const a4Width = 210 * mmToPx; // 210mm
  const a4Height = 297 * mmToPx; // 297mm
  const scaleFactor = zoom / 100;

  const handleMouseDown = (e: React.MouseEvent, block: LayoutBlock) => {
    e.preventDefault();
    e.stopPropagation();
    
    onSelectBlock(block.id);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / scaleFactor;
    const y = (e.clientY - rect.top) / scaleFactor;
    const blockX = block.x * mmToPx;
    const blockY = block.y * mmToPx;
    
    setDragging({
      blockId: block.id,
      offset: { x: x - blockX, y: y - blockY }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scaleFactor;
    const y = (e.clientY - rect.top) / scaleFactor;
    
    // Convertir en mm et appliquer le snap à la grille
    let newX = (x - dragging.offset.x) / mmToPx;
    let newY = (y - dragging.offset.y) / mmToPx;
    
    if (showGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Contraintes de la page A4
    newX = Math.max(layout.page.margins.left, Math.min(210 - layout.page.margins.right, newX));
    newY = Math.max(layout.page.margins.top, Math.min(297 - layout.page.margins.bottom, newY));
    
    onUpdateBlock(dragging.blockId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectBlock(null);
    }
  };

  useEffect(() => {
    if (dragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any);
      };
      
      const handleGlobalMouseUp = () => {
        setDragging(null);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragging]);

  const renderGrid = () => {
    if (!showGrid) return null;
    
    const gridLines = [];
    const spacing = gridSize * mmToPx;
    
    // Lignes verticales
    for (let x = 0; x <= a4Width; x += spacing) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={a4Height}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }
    
    // Lignes horizontales
    for (let y = 0; y <= a4Height; y += spacing) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={a4Width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }
    
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={a4Width}
        height={a4Height}
        style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'top left' }}
      >
        {gridLines}
      </svg>
    );
  };

  const renderMargins = () => {
    const { margins } = layout.page;
    const marginStyle = {
      border: '1px dashed #94a3b8',
      backgroundColor: 'rgba(148, 163, 184, 0.05)'
    };
    
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: margins.left * mmToPx * scaleFactor,
          top: margins.top * mmToPx * scaleFactor,
          right: margins.right * mmToPx * scaleFactor,
          bottom: margins.bottom * mmToPx * scaleFactor,
          width: (210 - margins.left - margins.right) * mmToPx * scaleFactor,
          height: (297 - margins.top - margins.bottom) * mmToPx * scaleFactor,
          ...marginStyle
        }}
      />
    );
  };

  const renderRulers = () => {
    const rulerHeight = 20;
    const rulerWidth = 20;
    const tickSpacing = 5 * mmToPx * scaleFactor; // Tick tous les 5mm
    
    return (
      <>
        {/* Règle horizontale */}
        <div 
          className="absolute top-0 left-5 bg-gray-100 border-b border-gray-300"
          style={{ width: a4Width * scaleFactor, height: rulerHeight }}
        >
          <svg width={a4Width * scaleFactor} height={rulerHeight}>
            {Array.from({ length: Math.floor(210 / 5) + 1 }, (_, i) => {
              const x = i * tickSpacing;
              const isMajor = i % 2 === 0;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={isMajor ? 0 : 5}
                    x2={x}
                    y2={rulerHeight}
                    stroke="#666"
                    strokeWidth={0.5}
                  />
                  {isMajor && (
                    <text
                      x={x + 2}
                      y={12}
                      fontSize={9}
                      fill="#666"
                    >
                      {i * 5}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Règle verticale */}
        <div 
          className="absolute left-0 top-5 bg-gray-100 border-r border-gray-300"
          style={{ width: rulerWidth, height: a4Height * scaleFactor }}
        >
          <svg width={rulerWidth} height={a4Height * scaleFactor}>
            {Array.from({ length: Math.floor(297 / 5) + 1 }, (_, i) => {
              const y = i * tickSpacing;
              const isMajor = i % 2 === 0;
              return (
                <g key={i}>
                  <line
                    x1={isMajor ? 0 : 5}
                    y1={y}
                    x2={rulerWidth}
                    y2={y}
                    stroke="#666"
                    strokeWidth={0.5}
                  />
                  {isMajor && (
                    <text
                      x={2}
                      y={y + 12}
                      fontSize={9}
                      fill="#666"
                      transform={`rotate(-90, 2, ${y + 12})`}
                    >
                      {i * 5}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </>
    );
  };

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full overflow-auto bg-gray-50">
        <div className="relative">
          {renderRulers()}
          
          <div 
            ref={canvasRef}
            className="relative ml-5 mt-5 bg-white shadow-lg cursor-crosshair"
            style={{
              width: a4Width * scaleFactor,
              height: a4Height * scaleFactor,
              minWidth: a4Width * scaleFactor,
              minHeight: a4Height * scaleFactor
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {renderGrid()}
            {renderMargins()}
            
            {/* Blocks */}
            {layout.blocks
              .filter(block => block.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((block) => {
                const isSelected = block.id === selectedBlockId;
                const blockStyle = {
                  position: 'absolute' as const,
                  left: block.x * mmToPx * scaleFactor,
                  top: block.y * mmToPx * scaleFactor,
                  width: block.width * mmToPx * scaleFactor,
                  height: block.height * mmToPx * scaleFactor,
                  fontSize: block.style.fontSize * scaleFactor,
                  fontFamily: block.style.fontFamily,
                  fontWeight: block.style.fontWeight,
                  fontStyle: block.style.fontStyle,
                  textAlign: block.style.textAlign,
                  color: block.style.color,
                  backgroundColor: block.style.backgroundColor,
                  border: isSelected 
                    ? '2px solid #3b82f6' 
                    : block.style.borderWidth > 0 
                      ? `${block.style.borderWidth}px solid ${block.style.borderColor}` 
                      : 'none',
                  borderRadius: block.style.borderRadius,
                  padding: block.style.padding * scaleFactor,
                  lineHeight: block.style.lineHeight,
                  cursor: block.locked ? 'not-allowed' : 'move',
                  zIndex: block.zIndex + (isSelected ? 1000 : 0),
                  overflow: 'hidden',
                  userSelect: 'none' as const,
                  opacity: block.locked ? 0.6 : 1
                };

                const getBlockContent = () => {
                  switch (block.type) {
                    case 'header':
                      return (
                        <div className="flex justify-between items-center h-full">
                          <span>{block.bindings.left || 'En-tête gauche'}</span>
                          <span>{block.bindings.right || 'En-tête droite'}</span>
                        </div>
                      );
                    case 'footer':
                      return (
                        <div className="flex justify-between items-center h-full">
                          <span>{block.bindings.left || 'Pied gauche'}</span>
                          <span>{block.bindings.right || 'Pied droite'}</span>
                        </div>
                      );
                    case 'table_tech':
                      return (
                        <div className="border border-gray-300 h-full">
                          <div className="bg-blue-600 text-white p-1 text-xs font-bold">
                            Tableau Technique
                          </div>
                          <div className="p-1 text-xs">
                            Colonnes: {block.tableConfig?.columns.filter(c => c.visible).length || 0}
                          </div>
                        </div>
                      );
                    case 'table_agent':
                      return (
                        <div className="border border-gray-300 h-full">
                          <div className="bg-orange-500 text-white p-1 text-xs font-bold">
                            Tableau Agents
                          </div>
                          <div className="p-1 text-xs">
                            Colonnes: {block.tableConfig?.columns.filter(c => c.visible).length || 0}
                          </div>
                        </div>
                      );
                    case 'totals':
                      return (
                        <div className="border border-gray-300 h-full p-1">
                          <div className="text-xs font-bold">Totaux</div>
                          <div className="text-xs">HT • TVA • TTC</div>
                        </div>
                      );
                    case 'signatures':
                      return (
                        <div className="flex justify-between h-full text-xs">
                          <div>Vendeur</div>
                          <div>Client</div>
                        </div>
                      );
                    case 'intent':
                      return (
                        <div className="text-xs">
                          <div>À l'intention de:</div>
                          <div>{block.bindings.company || 'Entreprise'}</div>
                        </div>
                      );
                    case 'letter':
                      return (
                        <div className="text-xs leading-tight">
                          {block.content || block.bindings.text || 'Lettre de présentation...'}
                        </div>
                      );
                    case 'description':
                      return (
                        <div className="text-xs">
                          <div className="font-bold">Description prestation agents</div>
                          <div>Nature • Lieu • Période...</div>
                        </div>
                      );
                    default:
                      return block.content || `Bloc ${block.type}`;
                  }
                };

                return (
                  <div
                    key={block.id}
                    style={blockStyle}
                    onMouseDown={(e) => !block.locked && handleMouseDown(e, block)}
                    className={`
                      ${!block.locked && 'hover:shadow-md'} 
                      ${isSelected ? 'shadow-lg' : ''}
                      transition-shadow duration-150
                    `}
                  >
                    {getBlockContent()}
                    
                    {/* Handles de redimensionnement pour le bloc sélectionné */}
                    {isSelected && !block.locked && (
                      <>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 cursor-nw-resize" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 cursor-ne-resize" />
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 cursor-nw-resize" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 cursor-ne-resize" />
                      </>
                    )}
                  </div>
                );
              })}
            
            {/* Informations de la page */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              A4 • {zoom}% • Page 1/1
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};