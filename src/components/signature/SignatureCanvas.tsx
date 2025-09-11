import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Pen } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  signature?: string;
}

export const SignatureCanvas = ({ onSignatureChange, signature }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    canvas.width = 400;
    canvas.height = 150;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Charger signature existante si présente
    if (signature && signature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsSigning(true);
      };
      img.src = signature;
    }

    // Fonction pour obtenir les coordonnées de l'événement
    const getEventPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      if (e.type.includes('touch')) {
        const touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY
        };
      } else {
        const mouse = e as MouseEvent;
        return {
          x: (mouse.clientX - rect.left) * scaleX,
          y: (mouse.clientY - rect.top) * scaleY
        };
      }
    };

    // Fonction de début de dessin
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getEventPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    // Fonction de dessin
    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      
      const pos = getEventPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      setIsSigning(true);
    };

    // Fonction de fin de dessin
    const stopDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      
      setIsDrawing(false);
      ctx.closePath();
      
      // Sauvegarder la signature
      const signatureData = canvas.toDataURL('image/png');
      onSignatureChange(signatureData);
    };

    // Événements souris
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Événements tactiles (mobile)
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [signature, onSignatureChange, isDrawing]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsSigning(false);
    onSignatureChange('');
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
        <div className="rounded-lg p-2 bg-background">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair touch-none"
            style={{ maxWidth: '100%', height: 'auto' }}
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
          
          <p className="text-xs text-muted-foreground ml-auto">
            Dessinez votre signature ci-dessus
          </p>
        </div>
      </CardContent>
    </Card>
  );
};