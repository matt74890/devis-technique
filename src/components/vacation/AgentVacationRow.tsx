import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Trash2 } from 'lucide-react';
import { QuoteItem, Settings } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AgentVacationRowProps {
  item: QuoteItem;
  settings: Settings;
  onUpdate: (id: string, updates: Partial<QuoteItem>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const AgentVacationRow = ({ item, settings, onUpdate, onDelete, onDuplicate }: AgentVacationRowProps) => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getSuggestedRate = (agentType: string): number => {
    const suggestion = settings.agentSettings.agentTypes.find(t => t.type === agentType);
    return suggestion?.suggestedRate || 0;
  };

  const validateAndUpdate = (field: keyof QuoteItem, value: any) => {
    const newErrors = { ...errors };
    
    // Validation rules
    if (field === 'rateCHFh' && (!value || value <= 0)) {
      newErrors.rateCHFh = 'Tarif obligatoire';
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le tarif CHF/h est obligatoire pour les vacations",
      });
    } else {
      delete newErrors[field];
    }
    
    if (field === 'dateEnd' && item.dateStart && value && new Date(value) < new Date(item.dateStart)) {
      newErrors.dateEnd = 'Date de fin antérieure au début';
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La date de fin ne peut pas être antérieure à la date de début",
      });
    } else if (field === 'dateEnd') {
      delete newErrors.dateEnd;
    }
    
    setErrors(newErrors);
    
    // Mettre à jour l'item avec la nouvelle valeur
    const updatedItem = { ...item, [field]: value };
    
    // Si c'est un changement qui affecte les calculs, recalculer
    if (['dateStart', 'timeStart', 'dateEnd', 'timeEnd', 'rateCHFh', 'pauseMinutes', 'pausePaid', 'travelCHF', 'agentType'].includes(field)) {
      // Import du calcul d'agent
      import('@/utils/agentCalculations').then(({ calculateAgentVacation }) => {
        const calculatedItem = calculateAgentVacation(updatedItem, settings);
        onUpdate(item.id, calculatedItem);
      });
    } else {
      onUpdate(item.id, { [field]: value });
    }
  };

  const formatTime = (hours: number): string => {
    return hours.toFixed(2).replace('.', ',');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const cantons = ['GE', 'VD', 'VS', 'NE', 'JU', 'FR', 'BE', 'SO', 'BS', 'BL', 'AG', 'ZH', 'SH', 'TG', 'SG', 'AR', 'AI', 'GL', 'GR', 'TI', 'UR', 'SZ', 'OW', 'NW', 'LU', 'ZG'];
  const agentTypeOptions = [
    'Sécurité', 'Sécurité armée', 'Maître-chien', 'Patrouilleur', 'Garde du corps', 'Autre'
  ];

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>AGENT</TableCell>
      
      {/* Date début */}
      <TableCell>
        <Input
          type="date"
          value={item.dateStart || ''}
          onChange={(e) => validateAndUpdate('dateStart', e.target.value)}
          className="w-32"
        />
      </TableCell>
      
      {/* Heure début */}
      <TableCell>
        <Input
          type="time"
          value={item.timeStart || ''}
          onChange={(e) => validateAndUpdate('timeStart', e.target.value)}
          className="w-24"
        />
      </TableCell>
      
      {/* Date fin */}
      <TableCell>
        <Input
          type="date"
          value={item.dateEnd || ''}
          onChange={(e) => validateAndUpdate('dateEnd', e.target.value)}
          className={`w-32 ${errors.dateEnd ? 'border-destructive' : ''}`}
        />
      </TableCell>
      
      {/* Heure fin */}
      <TableCell>
        <Input
          type="time"
          value={item.timeEnd || ''}
          onChange={(e) => validateAndUpdate('timeEnd', e.target.value)}
          className="w-24"
        />
      </TableCell>
      
      {/* Type de prestation */}
      <TableCell>
        <Select
          value={item.agentType || ''}
          onValueChange={(value) => validateAndUpdate('agentType', value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {agentTypeOptions.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      
      {/* Tarif CHF/h */}
      <TableCell>
        <div className="space-y-1">
          <Input
            type="number"
            step="0.01"
            value={item.rateCHFh || ''}
            onChange={(e) => validateAndUpdate('rateCHFh', parseFloat(e.target.value) || 0)}
            className={`w-24 ${errors.rateCHFh ? 'border-destructive' : ''}`}
            placeholder="0.00"
          />
          {item.agentType && getSuggestedRate(item.agentType) > 0 && (
            <div className="text-xs text-muted-foreground">
              Suggéré: {getSuggestedRate(item.agentType)} CHF/h
            </div>
          )}
        </div>
      </TableCell>
      
      {/* Pause */}
      <TableCell>
        <div className="space-y-2">
          <Input
            type="number"
            value={item.pauseMinutes || 0}
            onChange={(e) => validateAndUpdate('pauseMinutes', parseInt(e.target.value) || 0)}
            className="w-20"
            placeholder="0"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={item.pausePaid || false}
              onCheckedChange={(checked) => validateAndUpdate('pausePaid', checked)}
            />
            <span className="text-xs">Payée</span>
          </div>
        </div>
      </TableCell>
      
      {/* Déplacement */}
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={item.travelCHF || 0}
          onChange={(e) => validateAndUpdate('travelCHF', parseFloat(e.target.value) || 0)}
          className="w-24"
          placeholder="0.00"
        />
      </TableCell>
      
      {/* Canton */}
      <TableCell>
        <Select
          value={item.canton || 'GE'}
          onValueChange={(value) => validateAndUpdate('canton', value)}
        >
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cantons.map(canton => (
              <SelectItem key={canton} value={canton}>{canton}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      
      {/* Résultats */}
      <TableCell>
        <div className="text-sm space-y-1">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>Normal: {formatTime(item.hoursNormal || 0)}h</span>
            <span>Nuit: {formatTime(item.hoursNight || 0)}h</span>
            <span>Dimanche: {formatTime(item.hoursSunday || 0)}h</span>
            <span>JF: {formatTime(item.hoursHoliday || 0)}h</span>
          </div>
          <div className="font-medium">
            Total: {formatTime(item.hoursTotal || 0)}h
          </div>
        </div>
      </TableCell>
      
      {/* HT */}
      <TableCell className="text-right font-medium">
        {formatCurrency(item.lineHT || 0)}
      </TableCell>
      
      {/* TVA */}
      <TableCell className="text-right">
        {formatCurrency(item.lineTVA || 0)}
      </TableCell>
      
      {/* TTC */}
      <TableCell className="text-right font-medium">
        {formatCurrency(item.lineTTC || 0)}
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(item.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AgentVacationRow;