import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Copy, Trash2, Zap, MapPin } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { QuoteItem } from '@/types';
import { calculateQuoteItem } from '@/utils/calculations';

const DevisScreen = () => {
  const { 
    currentQuote, 
    settings, 
    updateQuote, 
    addQuoteItem, 
    updateQuoteItem, 
    deleteQuoteItem, 
    duplicateQuoteItem 
  } = useStore();

  const [newItemMode, setNewItemMode] = useState<'unique' | 'mensuel'>('unique');

  if (!currentQuote) return null;

  const addSubscriptionQuick = (subscriptionId: string) => {
    const subscription = settings.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return;

    const newItem: Omit<QuoteItem, 'id'> = {
      type: subscription.defaultType,
      reference: subscription.defaultRef,
      mode: 'mensuel',
      qty: 1,
      unitPriceValue: subscription.puTTC,
      unitPriceMode: 'TTC',
      lineDiscountPct: 0,
      puHT: 0,
      puTTC: 0,
      totalHT_brut: 0,
      discountHT: 0,
      totalHT_net: 0,
      totalTTC: 0
    };

    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    addQuoteItem(calculatedItem);
  };

  const addNewItem = () => {
    const newItem: Omit<QuoteItem, 'id'> = {
      type: settings.types[0] || 'Autre',
      reference: '',
      mode: newItemMode,
      qty: 1,
      unitPriceValue: 0,
      unitPriceMode: settings.priceInputModeDefault,
      lineDiscountPct: 0,
      puHT: 0,
      puTTC: 0,
      totalHT_brut: 0,
      discountHT: 0,
      totalHT_net: 0,
      totalTTC: 0
    };

    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    addQuoteItem(calculatedItem);
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    const currentItem = currentQuote.items.find(item => item.id === id);
    if (!currentItem) return;

    const updatedItem = { ...currentItem, ...updates };
    const calculatedItem = calculateQuoteItem(updatedItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    updateQuoteItem(id, calculatedItem);
  };

  const activeSubscriptions = settings.subscriptions.filter(s => s.active);

  return (
    <div className="space-y-6">
      {/* En-tête du devis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Informations du devis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={currentQuote.client}
              onChange={(e) => updateQuote({ client: e.target.value })}
              placeholder="Nom du client"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Input
              id="site"
              value={currentQuote.site}
              onChange={(e) => updateQuote({ site: e.target.value })}
              placeholder="Adresse du site"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref">Référence devis</Label>
            <Input
              id="ref"
              value={currentQuote.ref}
              onChange={(e) => updateQuote({ ref: e.target.value })}
              placeholder="DEV-2024-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={currentQuote.date}
              onChange={(e) => updateQuote({ date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canton">Canton</Label>
            <Select value={currentQuote.canton} onValueChange={(value) => updateQuote({ canton: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner canton" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AG">Argovie (AG)</SelectItem>
                <SelectItem value="AI">Appenzell Rhodes-Intérieures (AI)</SelectItem>
                <SelectItem value="AR">Appenzell Rhodes-Extérieures (AR)</SelectItem>
                <SelectItem value="BE">Berne (BE)</SelectItem>
                <SelectItem value="BL">Bâle-Campagne (BL)</SelectItem>
                <SelectItem value="BS">Bâle-Ville (BS)</SelectItem>
                <SelectItem value="FR">Fribourg (FR)</SelectItem>
                <SelectItem value="GE">Genève (GE)</SelectItem>
                <SelectItem value="GL">Glaris (GL)</SelectItem>
                <SelectItem value="GR">Grisons (GR)</SelectItem>
                <SelectItem value="JU">Jura (JU)</SelectItem>
                <SelectItem value="LU">Lucerne (LU)</SelectItem>
                <SelectItem value="NE">Neuchâtel (NE)</SelectItem>
                <SelectItem value="NW">Nidwald (NW)</SelectItem>
                <SelectItem value="OW">Obwald (OW)</SelectItem>
                <SelectItem value="SG">Saint-Gall (SG)</SelectItem>
                <SelectItem value="SH">Schaffhouse (SH)</SelectItem>
                <SelectItem value="SO">Soleure (SO)</SelectItem>
                <SelectItem value="SZ">Schwyz (SZ)</SelectItem>
                <SelectItem value="TG">Thurgovie (TG)</SelectItem>
                <SelectItem value="TI">Tessin (TI)</SelectItem>
                <SelectItem value="UR">Uri (UR)</SelectItem>
                <SelectItem value="VD">Vaud (VD)</SelectItem>
                <SelectItem value="VS">Valais (VS)</SelectItem>
                <SelectItem value="ZG">Zoug (ZG)</SelectItem>
                <SelectItem value="ZH">Zurich (ZH)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Adresses Client */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Adresses du Client</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="separate-addresses"
                checked={currentQuote.addresses.useSeparateAddresses}
                onCheckedChange={(checked) => 
                  updateQuote({ 
                    addresses: { 
                      ...currentQuote.addresses, 
                      useSeparateAddresses: checked,
                      // Si on désactive, copier l'adresse contact vers les autres
                      billing: checked ? currentQuote.addresses.billing : currentQuote.addresses.contact,
                      installation: checked ? currentQuote.addresses.installation : currentQuote.addresses.contact
                    } 
                  })
                }
              />
              <Label htmlFor="separate-addresses" className="text-sm">
                {currentQuote.addresses.useSeparateAddresses ? 'Adresses séparées' : 'Même adresse pour tout'}
              </Label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adresse de contact (toujours présente) */}
          <div>
            <h4 className="font-medium mb-3 text-primary">Adresse de Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-company">Société</Label>
                <Input
                  id="contact-company"
                  value={currentQuote.addresses.contact.company}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, company: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        // Si pas d'adresses séparées, propager à tous
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Nom de la société"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact</Label>
                <Input
                  id="contact-name"
                  value={currentQuote.addresses.contact.name}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, name: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Nom et prénom"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="contact-street">Adresse</Label>
                <Input
                  id="contact-street"
                  value={currentQuote.addresses.contact.street}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, street: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Rue et numéro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-postal">Code postal</Label>
                <Input
                  id="contact-postal"
                  value={currentQuote.addresses.contact.postalCode}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, postalCode: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-city">Ville</Label>
                <Input
                  id="contact-city"
                  value={currentQuote.addresses.contact.city}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, city: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Lausanne"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={currentQuote.addresses.contact.email}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, email: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="contact@exemple.ch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={currentQuote.addresses.contact.phone}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, phone: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="+41 21 XXX XX XX"
                />
              </div>
            </div>
          </div>

          {/* Adresses séparées si activées */}
          {currentQuote.addresses.useSeparateAddresses && (
            <>
              <Separator />
              
              {/* Adresse de facturation */}
              <div>
                <h4 className="font-medium mb-3 text-success">Adresse de Facturation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-company">Société</Label>
                    <Input
                      id="billing-company"
                      value={currentQuote.addresses.billing.company}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, company: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom de la société"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-name">Contact</Label>
                    <Input
                      id="billing-name"
                      value={currentQuote.addresses.billing.name}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, name: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="billing-street">Adresse</Label>
                    <Input
                      id="billing-street"
                      value={currentQuote.addresses.billing.street}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, street: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Rue et numéro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-postal">Code postal</Label>
                    <Input
                      id="billing-postal"
                      value={currentQuote.addresses.billing.postalCode}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, postalCode: e.target.value } 
                          } 
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">Ville</Label>
                    <Input
                      id="billing-city"
                      value={currentQuote.addresses.billing.city}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, city: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Lausanne"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={currentQuote.addresses.billing.email}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, email: e.target.value } 
                          } 
                        })
                      }
                      placeholder="facture@exemple.ch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-phone">Téléphone</Label>
                    <Input
                      id="billing-phone"
                      type="tel"
                      value={currentQuote.addresses.billing.phone}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, phone: e.target.value } 
                          } 
                        })
                      }
                      placeholder="+41 21 XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Adresse d'installation */}
              <div>
                <h4 className="font-medium mb-3 text-warning">Adresse d'Installation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="install-company">Société</Label>
                    <Input
                      id="install-company"
                      value={currentQuote.addresses.installation.company}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, company: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom de la société"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-name">Contact</Label>
                    <Input
                      id="install-name"
                      value={currentQuote.addresses.installation.name}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, name: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="install-street">Adresse</Label>
                    <Input
                      id="install-street"
                      value={currentQuote.addresses.installation.street}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, street: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Rue et numéro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-postal">Code postal</Label>
                    <Input
                      id="install-postal"
                      value={currentQuote.addresses.installation.postalCode}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, postalCode: e.target.value } 
                          } 
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-city">Ville</Label>
                    <Input
                      id="install-city"
                      value={currentQuote.addresses.installation.city}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, city: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Lausanne"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-email">Email</Label>
                    <Input
                      id="install-email"
                      type="email"
                      value={currentQuote.addresses.installation.email}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, email: e.target.value } 
                          } 
                        })
                      }
                      placeholder="installation@exemple.ch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-phone">Téléphone</Label>
                    <Input
                      id="install-phone"
                      type="tel"
                      value={currentQuote.addresses.installation.phone}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, phone: e.target.value } 
                          } 
                        })
                      }
                      placeholder="+41 21 XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Boutons rapides abonnements */}
      {activeSubscriptions.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Abonnements mensuels (TTC/mois)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeSubscriptions.map((subscription) => (
                <Button
                  key={subscription.id}
                  variant="outline"
                  onClick={() => addSubscriptionQuick(subscription.id)}
                  className="bg-success-light text-success hover:bg-success hover:text-success-foreground"
                >
                  {subscription.label} - {subscription.puTTC.toFixed(2)} CHF
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matériel & prestations */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Matériel & prestations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode de remise */}
          <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <Label>Mode de remise</Label>
              <Select
                value={currentQuote.discountMode}
                onValueChange={(value: 'per_line' | 'global') => updateQuote({ discountMode: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_line">Remise par ligne</SelectItem>
                  <SelectItem value="global">Remise globale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentQuote.discountMode === 'global' && (
              <div className="space-y-2">
                <Label htmlFor="globalDiscount">Remise globale (%)</Label>
                <Input
                  id="globalDiscount"
                  type="number"
                  step="0.01"
                  value={currentQuote.discountPct}
                  onChange={(e) => updateQuote({ discountPct: parseFloat(e.target.value) || 0 })}
                  className="w-24"
                />
              </div>
            )}
          </div>

          {/* Tableau des items */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Référence</th>
                  <th className="text-left p-2">Mode</th>
                  <th className="text-left p-2">Qté</th>
                  <th className="text-left p-2">PU</th>
                  <th className="text-left p-2">Saisie HT</th>
                  {currentQuote.discountMode === 'per_line' && (
                    <th className="text-left p-2">Remise %</th>
                  )}
                  <th className="text-left p-2">Total HT</th>
                  <th className="text-left p-2">Total TTC</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateItem(item.id, { type: value })}
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
                        value={item.reference}
                        onChange={(e) => updateItem(item.id, { reference: e.target.value })}
                        className="w-40"
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={item.mode}
                        onValueChange={(value: 'unique' | 'mensuel') => updateItem(item.id, { mode: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unique">Unique</SelectItem>
                          <SelectItem value="mensuel">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPriceValue}
                        onChange={(e) => updateItem(item.id, { unitPriceValue: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={item.unitPriceMode === 'HT'}
                        onCheckedChange={(checked) => updateItem(item.id, { unitPriceMode: checked ? 'HT' : 'TTC' })}
                      />
                    </td>
                    {currentQuote.discountMode === 'per_line' && (
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.lineDiscountPct}
                          onChange={(e) => updateItem(item.id, { lineDiscountPct: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </td>
                    )}
                    <td className="p-2 font-medium">
                      {item.totalHT_net.toFixed(2)} CHF
                    </td>
                    <td className="p-2 font-medium">
                      {item.totalTTC.toFixed(2)} CHF
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateQuoteItem(item.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuoteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ajouter ligne */}
          <div className="flex items-center gap-4">
            <Select value={newItemMode} onValueChange={(value: 'unique' | 'mensuel') => setNewItemMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unique">Unique</SelectItem>
                <SelectItem value="mensuel">Mensuel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addNewItem} className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter ligne
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commentaire */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Commentaire du devis</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentQuote.comment}
            onChange={(e) => updateQuote({ comment: e.target.value })}
            placeholder={settings.defaultComment}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DevisScreen;