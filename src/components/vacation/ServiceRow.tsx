import { QuoteItem, Settings } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Edit } from 'lucide-react';
import ServiceFormModal from './ServiceFormModal';

interface ServiceRowProps {
  item: QuoteItem;
  settings: Settings;
  onUpdate: (id: string, updates: Partial<QuoteItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  hideDelete?: boolean;
  currentQuote: any; // Pour accéder au discountMode
}

export default function ServiceRow({ item, settings, onUpdate, onDuplicate, onDelete, hideDelete, currentQuote }: ServiceRowProps) {
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

  const formatPrice = (price: number) => {
    const { currency } = settings;
    const formatted = price.toFixed(2);
    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}` 
      : `${formatted}${currency.symbol}`;
  };

  const getServiceLabel = (serviceType?: string) => {
    return serviceTypes.find(t => t.value === serviceType)?.label || 'Autre service';
  };

  const handleServiceUpdate = (updates: Partial<QuoteItem>) => {
    onUpdate(item.id, updates);
  };

  return (
    <tr className="border-b hover:bg-muted/30">
      {/* Nature */}
      <td className="p-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800">SERVICE</Badge>
      </td>
      {/* Type - Nom du service */}
      <td className="p-2">
        <div className="font-medium text-sm">
          {getServiceLabel(item.serviceType)}
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-32">
          {item.serviceDescription}
        </div>
      </td>
      {/* Référence */}
      <td className="p-2">
        <div className="text-xs text-muted-foreground">
          {item.reference || 'SRV-AUTO'}
        </div>
      </td>
      {/* Mode */}
      <td className="p-2 text-center">
        <Badge variant="outline" className="text-xs">
          unique
        </Badge>
      </td>
      {/* Qté - Nombre total de prestations */}
      <td className="p-2 text-center">
        <div className="font-medium">
          {(item.patrolsPerDay || 1) * (item.daysCount || 1)}
        </div>
        <div className="text-xs text-muted-foreground">
          ({item.patrolsPerDay || 1} × {item.daysCount || 1}j)
        </div>
      </td>
      {/* Prix unitaire */}
      <td className="p-2 text-center">
        <div className="font-medium">
          {formatPrice(item.serviceUnitPrice || 0)}
        </div>
        <div className="text-xs text-muted-foreground">
          par prestation
        </div>
      </td>
      {/* Mode prix */}
      <td className="p-2 text-center">
        <Badge variant="outline" className="text-xs">
          HT
        </Badge>
      </td>
      {/* Remise % si per_line */}
      {currentQuote.discountMode === 'per_line' && (
        <td className="p-2 text-center">
          <span className="text-xs text-muted-foreground">N/A</span>
        </td>
      )}
      {/* Total HT */}
      <td className="p-2 text-right font-medium">
        {formatPrice(item.lineHT || 0)}
      </td>
      {/* Total TTC */}
      <td className="p-2 text-right font-medium">
        {formatPrice(item.lineTTC || 0)}
      </td>
      {/* Actions */}
      <td className="p-2">
        <div className="flex gap-1">
          <ServiceFormModal
            item={item}
            settings={settings}
            onSave={handleServiceUpdate}
            isEdit={true}
            trigger={
              <Button variant="outline" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
            }
          />
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