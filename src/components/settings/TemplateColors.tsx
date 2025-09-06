import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const TemplateColors = () => {
  const { settings, updateSettings } = useSettings();

  const handleUpdateColor = (field: keyof typeof settings.templateColors, value: string) => {
    updateSettings({
      templateColors: {
        ...settings.templateColors,
        [field]: value
      }
    });
  };

  const colorFields = [
    { key: 'primary', label: 'Couleur principale', description: 'Titres et éléments importants' },
    { key: 'secondary', label: 'Couleur secondaire', description: 'Textes secondaires et sous-titres' },
    { key: 'accent', label: 'Couleur d\'accent', description: 'Éléments de mise en valeur' },
    { key: 'tableHeader', label: 'En-tête de tableau', description: 'Fond des en-têtes de tableau' },
    { key: 'tableRow', label: 'Lignes de tableau', description: 'Fond des lignes alternées' },
    { key: 'tableBorder', label: 'Bordures de tableau', description: 'Couleur des bordures' },
    { key: 'background', label: 'Arrière-plan', description: 'Couleur de fond principal' },
    { key: 'cardBackground', label: 'Fond des cartes', description: 'Arrière-plan des sections' }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-primary" />
          <span>Couleurs du template PDF</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez toutes les couleurs utilisées dans les devis PDF (format hexadécimal)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {colorFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${field.key}-color`}>
                {field.label}
                <span className="text-xs text-muted-foreground block">{field.description}</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={`${field.key}-color`}
                  type="color"
                  value={settings.templateColors?.[field.key as keyof typeof settings.templateColors] || '#000000'}
                  onChange={(e) => handleUpdateColor(field.key as keyof typeof settings.templateColors, e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={settings.templateColors?.[field.key as keyof typeof settings.templateColors] || '#000000'}
                  onChange={(e) => handleUpdateColor(field.key as keyof typeof settings.templateColors, e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Aperçu des couleurs</h4>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {colorFields.map((field) => (
              <div key={field.key} className="text-center">
                <div 
                  className="w-8 h-8 rounded border-2 border-white shadow-sm mx-auto mb-1"
                  style={{ backgroundColor: settings.templateColors?.[field.key as keyof typeof settings.templateColors] || '#000000' }}
                  title={field.label}
                />
                <span className="text-xs text-muted-foreground">{field.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateColors;