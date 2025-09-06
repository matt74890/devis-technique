import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { MapPin, Building, Copy } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Address } from '@/types';

const AddressSettings = () => {
  const { settings, updateAddresses } = useStore();

  const updateBillingAddress = (updates: Partial<Address>) => {
    updateAddresses({
      billing: { ...settings.addresses.billing, ...updates }
    });
  };

  const updateInstallationAddress = (updates: Partial<Address>) => {
    updateAddresses({
      installation: { ...settings.addresses.installation, ...updates }
    });
  };

  const copyBillingToInstallation = () => {
    updateAddresses({
      installation: { ...settings.addresses.billing }
    });
  };

  const toggleSameAddress = (useSame: boolean) => {
    if (useSame) {
      copyBillingToInstallation();
    }
    updateAddresses({ useSameAddress: useSame });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-primary" />
            <span>Gestion des Adresses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurez vos adresses de facturation et d'installation qui apparaîtront sur vos devis PDF.
          </p>
        </CardContent>
      </Card>

      {/* Adresse de facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-success" />
            <span>Adresse de Facturation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing-company">Société</Label>
              <Input
                id="billing-company"
                value={settings.addresses.billing.company}
                onChange={(e) => updateBillingAddress({ company: e.target.value })}
                placeholder="Nom de la société"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-name">Nom du contact</Label>
              <Input
                id="billing-name"
                value={settings.addresses.billing.name}
                onChange={(e) => updateBillingAddress({ name: e.target.value })}
                placeholder="Nom et prénom"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="billing-street">Adresse</Label>
              <Input
                id="billing-street"
                value={settings.addresses.billing.street}
                onChange={(e) => updateBillingAddress({ street: e.target.value })}
                placeholder="Rue et numéro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-postal">Code postal</Label>
              <Input
                id="billing-postal"
                value={settings.addresses.billing.postalCode}
                onChange={(e) => updateBillingAddress({ postalCode: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-city">Ville</Label>
              <Input
                id="billing-city"
                value={settings.addresses.billing.city}
                onChange={(e) => updateBillingAddress({ city: e.target.value })}
                placeholder="Lausanne"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-country">Pays</Label>
              <Input
                id="billing-country"
                value={settings.addresses.billing.country}
                onChange={(e) => updateBillingAddress({ country: e.target.value })}
                placeholder="Suisse"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-email">Email</Label>
              <Input
                id="billing-email"
                type="email"
                value={settings.addresses.billing.email}
                onChange={(e) => updateBillingAddress({ email: e.target.value })}
                placeholder="contact@exemple.ch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-phone">Téléphone</Label>
              <Input
                id="billing-phone"
                type="tel"
                value={settings.addresses.billing.phone}
                onChange={(e) => updateBillingAddress({ phone: e.target.value })}
                placeholder="+41 21 XXX XX XX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option même adresse */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="same-address"
                checked={settings.addresses.useSameAddress}
                onCheckedChange={toggleSameAddress}
              />
              <div>
                <Label htmlFor="same-address" className="font-medium">
                  Utiliser la même adresse pour l'installation
                </Label>
                <p className="text-sm text-muted-foreground">
                  L'adresse d'installation sera identique à celle de facturation
                </p>
              </div>
            </div>
            {!settings.addresses.useSameAddress && (
              <Button
                variant="outline"
                onClick={copyBillingToInstallation}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copier</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adresse d'installation */}
      {!settings.addresses.useSameAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-warning" />
              <span>Adresse d'Installation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="install-company">Société</Label>
                <Input
                  id="install-company"
                  value={settings.addresses.installation.company}
                  onChange={(e) => updateInstallationAddress({ company: e.target.value })}
                  placeholder="Nom de la société"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-name">Nom du contact</Label>
                <Input
                  id="install-name"
                  value={settings.addresses.installation.name}
                  onChange={(e) => updateInstallationAddress({ name: e.target.value })}
                  placeholder="Nom et prénom"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="install-street">Adresse</Label>
                <Input
                  id="install-street"
                  value={settings.addresses.installation.street}
                  onChange={(e) => updateInstallationAddress({ street: e.target.value })}
                  placeholder="Rue et numéro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-postal">Code postal</Label>
                <Input
                  id="install-postal"
                  value={settings.addresses.installation.postalCode}
                  onChange={(e) => updateInstallationAddress({ postalCode: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-city">Ville</Label>
                <Input
                  id="install-city"
                  value={settings.addresses.installation.city}
                  onChange={(e) => updateInstallationAddress({ city: e.target.value })}
                  placeholder="Lausanne"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-country">Pays</Label>
                <Input
                  id="install-country"
                  value={settings.addresses.installation.country}
                  onChange={(e) => updateInstallationAddress({ country: e.target.value })}
                  placeholder="Suisse"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-email">Email</Label>
                <Input
                  id="install-email"
                  type="email"
                  value={settings.addresses.installation.email}
                  onChange={(e) => updateInstallationAddress({ email: e.target.value })}
                  placeholder="contact@exemple.ch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-phone">Téléphone</Label>
                <Input
                  id="install-phone"
                  type="tel"
                  value={settings.addresses.installation.phone}
                  onChange={(e) => updateInstallationAddress({ phone: e.target.value })}
                  placeholder="+41 21 XXX XX XX"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressSettings;