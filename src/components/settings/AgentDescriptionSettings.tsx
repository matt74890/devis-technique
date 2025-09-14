import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Settings, Trash2, Copy, Edit } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useState } from 'react';
import type { AgentDescription, AgentDescriptionTemplate, AgentDescriptionSection } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

const AgentDescriptionSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [editingTemplate, setEditingTemplate] = useState<AgentDescriptionTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createNewTemplate = () => {
    const newTemplate: AgentDescriptionTemplate = {
      id: `template_${Date.now()}`,
      name: 'Nouveau modèle',
      description: {
        nature: '',
        lieu: '',
        effectif: '',
        dates: '',
        missions: '',
        deplacement: '',
        pause: '',
        duree: '',
        autre: []
      }
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;

    let updatedTemplates = [...(settings.agentDescriptionTemplates || [])];
    
    if (isCreating) {
      updatedTemplates.push(editingTemplate);
    } else {
      updatedTemplates = updatedTemplates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      );
    }

    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });

    setEditingTemplate(null);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = settings.agentDescriptionTemplates.filter(t => t.id !== templateId);
    
    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });
  };

  const setAsDefault = (templateId: string) => {
    const updatedTemplates = settings.agentDescriptionTemplates.map(template => ({
      ...template,
      isDefault: template.id === templateId
    }));
    
    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });
  };

  const duplicateTemplate = (template: AgentDescriptionTemplate) => {
    const newTemplate: AgentDescriptionTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (copie)`,
      isDefault: false
    };
    
    const updatedTemplates = [...settings.agentDescriptionTemplates, newTemplate];
    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });
  };

  const handleUpdateIncludeDescription = (enabled: boolean) => {
    updateSettings({
      agentDescription: {
        ...settings.agentDescription,
        enabled
      }
    });
  };

  // Fonctions pour éditer le template
  const updateTemplateField = (field: keyof AgentDescription, value: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      description: {
        ...editingTemplate.description,
        [field]: value
      }
    });
  };

  const addCustomSection = () => {
    if (!editingTemplate) return;
    
    const newSection: AgentDescriptionSection = {
      id: `custom_${Date.now()}`,
      title: 'Nouvelle section',
      content: ''
    };
    
    setEditingTemplate({
      ...editingTemplate,
      description: {
        ...editingTemplate.description,
        autre: [...(editingTemplate.description.autre || []), newSection]
      }
    });
  };

  const updateCustomSection = (id: string, field: 'title' | 'content', value: string) => {
    if (!editingTemplate) return;
    
    const sections = editingTemplate.description.autre || [];
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    );
    
    setEditingTemplate({
      ...editingTemplate,
      description: {
        ...editingTemplate.description,
        autre: updatedSections
      }
    });
  };

  const removeCustomSection = (id: string) => {
    if (!editingTemplate) return;
    
    const sections = editingTemplate.description.autre || [];
    setEditingTemplate({
      ...editingTemplate,
      description: {
        ...editingTemplate.description,
        autre: sections.filter(section => section.id !== id)
      }
    });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <span>Description des prestations agent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle pour inclure la description */}
        <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg border">
          <input
            type="checkbox"
            id="include-agent-description"
            checked={settings.agentDescription?.enabled || false}
            onChange={(e) => handleUpdateIncludeDescription(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="include-agent-description">
            Inclure la description des prestations dans les devis agent
          </Label>
        </div>

        {/* Liste des templates existants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Modèles de description</h3>
            <Button onClick={createNewTemplate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau modèle
            </Button>
          </div>

          {settings.agentDescriptionTemplates?.map((template) => {
            const filledFields = Object.entries(template.description).filter(([key, value]) => {
              if (key === 'autre') {
                return (value as AgentDescriptionSection[])?.some(section => 
                  section.title.trim() || section.content.trim()
                );
              }
              return typeof value === 'string' && value.trim();
            }).length;

            return (
              <div
                key={template.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{template.name}</h4>
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">Par défaut</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filledFields} champs remplis
                    </p>
                    
                    {/* Preview des champs remplis */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.description.nature && (
                        <Badge variant="secondary" className="text-xs">Nature</Badge>
                      )}
                      {template.description.lieu && (
                        <Badge variant="secondary" className="text-xs">Lieu</Badge>
                      )}
                      {template.description.missions && (
                        <Badge variant="secondary" className="text-xs">Missions</Badge>
                      )}
                      {template.description.autre?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {template.description.autre.length} section{template.description.autre.length > 1 ? 's' : ''} custom
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(template.id)}
                      >
                        Par défaut
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {(!settings.agentDescriptionTemplates || settings.agentDescriptionTemplates.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun modèle de description créé</p>
              <p className="text-sm">Créez votre premier modèle pour standardiser vos descriptions</p>
            </div>
          )}
        </div>

        {/* Éditeur de template */}
        {editingTemplate && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {isCreating ? 'Créer un nouveau modèle' : 'Modifier le modèle'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nom du template */}
              <div>
                <Label htmlFor="template-name">Nom du modèle</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Ex: Gardiennage standard, Surveillance événementielle..."
                />
              </div>

              {/* Champs standards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-nature">Nature de la prestation</Label>
                  <Input
                    id="template-nature"
                    value={editingTemplate.description.nature || ''}
                    onChange={(e) => updateTemplateField('nature', e.target.value)}
                    placeholder="Ex: Gardiennage, surveillance..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-lieu">Lieu</Label>
                  <Input
                    id="template-lieu"
                    value={editingTemplate.description.lieu || ''}
                    onChange={(e) => updateTemplateField('lieu', e.target.value)}
                    placeholder="Ex: Site industriel, bureau..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-effectif">Effectif</Label>
                  <Input
                    id="template-effectif"
                    value={editingTemplate.description.effectif || ''}
                    onChange={(e) => updateTemplateField('effectif', e.target.value)}
                    placeholder="Ex: 2 agents, 1 équipe..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-dates">Dates</Label>
                  <Input
                    id="template-dates"
                    value={editingTemplate.description.dates || ''}
                    onChange={(e) => updateTemplateField('dates', e.target.value)}
                    placeholder="Ex: du 15/09 au 30/09"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-deplacement">Déplacement</Label>
                  <Input
                    id="template-deplacement"
                    value={editingTemplate.description.deplacement || ''}
                    onChange={(e) => updateTemplateField('deplacement', e.target.value)}
                    placeholder="Ex: Inclus, 50 CHF..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-pause">Pause</Label>
                  <Input
                    id="template-pause"
                    value={editingTemplate.description.pause || ''}
                    onChange={(e) => updateTemplateField('pause', e.target.value)}
                    placeholder="Ex: 1h non payée, 30min payée..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="template-duree">Durée de la prestation</Label>
                  <Input
                    id="template-duree"
                    value={editingTemplate.description.duree || ''}
                    onChange={(e) => updateTemplateField('duree', e.target.value)}
                    placeholder="Ex: 8h par jour, temps complet..."
                  />
                </div>
              </div>

              {/* Missions */}
              <div>
                <Label htmlFor="template-missions">Missions</Label>
                <Textarea
                  id="template-missions"
                  value={editingTemplate.description.missions || ''}
                  onChange={(e) => updateTemplateField('missions', e.target.value)}
                  placeholder="Détaillez les missions et responsabilités de l'agent..."
                  rows={4}
                />
              </div>

              {/* Sections personnalisées */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Sections personnalisées</Label>
                  <Button onClick={addCustomSection} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une section
                  </Button>
                </div>
                
                {editingTemplate.description.autre?.map((section, index) => (
                  <Card key={section.id} className="border-muted">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={section.title}
                          onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                          placeholder="Titre de la section"
                          className="font-medium"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomSection(section.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)}
                        placeholder="Contenu de la section..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
                <Button onClick={saveTemplate}>
                  {isCreating ? 'Créer' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentDescriptionSettings;