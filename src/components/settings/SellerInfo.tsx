import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Upload, X } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useRef } from 'react';

const SellerInfo = () => {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateSeller = (field: string, value: string) => {
    updateSettings({
      sellerInfo: {
        ...settings.sellerInfo,
        [field]: value
      }
    });
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        handleUpdateSeller('signature', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
    handleUpdateSeller('signature', '');
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-primary" />
          <span>Informations du vendeur</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ces informations apparaîtront sur le devis et la lettre de présentation
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seller-name">Nom du vendeur *</Label>
            <Input
              id="seller-name"
              value={settings.sellerInfo?.name || ''}
              onChange={(e) => handleUpdateSeller('name', e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-title">Titre/Fonction</Label>
            <Input
              id="seller-title"
              value={settings.sellerInfo?.title || ''}
              onChange={(e) => handleUpdateSeller('title', e.target.value)}
              placeholder="Conseiller technique"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-email">Email professionnel</Label>
            <Input
              id="seller-email"
              type="email"
              value={settings.sellerInfo?.email || ''}
              onChange={(e) => handleUpdateSeller('email', e.target.value)}
              placeholder="jean.dupont@entreprise.ch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-phone">Téléphone direct</Label>
            <Input
              id="seller-phone"
              value={settings.sellerInfo?.phone || ''}
              onChange={(e) => handleUpdateSeller('phone', e.target.value)}
              placeholder="+41 21 XXX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-location">Lieu de création des devis</Label>
            <Input
              id="seller-location"
              value={settings.sellerInfo?.location || ''}
              onChange={(e) => handleUpdateSeller('location', e.target.value)}
              placeholder="Genève"
            />
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Label>Signature du vendeur</Label>
          <p className="text-sm text-muted-foreground">
            Ajoutez votre signature qui apparaîtra automatiquement sur les PDF
          </p>
          
          {settings.sellerInfo?.signature ? (
            <div className="space-y-2">
              <div className="relative p-4 border rounded-lg bg-card">
                <img 
                  src={settings.sellerInfo.signature} 
                  alt="Signature" 
                  className="max-h-20 object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={removeSignature}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Changer la signature
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-dashed"
            >
              <Upload className="h-6 w-6 mr-2" />
              Télécharger une signature
            </Button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerInfo;