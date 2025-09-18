import { QuoteItem, Settings } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ServiceRowProps {
  item: QuoteItem;
  settings: Settings;
  onUpdate: (id: string, updates: Partial<QuoteItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  hideDelete?: boolean;
}

export default function ServiceRow({ item, settings, onUpdate, onDuplicate, onDelete, hideDelete }: ServiceRowProps) {
  const serviceTypes = [
    { value: 'patrouille_ouverture', label: 'Patrouille Ouverture' },
    { value: 'patrouille_fermeture', label: 'Patrouille Fermeture' },
    { value: 'patrouille_exterieur', label: 'Patrouille Extérieur' },
    { value: 'pre_vol', label: 'Pré-vol' },
    { value: 'formation', label: 'Formation' },
    { value: 'garde_clef', label: 'Garde de clef' },
    { value: 'transport', label: 'Transport' },
    { value: 'maintenance', label: 'Maintenance technique' },
    { value: 'autre', label: 'Autre service' }
  ];

  const workDaysOptions = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  const formatPrice = (price: number) => {
    const { currency } = settings;
    const formatted = price.toFixed(2);
    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}` 
      : `${formatted}${currency.symbol}`;
  };

  return (
    <tr className="border-b">
      <td className="p-2">
        <Select 
          value={item.serviceType || 'autre'} 
          onValueChange={(value) => onUpdate(item.id, { serviceType: value as any })}
        >
          <SelectTrigger className="w-40">
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
      </td>
      <td className="p-2">
        <Textarea
          value={item.serviceDescription || ''}
          onChange={(e) => onUpdate(item.id, { serviceDescription: e.target.value })}
          placeholder="Description libre du service"
          className="min-h-[60px]"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="1"
          value={item.patrolsPerDay || 1}
          onChange={(e) => onUpdate(item.id, { patrolsPerDay: parseInt(e.target.value) || 1 })}
          className="w-20"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="1"
          value={item.daysCount || 1}
          onChange={(e) => onUpdate(item.id, { daysCount: parseInt(e.target.value) || 1 })}
          className="w-20"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="5"
          step="5"
          value={item.durationMinutes || 30}
          onChange={(e) => onUpdate(item.id, { durationMinutes: parseInt(e.target.value) || 30 })}
          className="w-24"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.serviceUnitPrice || 0}
          onChange={(e) => onUpdate(item.id, { serviceUnitPrice: parseFloat(e.target.value) || 0 })}
          className="w-24"
        />
      </td>
      <td className="p-2 text-right font-medium">
        {formatPrice(item.lineTTC || 0)}
      </td>
      <td className="p-2">
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          {!hideDelete && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}