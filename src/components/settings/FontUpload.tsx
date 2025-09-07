import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { toast } from 'sonner';

interface CustomFont {
  name: string;
  file: File;
  url: string;
  family: string;
}

const FontUpload = () => {
  const { settings, updateSettings } = useSettings();
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['.woff', '.woff2', '.ttf', '.otf'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newFonts: CustomFont[] = [];

      for (const file of Array.from(files)) {
        // Vérifier le format
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFormats.includes(fileExtension)) {
          toast.error(`Format non supporté: ${file.name}. Formats acceptés: ${acceptedFormats.join(', ')}`);
          continue;
        }

        // Créer URL pour le fichier
        const url = URL.createObjectURL(file);
        const fontName = file.name.replace(/\.[^/.]+$/, '');
        const fontFamily = `'${fontName}', sans-serif`;

        // Créer la font-face CSS
        const fontFace = new FontFace(fontName, `url(${url})`);
        
        try {
          await fontFace.load();
          document.fonts.add(fontFace);

          const customFont: CustomFont = {
            name: fontName,
            file,
            url,
            family: fontFamily
          };

          newFonts.push(customFont);
          toast.success(`Police "${fontName}" importée avec succès`);
        } catch (error) {
          toast.error(`Erreur lors du chargement de la police: ${file.name}`);
          URL.revokeObjectURL(url);
        }
      }

      if (newFonts.length > 0) {
        setCustomFonts(prev => [...prev, ...newFonts]);
      }

    } catch (error) {
      toast.error('Erreur lors de l\'import des polices');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFont = (index: number) => {
    const fontToRemove = customFonts[index];
    URL.revokeObjectURL(fontToRemove.url);
    
    // Retirer de document.fonts
    const fontFace = [...document.fonts].find(f => f.family === fontToRemove.name);
    if (fontFace) {
      document.fonts.delete(fontFace);
    }

    setCustomFonts(prev => prev.filter((_, i) => i !== index));
    toast.success(`Police "${fontToRemove.name}" supprimée`);
  };

  const handleUseCustomFont = (font: CustomFont) => {
    updateSettings({
      selectedFont: 'custom',
      fontFamily: font.family,
      customFontName: font.name
    });
    toast.success(`Police "${font.name}" appliquée au document PDF`);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5 text-primary" />
          <span>Import de polices personnalisées</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Importez vos propres fichiers de polices (Arial Nova Light, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone d'upload */}
        <div className="space-y-4">
          <Label htmlFor="font-upload">Sélectionner des fichiers de police</Label>
          <div className="flex items-center space-x-2">
            <Input
              ref={fileInputRef}
              id="font-upload"
              type="file"
              multiple
              accept={acceptedFormats.join(',')}
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Import...' : 'Parcourir'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formats supportés : {acceptedFormats.join(', ')} • Taille max : 5MB par fichier
          </p>
        </div>

        {/* Liste des polices importées */}
        {customFonts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Polices importées ({customFonts.length})</h4>
            <div className="space-y-2">
              {customFonts.map((font, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p 
                        className="font-medium text-sm"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Taille : {(font.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseCustomFont(font)}
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Utiliser
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFont(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aperçu de la police sélectionnée si c'est une custom */}
        {settings.selectedFont === 'custom' && settings.customFontName && (
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h5 className="font-medium text-green-900 mb-2">
              ✅ Police personnalisée active
            </h5>
            <p className="text-sm text-green-800 mb-3">
              Police actuelle : <strong>{settings.customFontName}</strong>
            </p>
            <div 
              style={{ fontFamily: settings.fontFamily }}
              className="space-y-1"
            >
              <p className="text-lg font-light">Aperçu avec votre police personnalisée</p>
              <p className="text-base">Arial Nova Light - Texte normal</p>
              <p className="text-sm text-muted-foreground">
                Cette police sera utilisée dans le PDF généré.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h5 className="font-medium text-blue-900 mb-2">💡 Instructions</h5>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Téléchargez Arial Nova Light depuis votre ordinateur</li>
            <li>Formats acceptés : WOFF, WOFF2, TTF, OTF</li>
            <li>Cliquez sur "Utiliser" pour appliquer la police au PDF</li>
            <li>La police sera chargée dans votre navigateur pour l'aperçu</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FontUpload;