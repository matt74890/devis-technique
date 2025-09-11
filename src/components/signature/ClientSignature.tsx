import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface ClientSignatureProps {
  onSignatureSaved?: (signatureData: { dataUrl: string; date: string; location: string }) => void;
  onCancel?: () => void;
}

const ClientSignature = ({ onSignatureSaved, onCancel }: ClientSignatureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const { settings, updateQuote } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    canvas.width = 400;
    canvas.height = 200;
    
    // Style de ligne pour la signature
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ligne de signature
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();

    // Texte indicatif
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Signature du client', canvas.width / 2, canvas.height - 10);

    // Remettre le style pour le dessin
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      e.preventDefault(); // Prevent scrolling
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer et redessiner le fond
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ligne de signature
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();

    // Texte indicatif
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Signature du client', canvas.width / 2, canvas.height - 10);

    // Remettre le style pour le dessin
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("Veuillez signer avant de sauvegarder");
      return;
    }

    // Convertir en image
    const dataUrl = canvas.toDataURL('image/png');
    
    // Préparer les données de signature
    const signatureData = {
      dataUrl,
      date: new Date().toLocaleDateString('fr-CH'),
      location: settings.sellerInfo?.location || ''
    };

    // Sauvegarder dans le devis
    updateQuote({ 
      clientSignature: signatureData 
    });

    // Callback optionnel
    if (onSignatureSaved) {
      onSignatureSaved(signatureData);
    }

    toast.success("Signature client sauvegardée");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PenTool className="h-5 w-5 text-primary" />
          <span>Signature du client</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
          <canvas
            ref={canvasRef}
            className="w-full h-auto cursor-crosshair bg-white rounded border"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="text-xs text-gray-500 text-center">
          Utilisez votre souris, doigt ou stylet pour signer
        </div>

        <div className="flex justify-between space-x-2">
          <Button
            variant="outline"
            onClick={clearSignature}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          
          <Button
            onClick={saveSignature}
            disabled={!hasSignature}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>

        {settings.sellerInfo?.location && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Date et lieu: {new Date().toLocaleDateString('fr-CH')} à {settings.sellerInfo.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientSignature;