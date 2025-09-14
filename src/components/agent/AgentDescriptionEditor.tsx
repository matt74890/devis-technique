import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, MoveUp, MoveDown, Copy, Eye } from 'lucide-react';
import { AgentDescription, AgentDescriptionSection, AgentDescriptionTemplate } from '@/types';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';

interface AgentDescriptionEditorProps {
  description: AgentDescription;
  onUpdate: (description: AgentDescription) => void;
  onPreview?: () => void;
}

export default function AgentDescriptionEditor({ 
  description, 
  onUpdate, 
  onPreview 
}: AgentDescriptionEditorProps) {
  const { settings } = useStore();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const updateField = (field: keyof AgentDescription, value: string) => {
    onUpdate({
      ...description,
      [field]: value
    });
  };

  const addCustomSection = () => {
    const newSection: AgentDescriptionSection = {
      id: `custom_${Date.now()}`,
      title: 'Nouvelle section',
      content: ''
    };
    
    onUpdate({
      ...description,
      autre: [...(description.autre || []), newSection]
    });
  };

  const updateCustomSection = (id: string, field: 'title' | 'content', value: string) => {
    const sections = description.autre || [];
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    );
    
    onUpdate({
      ...description,
      autre: updatedSections
    });
  };

  const removeCustomSection = (id: string) => {
    const sections = description.autre || [];
    onUpdate({
      ...description,
      autre: sections.filter(section => section.id !== id)
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sections = [...(description.autre || [])];
    const index = sections.findIndex(section => section.id === id);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    
    onUpdate({
      ...description,
      autre: sections
    });
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = settings.agentDescriptionTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    onUpdate(template.description);
    setSelectedTemplate('');
    
    toast({
      title: "Modèle appliqué",
      description: `Le modèle "${template.name}" a été appliqué avec succès.`
    });
  };

  const hasContent = () => {
    return !!(
      description.nature?.trim() ||
      description.lieu?.trim() ||
      description.effectif?.trim() ||
      description.dates?.trim() ||
      description.missions?.trim() ||
      description.deplacement?.trim() ||
      description.pause?.trim() ||
      description.duree?.trim() ||
      (description.autre && description.autre.some(section => 
        section.title.trim() || section.content.trim()
      ))
    );
  };

  return (
    <Card className="shadow-soft border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Description des prestations (Agent)</span>
          <div className="flex gap-2">
            {hasContent() && onPreview && (
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-1" />
                Aperçu PDF
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template selector */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Préremplir depuis modèle..." />
              </SelectTrigger>
              <SelectContent>
                {settings.agentDescriptionTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.isDefault && '(Par défaut)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={applyTemplate} 
            disabled={!selectedTemplate}
            variant="outline"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-1" />
            Appliquer
          </Button>
        </div>

        {/* Standard fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nature">Nature de la prestation</Label>
            <Input
              id="nature"
              value={description.nature || ''}
              onChange={(e) => updateField('nature', e.target.value)}
              placeholder="Ex: Gardiennage, surveillance..."
            />
          </div>
          
          <div>
            <Label htmlFor="lieu">Lieu</Label>
            <Input
              id="lieu"
              value={description.lieu || ''}
              onChange={(e) => updateField('lieu', e.target.value)}
              placeholder="Ex: Site industriel, bureau..."
            />
          </div>
          
          <div>
            <Label htmlFor="effectif">Effectif</Label>
            <Input
              id="effectif"
              value={description.effectif || ''}
              onChange={(e) => updateField('effectif', e.target.value)}
              placeholder="Ex: 2 agents, 1 équipe..."
            />
          </div>
          
          <div>
            <Label htmlFor="dates">Dates</Label>
            <Input
              id="dates"
              value={description.dates || ''}
              onChange={(e) => updateField('dates', e.target.value)}
              placeholder="Ex: du 15/09 au 30/09"
            />
          </div>
          
          <div>
            <Label htmlFor="deplacement">Déplacement</Label>
            <Input
              id="deplacement"
              value={description.deplacement || ''}
              onChange={(e) => updateField('deplacement', e.target.value)}
              placeholder="Ex: Inclus, 50 CHF..."
            />
          </div>
          
          <div>
            <Label htmlFor="pause">Pause</Label>
            <Input
              id="pause"
              value={description.pause || ''}
              onChange={(e) => updateField('pause', e.target.value)}
              placeholder="Ex: 1h non payée, 30min payée..."
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="duree">Durée de la prestation</Label>
            <Input
              id="duree"
              value={description.duree || ''}
              onChange={(e) => updateField('duree', e.target.value)}
              placeholder="Ex: 8h par jour, temps complet..."
            />
          </div>
        </div>

        {/* Missions - textarea */}
        <div>
          <Label htmlFor="missions">Missions</Label>
          <Textarea
            id="missions"
            value={description.missions || ''}
            onChange={(e) => updateField('missions', e.target.value)}
            placeholder="Détaillez les missions et responsabilités de l'agent..."
            rows={4}
          />
        </div>

        {/* Custom sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Sections personnalisées</Label>
            <Button onClick={addCustomSection} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une section
            </Button>
          </div>
          
          {description.autre?.map((section, index) => (
            <Card key={section.id} className="border-muted">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                    placeholder="Titre de la section"
                    className="font-medium"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === (description.autre?.length || 1) - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomSection(section.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
  );
}