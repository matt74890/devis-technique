import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

  const colorSections = [
    {
      title: 'Couleurs principales',
      fields: [
        { key: 'primary', label: 'Couleur principale', description: 'Éléments importants et liens' },
        { key: 'secondary', label: 'Couleur secondaire', description: 'Éléments de support' },
        { key: 'accent', label: 'Couleur d\'accent', description: 'Mise en valeur spéciale' }
      ]
    },
    {
      title: 'Couleurs de texte',
      fields: [
        { key: 'titleColor', label: 'Titres principaux', description: 'Couleur des grands titres' },
        { key: 'subtitleColor', label: 'Sous-titres', description: 'Couleur des sous-titres' },
        { key: 'textColor', label: 'Texte principal', description: 'Couleur du texte normal' },
        { key: 'mutedTextColor', label: 'Texte atténué', description: 'Texte secondaire et notes' }
      ]
    },
    {
      title: 'Couleurs de fond',
      fields: [
        { key: 'background', label: 'Arrière-plan principal', description: 'Fond de la page' },
        { key: 'cardBackground', label: 'Fond des cartes', description: 'Arrière-plan des sections' },
        { key: 'headerBackground', label: 'Fond d\'en-tête', description: 'Zone d\'en-tête du document' }
      ]
    },
    {
      title: 'Couleurs de tableau',
      fields: [
        { key: 'tableHeader', label: 'En-tête de tableau', description: 'Fond des en-têtes' },
        { key: 'tableHeaderText', label: 'Texte en-tête tableau', description: 'Couleur du texte des en-têtes' },
        { key: 'tableRow', label: 'Lignes de tableau', description: 'Fond des lignes normales' },
        { key: 'tableRowAlt', label: 'Lignes alternées', description: 'Fond des lignes alternées' },
        { key: 'tableBorder', label: 'Bordures de tableau', description: 'Couleur des bordures' }
      ]
    },
    {
      title: 'Couleurs des badges',
      fields: [
        { key: 'badgeUnique', label: 'Badge "Unique"', description: 'Fond du badge unique' },
        { key: 'badgeMensuel', label: 'Badge "Mensuel"', description: 'Fond du badge mensuel' },
        { key: 'badgeAgent', label: 'Badge "Agent"', description: 'Fond du badge agent' },
        { key: 'badgeText', label: 'Texte des badges', description: 'Couleur du texte des badges' }
      ]
    },
    {
      title: 'Couleurs des totaux',
      fields: [
        { key: 'totalCardBorder', label: 'Bordure cartes totaux', description: 'Bordure des sections de totaux' },
        { key: 'totalUniqueBackground', label: 'Fond total unique', description: 'Arrière-plan section unique' },
        { key: 'totalMensuelBackground', label: 'Fond total mensuel', description: 'Arrière-plan section mensuel' },
        { key: 'grandTotalBorder', label: 'Bordure total général', description: 'Bordure du total général' }
      ]
    },
    {
      title: 'Bordures et séparateurs',
      fields: [
        { key: 'borderPrimary', label: 'Bordure principale', description: 'Bordures importantes' },
        { key: 'borderSecondary', label: 'Bordure secondaire', description: 'Bordures de séparation' },
        { key: 'separatorColor', label: 'Séparateurs', description: 'Lignes de séparation' }
      ]
    },
    {
      title: 'Couleurs de la lettre',
      fields: [
        { key: 'letterHeaderColor', label: 'En-tête lettre', description: 'Nom de l\'entreprise dans la lettre' },
        { key: 'letterDateColor', label: 'Date de la lettre', description: 'Couleur de la date' },
        { key: 'letterSubjectColor', label: 'Objet de la lettre', description: 'Couleur de l\'objet' },
        { key: 'letterSignatureColor', label: 'Signature', description: 'Couleur de la signature' }
      ]
    },
    {
      title: 'Couleurs des signatures',
      fields: [
        { key: 'signatureBoxBorder', label: 'Bordure encart signature', description: 'Bordure des encarts de signature' },
        { key: 'signatureBoxBackground', label: 'Fond encart signature', description: 'Arrière-plan des encarts' },
        { key: 'signatureTitleColor', label: 'Titre signature', description: 'Couleur des titres d\'encart' },
        { key: 'signatureTextColor', label: 'Texte signature', description: 'Couleur du texte descriptif' }
      ]
    }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-primary" />
          <span>Personnalisation complète des couleurs PDF</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Contrôlez chaque couleur du document PDF pour une personnalisation totale (format hexadécimal)
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {colorSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h4 className="font-semibold text-lg mb-4 text-primary">{section.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
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
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            {sectionIndex < colorSections.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
        
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h4 className="font-medium mb-4">Aperçu des couleurs</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {colorSections.flatMap(section => section.fields).map((field) => (
              <div key={field.key} className="text-center">
                <div 
                  className="w-10 h-10 rounded-lg border-2 border-white shadow-sm mx-auto mb-2"
                  style={{ backgroundColor: settings.templateColors?.[field.key as keyof typeof settings.templateColors] || '#000000' }}
                  title={field.label}
                />
                <span className="text-xs text-muted-foreground block leading-tight">
                  {field.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateColors;