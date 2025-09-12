import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Zap, Settings2, FileText, Coins, MapPin, Package, Activity } from 'lucide-react';
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
import LogoUpload from '@/components/settings/LogoUpload';
import FontSelector from '@/components/settings/FontSelector';
import FontUpload from '@/components/settings/FontUpload';
import { PDFCenter } from '@/components/settings/PDFCenter';
import CurrencySettings from '@/components/settings/CurrencySettings';
import SellerInfo from '@/components/settings/SellerInfo';

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
            {/* Informations vendeur */}
            <SellerInfo />
            
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
                             {subscription.defaultType.startsWith('Autre - ') || (subscription.defaultType === 'Autre' && !settings.types.includes(subscription.defaultType)) ? (
                               <div className="space-y-1">
                                 <Input
                                   value={subscription.defaultType.replace('Autre - ', '')}
                                   onChange={(e) => updateSubscription(subscription.id, { defaultType: e.target.value ? `Autre - ${e.target.value}` : 'Autre - ' })}
                                   className="w-32"
                                   placeholder="Type personnalisé"
                                 />
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => updateSubscription(subscription.id, { defaultType: 'Autre' })}
                                   className="text-xs h-6"
                                 >
                                   Retour
                                 </Button>
                               </div>
                             ) : (
                               <Select
                                 value={subscription.defaultType}
                                 onValueChange={(value) => {
                                   if (value === 'Autre') {
                                     updateSubscription(subscription.id, { defaultType: 'Autre - ' });
                                   } else {
                                     updateSubscription(subscription.id, { defaultType: value });
                                   }
                                 }}
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
                             )}
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
                   {newSubscription.defaultType?.startsWith('Autre - ') || (newSubscription.defaultType === 'Autre' && !settings.types.includes(newSubscription.defaultType || '')) ? (
                     <div className="space-y-1">
                       <Input
                         value={newSubscription.defaultType?.replace('Autre - ', '') || ''}
                         onChange={(e) => setNewSubscription({ ...newSubscription, defaultType: e.target.value ? `Autre - ${e.target.value}` : 'Autre - ' })}
                         className="w-32"
                         placeholder="Type personnalisé"
                       />
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => setNewSubscription({ ...newSubscription, defaultType: 'Autre' })}
                         className="text-xs h-6"
                       >
                         Retour
                       </Button>
                     </div>
                   ) : (
                     <Select
                       value={newSubscription.defaultType}
                       onValueChange={(value) => {
                         if (value === 'Autre') {
                           setNewSubscription({ ...newSubscription, defaultType: 'Autre - ' });
                         } else {
                           setNewSubscription({ ...newSubscription, defaultType: value });
                         }
                       }}
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
                   )}
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

            {/* Import e-mail */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <span>Import e-mail</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="importEmailEnabled">Activer le remplissage automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Active le bouton "Remplir les champs du devis" dans l'écran Devis
                    </p>
                  </div>
                  <Switch
                    id="importEmailEnabled"
                    checked={settings.importEmail.enabled}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        importEmail: { ...settings.importEmail, enabled: checked } 
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importEmailHelp">Texte d'aide</Label>
                  <Textarea
                    id="importEmailHelp"
                    value={settings.importEmail.helpText}
                    onChange={(e) => 
                      updateSettings({ 
                        importEmail: { ...settings.importEmail, helpText: e.target.value } 
                      })
                    }
                    rows={2}
                    placeholder="Texte d'explication pour l'utilisateur..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Limites système */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Limites du système d'extraction IA</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg bg-muted/20">
                    <div className="text-2xl font-bold text-primary">10</div>
                    <div className="text-sm text-muted-foreground">Requêtes/minute</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-muted/20">
                    <div className="text-2xl font-bold text-primary">100</div>
                    <div className="text-sm text-muted-foreground">Requêtes/jour</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-muted/20">
                    <div className="text-2xl font-bold text-primary">6000</div>
                    <div className="text-sm text-muted-foreground">Tokens/minute</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-muted/20">
                    <div className="text-2xl font-bold text-primary">250k</div>
                    <div className="text-sm text-muted-foreground">Tokens/jour</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Ces limites s'appliquent au système d'extraction automatique de devis par IA. En cas de dépassement, veuillez patienter avant de relancer une extraction.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="agent">
          <div className="space-y-6">
            {/* Configuration des heures de majoration */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Heures de majoration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="night-start">Début heures de nuit</Label>
                    <Input
                      id="night-start"
                      type="time"
                      value={settings.agentSettings?.nightStartTime || '22:00'}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          nightStartTime: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="night-end">Fin heures de nuit</Label>
                    <Input
                      id="night-end"
                      type="time"
                      value={settings.agentSettings?.nightEndTime || '06:00'}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          nightEndTime: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday-start">Début heures dimanche</Label>
                    <Input
                      id="sunday-start"
                      type="time"
                      value={settings.agentSettings?.sundayStartTime || '00:00'}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          sundayStartTime: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday-end">Fin heures dimanche</Label>
                    <Input
                      id="sunday-end"
                      type="time"
                      value={settings.agentSettings?.sundayEndTime || '23:59'}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          sundayEndTime: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="night-markup">Majoration nuit (%)</Label>
                    <Input
                      id="night-markup"
                      type="number"
                      step="0.1"
                      value={settings.agentSettings?.nightMarkupPct || 25}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          nightMarkupPct: parseFloat(e.target.value) || 25
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday-markup">Majoration dimanche (%)</Label>
                    <Input
                      id="sunday-markup"
                      type="number"
                      step="0.1"
                      value={settings.agentSettings?.sundayMarkupPct || 100}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          sundayMarkupPct: parseFloat(e.target.value) || 100
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holiday-markup">Majoration jours fériés (%)</Label>
                    <Input
                      id="holiday-markup"
                      type="number"
                      step="0.1"
                      value={settings.agentSettings?.holidayMarkupPct || 100}
                      onChange={(e) => updateSettings({
                        agentSettings: {
                          ...settings.agentSettings,
                          holidayMarkupPct: parseFloat(e.target.value) || 100
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration des jours fériés par canton */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Jours fériés par canton</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['VD', 'GE', 'NE', 'VS', 'FR', 'JU', 'BE', 'AG', 'ZH', 'TI', 'GR'].map((canton) => (
                  <div key={canton} className="space-y-2">
                    <Label htmlFor={`holidays-${canton}`}>
                      Canton {canton} - Jours fériés (dates au format DD/MM)
                    </Label>
                    <Textarea
                      id={`holidays-${canton}`}
                      value={settings.agentSettings?.holidays?.[canton]?.join(', ') || ''}
                      onChange={(e) => {
                        const holidays = e.target.value.split(',').map(h => h.trim()).filter(h => h);
                        updateSettings({
                          agentSettings: {
                            ...settings.agentSettings,
                            holidays: {
                              ...settings.agentSettings?.holidays,
                              [canton]: holidays
                            }
                          }
                        });
                      }}
                      placeholder="01/01, 25/12, 01/08, etc."
                      rows={2}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Types d'agents et tarifs suggérés */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Types d'agents et tarifs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Type d'agent</th>
                        <th className="text-left p-2">Tarif suggéré (CHF/h)</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(settings.agentSettings?.agentTypes || []).map((agentType, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <Input
                              value={agentType.type}
                              onChange={(e) => {
                                const newTypes = [...(settings.agentSettings?.agentTypes || [])];
                                newTypes[index].type = e.target.value;
                                updateSettings({
                                  agentSettings: {
                                    ...settings.agentSettings,
                                    agentTypes: newTypes
                                  }
                                });
                              }}
                              className="min-w-48"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={agentType.suggestedRate}
                              onChange={(e) => {
                                const newTypes = [...(settings.agentSettings?.agentTypes || [])];
                                newTypes[index].suggestedRate = parseFloat(e.target.value) || 0;
                                updateSettings({
                                  agentSettings: {
                                    ...settings.agentSettings,
                                    agentTypes: newTypes
                                  }
                                });
                              }}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newTypes = [...(settings.agentSettings?.agentTypes || [])];
                                newTypes.splice(index, 1);
                                updateSettings({
                                  agentSettings: {
                                    ...settings.agentSettings,
                                    agentTypes: newTypes
                                  }
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Button
                  onClick={() => {
                    const newTypes = [...(settings.agentSettings?.agentTypes || [])];
                    newTypes.push({ type: 'Nouvel agent', suggestedRate: 30 });
                    updateSettings({
                      agentSettings: {
                        ...settings.agentSettings,
                        agentTypes: newTypes
                      }
                    });
                  }}
                  className="bg-success hover:bg-success/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un type d'agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pdf">
          <div className="space-y-6">
            <LogoUpload />
            <FontSelector />
            
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
            
            <TemplateColors />
            <LetterTemplate />
            <PDFSources />
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