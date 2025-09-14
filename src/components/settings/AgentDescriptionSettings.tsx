import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Star, 
  StarOff,
  Copy
} from 'lucide-react';
import { AgentDescriptionTemplate, AgentDescription, AgentDescriptionSection } from '@/types';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AgentDescriptionSettings() {
  const { settings: storeSettings } = useStore();
  const { settings, updateSettings } = useUserSettings(storeSettings);
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<AgentDescriptionTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createNewTemplate = () => {
    const newTemplate: AgentDescriptionTemplate = {
      id: `template_${Date.now()}`,
      name: 'Nouveau modèle',
      isDefault: false,
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
    
    let updatedTemplates = [...settings.agentDescriptionTemplates];
    
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
    
    toast({
      title: isCreating ? "Modèle créé" : "Modèle mis à jour",
      description: `"${editingTemplate.name}" sauvegardé avec succès.`
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
    
    toast({
      title: "Modèle supprimé",
      description: "Le modèle a été supprimé avec succès."
    });
  };

  const setAsDefault = (templateId: string) => {
    const updatedTemplates = settings.agentDescriptionTemplates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    }));
    
    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });
    
    toast({
      title: "Modèle par défaut",
      description: "Ce modèle sera utilisé par défaut pour les nouveaux devis agent."
    });
  };

  const duplicateTemplate = (template: AgentDescriptionTemplate) => {
    const duplicated: AgentDescriptionTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copie)`,
      isDefault: false
    };
    
    const updatedTemplates = [...settings.agentDescriptionTemplates, duplicated];
    updateSettings({
      agentDescriptionTemplates: updatedTemplates
    });
    
    toast({
      title: "Modèle dupliqué",
      description: `"${duplicated.name}" créé avec succès.`
    });
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Modèles de description des prestations
            <Button onClick={createNewTemplate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau modèle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings.agentDescriptionTemplates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun modèle configuré. Créez votre premier modèle pour faciliter la saisie des descriptions de prestations.
            </p>
          ) : (
            <div className="space-y-4">
              {settings.agentDescriptionTemplates.map(template => (
                <Card key={template.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        {template.isDefault && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!template.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAsDefault(template.id)}
                            title="Définir par défaut"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateTemplate(template)}
                          title="Dupliquer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTemplate(template)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le modèle</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le modèle "{template.name}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplate(template.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {/* Preview des champs remplis */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      {template.description.nature && <div>• Nature: {template.description.nature}</div>}
                      {template.description.lieu && <div>• Lieu: {template.description.lieu}</div>}
                      {template.description.missions && <div>• Missions: {template.description.missions.substring(0, 100)}...</div>}
                      {template.description.autre && template.description.autre.length > 0 && (
                        <div>• {template.description.autre.length} section(s) personnalisée(s)</div>
                      )}
                      {!template.description.nature && !template.description.lieu && !template.description.missions && (!template.description.autre || template.description.autre.length === 0) && (
                        <div className="text-muted-foreground/70">Modèle vide</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {isCreating ? 'Créer un modèle' : 'Modifier le modèle'}
              <div className="flex gap-2">
                <Button onClick={saveTemplate} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button onClick={cancelEdit} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template name */}
            <div>
              <Label htmlFor="template-name">Nom du modèle</Label>
              <Input
                id="template-name"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  name: e.target.value
                })}
              />
            </div>

            {/* Template fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-nature">Nature de la prestation</Label>
                <Input
                  id="template-nature"
                  value={editingTemplate.description.nature || ''}
                  onChange={(e) => updateTemplateField('nature', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-lieu">Lieu</Label>
                <Input
                  id="template-lieu"
                  value={editingTemplate.description.lieu || ''}
                  onChange={(e) => updateTemplateField('lieu', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-effectif">Effectif</Label>
                <Input
                  id="template-effectif"
                  value={editingTemplate.description.effectif || ''}
                  onChange={(e) => updateTemplateField('effectif', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-dates">Dates</Label>
                <Input
                  id="template-dates"
                  value={editingTemplate.description.dates || ''}
                  onChange={(e) => updateTemplateField('dates', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-deplacement">Déplacement</Label>
                <Input
                  id="template-deplacement"
                  value={editingTemplate.description.deplacement || ''}
                  onChange={(e) => updateTemplateField('deplacement', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-pause">Pause</Label>
                <Input
                  id="template-pause"
                  value={editingTemplate.description.pause || ''}
                  onChange={(e) => updateTemplateField('pause', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="template-duree">Durée de la prestation</Label>
                <Input
                  id="template-duree"
                  value={editingTemplate.description.duree || ''}
                  onChange={(e) => updateTemplateField('duree', e.target.value)}
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
                rows={4}
              />
            </div>

            {/* Custom sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sections personnalisées</Label>
                <Button onClick={addCustomSection} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              {editingTemplate.description.autre?.map((section) => (
                <Card key={section.id} className="border-muted">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                        placeholder="Titre de la section"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}