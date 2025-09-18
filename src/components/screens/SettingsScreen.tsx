import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Zap, Settings2, Coins, Package, Activity, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { Subscription } from '@/types';
import ProductCatalog from '../catalog/ProductCatalog';
import LogoUpload from '@/components/settings/LogoUpload';
import FontSelector from '@/components/settings/FontSelector';
import FontUpload from '@/components/settings/FontUpload';
import CurrencySettings from '@/components/settings/CurrencySettings';
import SellerInfo from '@/components/settings/SellerInfo';
import LetterTemplate from '@/components/settings/LetterTemplate';
import AgentDescriptionSettings from '@/components/settings/AgentDescriptionSettings';
import ImportExportSettings from '@/components/settings/ImportExportSettings';
import { PDFSettings } from '@/components/settings/PDFSettings';

const SettingsScreen = () => {
  const { settings, updateSettings } = useSettings();
  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>({
    label: '',
    puTTC: 0,
    active: true,
    defaultType: 'Autre',
    defaultRef: ''
  });
  const [newType, setNewType] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const addSubscription = (subscription: Omit<Subscription, 'id'>) => {
    const newSubscriptions = [...settings.subscriptions, { 
      ...subscription, 
      id: crypto.randomUUID() 
    }];
    updateSettings({ subscriptions: newSubscriptions });
  };

  const updateSubscription = (id: string, subscription: Partial<Subscription>) => {
    const newSubscriptions = settings.subscriptions.map(s => 
      s.id === id ? { ...s, ...subscription } : s
    );
    updateSettings({ subscriptions: newSubscriptions });
  };

  const deleteSubscription = (id: string) => {
    const newSubscriptions = settings.subscriptions.filter(s => s.id !== id);
    updateSettings({ subscriptions: newSubscriptions });
  };

  const handleAddSubscription = () => {
    if (!newSubscription.label) return;
    
    addSubscription(newSubscription as Omit<Subscription, 'id'>);
    setNewSubscription({
      label: '',
      puTTC: 0,
      active: true,
      defaultType: 'Autre',
      defaultRef: ''
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-card shadow-soft">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Catalogue</span>
          </TabsTrigger>
          <TabsTrigger value="agent" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Agent</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Devise</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Sauvegarde</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <SellerInfo />
            
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-accent" />
                  <span>Configuration générale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tvaPct">TVA (%)</Label>
                    <Input
                      id="tvaPct"
                      type="number"
                      value={settings.tvaPct}
                      onChange={(e) => updateSettings({ tvaPct: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMode">Mode de saisie par défaut</Label>
                    <Select value={settings.priceInputModeDefault} onValueChange={(value: 'TTC' | 'HT') => updateSettings({ priceInputModeDefault: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HT">Hors Taxes (HT)</SelectItem>
                        <SelectItem value="TTC">Toutes Taxes Comprises (TTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="showFeesAsLines"
                    checked={settings.defaults.showFeesAsLines}
                    onCheckedChange={(checked) => updateSettings({ 
                      defaults: { ...settings.defaults, showFeesAsLines: checked }
                    })}
                  />
                  <Label htmlFor="showFeesAsLines">Afficher les frais comme lignes séparées</Label>
                </div>
              </CardContent>
            </Card>

            <LogoUpload />
            <FontSelector />
            <FontUpload />
            <LetterTemplate />

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <span>Abonnements mensuels</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.subscriptions.length > 0 && (
                  <div className="space-y-2">
                    {settings.subscriptions.map(subscription => (
                      <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                          <Input
                            value={subscription.label}
                            onChange={(e) => updateSubscription(subscription.id, { label: e.target.value })}
                            placeholder="Libellé"
                          />
                          <Input
                            type="number"
                            value={subscription.puTTC || ''}
                            onChange={(e) => updateSubscription(subscription.id, { puTTC: parseFloat(e.target.value) || 0 })}
                            placeholder="Prix TTC"
                          />
                          <Input
                            value={subscription.defaultRef}
                            onChange={(e) => updateSubscription(subscription.id, { defaultRef: e.target.value })}
                            placeholder="Référence par défaut"
                          />
                          <Badge variant={subscription.active ? "default" : "secondary"}>
                            {subscription.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubscription(subscription.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Input
                    value={newSubscription.label || ''}
                    onChange={(e) => setNewSubscription({ ...newSubscription, label: e.target.value })}
                    placeholder="Nouvel abonnement"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newSubscription.puTTC || ''}
                    onChange={(e) => setNewSubscription({ ...newSubscription, puTTC: parseFloat(e.target.value) || 0 })}
                    placeholder="Prix TTC"
                    className="w-32"
                  />
                  <Button onClick={handleAddSubscription} className="bg-success hover:bg-success/90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="agent">
          <AgentDescriptionSettings />
        </TabsContent>

        <TabsContent value="currency">
          <CurrencySettings />
        </TabsContent>

        <TabsContent value="pdf">
          <PDFSettings />
        </TabsContent>

        <TabsContent value="backup">
          <ImportExportSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsScreen;