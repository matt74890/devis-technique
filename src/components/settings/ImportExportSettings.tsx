import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, Shield } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { Settings } from '@/types';
import { toast } from 'sonner';

const ImportExportSettings = () => {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportSettings = () => {
    try {
      const dataToExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings: settings
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `parametres-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('Paramètres exportés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export des paramètres');
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validation basique
        if (!importedData.settings) {
          throw new Error('Format de fichier invalide');
        }

        // Mise à jour des paramètres
        const newSettings = importedData.settings as Settings;
        
        // Validation des propriétés essentielles
        if (typeof newSettings.tvaPct !== 'number' || 
            !newSettings.currency || 
            !Array.isArray(newSettings.subscriptions)) {
          throw new Error('Données corrompues dans le fichier');
        }

        updateSettings(newSettings);
        toast.success('Paramètres importés et synchronisés avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        toast.error('Erreur lors de l\'import: fichier invalide ou corrompu');
      }
    };

    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.')) {
      // Utiliser les paramètres par défaut du store
      const { defaultSettings } = require('@/store/useStore');
      updateSettings(defaultSettings);
      toast.success('Paramètres réinitialisés aux valeurs par défaut');
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Cette section permet de sauvegarder et restaurer tous vos paramètres. 
          Les données sont automatiquement synchronisées avec votre compte.
        </AlertDescription>
      </Alert>

      {/* Export des paramètres */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Exporter les paramètres</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Téléchargez un fichier contenant tous vos paramètres actuels. 
            Ce fichier peut être utilisé pour restaurer vos paramètres sur un autre compte.
          </p>
          <Button onClick={exportSettings} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Télécharger les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* Import des paramètres */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-success" />
            <span>Importer les paramètres</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chargez un fichier de paramètres pour remplacer tous vos paramètres actuels. 
            Cette action synchronisera automatiquement les données avec votre compte.
          </p>
          <div className="space-y-2">
            <Label htmlFor="import-file">Fichier de paramètres (.json)</Label>
            <Input
              id="import-file"
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importSettings}
              className="cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Seuls les fichiers JSON exportés depuis cette application sont acceptés.
          </p>
        </CardContent>
      </Card>

      {/* Informations sur la synchronisation */}
      <Card className="shadow-soft border-info/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-info" />
            <span>Synchronisation automatique</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Tous les paramètres sont automatiquement sauvegardés dans le cloud</p>
            <p>• Les modifications sont synchronisées en temps réel</p>
            <p>• Vos paramètres sont disponibles sur tous vos appareils</p>
            <p>• L'historique des modifications est conservé pour la récupération</p>
          </div>
        </CardContent>
      </Card>

      {/* Reset aux paramètres par défaut */}
      <Card className="shadow-soft border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <Shield className="h-5 w-5" />
            <span>Zone de danger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Réinitialiser tous les paramètres aux valeurs par défaut. Cette action est irréversible.
          </p>
          <Button 
            variant="destructive" 
            onClick={resetToDefaults}
            className="w-full sm:w-auto"
          >
            Réinitialiser tous les paramètres
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExportSettings;