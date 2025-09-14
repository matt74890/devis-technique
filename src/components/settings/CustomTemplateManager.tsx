import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import type { CustomLetterTemplate, PlaceholderType } from '@/types';
import { toast } from 'sonner';

interface CustomTemplateManagerProps {
  availablePlaceholders: PlaceholderType[];
}

const CustomTemplateManager = ({ availablePlaceholders }: CustomTemplateManagerProps) => {
  const { settings, updateSettings } = useSettings();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomLetterTemplate | null>(null);

  const [newTemplate, setNewTemplate] = useState<Partial<CustomLetterTemplate>>({
    name: '',
    description: '',
    template: {
      companyName: '',
      contactName: '',
      contactTitle: '',
      contactPhone: '',
      contactEmail: '',
      companyAddress: '',
      subject: '',
      civility: '{{CLIENT_CIVILITE}}',
      opening: '',
      body: '',
      closing: '',
      textAlignment: 'left',
      boldOptions: {
        subject: false,
        opening: false,
        body: false,
        closing: false,
      },
      placeholders: {
        enabled: true,
        availablePlaceholders,
      },
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name?.trim()) {
      toast.error('Le nom du template est requis');
      return;
    }

    const template: CustomLetterTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description || '',
      template: newTemplate.template!,
    };

    const updatedTemplates = [...(settings.customLetterTemplates || []), template];
    
    updateSettings({
      customLetterTemplates: updatedTemplates,
    });

    setIsCreateDialogOpen(false);
    setNewTemplate({
      name: '',
      description: '',
      template: {
        companyName: '',
        contactName: '',
        contactTitle: '',
        contactPhone: '',
        contactEmail: '',
        companyAddress: '',
        subject: '',
        civility: '{{CLIENT_CIVILITE}}',
        opening: '',
        body: '',
        closing: '',
        textAlignment: 'left',
        boldOptions: {
          subject: false,
          opening: false,
          body: false,
          closing: false,
        },
        placeholders: {
          enabled: true,
          availablePlaceholders,
        },
      },
    });

    toast.success('Template personnalisé créé avec succès');
  };

  const handleEditTemplate = (template: CustomLetterTemplate) => {
    setEditingTemplate(template);
    setNewTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplate.name?.trim()) {
      toast.error('Le nom du template est requis');
      return;
    }

    const updatedTemplate: CustomLetterTemplate = {
      ...editingTemplate,
      name: newTemplate.name,
      description: newTemplate.description || '',
      template: newTemplate.template!,
    };

    const updatedTemplates = (settings.customLetterTemplates || []).map(t =>
      t.id === editingTemplate.id ? updatedTemplate : t
    );

    updateSettings({
      customLetterTemplates: updatedTemplates,
    });

    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    toast.success('Template mis à jour avec succès');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = (settings.customLetterTemplates || []).filter(t => t.id !== templateId);
    updateSettings({
      customLetterTemplates: updatedTemplates,
    });
    toast.success('Template supprimé avec succès');
  };

  const handleDuplicateTemplate = (template: CustomLetterTemplate) => {
    const duplicatedTemplate: CustomLetterTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copie)`,
    };

    const updatedTemplates = [...(settings.customLetterTemplates || []), duplicatedTemplate];
    updateSettings({
      customLetterTemplates: updatedTemplates,
    });
    toast.success('Template dupliqué avec succès');
  };

  const TemplateDialog = ({ isEdit = false }: { isEdit?: boolean }) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Modifier le template' : 'Créer un nouveau template'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nom du template *</Label>
            <Input
              id="template-name"
              value={newTemplate.name || ''}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Mon template personnalisé"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={newTemplate.description || ''}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description optionnelle du template"
            />
          </div>
        </div>

        {/* Contenu du template */}
        <div className="space-y-4">
          <h4 className="font-medium text-primary">Contenu de la lettre</h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Civilité</Label>
              <Input
                value={newTemplate.template?.civility || ''}
                onChange={(e) => setNewTemplate(prev => ({
                  ...prev,
                  template: { ...prev.template!, civility: e.target.value }
                }))}
                placeholder="{{CLIENT_CIVILITE}} ou texte personnalisé"
              />
            </div>

            <div className="space-y-2">
              <Label>Objet</Label>
              <Input
                value={newTemplate.template?.subject || ''}
                onChange={(e) => setNewTemplate(prev => ({
                  ...prev,
                  template: { ...prev.template!, subject: e.target.value }
                }))}
                placeholder="Objet de la lettre"
              />
            </div>

            <div className="space-y-2">
              <Label>Formule d'ouverture</Label>
              <Textarea
                value={newTemplate.template?.opening || ''}
                onChange={(e) => setNewTemplate(prev => ({
                  ...prev,
                  template: { ...prev.template!, opening: e.target.value }
                }))}
                placeholder="Formule d'ouverture..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Corps du message</Label>
              <Textarea
                value={newTemplate.template?.body || ''}
                onChange={(e) => setNewTemplate(prev => ({
                  ...prev,
                  template: { ...prev.template!, body: e.target.value }
                }))}
                placeholder="Corps du message..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Formule de politesse</Label>
              <Textarea
                value={newTemplate.template?.closing || ''}
                onChange={(e) => setNewTemplate(prev => ({
                  ...prev,
                  template: { ...prev.template!, closing: e.target.value }
                }))}
                placeholder="Formule de politesse..."
                rows={3}
              />
            </div>
          </div>

          {/* Placeholders disponibles */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">Placeholders disponibles</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {availablePlaceholders.map((placeholder) => (
                <Badge
                  key={placeholder.id}
                  variant="secondary"
                  className="text-xs"
                  title={`${placeholder.description} - Ex: ${placeholder.example}`}
                >
                  {placeholder.id}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isEdit) {
                setIsEditDialogOpen(false);
              } else {
                setIsCreateDialogOpen(false);
              }
            }}
          >
            Annuler
          </Button>
          <Button onClick={isEdit ? handleUpdateTemplate : handleCreateTemplate}>
            {isEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Templates personnalisés</span>
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </DialogTrigger>
            <TemplateDialog />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!settings.customLetterTemplates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun template personnalisé créé</p>
              <p className="text-sm">Cliquez sur "Nouveau template" pour commencer</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {settings.customLetterTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        Objet: {template.template.subject}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Dupliquer"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer le template "{template.name}" ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dialog pour édition */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <TemplateDialog isEdit />
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomTemplateManager;