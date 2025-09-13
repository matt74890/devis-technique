import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Layout, 
  Palette, 
  Settings, 
  Eye, 
  Download, 
  Plus, 
  Edit, 
  Trash2,
  Copy,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { PDFLayoutConfig, LayoutVariant } from '@/types/layout';
import { createPrebuiltTemplates } from '@/data/pdfTemplates';
import { toast } from 'sonner';

// Composant principal centralisé pour tous les paramètres PDF
export const PDFCenter: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('templates');
  
  // Initialiser les templates préfabriqués si pas encore fait
  const initializePrebuiltTemplates = () => {
    const prebuiltTemplates = createPrebuiltTemplates();
    const existingLayouts = settings.pdfLayouts || {};
    const existingActiveLayouts = settings.activePDFLayouts || {};
    
    // Ajouter les templates préfabriqués s'ils n'existent pas
    const updatedLayouts = { ...existingLayouts };
    const updatedActiveLayouts = { ...existingActiveLayouts };
    
    prebuiltTemplates.forEach(template => {
      const variant = template.variant;
      
      if (!updatedLayouts[variant]) {
        updatedLayouts[variant] = [];
      }
      
      // Vérifier si le template existe déjà
      const exists = updatedLayouts[variant].some(layout => layout.id === template.id);
      if (!exists) {
        updatedLayouts[variant].push(template);
        
        // Définir comme actif s'il n'y en a pas encore
        if (!updatedActiveLayouts[variant]) {
          updatedActiveLayouts[variant] = template.id;
        }
      }
    });
    
    updateSettings({
      pdfLayouts: updatedLayouts,
      activePDFLayouts: updatedActiveLayouts
    });
    
    toast.success('Templates préfabriqués initialisés !');
  };

  // Obtenir tous les layouts disponibles
  const getAllLayouts = (): PDFLayoutConfig[] => {
    const layouts: PDFLayoutConfig[] = [];
    const pdfLayouts = settings.pdfLayouts || {};
    
    Object.values(pdfLayouts).forEach(variantLayouts => {
      layouts.push(...variantLayouts);
    });
    
    return layouts;
  };

  // Définir un layout comme actif pour sa variante
  const setActiveLayout = (layoutId: string, variant: LayoutVariant) => {
    const updatedActiveLayouts = {
      ...(settings.activePDFLayouts || {}),
      [variant]: layoutId
    };
    
    updateSettings({ activePDFLayouts: updatedActiveLayouts });
    toast.success(`Template "${variant}" activé !`);
  };

  // Dupliquer un layout
  const duplicateLayout = (layout: PDFLayoutConfig) => {
    const newLayout: PDFLayoutConfig = {
      ...layout,
      id: `${layout.id}_copy_${Date.now()}`,
      name: `${layout.name} (Copie)`,
      metadata: {
        ...layout.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      }
    };
    
    const existingLayouts = settings.pdfLayouts || {};
    const variantLayouts = existingLayouts[layout.variant] || [];
    
    const updatedLayouts = {
      ...existingLayouts,
      [layout.variant]: [...variantLayouts, newLayout]
    };
    
    updateSettings({ pdfLayouts: updatedLayouts });
    toast.success('Template dupliqué !');
  };

  // Supprimer un layout
  const deleteLayout = (layoutId: string, variant: LayoutVariant) => {
    const existingLayouts = settings.pdfLayouts || {};
    const variantLayouts = existingLayouts[variant] || [];
    
    const updatedVariantLayouts = variantLayouts.filter(layout => layout.id !== layoutId);
    
    const updatedLayouts = {
      ...existingLayouts,
      [variant]: updatedVariantLayouts
    };
    
    // Si c'était le layout actif, le désactiver
    const activeLayouts = settings.activePDFLayouts || {};
    if (activeLayouts[variant] === layoutId) {
      const updatedActiveLayouts = { ...activeLayouts };
      delete updatedActiveLayouts[variant];
      updateSettings({ 
        pdfLayouts: updatedLayouts,
        activePDFLayouts: updatedActiveLayouts 
      });
    } else {
      updateSettings({ pdfLayouts: updatedLayouts });
    }
    
    toast.success('Template supprimé !');
  };

  const allLayouts = getAllLayouts();
  const activeLayouts = settings.activePDFLayouts || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Centre de Configuration PDF
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gérez tous vos templates PDF, paramètres de mise en page et options d'export depuis cette interface centralisée.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="layouts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mise en page
          </TabsTrigger>
          <TabsTrigger value="styles" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Styles
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates PDF disponibles</CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {allLayouts.length} template(s) configuré(s)
                </p>
                <Button onClick={initializePrebuiltTemplates} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Initialiser templates préfabriqués
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {allLayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun template configuré</p>
                  <p className="text-sm">Cliquez sur "Initialiser templates préfabriqués" pour commencer</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allLayouts.map((layout) => {
                    const isActive = activeLayouts[layout.variant] === layout.id;
                    
                    return (
                      <Card key={layout.id} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{layout.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={layout.variant === 'technique' ? 'default' : 
                                          layout.variant === 'agent' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {layout.variant}
                                </Badge>
                                {isActive && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Actif
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {layout.metadata.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {layout.blocks.length} bloc(s)
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => duplicateLayout(layout)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!layout.metadata.isDefault && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => deleteLayout(layout.id, layout.variant)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {!isActive && (
                            <Button 
                              size="sm" 
                              className="w-full mt-3"
                              onClick={() => setActiveLayout(layout.id, layout.variant)}
                            >
                              Activer ce template
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la mise en page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Format de page</Label>
                  <Select defaultValue="A4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                      <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select defaultValue="portrait">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Paysage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Marges (mm)</Label>
                  <Select defaultValue="12">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">Étroites (8mm)</SelectItem>
                      <SelectItem value="12">Normales (12mm)</SelectItem>
                      <SelectItem value="16">Larges (16mm)</SelectItem>
                      <SelectItem value="20">Très larges (20mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="styles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Styles et apparence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-base">Polices</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Police principale</Label>
                      <Select defaultValue="Arial">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times">Times New Roman</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Taille de police par défaut</Label>
                      <Select defaultValue="11">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9">9pt</SelectItem>
                          <SelectItem value="10">10pt</SelectItem>
                          <SelectItem value="11">11pt</SelectItem>
                          <SelectItem value="12">12pt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Couleurs</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Couleur principale</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded border"></div>
                        <span className="text-sm text-muted-foreground">#2563eb</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Couleur secondaire</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-secondary rounded border"></div>
                        <span className="text-sm text-muted-foreground">#f59e0b</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Options d'export PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Remarque importante (sous le total)</Label>
                  <textarea
                    className="w-full border rounded-md p-3 text-sm min-h-[80px] resize-none"
                    value={settings.pdfSettings?.importantRemark || ""}
                    onChange={(e) => updateSettings({ 
                      pdfSettings: { 
                        ...settings.pdfSettings, 
                        importantRemark: e.target.value 
                      } 
                    })}
                    placeholder="Ex: Les heures de nuit, dimanche et jours fériés sont majorées de 10% selon la CCT."
                  />
                  <p className="text-xs text-muted-foreground">
                    Cette remarque apparaîtra sous le total du devis. Elle peut être modifiée à tout moment.
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Qualité d'impression</Label>
                    <div className="text-sm text-muted-foreground">
                      Optimiser pour l'impression ou l'affichage écran
                    </div>
                  </div>
                  <Select defaultValue="print">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="print">Impression (haute qualité)</SelectItem>
                      <SelectItem value="screen">Écran (fichier léger)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Afficher les couleurs de fond</Label>
                    <div className="text-sm text-muted-foreground">
                      Inclure les arrière-plans colorés dans le PDF
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Préserver la mise en page</Label>
                    <div className="text-sm text-muted-foreground">
                      Éviter les coupures de page inappropriées
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nom de fichier automatique</Label>
                    <div className="text-sm text-muted-foreground">
                      Format : devis_[référence]_[date].pdf
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde et import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter tous les templates
                </Button>
                <Button variant="outline" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer templates
                    <input type="file" accept=".json" className="hidden" />
                  </label>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Sauvegardez vos templates personnalisés ou importez-en depuis un autre système.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};