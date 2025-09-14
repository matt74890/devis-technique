import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';

const ImportantNoteSettings = () => {
  const { settings, updateSettings } = useStore();

  const handleNoteChange = (value: string) => {
    updateSettings({
      importantNote: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Remarque importante</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="important-note">
              Texte de la remarque (affiché sous le total général)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Cette remarque apparaîtra sur tous les devis sous le total général. 
              Utilisez-la pour des mentions légales, conditions spéciales, etc.
            </p>
            <Textarea
              id="important-note"
              placeholder="Ex: Heures de nuit, dimanche et jours fériés majorées à 10% selon la CCT."
              value={settings.importantNote || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
          
          {settings.importantNote && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">Aperçu de la remarque :</p>
                  <div className="text-sm text-amber-700 whitespace-pre-line">
                    {settings.importantNote}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantNoteSettings;