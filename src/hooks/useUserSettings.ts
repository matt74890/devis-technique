import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Settings } from '@/types';
import { toast } from 'sonner';

export const useUserSettings = (defaultSettings: Settings) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  // Charger les paramètres depuis Supabase
  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si pas de profil, créer un nouveau avec les paramètres par défaut
        if (error.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert({ user_id: user.id, settings: defaultSettings as any });
        } else {
          throw error;
        }
      } else if (data?.settings) {
        // Merger les paramètres sauvegardés avec les valeurs par défaut pour les nouvelles propriétés
        setSettings({ ...defaultSettings, ...(data.settings as any) });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les paramètres dans Supabase
  const saveSettings = async (newSettings: Settings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings as any })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  // Charger les paramètres au montage ou changement d'utilisateur
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(defaultSettings);
    }
  }, [user]);

  return {
    settings,
    loading,
    updateSettings: (newSettings: Partial<Settings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      saveSettings(updatedSettings);
    },
    saveSettings
  };
};