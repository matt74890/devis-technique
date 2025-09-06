import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, DollarSign } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Currency } from '@/types';

const CurrencySettings = () => {
  const { settings, updateSettings } = useStore();

  const predefinedCurrencies: Currency[] = [
    { code: 'CHF', symbol: 'CHF', name: 'Franc suisse', position: 'after' },
    { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
    { code: 'USD', symbol: '$', name: 'Dollar américain', position: 'before' },
    { code: 'GBP', symbol: '£', name: 'Livre sterling', position: 'before' },
    { code: 'CAD', symbol: 'C$', name: 'Dollar canadien', position: 'before' },
    { code: 'JPY', symbol: '¥', name: 'Yen japonais', position: 'before' }
  ];

  const updateCurrency = (updates: Partial<Currency>) => {
    updateSettings({
      currency: { ...settings.currency, ...updates }
    });
  };

  const selectPredefinedCurrency = (currencyCode: string) => {
    const currency = predefinedCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      updateSettings({ currency });
    }
  };

  const formatExamplePrice = (price: number) => {
    const { symbol, position } = settings.currency;
    return position === 'before' 
      ? `${symbol} ${price.toFixed(2)}`
      : `${price.toFixed(2)} ${symbol}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-primary" />
            <span>Configuration des Devises</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurez la devise utilisée pour tous les prix et devis de l'application.
          </p>
        </CardContent>
      </Card>

      {/* Devises prédéfinies */}
      <Card>
        <CardHeader>
          <CardTitle>Devises Prédéfinies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {predefinedCurrencies.map((currency) => (
              <Button
                key={currency.code}
                variant={settings.currency.code === currency.code ? "default" : "outline"}
                onClick={() => selectPredefinedCurrency(currency.code)}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{currency.symbol}</span>
                  <Badge variant="secondary">{currency.code}</Badge>
                </div>
                <span className="text-xs text-center">{currency.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration manuelle */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Personnalisée</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency-code">Code de la devise</Label>
              <Input
                id="currency-code"
                value={settings.currency.code}
                onChange={(e) => updateCurrency({ code: e.target.value.toUpperCase() })}
                placeholder="CHF"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-symbol">Symbole</Label>
              <Input
                id="currency-symbol"
                value={settings.currency.symbol}
                onChange={(e) => updateCurrency({ symbol: e.target.value })}
                placeholder="CHF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-name">Nom complet</Label>
            <Input
              id="currency-name"
              value={settings.currency.name}
              onChange={(e) => updateCurrency({ name: e.target.value })}
              placeholder="Franc suisse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-position">Position du symbole</Label>
            <Select
              value={settings.currency.position}
              onValueChange={(value: 'before' | 'after') => updateCurrency({ position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Avant le montant ($ 100.00)</SelectItem>
                <SelectItem value="after">Après le montant (100.00 CHF)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prévisualisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span>Prévisualisation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3">Exemples d'affichage :</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Prix unitaire :</span>
                <span className="font-mono">{formatExamplePrice(129.90)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total TTC :</span>
                <span className="font-mono">{formatExamplePrice(1580.50)}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant mensuel :</span>
                <span className="font-mono">{formatExamplePrice(85.00)} / mois</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary-light rounded-lg">
            <div className="flex items-center space-x-2">
              <Badge>{settings.currency.code}</Badge>
              <span className="font-medium">{settings.currency.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Symbole : {settings.currency.symbol} | Position : {settings.currency.position === 'before' ? 'Avant' : 'Après'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencySettings;