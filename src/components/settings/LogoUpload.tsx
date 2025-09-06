import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, Trash2 } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LogoUpload = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        throw new Error('Vous devez être connecté pour uploader un logo');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Supprimer l'ancien logo s'il existe
      if (settings.logoUrl) {
        const oldPath = settings.logoUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('logos').remove([oldPath]);
      }

      // Upload le nouveau logo
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      
      // Mettre à jour les paramètres
      updateSettings({ logoUrl: data.publicUrl });
      
      toast.success('Logo uploadé avec succès!');
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      if (!settings.logoUrl) return;
      
      const filePath = settings.logoUrl.split('/').slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (error) throw error;

      updateSettings({ logoUrl: '' });
      toast.success('Logo supprimé');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression du logo');
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5 text-primary" />
          <span>Logo de l'entreprise</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ce logo apparaîtra sur la lettre de présentation et les devis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo actuel */}
        {settings.logoUrl && (
          <div className="flex items-center space-x-4 p-4 border rounded-lg">
            <img 
              src={settings.logoUrl} 
              alt="Logo de l'entreprise"
              className="h-16 w-16 object-contain bg-gray-50 rounded"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Logo actuel</p>
              <p className="text-xs text-muted-foreground">
                Utilisé sur la lettre de présentation et les devis
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeLogo}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload de nouveau logo */}
        <div>
          <Label htmlFor="logo-upload" className="text-base font-medium">
            {settings.logoUrl ? 'Remplacer le logo' : 'Ajouter un logo'}
          </Label>
          <div className="mt-2">
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={uploading}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={uploading}
              className="w-full"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Upload en cours...' : 'Choisir une image'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formats acceptés : JPG, PNG, GIF • Taille max : 5MB
          </p>
        </div>

        {/* URL alternative */}
        <div>
          <Label htmlFor="logo-url">Ou saisir une URL d'image</Label>
          <Input
            id="logo-url"
            value={settings.logoUrl}
            onChange={(e) => updateSettings({ logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;