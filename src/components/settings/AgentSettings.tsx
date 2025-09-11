import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shield, Calendar, FileText, Palette } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

const AgentSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [newCategory, setNewCategory] = useState('');
  const [newHoliday, setNewHoliday] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('GE');

  const cantons = ['AG', 'AR', 'AI', 'BL', 'BS', 'BE', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SZ', 'SO', 'TG', 'TI', 'UR', 'VS', 'VD', 'ZG', 'ZH'];

  const defaultCategories = [
    'Sécurité',
    'Sécurité armée', 
    'Maître-chien',
    'Patrouilleur',
    'Garde du corps',
    'Autre'
  ];

  const addServiceCategory = () => {
    if (!newCategory.trim() || settings.agentSettings.serviceCategories.includes(newCategory.trim())) return;
    
    const updatedSettings = {
      ...settings,
      agentSettings: {
        ...settings.agentSettings,
        serviceCategories: [...settings.agentSettings.serviceCategories, newCategory.trim()]
      }
    };
    updateSettings(updatedSettings);
    setNewCategory('');
  };

  const removeServiceCategory = (category: string) => {
    const updatedSettings = {
      ...settings,
      agentSettings: {
        ...settings.agentSettings,
        serviceCategories: settings.agentSettings.serviceCategories.filter(c => c !== category)
      }
    };
    updateSettings(updatedSettings);
  };

  const addHoliday = () => {
    if (!newHoliday.trim()) return;
    
    const currentHolidays = settings.agentSettings.holidays[selectedCanton] || [];
    if (currentHolidays.includes(newHoliday.trim())) return;
    
    const updatedSettings = {
      ...settings,
      agentSettings: {
        ...settings.agentSettings,
        holidays: {
          ...settings.agentSettings.holidays,
          [selectedCanton]: [...currentHolidays, newHoliday.trim()]
        }
      }
    };
    updateSettings(updatedSettings);
    setNewHoliday('');
  };

  const removeHoliday = (canton: string, holiday: string) => {
    const updatedSettings = {
      ...settings,
      agentSettings: {
        ...settings.agentSettings,
        holidays: {
          ...settings.agentSettings.holidays,
          [canton]: settings.agentSettings.holidays[canton]?.filter(h => h !== holiday) || []
        }
      }
    };
    updateSettings(updatedSettings);
  };

  const updateAgentLetterTemplate = (field: string, value: any) => {
    const updatedSettings = {
      ...settings,
      agentSettings: {
        ...settings.agentSettings,
        agentLetterTemplate: {
          ...settings.agentSettings.agentLetterTemplate,
          [field]: value
        }
      }
    };
    updateSettings(updatedSettings);
  };

  // Initialiser les catégories si vide
  const serviceCategories = settings.agentSettings.serviceCategories?.length > 0 
    ? settings.agentSettings.serviceCategories 
    : defaultCategories;

  return (
    <div className="space-y-6">
      {/* Catégories de prestations */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Catégories de prestations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map((category) => (
              <Badge key={category} variant="outline" className="text-sm p-2">
                {category}
                {!defaultCategories.includes(category) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => removeServiceCategory(category)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Nouvelle catégorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addServiceCategory()}
            />
            <Button onClick={addServiceCategory} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jours fériés par canton */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Jours fériés par canton</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <Select value={selectedCanton} onValueChange={setSelectedCanton}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cantons.map((canton) => (
                  <SelectItem key={canton} value={canton}>{canton}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nom du jour férié (ex: 1er Janvier)"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHoliday()}
              className="flex-1"
            />
            <Button onClick={addHoliday} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cantons.map((canton) => (
              <div key={canton} className="space-y-2">
                <h4 className="font-medium text-sm">{canton}</h4>
                <div className="space-y-1">
                  {(settings.agentSettings.holidays[canton] || []).map((holiday) => (
                    <div key={holiday} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                      <span>{holiday}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => removeHoliday(canton, holiday)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {!(settings.agentSettings.holidays[canton]?.length > 0) && (
                    <div className="text-xs text-gray-400 italic">Aucun jour férié défini</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note de majoration personnalisable */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Note explicative des majorations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="majorationNote">Texte affiché dans le PDF/Word</Label>
            <Textarea
              id="majorationNote"
              value={settings.agentSettings.majorationNote || ''}
              onChange={(e) => {
                const updatedSettings = {
                  ...settings,
                  agentSettings: {
                    ...settings.agentSettings,
                    majorationNote: e.target.value
                  }
                };
                updateSettings(updatedSettings);
              }}
              placeholder={`Les heures entre ${settings.agentSettings?.nightStartTime || '23:00'} et ${settings.agentSettings?.nightEndTime || '06:00'} ainsi que les dimanches et jours fériés sont majorées de ${settings.agentSettings?.nightMarkupPct || 10}%.`}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Ce texte sera affiché dans le PDF et Word pour expliquer les règles de majoration.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Couleur du tableau agent */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-primary" />
            <span>Couleur du tableau agent</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentTableColor">Couleur du tableau des totaux agents</Label>
            <Input
              id="agentTableColor"
              type="color"
              value={settings.templateColors?.agentTableColor || '#f59e0b'}
              onChange={(e) => {
                const updatedSettings = {
                  ...settings,
                  templateColors: {
                    ...settings.templateColors,
                    agentTableColor: e.target.value
                  }
                };
                updateSettings(updatedSettings);
              }}
            />
            <p className="text-sm text-gray-500">
              Cette couleur sera utilisée pour les bordures et titres du tableau des totaux agents dans le PDF.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lettre de présentation Agent */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Lettre de présentation spécifique "Devis Agent"</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentLetterEnabled">Activer la lettre agent</Label>
              <Switch
                id="agentLetterEnabled"
                checked={settings.agentSettings.agentLetterTemplate?.enabled || false}
                onCheckedChange={(checked) => updateAgentLetterTemplate('enabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentLetterSubject">Objet</Label>
              <Input
                id="agentLetterSubject"
                value={settings.agentSettings.agentLetterTemplate?.subject || ''}
                onChange={(e) => updateAgentLetterTemplate('subject', e.target.value)}
                placeholder="Devis pour prestations de sécurité"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentLetterOpening">Introduction</Label>
            <Textarea
              id="agentLetterOpening"
              value={settings.agentSettings.agentLetterTemplate?.opening || ''}
              onChange={(e) => updateAgentLetterTemplate('opening', e.target.value)}
              placeholder="Nous avons le plaisir de vous adresser notre offre pour..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentLetterBody">Corps du message</Label>
            <Textarea
              id="agentLetterBody"
              value={settings.agentSettings.agentLetterTemplate?.body || ''}
              onChange={(e) => updateAgentLetterTemplate('body', e.target.value)}
              placeholder="Notre équipe d'agents de sécurité qualifiés..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentLetterClosing">Conclusion</Label>
            <Textarea
              id="agentLetterClosing"
              value={settings.agentSettings.agentLetterTemplate?.closing || ''}
              onChange={(e) => updateAgentLetterTemplate('closing', e.target.value)}
              placeholder="Nous restons à votre disposition pour tout renseignement complémentaire..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentSettings;