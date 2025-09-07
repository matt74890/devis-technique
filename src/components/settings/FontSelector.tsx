import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const FontSelector = () => {
  const { settings, updateSettings } = useSettings();

  const fontOptions = [
    { 
      value: 'inter', 
      label: 'Inter (Moderne et lisible)',
      family: 'Inter, sans-serif',
      description: 'Police moderne très lisible, similaire à Arial Nova'
    },
    { 
      value: 'dm-sans', 
      label: 'DM Sans (Très proche d\'Arial Nova)',
      family: 'DM Sans, sans-serif',
      description: 'Alternative la plus proche d\'Arial Nova Light'
    },
    { 
      value: 'nunito-sans', 
      label: 'Nunito Sans (Élégante et légère)',
      family: 'Nunito Sans, sans-serif',
      description: 'Police élégante avec graisses légères'
    },
    { 
      value: 'source-sans-pro', 
      label: 'Source Sans Pro (Professionnelle)',
      family: 'Source Sans Pro, sans-serif',
      description: 'Police Adobe très professionnelle'
    },
    { 
      value: 'work-sans', 
      label: 'Work Sans (Clean et moderne)',
      family: 'Work Sans, sans-serif',
      description: 'Police clean pour documents professionnels'
    },
    { 
      value: 'lato', 
      label: 'Lato (Harmonieuse)',
      family: 'Lato, sans-serif',
      description: 'Police harmonieuse et accessible'
    },
    { 
      value: 'rubik', 
      label: 'Rubik (Contemporaine)',
      family: 'Rubik, sans-serif',
      description: 'Police contemporaine avec coins arrondis'
    },
    { 
      value: 'open-sans', 
      label: 'Open Sans (Standard web)',
      family: 'Open Sans, sans-serif',
      description: 'Police web standard très utilisée'
    }
  ];

  const selectedFont = fontOptions.find(font => font.value === settings.selectedFont) || fontOptions[1]; // DM Sans par défaut

  const handleFontChange = (fontValue: string) => {
    const selectedFont = fontOptions.find(font => font.value === fontValue);
    if (selectedFont) {
      updateSettings({ 
        selectedFont: fontValue,
        fontFamily: selectedFont.family
      });
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Type className="h-5 w-5 text-primary" />
          <span>Sélection de police pour PDF</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Arial Nova Light n'est pas disponible via Google Fonts. Voici les meilleures alternatives :
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-selector">Police principale du document</Label>
            <Select 
              value={settings.selectedFont || 'dm-sans'} 
              onValueChange={handleFontChange}
            >
              <SelectTrigger id="font-selector">
                <SelectValue placeholder="Choisir une police" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <div className="flex flex-col">
                      <span style={{ fontFamily: font.family }}>{font.label}</span>
                      <span className="text-xs text-muted-foreground">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Aperçu de la police sélectionnée :</h4>
            <div 
              style={{ fontFamily: selectedFont.family }}
              className="space-y-2"
            >
              <p className="text-lg font-light">Texte en graisse légère (300)</p>
              <p className="text-base font-normal">Texte normal (400)</p>
              <p className="text-base font-medium">Texte moyen (500)</p>
              <p className="text-base font-semibold">Texte semi-gras (600)</p>
              <p className="text-sm text-muted-foreground">
                Cette police sera appliquée à tout le document PDF généré.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h5 className="font-medium text-blue-900 mb-2">💡 Recommandation</h5>
          <p className="text-sm text-blue-800">
            <strong>DM Sans</strong> est l'alternative la plus proche d'Arial Nova Light avec des graisses légères et une excellente lisibilité.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FontSelector;