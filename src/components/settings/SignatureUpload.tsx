import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSignature, Trash2 } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SignatureUpload = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadSignature = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à uploader.');
      }

      const file = event.target.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image ne doit pas dépasser 5MB');
      }

      if (!user) {
        throw new Error('Vous devez être connecté pour uploader une signature');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/signature.${fileExt}`;

      // Supprimer l'ancienne signature s'il existe
      if (settings.sellerInfo?.signature && settings.sellerInfo.signature.startsWith('https://')) {
        const oldPath = settings.sellerInfo.signature.split('/').slice(-2).join('/');
        await supabase.storage.from('signatures').remove([oldPath]);
      }

      // Upload la nouvelle signature
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage.from('signatures').getPublicUrl(filePath);
      
      // Mettre à jour les paramètres
      updateSettings({ 
        sellerInfo: { 
          ...settings.sellerInfo, 
          signature: data.publicUrl 
        } 
      });
      
      toast.success('Signature uploadée avec succès!');
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeSignature = async () => {
    try {
      if (!settings.sellerInfo?.signature) return;
      
      if (settings.sellerInfo.signature.startsWith('https://')) {
        const filePath = settings.sellerInfo.signature.split('/').slice(-2).join('/');
        
        const { error } = await supabase.storage
          .from('signatures')
          .remove([filePath]);

        if (error) throw error;
      }

      updateSettings({ 
        sellerInfo: { 
          ...settings.sellerInfo, 
          signature: '' 
        } 
      });
      toast.success('Signature supprimée');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression de la signature');
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <span>Signature du vendeur</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cette signature apparaîtra sur les PDFs et la lettre de présentation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature actuelle */}
        {settings.sellerInfo?.signature && (
          <div className="flex items-center space-x-4 p-4 border rounded-lg">
            <img 
              src={settings.sellerInfo.signature} 
              alt="Signature du vendeur"
              className="h-16 max-w-32 object-contain bg-gray-50 rounded"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Signature actuelle</p>
              <p className="text-xs text-muted-foreground">
                Utilisée sur les PDFs et la lettre de présentation
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeSignature}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload de nouvelle signature */}
        <div>
          <Label htmlFor="signature-upload" className="text-base font-medium">
            {settings.sellerInfo?.signature ? 'Remplacer la signature' : 'Ajouter une signature'}
          </Label>
          <div className="mt-2">
            <input
              id="signature-upload"
              type="file"
              accept="image/*"
              onChange={uploadSignature}
              disabled={uploading}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('signature-upload')?.click()}
              disabled={uploading}
              className="w-full"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Upload en cours...' : 'Choisir une image'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formats acceptés : JPG, PNG, GIF • Taille max : 5MB • Recommandé : fond transparent
          </p>
        </div>

        {/* URL alternative */}
        <div>
          <Label htmlFor="signature-url">Ou saisir une URL d'image</Label>
          <Input
            id="signature-url"
            value={settings.sellerInfo?.signature || ''}
            onChange={(e) => updateSettings({ 
              sellerInfo: { 
                ...settings.sellerInfo, 
                signature: e.target.value 
              } 
            })}
            placeholder="https://example.com/signature.png"
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureUpload;