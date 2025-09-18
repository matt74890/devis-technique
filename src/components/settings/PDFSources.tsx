import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Eye, FileText, Upload, Download, Trash2 } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { LayoutVariant } from '@/types/layout';

interface PDFSource {
  id: string;
  name: string;
  type: 'json' | 'copier' | 'legacy';
  variant: LayoutVariant;
  enabled: boolean;
  order: number;
  isDefault?: boolean;
}

export const PDFSources: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  // Configuration des sources disponibles (exemple)
  const availableSources: PDFSource[] = [
    {
      id: 'json_wysiwyg',
      name: 'Éditeur WYSIWYG (Layouts JSON)',
      type: 'json',
      variant: 'technique',
      enabled: true,
      order: 1,
      isDefault: true
    },
    {
      id: 'copier_imported',
      name: 'Modèles importés (Copieur PDF)',
      type: 'copier',
      variant: 'technique',
      enabled: true,
      order: 2
    },
    {
      id: 'legacy_templates',
      name: 'Anciens gabarits (Legacy)',
      type: 'legacy',
      variant: 'technique',
      enabled: false,
      order: 3
    }
  ];

  const handleToggleSource = (sourceId: string, enabled: boolean) => {
    // TODO: Mettre à jour la configuration des sources
    console.log(`Toggle source ${sourceId}: ${enabled}`);
  };

  const handleSetDefault = (sourceId: string) => {
    // TODO: Définir comme source par défaut
    console.log(`Set default source: ${sourceId}`);
  };

  const exportAllSources = () => {
    const exportData = {
      layouts: settings.pdfLayouts || {},
      activeLayouts: settings.activePDFLayouts || {},
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pdf-sources-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSources = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Valider et importer les données
        if (importData.layouts && importData.activeLayouts) {
          updateSettings({
            pdfLayouts: { ...settings.pdfLayouts, ...importData.layouts },
            activePDFLayouts: { ...settings.activePDFLayouts, ...importData.activeLayouts }
          });
          
          console.log('Sources PDF importées avec succès');
        } else {
          console.error('Format de fichier invalide');
        }
      } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sources PDF disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Configurez les sources de génération PDF disponibles lors de l'export. 
            L'ordre détermine la priorité d'affichage dans le sélecteur.
          </div>

          <div className="space-y-3">
            {availableSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={source.enabled}
                    onCheckedChange={(enabled) => handleToggleSource(source.id, enabled)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="font-medium">{source.name}</Label>
                      {source.isDefault && (
                        <Badge variant="default" className="text-xs">Par défaut</Badge>
                      )}
                      <Badge 
                        variant={source.type === 'json' ? 'secondary' : 
                                source.type === 'copier' ? 'outline' : 'destructive'}
                        className="text-xs"
                      >
                        {source.type === 'json' ? 'JSON' : 
                         source.type === 'copier' ? 'Copié' : 'Legacy'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Variante : {source.variant} • Ordre : {source.order}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!source.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(source.id)}
                    >
                      Définir par défaut
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Toujours afficher le sélecteur</Label>
              <div className="text-sm text-muted-foreground">
                Si désactivé, utilise directement la source par défaut
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Sauvegarde et restauration</Label>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportAllSources}>
                <Download className="h-4 w-4 mr-2" />
                Exporter toutes les sources
              </Button>
              
              <Button variant="outline" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer des sources
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importSources}
                  />
                </label>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              L'export inclut tous les layouts JSON et configurations actives. 
              L'import fusionnera avec les sources existantes.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des choix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            Aucun historique disponible
          </div>
        </CardContent>
      </Card>
    </div>
  );
};