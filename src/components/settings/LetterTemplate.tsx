import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const LetterTemplate = () => {
  const { settings, updateSettings } = useSettings();

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

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Lettre de présentation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations vendeur/entreprise */}
        <div>
          <h4 className="font-medium mb-3 text-primary">Informations de votre entreprise</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nom de l'entreprise</Label>
              <Input
                id="company-name"
                value={settings.letterTemplate?.companyName || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('companyName', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Votre Entreprise SA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nom du contact</Label>
              <Input
                id="contact-name"
                value={settings.letterTemplate?.contactName || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('contactName', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-title">Fonction</Label>
              <Input
                id="contact-title"
                value={settings.letterTemplate?.contactTitle || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('contactTitle', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Responsable commercial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Téléphone</Label>
              <Input
                id="contact-phone"
                value={settings.letterTemplate?.contactPhone || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('contactPhone', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="+41 21 XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={settings.letterTemplate?.contactEmail || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('contactEmail', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="contact@votre-entreprise.ch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Adresse de l'entreprise</Label>
              <Input
                id="company-address"
                value={settings.letterTemplate?.companyAddress || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('companyAddress', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
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
                  id="letter-subject"
                  value={settings.letterTemplate?.subject || ''}
                  onChange={(e) => {
                    const target = e.target;
                    const cursorPosition = target.selectionStart;
                    handleUpdateLetter('subject', e.target.value);
                    setTimeout(() => {
                      target.setSelectionRange(cursorPosition, cursorPosition);
                    }, 0);
                  }}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="civility-select">Civilité</Label>
              <select
                id="civility-select"
                value={settings.letterTemplate?.civility || 'Monsieur'}
                onChange={(e) => handleUpdateLetter('civility', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Monsieur">Monsieur</option>
                <option value="Madame">Madame</option>
              </select>
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
                id="letter-opening"
                value={settings.letterTemplate?.opening || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('opening', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Suite à votre demande, nous avons le plaisir de vous adresser notre proposition commerciale..."
                rows={4}
              />
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
                id="letter-body"
                value={settings.letterTemplate?.body || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('body', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Notre entreprise, spécialisée dans les solutions de sécurité technique, vous propose une offre adaptée à vos besoins spécifiques.&#10;&#10;Vous trouverez ci-joint notre devis détaillé comprenant..."
                rows={6}
              />
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
                id="letter-closing"
                value={settings.letterTemplate?.closing || ''}
                onChange={(e) => {
                  const target = e.target;
                  const cursorPosition = target.selectionStart;
                  handleUpdateLetter('closing', e.target.value);
                  setTimeout(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  }, 0);
                }}
                placeholder="Nous restons à votre disposition pour tout complément d'information et espérons que notre proposition retiendra votre attention.&#10;&#10;Dans l'attente de votre retour, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <h4 className="font-medium mb-3 text-primary">Options de mise en forme</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="text-alignment">Alignement du texte</Label>
              <select
                id="text-alignment"
                value={settings.letterTemplate?.textAlignment || 'left'}
                onChange={(e) => handleUpdateLetter('textAlignment', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="left">À gauche</option>
                <option value="center">Centré</option>
                <option value="right">À droite</option>
                <option value="justify">Justifié</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-letter"
              checked={settings.letterTemplate?.enabled || false}
              onChange={(e) => handleUpdateLetter('enabled', e.target.checked.toString())}
              className="rounded"
            />
            <Label htmlFor="include-letter">Inclure la lettre de présentation avant le devis</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LetterTemplate;