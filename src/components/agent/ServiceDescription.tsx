import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Quote, Settings } from '@/types';

interface ServiceDescriptionProps {
  quote: Quote;
  settings: Settings;
  onUpdateDescription: (description: Quote['serviceDescription']) => void;
}

const getDefaultDescription = (agentTypes: string[]): string => {
  const descriptions: { [key: string]: string } = {
    'Sécurité': 'Mise en place d\'un agent de sécurité pour assurer la surveillance et la prévention des risques.',
    'Sécurité armée': 'Mise en place d\'un agent de sécurité armé, conformément aux normes légales et opérationnelles en vigueur.',
    'Maître-chien': 'Mise en place d\'un maître-chien de sécurité, garantissant la dissuasion et la détection grâce au binôme.',
    'Patrouilleur': 'Service de patrouille mobile, avec rondes préventives sur le site défini.',
    'Garde du corps': 'Mise à disposition d\'un agent de protection rapprochée, dédié à la sécurité des personnes.'
  };

  const uniqueTypes = [...new Set(agentTypes)];
  return uniqueTypes.map(type => descriptions[type] || `Service de ${type.toLowerCase()}`).join(' ');
};

const ServiceDescription: React.FC<ServiceDescriptionProps> = ({ 
  quote, 
  settings, 
  onUpdateDescription 
}) => {
  const agentItems = quote.items.filter(item => item.kind === 'AGENT');
  
  if (agentItems.length === 0) {
    return null;
  }

  const agentTypes = agentItems.map(item => item.agentType).filter(Boolean) as string[];
  const defaultNature = getDefaultDescription(agentTypes);

  const currentDescription = quote.serviceDescription || {
    nature: defaultNature,
    lieu: quote.site || '',
    periode: '',
    horaires: '',
    tenue: '',
    pause: '',
    deplacement: '',
    remarque: ''
  };

  const updateField = (field: keyof typeof currentDescription, value: string) => {
    onUpdateDescription({
      ...currentDescription,
      [field]: value
    });
  };

  // Extract period from agent items
  const getDefaultPeriod = () => {
    if (agentItems.length === 0) return '';
    const startDate = agentItems[0].dateStart;
    const endDate = agentItems[0].dateEnd;
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('fr-CH');
      const end = new Date(endDate).toLocaleDateString('fr-CH');
      return `Du ${start} au ${end}`;
    }
    return '';
  };

  // Extract schedule from agent items
  const getDefaultSchedule = () => {
    if (agentItems.length === 0) return '';
    const timeStart = agentItems[0].timeStart;
    const timeEnd = agentItems[0].timeEnd;
    if (timeStart && timeEnd) {
      return `De ${timeStart} à ${timeEnd}`;
    }
    return '';
  };

  // Extract pause info
  const getDefaultPause = () => {
    if (agentItems.length === 0) return '';
    const pauseMinutes = agentItems[0].pauseMinutes;
    const pausePaid = agentItems[0].pausePaid;
    if (pauseMinutes) {
      return `Pause de ${pauseMinutes} minutes (${pausePaid ? 'payée' : 'non payée'})`;
    }
    return '';
  };

  // Extract travel info
  const getDefaultTravel = () => {
    if (agentItems.length === 0) return '';
    const travelCHF = agentItems[0].travelCHF;
    if (travelCHF && travelCHF > 0) {
      return `Frais de déplacement : ${travelCHF} CHF`;
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-primary">Description de la prestation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nature">Nature de la prestation</Label>
          <Textarea
            id="nature"
            value={currentDescription.nature}
            onChange={(e) => updateField('nature', e.target.value)}
            placeholder="Description de la prestation..."
            className="min-h-20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu de prestation</Label>
            <Input
              id="lieu"
              value={currentDescription.lieu}
              onChange={(e) => updateField('lieu', e.target.value)}
              placeholder={quote.site || "Lieu de la prestation..."}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="periode">Période</Label>
            <Input
              id="periode"
              value={currentDescription.periode}
              onChange={(e) => updateField('periode', e.target.value)}
              placeholder={getDefaultPeriod() || "Période de la prestation..."}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="horaires">Horaires</Label>
            <Input
              id="horaires"
              value={currentDescription.horaires}
              onChange={(e) => updateField('horaires', e.target.value)}
              placeholder={getDefaultSchedule() || "Horaires de la prestation..."}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenue">Tenue</Label>
            <Input
              id="tenue"
              value={currentDescription.tenue}
              onChange={(e) => updateField('tenue', e.target.value)}
              placeholder="Tenue requise..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pause">Pause</Label>
            <Input
              id="pause"
              value={currentDescription.pause}
              onChange={(e) => updateField('pause', e.target.value)}
              placeholder={getDefaultPause() || "Informations sur la pause..."}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deplacement">Déplacement</Label>
            <Input
              id="deplacement"
              value={currentDescription.deplacement}
              onChange={(e) => updateField('deplacement', e.target.value)}
              placeholder={getDefaultTravel() || "Frais de déplacement..."}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarque">Remarque</Label>
          <Textarea
            id="remarque"
            value={currentDescription.remarque}
            onChange={(e) => updateField('remarque', e.target.value)}
            placeholder="Remarques ou informations supplémentaires..."
            className="min-h-16"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDescription;