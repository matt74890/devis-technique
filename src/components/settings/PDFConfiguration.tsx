import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, EyeOff, Plus, Trash2, Move } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PDFField, PDFSection } from '@/types';

const PDFConfiguration = () => {
  const { settings, updatePDFConfig } = useStore();

  const updateSection = (sectionKey: keyof typeof settings.pdfConfig.sections, updates: Partial<PDFSection>) => {
    const updatedConfig = {
      ...settings.pdfConfig,
      sections: {
        ...settings.pdfConfig.sections,
        [sectionKey]: {
          ...settings.pdfConfig.sections[sectionKey],
          ...updates
        }
      }
    };
    updatePDFConfig(updatedConfig);
  };

  const updateField = (sectionKey: keyof typeof settings.pdfConfig.sections, fieldId: string, updates: Partial<PDFField>) => {
    const section = settings.pdfConfig.sections[sectionKey];
    const updatedFields = section.fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    
    updateSection(sectionKey, { fields: updatedFields });
  };

  const addField = (sectionKey: keyof typeof settings.pdfConfig.sections) => {
    const section = settings.pdfConfig.sections[sectionKey];
    const newField: PDFField = {
      id: crypto.randomUUID(),
      label: 'Nouveau champ',
      enabled: true,
      text: '',
      order: section.fields.length
    };
    
    updateSection(sectionKey, { 
      fields: [...section.fields, newField] 
    });
  };

  const removeField = (sectionKey: keyof typeof settings.pdfConfig.sections, fieldId: string) => {
    const section = settings.pdfConfig.sections[sectionKey];
    const updatedFields = section.fields.filter(field => field.id !== fieldId);
    
    updateSection(sectionKey, { fields: updatedFields });
  };

  const moveField = (sectionKey: keyof typeof settings.pdfConfig.sections, fieldId: string, direction: 'up' | 'down') => {
    const section = settings.pdfConfig.sections[sectionKey];
    const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
    
    if (
      (direction === 'up' && fieldIndex === 0) ||
      (direction === 'down' && fieldIndex === section.fields.length - 1)
    ) return;

    const newFields = [...section.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
    
    updateSection(sectionKey, { fields: newFields });
  };

  const sectionLabels = {
    header: 'En-tête PDF',
    clientInfo: 'Informations Client',
    itemsTable: 'Tableau des Articles',
    totals: 'Totaux et Calculs',
    comments: 'Commentaires',
    footer: 'Pied de page'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Configuration PDF Complète</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Personnalisez entièrement votre PDF en activant/désactivant et modifiant chaque section et champ.
          </p>
        </CardContent>
      </Card>

      {/* Sections PDF */}
      {Object.entries(settings.pdfConfig.sections).map(([sectionKey, section]) => (
        <Card key={sectionKey} className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {sectionLabels[sectionKey as keyof typeof sectionLabels]}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={section.enabled}
                  onCheckedChange={(checked) => updateSection(sectionKey as keyof typeof settings.pdfConfig.sections, { enabled: checked })}
                />
                <Label className="text-sm">
                  {section.enabled ? 'Activé' : 'Désactivé'}
                </Label>
              </div>
            </div>
          </CardHeader>
          
          {section.enabled && (
            <CardContent className="space-y-4">
              {/* Titre de section personnalisable */}
              {section.title !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor={`${sectionKey}-title`}>Titre de la section</Label>
                  <Input
                    id={`${sectionKey}-title`}
                    value={section.title}
                    onChange={(e) => updateSection(sectionKey as keyof typeof settings.pdfConfig.sections, { title: e.target.value })}
                    placeholder="Titre personnalisé"
                  />
                </div>
              )}

              {/* Contenu global de section */}
              {section.content !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor={`${sectionKey}-content`}>Contenu de la section</Label>
                  <Textarea
                    id={`${sectionKey}-content`}
                    value={section.content}
                    onChange={(e) => updateSection(sectionKey as keyof typeof settings.pdfConfig.sections, { content: e.target.value })}
                    placeholder="Contenu personnalisé"
                    rows={3}
                  />
                </div>
              )}

              <Separator />

              {/* Champs de la section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Champs de la section</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addField(sectionKey as keyof typeof settings.pdfConfig.sections)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un champ
                  </Button>
                </div>

                {section.fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div className="space-y-2">
                        <Label htmlFor={`${field.id}-label`}>Libellé</Label>
                        <Input
                          id={`${field.id}-label`}
                          value={field.label}
                          onChange={(e) => updateField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id, { label: e.target.value })}
                          placeholder="Libellé du champ"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`${field.id}-text`}>Texte/Contenu</Label>
                        <Textarea
                          id={`${field.id}-text`}
                          value={field.text}
                          onChange={(e) => updateField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id, { text: e.target.value })}
                          placeholder="Contenu du champ"
                          rows={2}
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.enabled}
                            onCheckedChange={(checked) => updateField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id, { enabled: checked })}
                          />
                          <Badge variant={field.enabled ? "default" : "secondary"}>
                            {field.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Badge>
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id, 'down')}
                            disabled={index === section.fields.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(sectionKey as keyof typeof settings.pdfConfig.sections, field.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {section.fields.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucun champ dans cette section. Cliquez sur "Ajouter un champ" pour commencer.
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Textes personnalisés */}
      <Card>
        <CardHeader>
          <CardTitle>Textes Personnalisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(settings.pdfConfig.customTexts).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                <Textarea
                  id={key}
                  value={value}
                  onChange={(e) => {
                    const updatedTexts = {
                      ...settings.pdfConfig.customTexts,
                      [key]: e.target.value
                    };
                    updatePDFConfig({
                      ...settings.pdfConfig,
                      customTexts: updatedTexts
                    });
                  }}
                  placeholder={`Texte personnalisé pour ${key}`}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFConfiguration;