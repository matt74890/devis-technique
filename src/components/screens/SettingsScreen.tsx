import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Zap, Settings2, FileText, Coins, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { Subscription } from '@/types';
import ProductCatalog from '../catalog/ProductCatalog';
import PDFConfiguration from '../settings/PDFConfiguration';
import CurrencySettings from '../settings/CurrencySettings';
import LetterTemplate from '../settings/LetterTemplate';

const SettingsScreen = () => {
  const { settings, updateSettings } = useSettings();
  
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

  const addType = (type: string) => {
    const newTypes = [...settings.types, type];
    updateSettings({ types: newTypes });
  };

  const deleteType = (type: string) => {
    const newTypes = settings.types.filter(t => t !== type);
    updateSettings({ types: newTypes });
  };

  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>({
    label: '',
    puTTC: 0,
    active: true,
    defaultType: 'Autre',
    defaultRef: ''
  });

  const [newType, setNewType] = useState('');
  const [activeTab, setActiveTab] = useState('general');

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

  const handleAddType = () => {
    if (!newType || settings.types.includes(newType)) return;
    
    addType(newType);
    setNewType('');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-card shadow-soft">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Catalogue</span>
          </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF & Lettre</span>
            </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Devises</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            {/* TVA & Formats */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <span>TVA & Formats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="decimals">Affichage décimales</Label>
                  <Input
                    id="decimals"
                    type="number"
                    value="2"
                    disabled
                    className="bg-muted"
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

            {/* Boutons rapides (Abonnements) */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-success" />
                  <span>Boutons rapides (Abonnements mensuels)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Libellé</th>
                        <th className="text-left p-2">PU TTC</th>
                        <th className="text-left p-2">Actif</th>
                        <th className="text-left p-2">Type par défaut</th>
                        <th className="text-left p-2">Référence par défaut</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="border-b">
                          <td className="p-2">
                            <Input
                              value={subscription.label}
                              onChange={(e) => updateSubscription(subscription.id, { label: e.target.value })}
                              className="min-w-48"
                            />
                          </td>
                          <td className="p-2">
                             <Input
                               type="number"
                               step="0.01"
                               value={subscription.puTTC || ''}
                               onChange={(e) => updateSubscription(subscription.id, { puTTC: parseFloat(e.target.value) || undefined })}
                               className="w-24"
                               placeholder="Prix"
                             />
                          </td>
                          <td className="p-2">
                            <Switch
                              checked={subscription.active}
                              onCheckedChange={(checked) => updateSubscription(subscription.id, { active: checked })}
                            />
                          </td>
                          <td className="p-2">
                            <Select
                              value={subscription.defaultType}
                              onValueChange={(value) => updateSubscription(subscription.id, { defaultType: value })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {settings.types.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Input
                              value={subscription.defaultRef}
                              onChange={(e) => updateSubscription(subscription.id, { defaultRef: e.target.value })}
                              className="min-w-48"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSubscription(subscription.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Ajouter abonnement */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-4 bg-muted rounded-lg">
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newSubscription.active}
                      onCheckedChange={(checked) => setNewSubscription({ ...newSubscription, active: checked })}
                    />
                    <span className="text-sm">Actif</span>
                  </div>
                  <Select
                    value={newSubscription.defaultType}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, defaultType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Types de lignes */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <span>Types de lignes (catalogue)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {settings.types.map((type) => (
                    <Badge key={type} variant="outline" className="text-sm p-2">
                      {type}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => deleteType(type)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nouveau type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
                  />
                  <Button onClick={handleAddType} className="bg-primary hover:bg-primary-hover">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Frais par défaut */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Frais par défaut</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feesInstall">Frais d'installation (HT)</Label>
                  <Input
                    id="feesInstall"
                    type="number"
                    step="0.01"
                    value={settings.defaults.feesInstallHT || ''}
                    onChange={(e) => updateSettings({ 
                      defaults: { 
                        ...settings.defaults, 
                        feesInstallHT: parseFloat(e.target.value) || undefined 
                      } 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feesDossier">Frais de dossier (HT)</Label>
                  <Input
                    id="feesDossier"
                    type="number"
                    step="0.01"
                    value={settings.defaults.feesDossierHT || ''}
                    onChange={(e) => updateSettings({ 
                      defaults: { 
                        ...settings.defaults, 
                        feesDossierHT: parseFloat(e.target.value) || undefined 
                      } 
                    })}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showFees"
                      checked={settings.defaults.showFeesAsLines}
                      onCheckedChange={(checked) => updateSettings({ 
                        defaults: { 
                          ...settings.defaults, 
                          showFeesAsLines: checked 
                        } 
                      })}
                    />
                    <Label htmlFor="showFees">Afficher comme lignes visibles</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="pdf">
          <div className="space-y-6">
            {/* Informations de base pour PDF */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Informations de base pour PDF</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="logoUrl"
                        value={settings.logoUrl}
                        onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              // Pour l'instant, afficher un message - l'upload de fichier nécessiterait Supabase Storage
                              alert('Upload de fichier à implémenter avec Supabase Storage');
                            }
                          };
                          input.click();
                        }}
                      >
                        Importer
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdfTitle">En-tête PDF (titre)</Label>
                    <Input
                      id="pdfTitle"
                      value={settings.pdfTitle}
                      onChange={(e) => updateSettings({ pdfTitle: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pdfFooter">Pied PDF (mentions)</Label>
                  <Textarea
                    id="pdfFooter"
                    value={settings.pdfFooter}
                    onChange={(e) => updateSettings({ pdfFooter: e.target.value })}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultComment">Texte commentaire par défaut</Label>
                  <Textarea
                    id="defaultComment"
                    value={settings.defaultComment}
                    onChange={(e) => updateSettings({ defaultComment: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <LetterTemplate />
            <PDFConfiguration />
          </div>
        </TabsContent>

        <TabsContent value="currency">
          <CurrencySettings />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default SettingsScreen;