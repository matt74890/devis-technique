import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArchivedQuote {
  id: string;
  quote_ref: string;
  client_name: string;
  quote_date: string;
  status: 'archived' | 'validated';
  subtotal_ht: number;
  total_ttc: number;
  archived_at: string;
}

interface MonthlyStats {
  month: string;
  total_ht: number;
  total_ttc: number;
  count: number;
}

export function ArchivedQuotes() {
  const [quotes, setQuotes] = useState<ArchivedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedQuotes();
  }, []);

  const fetchArchivedQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('archived_quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('quote_date', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as ArchivedQuote[];
      setQuotes(typedData);
      calculateMonthlyStats(typedData);
    } catch (error) {
      console.error('Error fetching archived quotes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les devis archivés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (quotesData: ArchivedQuote[]) => {
    const validatedQuotes = quotesData.filter(q => q.status === 'validated');
    const statsByMonth: { [key: string]: MonthlyStats } = {};

    validatedQuotes.forEach(quote => {
      const monthKey = format(new Date(quote.quote_date), 'yyyy-MM', { locale: fr });
      
      if (!statsByMonth[monthKey]) {
        statsByMonth[monthKey] = {
          month: format(new Date(quote.quote_date), 'MMMM yyyy', { locale: fr }),
          total_ht: 0,
          total_ttc: 0,
          count: 0,
        };
      }

      statsByMonth[monthKey].total_ht += Number(quote.subtotal_ht);
      statsByMonth[monthKey].total_ttc += Number(quote.total_ttc);
      statsByMonth[monthKey].count += 1;
    });

    setMonthlyStats(Object.values(statsByMonth).sort((a, b) => b.month.localeCompare(a.month)));
  };

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('archived_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Devis supprimé',
      });

      fetchArchivedQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le devis',
        variant: 'destructive',
      });
    }
  };

  const archivedQuotes = quotes.filter(q => q.status === 'archived');
  const validatedQuotes = quotes.filter(q => q.status === 'validated');

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="archived" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="archived">Archivés ({archivedQuotes.length})</TabsTrigger>
          <TabsTrigger value="validated">Validés ({validatedQuotes.length})</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="archived" className="space-y-4">
          {archivedQuotes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Aucun devis archivé
            </Card>
          ) : (
            archivedQuotes.map(quote => (
              <Card key={quote.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Devis N° {quote.quote_ref}</h3>
                      <Badge variant="secondary">Archivé</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(quote.quote_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">HT: {quote.subtotal_ht.toFixed(2)} CHF</span>
                      {' • '}
                      <span className="font-medium">TTC: {quote.total_ttc.toFixed(2)} CHF</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteQuote(quote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="validated" className="space-y-4">
          {validatedQuotes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Aucun devis validé
            </Card>
          ) : (
            validatedQuotes.map(quote => (
              <Card key={quote.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Devis N° {quote.quote_ref}</h3>
                      <Badge variant="default">Validé</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(quote.quote_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">HT: {quote.subtotal_ht.toFixed(2)} CHF</span>
                      {' • '}
                      <span className="font-medium">TTC: {quote.total_ttc.toFixed(2)} CHF</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteQuote(quote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {monthlyStats.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Aucune statistique disponible
            </Card>
          ) : (
            <>
              {monthlyStats.map(stat => (
                <Card key={stat.month} className="p-4">
                  <h3 className="font-semibold text-lg mb-3 capitalize">{stat.month}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre de devis</p>
                      <p className="text-2xl font-bold">{stat.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total HT</p>
                      <p className="text-2xl font-bold">{stat.total_ht.toFixed(2)} CHF</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total TTC</p>
                      <p className="text-2xl font-bold">{stat.total_ttc.toFixed(2)} CHF</p>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}