import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Users, Hash, Copy, Settings } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useState, useRef } from 'react';
import type { PlaceholderType, CustomLetterTemplate } from '@/types';
import CustomTemplateManager from './CustomTemplateManager';

interface LetterTemplateType {
  id: string;
  name: string;
  enabled: boolean;
  companyName: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  companyAddress: string;
  subject: string;
  civility: string; // Changé pour permettre les placeholders
  opening: string;
  body: string;
  closing: string;
  textAlignment: 'left' | 'center' | 'right' | 'justify';
  boldOptions: {
    subject: boolean;
    opening: boolean;
    body: boolean;
    closing: boolean;
  };
  placeholders: {
    enabled: boolean;
    availablePlaceholders: PlaceholderType[];
  };
}

const LetterTemplate = () => {
  const { settings, updateSettings } = useSettings();

  // Placeholders disponibles
  const availablePlaceholders: PlaceholderType[] = [
    {
      id: '{{CLIENT_PRENOM}}',
      label: 'Prénom du client',
      description: 'Insère le prénom du client',
      example: 'Jean'
    },
    {
      id: '{{CLIENT_NOM}}',
      label: 'Nom du client',
      description: 'Insère le nom de famille du client',
      example: 'Dupont'
    },
    {
      id: '{{CLIENT_NOM_COMPLET}}',
      label: 'Nom complet',
      description: 'Insère le prénom et nom du client',
      example: 'Jean Dupont'
    },
    {
      id: '{{CLIENT_CIVILITE}}',
      label: 'Civilité',
      description: 'Insère Monsieur ou Madame',
      example: 'Monsieur'
    },
    {
      id: '{{CLIENT_ENTREPRISE}}',
      label: 'Entreprise',
      description: 'Insère le nom de l\'entreprise du client',
      example: 'ABC Sécurité SA'
    }
  ];

  // Templates prédéfinis
  const predefinedTemplates: LetterTemplateType[] = [
    {
      id: 'default',
      name: 'Lettre standard',
      enabled: settings.letterTemplate?.enabled || false,
      companyName: settings.letterTemplate?.companyName || '',
      contactName: settings.letterTemplate?.contactName || '',
      contactTitle: settings.letterTemplate?.contactTitle || '',
      contactPhone: settings.letterTemplate?.contactPhone || '',
      contactEmail: settings.letterTemplate?.contactEmail || '',
      companyAddress: settings.letterTemplate?.companyAddress || '',
      subject: settings.letterTemplate?.subject || 'Proposition commerciale - Sécurité technique',
      civility: '{{CLIENT_CIVILITE}}',
      opening: settings.letterTemplate?.opening || 'Suite à votre demande, {{CLIENT_CIVILITE}} {{CLIENT_NOM_COMPLET}}, nous avons le plaisir de vous adresser notre proposition commerciale...',
      body: settings.letterTemplate?.body || 'Notre entreprise, spécialisée dans les solutions de sécurité technique, vous propose une offre adaptée à vos besoins spécifiques de {{CLIENT_ENTREPRISE}}.\n\nVous trouverez ci-joint notre devis détaillé comprenant...',
      closing: settings.letterTemplate?.closing || 'Nous restons à votre disposition pour tout complément d\'information et espérons que notre proposition retiendra votre attention.\n\nDans l\'attente de votre retour, nous vous prions d\'agréer, {{CLIENT_CIVILITE}} {{CLIENT_NOM}}, l\'expression de nos salutations distinguées.',
      textAlignment: settings.letterTemplate?.textAlignment || 'left',
      boldOptions: settings.letterTemplate?.boldOptions || {
        subject: false,
        opening: false,
        body: false,
        closing: false,
      },
      placeholders: {
        enabled: true,
        availablePlaceholders
      }
    },
    {
      id: 'agent',
      name: 'Présentation agent',
      enabled: false,
      companyName: settings.letterTemplate?.companyName || '',
      contactName: settings.letterTemplate?.contactName || '',
      contactTitle: settings.letterTemplate?.contactTitle || '',
      contactPhone: settings.letterTemplate?.contactPhone || '',
      contactEmail: settings.letterTemplate?.contactEmail || '',
      companyAddress: settings.letterTemplate?.companyAddress || '',
      subject: 'Présentation de nos services d\'agents de sécurité',
      civility: 'Monsieur',
      opening: 'Suite à votre demande concernant nos services d\'agents de sécurité, {{CLIENT_CIVILITE}} {{CLIENT_NOM_COMPLET}}, nous avons l\'honneur de vous présenter notre équipe qualifiée.',
      body: 'Notre société dispose d\'agents de sécurité expérimentés et certifiés pour {{CLIENT_ENTREPRISE}}, formés aux dernières techniques de surveillance et d\'intervention.\n\nNos agents sont:\n• Certifiés selon les normes en vigueur\n• Formés régulièrement aux nouvelles technologies\n• Disponibles 24h/24 et 7j/7\n• Équipés de matériel de communication moderne\n\nVous trouverez ci-joint notre proposition tarifaire détaillée.',
      closing: 'Nous sommes convaincus que nos agents sauront répondre à vos exigences de sécurité les plus strictes.\n\nNous demeurons à votre entière disposition pour toute information complémentaire et vous prions d\'agréer, {{CLIENT_CIVILITE}} {{CLIENT_NOM}}, nos salutations les plus respectueuses.',
      textAlignment: 'left',
      boldOptions: {
        subject: false,
        opening: false,
        body: false,
        closing: false,
      },
      placeholders: {
        enabled: true,
        availablePlaceholders
      }
    }
  ];

  // Templates prédéfinis + personnalisés
  const allTemplates: (LetterTemplateType & { isCustom?: boolean })[] = [
    ...predefinedTemplates,
    ...(settings.customLetterTemplates || []).map((customTemplate): LetterTemplateType & { isCustom: boolean } => ({
      id: customTemplate.id,
      name: customTemplate.name,
      isCustom: true,
      enabled: settings.letterTemplate?.enabled || false,
      ...customTemplate.template,
    })),
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    settings.letterTemplate?.templateId || 'default'
  );
  const [activeTab, setActiveTab] = useState('selection');
  
  // Refs pour insérer les placeholders dans les bons champs
  const subjectRef = useRef<HTMLInputElement>(null);
  const openingRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const closingRef = useRef<HTMLTextAreaElement>(null);
  const civilityRef = useRef<HTMLInputElement>(null);

  const handleSelectTemplate = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    setSelectedTemplate(templateId);
    updateSettings({
      letterTemplate: {
        ...template,
        templateId: templateId,
        enabled: settings.letterTemplate?.enabled || false,
        // Preserve company info from current settings
        companyName: settings.letterTemplate?.companyName || template.companyName,
        contactName: settings.letterTemplate?.contactName || template.contactName,
        contactTitle: settings.letterTemplate?.contactTitle || template.contactTitle,
        contactPhone: settings.letterTemplate?.contactPhone || template.contactPhone,
        contactEmail: settings.letterTemplate?.contactEmail || template.contactEmail,
        companyAddress: settings.letterTemplate?.companyAddress || template.companyAddress,
      }
    });
  };

  const handleUpdateLetter = (field: string, value: string | boolean, preserveCursor?: boolean) => {
    updateSettings({
      letterTemplate: {
        ...settings.letterTemplate,
        [field]: value
      }
    });
  };

  const handleUpdateBoldOption = (field: string, value: boolean) => {
    updateSettings({
      letterTemplate: {
        ...settings.letterTemplate,
        boldOptions: {
          ...settings.letterTemplate?.boldOptions,
          [field]: value
        }
      }
    });
  };

  // Fonction pour insérer un placeholder dans un champ spécifique
  const insertPlaceholder = (placeholder: string, fieldRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => {
    const element = fieldRef.current;
    if (!element) return;

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = settings.letterTemplate?.[fieldName as keyof typeof settings.letterTemplate] as string || '';
    
    const newValue = currentValue.slice(0, start) + placeholder + currentValue.slice(end);
    
    handleUpdateLetter(fieldName, newValue);
    
    // Restaurer la position du curseur après le placeholder
    setTimeout(() => {
      if (element) {
        element.focus();
        element.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }
    }, 0);
  };

  // Composant pour afficher les placeholders disponibles
  const PlaceholderPanel = ({ targetField, targetRef }: { targetField: string, targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement> }) => (
    <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-dashed">
      <div className="flex items-center space-x-2 mb-2">
        <Hash className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Placeholders disponibles</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availablePlaceholders.map((placeholder) => (
          <Badge
            key={placeholder.id}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => insertPlaceholder(placeholder.id, targetRef, targetField)}
            title={`${placeholder.description} - Ex: ${placeholder.example}`}
          >
            <Copy className="h-3 w-3 mr-1" />
            {placeholder.label}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Cliquez sur un placeholder pour l'insérer à la position du curseur
      </p>
    </div>
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Lettres de présentation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Templates personnalisés</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
            <div className="space-y-3">
              <Label>Choisir un template de lettre</Label>
              {allTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-accent/50'
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {template.isCustom ? (
                          <Settings className="h-4 w-4 text-primary" />
                        ) : template.id === 'default' ? (
                          <FileText className="h-4 w-4 text-primary" />
                        ) : (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                        <h4 className="font-medium">{template.name}</h4>
                        {template.isCustom && (
                          <Badge variant="secondary" className="text-xs">Personnalisé</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {template.opening}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={selectedTemplate === template.id}
                          onChange={() => handleSelectTemplate(template.id)}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="include-letter"
                checked={settings.letterTemplate?.enabled || false}
                onChange={(e) => handleUpdateLetter('enabled', e.target.checked.toString())}
                className="rounded"
              />
              <Label htmlFor="include-letter">Inclure la lettre de présentation avant le devis</Label>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            {/* Informations vendeur/entreprise */}
            <div>
              <h4 className="font-medium mb-3 text-primary">Informations de votre entreprise</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l'entreprise</Label>
                  <Input
                    id="company-name"
                    value={settings.letterTemplate?.companyName || ''}
                    onChange={(e) => handleUpdateLetter('companyName', e.target.value)}
                    placeholder="Votre Entreprise SA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nom du contact</Label>
                  <Input
                    id="contact-name"
                    value={settings.letterTemplate?.contactName || ''}
                    onChange={(e) => handleUpdateLetter('contactName', e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-title">Fonction</Label>
                  <Input
                    id="contact-title"
                    value={settings.letterTemplate?.contactTitle || ''}
                    onChange={(e) => handleUpdateLetter('contactTitle', e.target.value)}
                    placeholder="Responsable commercial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Téléphone</Label>
                  <Input
                    id="contact-phone"
                    value={settings.letterTemplate?.contactPhone || ''}
                    onChange={(e) => handleUpdateLetter('contactPhone', e.target.value)}
                    placeholder="+41 21 XXX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={settings.letterTemplate?.contactEmail || ''}
                    onChange={(e) => handleUpdateLetter('contactEmail', e.target.value)}
                    placeholder="contact@votre-entreprise.ch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Adresse de l'entreprise</Label>
                  <Input
                    id="company-address"
                    value={settings.letterTemplate?.companyAddress || ''}
                    onChange={(e) => handleUpdateLetter('companyAddress', e.target.value)}
                    placeholder="Rue de l'Exemple 123, 1000 Lausanne"
                  />
                </div>
              </div>
            </div>

            {/* Texte de la lettre */}
            <div>
              <h4 className="font-medium mb-3 text-primary">Contenu de la lettre</h4>
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="letter-subject">Objet de la lettre</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        ref={subjectRef}
                        id="letter-subject"
                        value={settings.letterTemplate?.subject || ''}
                        onChange={(e) => handleUpdateLetter('subject', e.target.value)}
                        placeholder="Proposition commerciale - Sécurité technique"
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id="subject-bold"
                          checked={settings.letterTemplate?.boldOptions?.subject || false}
                          onChange={(e) => handleUpdateBoldOption('subject', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="subject-bold" className="text-sm">Gras</Label>
                      </div>
                    </div>
                    <PlaceholderPanel targetField="subject" targetRef={subjectRef} />
                  </div>
                
                <div className="space-y-2">
                  <Label htmlFor="civility-input">Civilité</Label>
                  <Input
                    ref={civilityRef}
                    id="civility-input"
                    value={settings.letterTemplate?.civility || ''}
                    onChange={(e) => handleUpdateLetter('civility', e.target.value)}
                    placeholder="{{CLIENT_CIVILITE}} ou texte personnalisé"
                  />
                  <PlaceholderPanel targetField="civility" targetRef={civilityRef} />
                </div>
                
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="letter-opening">Formule d'ouverture</Label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id="opening-bold"
                          checked={settings.letterTemplate?.boldOptions?.opening || false}
                          onChange={(e) => handleUpdateBoldOption('opening', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="opening-bold" className="text-sm">Gras</Label>
                      </div>
                    </div>
                    <Textarea
                      ref={openingRef}
                      id="letter-opening"
                      value={settings.letterTemplate?.opening || ''}
                      onChange={(e) => handleUpdateLetter('opening', e.target.value)}
                      placeholder="Suite à votre demande, nous avons le plaisir de vous adresser notre proposition commerciale..."
                      rows={4}
                    />
                    <PlaceholderPanel targetField="opening" targetRef={openingRef} />
                  </div>
                
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="letter-body">Corps du message</Label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id="body-bold"
                          checked={settings.letterTemplate?.boldOptions?.body || false}
                          onChange={(e) => handleUpdateBoldOption('body', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="body-bold" className="text-sm">Gras</Label>
                      </div>
                    </div>
                    <Textarea
                      ref={bodyRef}
                      id="letter-body"
                      value={settings.letterTemplate?.body || ''}
                      onChange={(e) => handleUpdateLetter('body', e.target.value)}
                      placeholder="Notre entreprise, spécialisée dans les solutions de sécurité technique, vous propose une offre adaptée à vos besoins spécifiques.&#10;&#10;Vous trouverez ci-joint notre devis détaillé comprenant..."
                      rows={6}
                    />
                    <PlaceholderPanel targetField="body" targetRef={bodyRef} />
                  </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="letter-closing">Formule de politesse</Label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        id="closing-bold"
                        checked={settings.letterTemplate?.boldOptions?.closing || false}
                        onChange={(e) => handleUpdateBoldOption('closing', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="closing-bold" className="text-sm">Gras</Label>
                    </div>
                  </div>
                   <Textarea
                     ref={closingRef}
                     id="letter-closing"
                     value={settings.letterTemplate?.closing || ''}
                     onChange={(e) => handleUpdateLetter('closing', e.target.value)}
                     placeholder="Nous restons à votre disposition pour tout complément d'information et espérons que notre proposition retiendra votre attention.&#10;&#10;Dans l'attente de votre retour, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées."
                     rows={4}
                   />
                   <PlaceholderPanel targetField="closing" targetRef={closingRef} />
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <h4 className="font-medium mb-3 text-primary">Options de mise en forme</h4>
              <div className="space-y-2">
                <Label htmlFor="text-alignment">Alignement du texte</Label>
                <Select
                  value={settings.letterTemplate?.textAlignment || 'left'}
                  onValueChange={(value) => handleUpdateLetter('textAlignment', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">À gauche</SelectItem>
                    <SelectItem value="center">Centré</SelectItem>
                    <SelectItem value="right">À droite</SelectItem>
                    <SelectItem value="justify">Justifié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom" className="space-y-4">
            <CustomTemplateManager availablePlaceholders={availablePlaceholders} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LetterTemplate;