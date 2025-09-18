import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const SellerInfo = () => {
  const { settings, updateSettings } = useSettings();

  const handleUpdateSeller = (field: string, value: string) => {
    updateSettings({
      sellerInfo: {
        ...settings.sellerInfo,
        [field]: value
      }
    });
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
        
      </CardContent>
    </Card>
  );
};

export default SellerInfo;