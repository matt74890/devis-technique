import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Users } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { AgentServiceCategory } from '@/types';

const AgentQuoteSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [newCategory, setNewCategory] = useState<Partial<AgentServiceCategory>>({
    name: '',
    description: ''
  });
  const [newHoliday, setNewHoliday] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('GE');

  const cantons = ['GE', 'VD', 'VS', 'FR', 'NE', 'JU', 'BE', 'SO', 'BL', 'BS', 'AG', 'LU', 'OW', 'NW', 'UR', 'SZ', 'GL', 'ZG', 'ZH', 'SH', 'AR', 'AI', 'SG', 'GR', 'TG', 'TI'];

  const handleAddCategory = () => {
    if (!newCategory.name) return;
    
    const category: AgentServiceCategory = {
      id: crypto.randomUUID(),
      name: newCategory.name,
      description: newCategory.description || ''
    };

    const currentCategories = settings.agentSettings?.serviceCategories || [];
    updateSettings({
      agentSettings: {
        ...settings.agentSettings,
        serviceCategories: [...currentCategories, category]
      }
    });

    setNewCategory({ name: '', description: '' });
  };

  const handleDeleteCategory = (id: string) => {
    const currentCategories = settings.agentSettings?.serviceCategories || [];
    updateSettings({
      agentSettings: {
        ...settings.agentSettings,
        serviceCategories: currentCategories.filter(cat => cat.id !== id)
      }
    });
  };

  const handleAddHoliday = () => {
    if (!newHoliday || !selectedCanton) return;
    
    const currentHolidays = settings.agentSettings?.holidays || {};
    const cantonHolidays = currentHolidays[selectedCanton] || [];
    
    updateSettings({
      agentSettings: {
        ...settings.agentSettings,
        holidays: {
          ...currentHolidays,
          [selectedCanton]: [...cantonHolidays, newHoliday]
        }
      }
    });

    setNewHoliday('');
  };

  const handleDeleteHoliday = (canton: string, holiday: string) => {
    const currentHolidays = settings.agentSettings?.holidays || {};
    const cantonHolidays = currentHolidays[canton] || [];
    
    updateSettings({
      agentSettings: {
        ...settings.agentSettings,
        holidays: {
          ...currentHolidays,
          [canton]: cantonHolidays.filter(h => h !== holiday)
        }
      }
    });
  };

  const updateAgentLetterTemplate = (field: string, value: any) => {
    updateSettings({
      agentQuoteSettings: {
        ...settings.agentQuoteSettings,
        letterTemplate: {
          ...settings.agentQuoteSettings?.letterTemplate,
          [field]: value
        }
      }
    });
  };

  const currentCategories = settings.agentSettings?.serviceCategories || [];
  const currentHolidays = settings.agentSettings?.holidays || {};
  const agentLetterTemplate = settings.agentQuoteSettings?.letterTemplate;

  return (
    <div className="space-y-6">
      {/* Catégories de prestations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Catégories de prestations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
            <Input
              placeholder="Nom de la catégorie"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <Button onClick={handleAddCategory} className="bg-success hover:bg-success/90">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jours fériés par canton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Jours fériés par canton</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cantons.map(canton => (
            <div key={canton} className="space-y-2">
              <Label className="text-sm font-medium">{canton}</Label>
              <div className="flex flex-wrap gap-2">
                {(currentHolidays[canton] || []).map((holiday, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{holiday}</span>
                    <button
                      onClick={() => handleDeleteHoliday(canton, holiday)}
                      className="ml-1 text-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted rounded-lg">
            <select
              value={selectedCanton}
              onChange={(e) => setSelectedCanton(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {cantons.map(canton => (
                <option key={canton} value={canton}>{canton}</option>
              ))}
            </select>
            <Input
              type="date"
              placeholder="Date du jour férié"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
            />
            <Button onClick={handleAddHoliday} className="bg-success hover:bg-success/90">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lettre de présentation spéciale pour devis agent */}
      <Card>
        <CardHeader>
          <CardTitle>Lettre de présentation - Devis Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-subject">Objet</Label>
            <Input
              id="agent-subject"
              value={agentLetterTemplate?.subject || 'Proposition commerciale - Services de sécurité'}
              onChange={(e) => updateAgentLetterTemplate('subject', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-opening">Formule d'ouverture</Label>
            <Textarea
              id="agent-opening"
              value={agentLetterTemplate?.opening || 'Suite à votre demande, nous avons le plaisir de vous adresser notre proposition pour des services de sécurité.'}
              onChange={(e) => updateAgentLetterTemplate('opening', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-body">Corps de la lettre</Label>
            <Textarea
              id="agent-body"
              value={agentLetterTemplate?.body || 'Notre entreprise, spécialisée dans les services de sécurité, vous propose une solution adaptée à vos besoins spécifiques.\n\nNous mettons à votre disposition des agents qualifiés et formés selon les standards les plus élevés de la profession.'}
              onChange={(e) => updateAgentLetterTemplate('body', e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-closing">Formule de clôture</Label>
            <Textarea
              id="agent-closing"
              value={agentLetterTemplate?.closing || 'Nous restons à votre disposition pour tout complément d\'information et espérons que notre proposition retiendra votre attention.'}
              onChange={(e) => updateAgentLetterTemplate('closing', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentQuoteSettings;