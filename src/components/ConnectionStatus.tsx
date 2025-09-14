import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Connection error:', error);
          setStatus('disconnected');
        } else {
          setStatus(data.session ? 'connected' : 'disconnected');
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setStatus('disconnected');
      }
    };

    // Vérification initiale
    checkConnection();

    // Écouter les changements d'état de l'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'Session active' : 'No session');
      setStatus(session ? 'connected' : 'disconnected');
    });

    return () => subscription.unsubscribe();
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'Connecté',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'disconnected':
        return {
          icon: XCircle,
          text: 'Déconnecté',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'connecting':
        return {
          icon: Clock,
          text: 'Connexion...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};