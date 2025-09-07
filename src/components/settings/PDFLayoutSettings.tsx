import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Layout, Ruler } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const PDFLayoutSettings = () => {
  const { settings, updateSettings } = useSettings();

  const handleUpdateLayout = (section: string, property: string, value: string) => {
    updateSettings({
      pdfLayout: {
        ...settings.pdfLayout,
        [section]: {
          ...settings.pdfLayout?.[section],
          [property]: value
        }
      }
    });
  };

  const layoutSections = [
    {
      title: 'Logo',
      key: 'logo',
      fields: [
        { key: 'height', label: 'Hauteur (px)', placeholder: '32' },
        { key: 'marginBottom', label: 'Marge bas (px)', placeholder: '3' },
        { key: 'marginTop', label: 'Marge haut (px)', placeholder: '0' }
      ]
    },
    {
      title: 'En-tête du devis',
      key: 'header',
      fields: [
        { key: 'marginBottom', label: 'Marge bas (px)', placeholder: '8' },
        { key: 'fontSize', label: 'Taille police (px)', placeholder: '11' },
        { key: 'lineHeight', label: 'Hauteur ligne', placeholder: '1.2' }
      ]
    },
    {
      title: 'Titre principal',
      key: 'title',
      fields: [
        { key: 'fontSize', label: 'Taille police (px)', placeholder: '16' },
        { key: 'padding', label: 'Padding (px)', placeholder: '4' },
        { key: 'margin', label: 'Marge (px)', placeholder: '4' }
      ]
    },
    {
      title: 'Tableau des produits',
      key: 'table',
      fields: [
        { key: 'headerFontSize', label: 'Police en-tête (px)', placeholder: '9' },
        { key: 'cellFontSize', label: 'Police cellules (px)', placeholder: '9' },
        { key: 'headerPadding', label: 'Padding en-tête (px)', placeholder: '3' },
        { key: 'cellPadding', label: 'Padding cellules (px)', placeholder: '2' },
        { key: 'margin', label: 'Marge (px)', placeholder: '4' }
      ]
    },
    {
      title: 'Section totaux',
      key: 'totals',
      fields: [
        { key: 'fontSize', label: 'Taille police (px)', placeholder: '10' },
        { key: 'padding', label: 'Padding cartes (px)', placeholder: '4' },
        { key: 'gap', label: 'Espacement (px)', placeholder: '4' },
        { key: 'margin', label: 'Marge (px)', placeholder: '4' }
      ]
    },
    {
      title: 'Total général',
      key: 'grandTotal',
      fields: [
        { key: 'fontSize', label: 'Taille police (px)', placeholder: '11' },
        { key: 'padding', label: 'Padding (px)', placeholder: '6' },
        { key: 'margin', label: 'Marge (px)', placeholder: '6' },
        { key: 'borderWidth', label: 'Épaisseur bordure (px)', placeholder: '2' }
      ]
    },
    {
      title: 'Signatures',
      key: 'signatures',
      fields: [
        { key: 'titleFontSize', label: 'Police titre (px)', placeholder: '13' },
        { key: 'contentFontSize', label: 'Police contenu (px)', placeholder: '10' },
        { key: 'lineFontSize', label: 'Police ligne (px)', placeholder: '9' },
        { key: 'padding', label: 'Padding boîtes (px)', placeholder: '6' },
        { key: 'gap', label: 'Espacement (px)', placeholder: '10' },
        { key: 'margin', label: 'Marge (px)', placeholder: '8' },
        { key: 'minHeight', label: 'Hauteur min (px)', placeholder: '45' },
        { key: 'lineMarginTop', label: 'Marge ligne (px)', placeholder: '15' }
      ]
    },
    {
      title: 'Lettre de présentation',
      key: 'letter',
      fields: [
        { key: 'headerFontSize', label: 'Police en-tête (px)', placeholder: '18' },
        { key: 'dateFontSize', label: 'Police date (px)', placeholder: '12' },
        { key: 'subjectFontSize', label: 'Police objet (px)', placeholder: '12' },
        { key: 'contentFontSize', label: 'Police contenu (px)', placeholder: '11' },
        { key: 'subjectMarginTop', label: 'Marge objet (px)', placeholder: '30' },
        { key: 'contentMargin', label: 'Marge contenu (px)', placeholder: '10' },
        { key: 'lineHeight', label: 'Hauteur ligne', placeholder: '1.4' }
      ]
    }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Layout className="h-5 w-5 text-primary" />
          <span>Configuration de mise en page PDF</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les dimensions et espacements de chaque élément du PDF
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {layoutSections.map((section, sectionIndex) => (
          <div key={section.key}>
            <div className="flex items-center space-x-2 mb-4">
              <Ruler className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-primary">{section.title}</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`${section.key}-${field.key}`}>
                    {field.label}
                  </Label>
                  <Input
                    id={`${section.key}-${field.key}`}
                    value={settings.pdfLayout?.[section.key]?.[field.key] || ''}
                    onChange={(e) => {
                      const target = e.target;
                      const cursorPosition = target.selectionStart;
                      handleUpdateLayout(section.key, field.key, e.target.value);
                      setTimeout(() => {
                        target.setSelectionRange(cursorPosition, cursorPosition);
                      }, 0);
                    }}
                    placeholder={field.placeholder}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
            
            {sectionIndex < layoutSections.length - 1 && (
              <Separator className="mt-6" />
            )}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2 text-primary">Information</h5>
          <p className="text-sm text-muted-foreground">
            Les valeurs par défaut sont optimisées pour tenir sur une page A4. 
            Ajustez avec précaution pour éviter les débordements de page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFLayoutSettings;