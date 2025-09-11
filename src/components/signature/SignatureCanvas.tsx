import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Pen } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  signature?: string;
}

export const SignatureCanvas = ({ onSignatureChange, signature }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 150,
      backgroundColor: '#ffffff',
      isDrawingMode: true
    });

    // Configuration du pinceau
    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = '#000000';

    // Charger signature existante si présente
    if (signature) {
      try {
        canvas.loadFromJSON(signature, () => {
          canvas.renderAll();
          setIsSigning(true);
        });
      } catch (error) {
        console.log('Erreur lors du chargement de la signature:', error);
      }
    }

    // Événement lors de modification
    canvas.on('path:created', () => {
      setIsSigning(true);
      const signatureData = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      onSignatureChange(signatureData);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const clearSignature = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      setIsSigning(false);
      onSignatureChange('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5" />
          Signature client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-input rounded-lg p-2 bg-background">
          <canvas
            ref={canvasRef}
            className="border border-dashed border-muted-foreground/30 rounded w-full cursor-crosshair"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!isSigning}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Effacer
          </Button>
          
          {isSigning && (
            <p className="text-sm text-muted-foreground flex items-center">
              ✓ Signature enregistrée
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};