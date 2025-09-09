import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Download, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { calculateQuoteTotals } from '@/utils/calculations';

interface SavedQuoteManagerProps {
  currentClient: string;
}

const SavedQuoteManager = ({ currentClient }: SavedQuoteManagerProps) => {
  const { toast } = useToast();
  const { 
    getSavedQuoteForClient, 
    loadSavedQuoteAsBase, 
    addSavedQuoteItems,
    settings 
  } = useStore();
  
  const savedQuote = currentClient ? getSavedQuoteForClient(currentClient) : null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const calculateTotals = (items: any[]) => {
    const mockQuote = { items, discountMode: 'per_line', discountPct: 0 };
    return calculateQuoteTotals(mockQuote as any, settings.tvaPct);
  };

  const handleLoadAsBase = () => {
    loadSavedQuoteAsBase(currentClient);
    toast({
      title: "Devis chargé",
      description: "Le dernier devis a été chargé comme base du devis actuel",
    });
  };

  const handleAddToCurrentQuote = () => {
    addSavedQuoteItems(currentClient);
    toast({
      title: "Lignes ajoutées",
      description: "Les lignes du dernier devis ont été ajoutées au devis actuel",
    });
  };

  if (!currentClient || !savedQuote) {
    return null;
  }

  const totals = calculateTotals(savedQuote.items);
  const techItems = savedQuote.items.filter((item: any) => item.kind === 'TECH');
  const agentItems = savedQuote.items.filter((item: any) => item.kind === 'AGENT');

  return (
    <Card className="shadow-soft border-primary/20 bg-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          <span>Dernier devis pour ce client</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enregistré le {formatDate(savedQuote.savedAt)}
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">{techItems.length}</span> ligne{techItems.length > 1 ? 's' : ''} technique{techItems.length > 1 ? 's' : ''}
              </p>
              <p>
                <span className="font-medium">{agentItems.length}</span> vacation{agentItems.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            {totals.unique.totalTTC > 0 && (
              <p className="text-sm">
                Tech unique: <span className="font-medium">{formatCurrency(totals.unique.totalTTC)}</span>
              </p>
            )}
            {totals.mensuel.totalTTC > 0 && (
              <p className="text-sm">
                Tech mensuel: <span className="font-medium">{formatCurrency(totals.mensuel.totalTTC)}</span>
              </p>
            )}
            {totals.agents.totalTTC > 0 && (
              <p className="text-sm">
                Vacations: <span className="font-medium">{formatCurrency(totals.agents.totalTTC)}</span>
              </p>
            )}
            <p className="text-lg font-bold text-primary">
              Total: {formatCurrency(totals.global.totalTTC)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadAsBase}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Charger comme base
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCurrentQuote}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter à la suite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedQuoteManager;