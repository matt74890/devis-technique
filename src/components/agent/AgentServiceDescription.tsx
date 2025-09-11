import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, MapPin, Calendar, Clock, Shirt, Coffee, Car, MessageSquare } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/components/SettingsProvider';
import { toast } from 'sonner';

const AgentServiceDescription = () => {
  const { currentQuote, updateQuote } = useStore();
  const { settings } = useSettings();

  const [description, setDescription] = useState(() => {
    // Initialiser avec les données existantes ou des valeurs par défaut
    const existing = currentQuote?.agentServiceDescription;
    const agentItems = currentQuote?.items?.filter(item => item.kind === 'AGENT') || [];
    
    return {
      naturePrestation: existing?.naturePrestation || (agentItems[0]?.agentType || ''),
      lieuPrestation: existing?.lieuPrestation || currentQuote?.site || '',
      periode: existing?.periode || '',
      horaires: existing?.horaires || '',
      tenue: existing?.tenue || '',
      pause: existing?.pause || '',
      deplacement: existing?.deplacement || '',
      remarque: existing?.remarque || ''
    };
  });

  // Calculer automatiquement certains champs
  useEffect(() => {
    if (!currentQuote) return;

    const agentItems = currentQuote.items.filter(item => item.kind === 'AGENT');
    
    if (agentItems.length > 0) {
      // Période automatique
      const dates = agentItems.map(item => ({
        start: item.dateStart,
        end: item.dateEnd
      })).filter(d => d.start && d.end);
      
      if (dates.length > 0) {
        const minDate = dates.reduce((min, d) => !min || d.start! < min ? d.start! : min, '');
        const maxDate = dates.reduce((max, d) => !max || d.end! > max ? d.end! : max, '');
        
        const periodeAuto = minDate === maxDate 
          ? `Le ${new Date(minDate).toLocaleDateString('fr-CH')}`
          : `Du ${new Date(minDate).toLocaleDateString('fr-CH')} au ${new Date(maxDate).toLocaleDateString('fr-CH')}`;
        
        setDescription(prev => ({ ...prev, periode: periodeAuto }));
      }

      // Horaires automatiques
      const horaires = agentItems.map(item => 
        `${item.timeStart || ''} - ${item.timeEnd || ''}`
      ).filter(h => h !== ' - ').join(', ');
      
      if (horaires) {
        setDescription(prev => ({ ...prev, horaires }));
      }

      // Pause automatique
      const pauses = agentItems.map(item => {
        if (item.pauseMinutes && item.pauseMinutes > 0) {
          const paidText = item.pausePaid ? 'payée' : 'non payée';
          return `${item.pauseMinutes} min (${paidText})`;
        }
        return '';
      }).filter(p => p).join(', ');
      
      if (pauses) {
        setDescription(prev => ({ ...prev, pause: pauses }));
      }

      // Déplacement automatique
      const deplacements = agentItems.map(item => 
        item.travelCHF && item.travelCHF > 0 ? `${item.travelCHF.toFixed(2)} CHF` : ''
      ).filter(d => d).join(', ');
      
      if (deplacements) {
        setDescription(prev => ({ ...prev, deplacement: deplacements }));
      }
    }
  }, [currentQuote]);

  const handleSave = () => {
    updateQuote({
      agentServiceDescription: description
    });
    toast.success('Description de la prestation sauvegardée');
  };

  const serviceCategories = settings.agentSettings?.serviceCategories || [
    'Sécurité', 'Sécurité armée', 'Maître-chien', 'Patrouilleur', 'Garde du corps', 'Autre'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">Description de la prestation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nature de la prestation */}
          <div className="space-y-2">
            <Label htmlFor="naturePrestation" className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Nature de la prestation</span>
            </Label>
            <Select 
              value={description.naturePrestation} 
              onValueChange={(value) => setDescription(prev => ({ ...prev, naturePrestation: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type de prestation" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lieu de prestation */}
          <div className="space-y-2">
            <Label htmlFor="lieuPrestation" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Lieu de prestation</span>
            </Label>
            <Input
              id="lieuPrestation"
              value={description.lieuPrestation}
              onChange={(e) => setDescription(prev => ({ ...prev, lieuPrestation: e.target.value }))}
              placeholder="Adresse ou description du lieu"
            />
          </div>

          {/* Période */}
          <div className="space-y-2">
            <Label htmlFor="periode" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Période</span>
            </Label>
            <Input
              id="periode"
              value={description.periode}
              onChange={(e) => setDescription(prev => ({ ...prev, periode: e.target.value }))}
              placeholder="Du ... au ... ou Le ..."
            />
          </div>

          {/* Horaires */}
          <div className="space-y-2">
            <Label htmlFor="horaires" className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Horaires</span>
            </Label>
            <Input
              id="horaires"
              value={description.horaires}
              onChange={(e) => setDescription(prev => ({ ...prev, horaires: e.target.value }))}
              placeholder="08:00 - 16:00"
            />
          </div>

          {/* Tenue */}
          <div className="space-y-2">
            <Label htmlFor="tenue" className="flex items-center space-x-2">
              <Shirt className="h-4 w-4 text-primary" />
              <span>Tenue</span>
            </Label>
            <Input
              id="tenue"
              value={description.tenue}
              onChange={(e) => setDescription(prev => ({ ...prev, tenue: e.target.value }))}
              placeholder="Uniforme de sécurité, civil, etc."
            />
          </div>

          {/* Pause */}
          <div className="space-y-2">
            <Label htmlFor="pause" className="flex items-center space-x-2">
              <Coffee className="h-4 w-4 text-primary" />
              <span>Pause</span>
            </Label>
            <Input
              id="pause"
              value={description.pause}
              onChange={(e) => setDescription(prev => ({ ...prev, pause: e.target.value }))}
              placeholder="60 min (non payée)"
            />
          </div>

          {/* Déplacement */}
          <div className="space-y-2">
            <Label htmlFor="deplacement" className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-primary" />
              <span>Déplacement</span>
            </Label>
            <Input
              id="deplacement"
              value={description.deplacement}
              onChange={(e) => setDescription(prev => ({ ...prev, deplacement: e.target.value }))}
              placeholder="50.00 CHF ou Inclus"
            />
          </div>
        </div>

        {/* Remarque */}
        <div className="space-y-2">
          <Label htmlFor="remarque" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Remarque</span>
          </Label>
          <Textarea
            id="remarque"
            value={description.remarque}
            onChange={(e) => setDescription(prev => ({ ...prev, remarque: e.target.value }))}
            placeholder="Informations complémentaires, instructions spéciales..."
            rows={4}
          />
        </div>

        <div className="flex justify-center">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Sauvegarder la description
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentServiceDescription;