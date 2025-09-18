import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Zap, Settings2, Coins, Package, Activity, Download } from 'lucide-react';
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-card shadow-soft">
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
            <span className="hidden sm:inline">Devis Agent</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Devises</span>
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
                  <Percent className="h-5 w-5 text-primary" />
                  <span>TVA & Formats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tva">TVA (%)</Label>
                   <Input
                     id="tva"
                     type="number"
                     step="0.01"
                     value={settings.tvaPct || ''}
                     onChange={(e) => updateSettings({ tvaPct: parseFloat(e.target.value) || 8.10 })}
                     placeholder="8.10"
                   />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceMode">Mode d'entrée prix par défaut</Label>
                  <Select 
                    value={settings.priceInputModeDefault} 
                    onValueChange={(value: 'TTC' | 'HT') => updateSettings({ priceInputModeDefault: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TTC">TTC</SelectItem>
                      <SelectItem value="HT">HT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-success" />
                  <span>Abonnements mensuels</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-muted rounded-lg">
                  <Input
                    placeholder="Libellé"
                    value={newSubscription.label}
                    onChange={(e) => setNewSubscription({ ...newSubscription, label: e.target.value })}
                  />
                   <Input
                     type="number"
                     step="0.01"
                     placeholder="PU TTC"
                     value={newSubscription.puTTC || ''}
                     onChange={(e) => setNewSubscription({ ...newSubscription, puTTC: parseFloat(e.target.value) || undefined })}
                   />
                  <Input
                    placeholder="Référence par défaut"
                    value={newSubscription.defaultRef}
                    onChange={(e) => setNewSubscription({ ...newSubscription, defaultRef: e.target.value })}
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

        <TabsContent value="backup">
          <ImportExportSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsScreen;