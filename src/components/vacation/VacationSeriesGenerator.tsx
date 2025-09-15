import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Plus } from 'lucide-react';
import { QuoteItem, Settings } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface VacationSeriesGeneratorProps {
  settings: Settings;
  onAddVacations: (vacations: Omit<QuoteItem, 'id'>[]) => void;
}

const VacationSeriesGenerator = ({ settings, onAddVacations }: VacationSeriesGeneratorProps) => {
  const { toast } = useToast();
  
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, true, true, true, true, true, false]); // Mon-Fri par défaut
  const [agentType, setAgentType] = useState('');
  const [rateCHFh, setRateCHFh] = useState<number>(0);
  const [pauseMinutes, setPauseMinutes] = useState<number>(0);
  const [pausePaid, setPausePaid] = useState<boolean>(false);
  const [travelCHF, setTravelCHF] = useState<number>(0);
  const [canton, setCanton] = useState('GE');
  const [ignoreHolidays, setIgnoreHolidays] = useState<boolean>(true);
  const [ignoreSundays, setIgnoreSundays] = useState<boolean>(false);

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const cantons = ['GE', 'VD', 'VS', 'NE', 'JU', 'FR', 'BE', 'SO', 'BS', 'BL', 'AG', 'ZH', 'SH', 'TG', 'SG', 'AR', 'AI', 'GL', 'GR', 'TI', 'UR', 'SZ', 'OW', 'NW', 'LU', 'ZG'];
  const agentTypeOptions = [
    'Sécurité', 'Sécurité armée', 'Maître-chien', 'Patrouilleur', 'Garde du corps', 'Autre'
  ];

  const getSuggestedRate = (agentType: string): number => {
    const suggestion = settings.agentSettings.agentTypes.find(t => t.type === agentType);
    return suggestion?.suggestedRate || 0;
  };

  const isHoliday = (date: Date, canton: string): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const holidays = settings.agentSettings.holidays[canton] || [];
    return holidays.includes(dateStr);
  };

  const calculateEndDate = (startDate: string, startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return startDate;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Si l'heure de fin est plus petite que l'heure de début, c'est le lendemain
    if (endMinutes < startMinutes) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }
    
    return startDate;
  };

  const generateSeries = () => {
    if (!dateStart || !dateEnd || !timeStart || !timeEnd || !agentType || !rateCHFh) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires (dates, heures, type, tarif)",
      });
      return;
    }

    if (new Date(dateEnd) < new Date(dateStart)) {
      toast({
        variant: "destructive",
        title: "Erreur de dates",
        description: "La date de fin ne peut pas être antérieure à la date de début",
      });
      return;
    }

    const vacations: Omit<QuoteItem, 'id'>[] = [];
    const seriesTag = crypto.randomUUID();
    const startDate = new Date(dateStart);
    const endDate = new Date(dateEnd);

    let currentDate = new Date(startDate);
    let count = 0;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      
      // Check if this day is selected
      if (selectedDays[dayOfWeek]) {
        // Check exclusions
        let shouldSkip = false;
        
        if (ignoreSundays && dayOfWeek === 0) {
          shouldSkip = true;
        }
        
        if (ignoreHolidays && isHoliday(currentDate, canton)) {
          shouldSkip = true;
        }
        
        if (!shouldSkip) {
          // Calculer la date de fin (peut être le lendemain si vacation passe minuit)
          const startDateStr = currentDate.toISOString().split('T')[0];
          const endDateStr = calculateEndDate(startDateStr, timeStart, timeEnd);
          
          const vacation: Omit<QuoteItem, 'id'> = {
            kind: 'AGENT',
            type: agentType,
            reference: `Vacation ${agentType}`,
            mode: 'unique',
            dateStart: startDateStr,
            timeStart,
            dateEnd: endDateStr,
            timeEnd,
            agentType,
            rateCHFh,
            pauseMinutes,
            pausePaid,
            travelCHF,
            canton,
            seriesTag,
            unitPriceMode: 'HT'
          };
          
          vacations.push(vacation);
          count++;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (count === 0) {
      toast({
        variant: "destructive",
        title: "Aucune vacation",
        description: "Aucune vacation n'a été générée avec les paramètres sélectionnés",
      });
      return;
    }

    onAddVacations(vacations);
    
    toast({
      title: "Série créée",
      description: `${count} vacation${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''}`,
    });

    // Reset form
    setDateStart('');
    setDateEnd('');
    setTimeStart('');
    setTimeEnd('');
    setAgentType('');
    setRateCHFh(0);
    setPauseMinutes(0);
    setPausePaid(false);
    setTravelCHF(0);
    setSelectedDays([false, true, true, true, true, true, false]);
  };

  return (
    <Card className="shadow-soft border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span>Générateur de série de vacations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plage de dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateStart">Date de début</Label>
            <Input
              id="dateStart"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dateEnd">Date de fin</Label>
            <Input
              id="dateEnd"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Jours de la semaine */}
        <div>
          <Label>Jours de la semaine</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {dayNames.map((day, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedDays[index]}
                  onCheckedChange={(checked) => {
                    const newDays = [...selectedDays];
                    newDays[index] = !!checked;
                    setSelectedDays(newDays);
                  }}
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Heures */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeStart">Heure de début</Label>
            <Input
              id="timeStart"
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="timeEnd">Heure de fin</Label>
            <Input
              id="timeEnd"
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Type de prestation et tarif */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agentType">Type de prestation</Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {agentTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rateCHFh">Tarif CHF/h *</Label>
            <Input
              id="rateCHFh"
              type="number"
              step="0.01"
              value={rateCHFh || ''}
              onChange={(e) => setRateCHFh(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            {agentType && getSuggestedRate(agentType) > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Suggéré: {getSuggestedRate(agentType)} CHF/h
              </div>
            )}
          </div>
        </div>

        {/* Pause et déplacement */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="pauseMinutes">Pause (minutes)</Label>
            <Input
              id="pauseMinutes"
              type="number"
              value={pauseMinutes}
              onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
            />
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                checked={pausePaid}
                onCheckedChange={(checked) => setPausePaid(!!checked)}
              />
              <span className="text-sm">Pause payée</span>
            </div>
          </div>
          <div>
            <Label htmlFor="travelCHF">Déplacement CHF</Label>
            <Input
              id="travelCHF"
              type="number"
              step="0.01"
              value={travelCHF}
              onChange={(e) => setTravelCHF(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="canton">Canton</Label>
            <Select value={canton} onValueChange={setCanton}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cantons.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options d'exclusion */}
        <div className="space-y-2">
          <Label>Options d'exclusion</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={ignoreHolidays}
              onCheckedChange={(checked) => setIgnoreHolidays(!!checked)}
              />
              <span className="text-sm">Ignorer les jours fériés</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={ignoreSundays}
              onCheckedChange={(checked) => setIgnoreSundays(!!checked)}
              />
              <span className="text-sm">Ignorer les dimanches</span>
            </label>
          </div>
        </div>

        {/* Bouton de génération */}
        <Button onClick={generateSeries} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Générer la série de vacations
        </Button>
      </CardContent>
    </Card>
  );
};

export default VacationSeriesGenerator;