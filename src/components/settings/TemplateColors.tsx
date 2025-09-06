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

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-primary" />
          <span>Couleurs du template</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les couleurs utilisées dans les devis PDF (maximum 3 couleurs en hexadécimal)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Couleur principale *</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="primary-color"
                type="color"
                value={settings.templateColors?.primary || '#2563eb'}
                onChange={(e) => handleUpdateColor('primary', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.templateColors?.primary || '#2563eb'}
                onChange={(e) => handleUpdateColor('primary', e.target.value)}
                placeholder="#2563eb"
                className="font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Couleur secondaire</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="secondary-color"
                type="color"
                value={settings.templateColors?.secondary || '#64748b'}
                onChange={(e) => handleUpdateColor('secondary', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.templateColors?.secondary || '#64748b'}
                onChange={(e) => handleUpdateColor('secondary', e.target.value)}
                placeholder="#64748b"
                className="font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accent-color">Couleur d'accent</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="accent-color"
                type="color"
                value={settings.templateColors?.accent || '#059669'}
                onChange={(e) => handleUpdateColor('accent', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.templateColors?.accent || '#059669'}
                onChange={(e) => handleUpdateColor('accent', e.target.value)}
                placeholder="#059669"
                className="font-mono"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Aperçu des couleurs</h4>
          <div className="flex space-x-2">
            <div 
              className="w-8 h-8 rounded border-2 border-white shadow-sm"
              style={{ backgroundColor: settings.templateColors?.primary || '#2563eb' }}
              title="Couleur principale"
            />
            <div 
              className="w-8 h-8 rounded border-2 border-white shadow-sm"
              style={{ backgroundColor: settings.templateColors?.secondary || '#64748b' }}
              title="Couleur secondaire"
            />
            <div 
              className="w-8 h-8 rounded border-2 border-white shadow-sm"
              style={{ backgroundColor: settings.templateColors?.accent || '#059669' }}
              title="Couleur d'accent"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateColors;