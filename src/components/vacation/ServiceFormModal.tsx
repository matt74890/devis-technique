import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus, Edit } from 'lucide-react';
import { QuoteItem, Settings } from '@/types';

interface ServiceFormModalProps {
  item?: QuoteItem;
  settings: Settings;
  onSave: (service: Partial<QuoteItem>) => void;
  trigger?: React.ReactNode;
  isEdit?: boolean;
}

export default function ServiceFormModal({ item, settings, onSave, trigger, isEdit }: ServiceFormModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: 'patrouille_ouverture' as QuoteItem['serviceType'],
    serviceDescription: '',
    patrolsPerDay: 1,
    daysCount: 1,
    durationMinutes: 30,
    serviceUnitPrice: 0,
  });

  const serviceTypes = [
    { 
      value: 'patrouille_ouverture', 
      label: 'Patrouille Ouverture',
      description: 'Contrôle d\'ouverture des locaux',
      defaultDuration: 15,
      suggestedPrice: 25
    },
    { 
      value: 'patrouille_fermeture', 
      label: 'Patrouille Fermeture',
      description: 'Contrôle de fermeture et sécurisation',
      defaultDuration: 20,
      suggestedPrice: 30
    },
    { 
      value: 'patrouille_exterieur', 
      label: 'Patrouille Extérieur',
      description: 'Ronde de sécurité extérieure',
      defaultDuration: 30,
      suggestedPrice: 35
    },
    { 
      value: 'pre_vol', 
      label: 'Pré-vol',
      description: 'Contrôle pré-vol aéronautique',
      defaultDuration: 45,
      suggestedPrice: 85
    },
    { 
      value: 'formation', 
      label: 'Formation',
      description: 'Formation du personnel',
      defaultDuration: 120,
      suggestedPrice: 150
    },
    { 
      value: 'garde_clef', 
      label: 'Garde de clef',
      description: 'Service de garde de clés',
      defaultDuration: 5,
      suggestedPrice: 10
    },
    { 
      value: 'transport', 
      label: 'Transport',
      description: 'Transport de personnel ou matériel',
      defaultDuration: 60,
      suggestedPrice: 80
    },
    { 
      value: 'maintenance', 
      label: 'Maintenance technique',
      description: 'Maintenance d\'équipements de sécurité',
      defaultDuration: 90,
      suggestedPrice: 120
    },
    { 
      value: 'autre', 
      label: 'Autre service',
      description: 'Service personnalisé',
      defaultDuration: 30,
      suggestedPrice: 50
    }
  ];

  const selectedType = serviceTypes.find(t => t.value === formData.serviceType);

  useEffect(() => {
    if (item && isEdit) {
      setFormData({
        serviceType: item.serviceType || 'patrouille_ouverture',
        serviceDescription: item.serviceDescription || '',
        patrolsPerDay: item.patrolsPerDay || 1,
        daysCount: item.daysCount || 1,
        durationMinutes: item.durationMinutes || 30,
        serviceUnitPrice: item.serviceUnitPrice || 0,
      });
    }
  }, [item, isEdit]);

  const handleServiceTypeChange = (value: string) => {
    const type = serviceTypes.find(t => t.value === value);
    if (type) {
      setFormData(prev => ({
        ...prev,
        serviceType: value as QuoteItem['serviceType'],
        durationMinutes: type.defaultDuration,
        serviceUnitPrice: type.suggestedPrice,
        serviceDescription: prev.serviceDescription || type.description
      }));
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calcul en temps réel
  const totalPrestations = formData.patrolsPerDay * formData.daysCount;
  const totalHT = totalPrestations * formData.serviceUnitPrice;
  const totalTVA = totalHT * (settings.tvaPct / 100);
  const totalTTC = totalHT + totalTVA;

  const formatPrice = (price: number) => {
    const { currency } = settings;
    const formatted = price.toFixed(2);
    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}` 
      : `${formatted}${currency.symbol}`;
  };

  const handleSave = () => {
    onSave({
      kind: 'SERVICE',
      ...formData,
      // Valeurs calculées
      qty: totalPrestations,
      lineHT: totalHT,
      lineTVA: totalTVA,
      lineTTC: totalTTC,
      puHT: formData.serviceUnitPrice,
      puTTC: formData.serviceUnitPrice * (1 + settings.tvaPct / 100),
      totalHT_net: totalHT,
      totalTTC: totalTTC
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {isEdit ? <Edit className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {isEdit ? 'Modifier' : 'Nouveau service'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {isEdit ? 'Modifier le service' : 'Nouveau service complémentaire'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type de service */}
          <div className="space-y-2">
            <Label>Type de service</Label>
            <Select value={formData.serviceType} onValueChange={handleServiceTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground">{selectedType.description}</p>
            )}
          </div>

          {/* Description personnalisée */}
          <div className="space-y-2">
            <Label>Description détaillée (optionnelle)</Label>
            <Textarea
              value={formData.serviceDescription}
              onChange={(e) => updateField('serviceDescription', e.target.value)}
              placeholder="Précisions sur le service..."
              rows={3}
            />
          </div>

          {/* Configuration du calcul */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration du calcul</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prestations par jour</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.patrolsPerDay}
                    onChange={(e) => updateField('patrolsPerDay', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.serviceType === 'formation' ? 'Nombre de sessions par jour' : 'Nombre de passages/contrôles par jour'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Nombre de jours</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.daysCount}
                    onChange={(e) => updateField('daysCount', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Durée totale de la mission
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée par prestation (min)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 5)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Temps estimé par prestation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Prix unitaire ({settings.currency.symbol})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.serviceUnitPrice}
                    onChange={(e) => updateField('serviceUnitPrice', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prix par prestation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calcul automatique */}
          <Card className="border-primary/20 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base text-primary">Calcul automatique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>{formData.patrolsPerDay} × {formData.daysCount} jours</span>
                <span className="font-medium">{totalPrestations} prestations total</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>{totalPrestations} × {formatPrice(formData.serviceUnitPrice)}</span>
                <span className="font-medium">{formatPrice(totalHT)} HT</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>TVA ({settings.tvaPct}%)</span>
                <span className="font-medium">{formatPrice(totalTVA)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2 font-bold text-lg">
                <span>Total TTC</span>
                <span className="text-primary">{formatPrice(totalTTC)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={formData.serviceUnitPrice <= 0}>
              {isEdit ? 'Mettre à jour' : 'Ajouter le service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}