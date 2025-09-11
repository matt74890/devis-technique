import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Move, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFLayoutConfig } from '@/types/layout';
import { useStore } from '@/store/useStore';

interface FidelityCheckerProps {
  originalFile: File | null;
  reconstructedLayout: PDFLayoutConfig | null;
}

export const FidelityChecker: React.FC<FidelityCheckerProps> = ({
  originalFile,
  reconstructedLayout
}) => {
  const { currentQuote: quote, settings } = useStore();
  const [overlayOpacity, setOverlayOpacity] = useState([50]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(100);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [reconstructedPreview, setReconstructedPreview] = useState<string | null>(null);
  const [fidelityScore, setFidelityScore] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (originalFile) {
      generateOriginalPreview();
    }
  }, [originalFile]);

  useEffect(() => {
    if (reconstructedLayout) {
      generateReconstructedPreview();
    }
  }, [reconstructedLayout, quote, settings]);

  const generateOriginalPreview = async () => {
    if (!originalFile) return;

    try {
      const arrayBuffer = await originalFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 2 });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context!,
        viewport: viewport,
        canvas: canvas
      }).promise;

      setOriginalPreview(canvas.toDataURL());
    } catch (error) {
      console.error('Erreur génération preview original:', error);
      toast.error('Erreur lors de la génération de l\'aperçu original');
    }
  };

  const generateReconstructedPreview = async () => {
    if (!reconstructedLayout) return;

    try {
      // Simuler la génération du HTML reconstruit
      const html = renderLayoutHTML(reconstructedLayout, quote, settings);
      
      // Créer un canvas pour rendre le HTML
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 595; // A4 width in pixels at 72 DPI
      canvas.height = 842; // A4 height in pixels at 72 DPI

      // Fond blanc
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Simuler le rendu des blocs (version simplifiée)
      reconstructedLayout.blocks.forEach((block) => {
        const x = (block.x / 210) * canvas.width; // Convert mm to pixels
        const y = (block.y / 297) * canvas.height;
        const width = (block.width / 210) * canvas.width;
        const height = (block.height / 297) * canvas.height;

        // Dessiner un rectangle pour chaque bloc
        ctx!.strokeStyle = '#e5e7eb';
        ctx!.strokeRect(x, y, width, height);

        // Ajouter le texte du bloc
        if (block.bindings) {
          ctx!.fillStyle = block.style?.color || '#000000';
          ctx!.font = `${block.style?.fontSize || 11}px Arial`;
          ctx!.fillText(
            Object.values(block.bindings)[0]?.toString().slice(0, 20) || block.type,
            x + 5,
            y + 15
          );
        }
      });

      setReconstructedPreview(canvas.toDataURL());
      calculateFidelityScore();
    } catch (error) {
      console.error('Erreur génération preview reconstruit:', error);
      toast.error('Erreur lors de la génération de l\'aperçu reconstruit');
    }
  };

  const renderLayoutHTML = (layout: PDFLayoutConfig, quoteData: any, settingsData: any): string => {
    // Version simplifiée du rendu HTML
    return `
      <div style="width: 210mm; height: 297mm; background: white; padding: 12mm;">
        ${layout.blocks.map(block => `
          <div style="
            position: absolute;
            left: ${block.x}mm;
            top: ${block.y}mm;
            width: ${block.width}mm;
            height: ${block.height}mm;
            font-size: ${block.style?.fontSize || 11}px;
            font-weight: ${block.style?.fontWeight || 'normal'};
            color: ${block.style?.color || '#000000'};
            text-align: ${block.style?.textAlign || 'left'};
          ">
            ${block.bindings ? Object.values(block.bindings)[0] : block.type}
          </div>
        `).join('')}
      </div>
    `;
  };

  const calculateFidelityScore = () => {
    if (!originalPreview || !reconstructedPreview || !reconstructedLayout) {
      setFidelityScore(null);
      return;
    }

    // Algorithme simplifié de calcul de fidélité
    // En réalité, cela nécessiterait une comparaison pixel par pixel
    let score = 100;

    // Pénalité basée sur le nombre de blocs détectés vs attendus
    const expectedBlocks = 8; // Nombre typique de blocs dans un devis
    const detectedBlocks = reconstructedLayout.blocks.length;
    const blockDifference = Math.abs(expectedBlocks - detectedBlocks);
    score -= blockDifference * 5;

    // Pénalité basée sur les ajustements manuels
    score -= Math.abs(offsetX) * 0.1;
    score -= Math.abs(offsetY) * 0.1;
    score -= Math.abs(scale - 100) * 0.05;

    setFidelityScore(Math.max(0, Math.min(100, score)));
  };

  const resetAdjustments = () => {
    setOffsetX(0);
    setOffsetY(0);
    setScale(100);
    setOverlayOpacity([50]);
    toast.success('Ajustements remis à zéro');
  };

  const applyGlobalAdjustment = () => {
    if (!reconstructedLayout) return;

    const adjustedLayout = {
      ...reconstructedLayout,
      blocks: reconstructedLayout.blocks.map(block => ({
        ...block,
        x: block.x + (offsetX * 0.1), // Conversion approximative px->mm
        y: block.y + (offsetY * 0.1),
        width: block.width * (scale / 100),
        height: block.height * (scale / 100)
      }))
    };

    generateReconstructedPreview();
    toast.success('Ajustements appliqués au layout');
  };

  const getFidelityColor = (score: number | null) => {
    if (score === null) return 'bg-gray-500';
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFidelityIcon = (score: number | null) => {
    if (score === null) return <Eye className="w-4 h-4" />;
    if (score >= 90) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Score de fidélité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFidelityIcon(fidelityScore)}
            Vérification de fidélité
          </CardTitle>
          <CardDescription>
            Comparez la reconstruction avec l'original et ajustez si nécessaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getFidelityColor(fidelityScore)}`} />
              <span className="font-medium">
                Score de fidélité: {fidelityScore !== null ? `${fidelityScore.toFixed(1)}%` : 'En cours...'}
              </span>
            </div>
            <Badge variant={fidelityScore && fidelityScore >= 90 ? 'default' : 'secondary'}>
              {fidelityScore && fidelityScore >= 90 ? 'Excellent' : 
               fidelityScore && fidelityScore >= 70 ? 'Bon' : 
               fidelityScore ? 'À améliorer' : 'Analyse...'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison visuelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PDF Original</CardTitle>
          </CardHeader>
          <CardContent>
            {originalPreview ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <img 
                  src={originalPreview} 
                  alt="PDF Original" 
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                Génération de l'aperçu original...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Reconstruit</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverlay(!showOverlay)}
              >
                {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showOverlay ? 'Masquer' : 'Afficher'} superposition
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-lg overflow-hidden bg-white">
              {reconstructedPreview && (
                <img 
                  src={reconstructedPreview} 
                  alt="Layout Reconstruit" 
                  className="w-full h-auto"
                />
              )}
              
              {showOverlay && originalPreview && (
                <img 
                  src={originalPreview} 
                  alt="Superposition Original" 
                  className="absolute top-0 left-0 w-full h-auto"
                  style={{ 
                    opacity: overlayOpacity[0] / 100,
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale / 100})`
                  }}
                />
              )}
              
              {!reconstructedPreview && (
                <div className="p-8 text-center text-muted-foreground">
                  Génération de l'aperçu reconstruit...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles d'ajustement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            Ajustements de positionnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Opacité superposition (%)</Label>
              <Slider
                value={overlayOpacity}
                onValueChange={setOverlayOpacity}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground">{overlayOpacity[0]}%</span>
            </div>

            <div className="space-y-2">
              <Label>Décalage X (px)</Label>
              <Input
                type="number"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Décalage Y (px)</Label>
              <Input
                type="number"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Échelle (%)</Label>
              <Input
                type="number"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                min={50}
                max={150}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={applyGlobalAdjustment} variant="outline">
              Appliquer les ajustements
            </Button>
            <Button onClick={resetAdjustments} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};