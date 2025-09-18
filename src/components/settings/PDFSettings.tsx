import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Layout, FileText } from 'lucide-react';
import { PdfTemplateConfig } from '@/types/pdf';
import { useSettings } from '@/components/SettingsProvider';
import defaultTemplate from '@/data/pdfDefaultTemplate.json';

export const PDFSettings = () => {
  const { settings, updateSettings } = useSettings();
  const baseTemplate = settings.pdf?.template || defaultTemplate as PdfTemplateConfig;
  const [template, setTemplate] = useState<PdfTemplateConfig>(baseTemplate);

  const handleSave = () => {
    updateSettings({
      pdf: {
        ...settings.pdf,
        template
      }
    });
  };

  const updateTemplate = (updates: Partial<PdfTemplateConfig>) => {
    setTemplate(prev => ({ ...prev, ...updates }));
  };

  const updateBrand = (updates: Partial<PdfTemplateConfig['brand']>) => {
    setTemplate(prev => ({
      ...prev,
      brand: { ...prev.brand, ...updates }
    }));
  };

  const updateTheme = (updates: Partial<PdfTemplateConfig['brand']['theme']>) => {
    setTemplate(prev => ({
      ...prev,
      brand: {
        ...prev.brand,
        theme: { ...prev.brand.theme, ...updates }
      }
    }));
  };

  const updateContent = (updates: Partial<PdfTemplateConfig['content']>) => {
    setTemplate(prev => ({
      ...prev,
      content: { ...prev.content, ...updates }
    }));
  };

  const updateLayout = (updates: Partial<PdfTemplateConfig['layout']>) => {
    setTemplate(prev => ({
      ...prev,
      layout: { ...prev.layout, ...updates }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Configuration PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Brand & Thème
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenus
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Mise en page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="space-y-6">
            {/* Informations vendeur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations vendeur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sellerName">Nom du vendeur</Label>
                    <Input
                      id="sellerName"
                      value={template.brand.sellerName || ''}
                      onChange={(e) => updateBrand({ sellerName: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellerTitle">Titre du vendeur</Label>
                    <Input
                      id="sellerTitle"
                      value={template.brand.sellerTitle || ''}
                      onChange={(e) => updateBrand({ sellerTitle: e.target.value })}
                      placeholder="Responsable commercial"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20">
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger logo
                  </Button>
                  <Button variant="outline" className="h-20">
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger signature
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Thème et couleurs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thème et couleurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fontFamily">Police</Label>
                    <Select 
                      value={template.brand.theme.page.fontFamily}
                      onValueChange={(value) => updateTheme({ 
                        page: { ...template.brand.theme.page, fontFamily: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fontSize">Taille police (pt)</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={template.brand.theme.page.fontSize}
                      onChange={(e) => updateTheme({ 
                        page: { ...template.brand.theme.page, fontSize: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marginMm">Marges (mm)</Label>
                    <Input
                      id="marginMm"
                      type="number"
                      value={template.brand.theme.page.marginMm}
                      onChange={(e) => updateTheme({ 
                        page: { ...template.brand.theme.page, marginMm: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accentColor">Couleur accent</Label>
                    <Input
                      id="accentColor"
                      type="color"
                      value={template.brand.theme.color.accent}
                      onChange={(e) => updateTheme({ 
                        color: { ...template.brand.theme.color, accent: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Badge style={{ backgroundColor: template.brand.theme.color.accent }}>
                      Aperçu badge
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Lettre de présentation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lettre de présentation</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="introHtml">Contenu introduction</Label>
                <Textarea
                  id="introHtml"
                  value={template.content.introHtml}
                  onChange={(e) => updateContent({ introHtml: e.target.value })}
                  rows={6}
                  placeholder="Madame, Monsieur,&#10;&#10;Nous vous remercions..."
                />
              </CardContent>
            </Card>

            {/* Remarque */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remarque finale</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="remark">Remarque sous le total</Label>
                <Textarea
                  id="remark"
                  value={template.content.remark}
                  onChange={(e) => updateContent({ remark: e.target.value })}
                  rows={3}
                  placeholder="Remarque concernant les conditions..."
                />
              </CardContent>
            </Card>

            {/* Options missions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page missions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showIfAgent"
                    checked={template.content.missionsTemplate.showIfAgent}
                    onCheckedChange={(checked) => updateContent({
                      missionsTemplate: { 
                        ...template.content.missionsTemplate, 
                        showIfAgent: checked 
                      }
                    })}
                  />
                  <Label htmlFor="showIfAgent">Afficher si devis agent</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hideEmptyFields"
                    checked={template.content.missionsTemplate.hideEmptyFields}
                    onCheckedChange={(checked) => updateContent({
                      missionsTemplate: { 
                        ...template.content.missionsTemplate, 
                        hideEmptyFields: checked 
                      }
                    })}
                  />
                  <Label htmlFor="hideEmptyFields">Masquer les champs vides</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            {/* Options tableaux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tableaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="techZebra"
                    checked={template.layout.tech.table.zebra}
                    onCheckedChange={(checked) => updateLayout({
                      tech: {
                        ...template.layout.tech,
                        table: { ...template.layout.tech.table, zebra: checked }
                      }
                    })}
                  />
                  <Label htmlFor="techZebra">Zébrage tableau technique</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="agentZebra"
                    checked={template.layout.agent.table.zebra}
                    onCheckedChange={(checked) => updateLayout({
                      agent: {
                        ...template.layout.agent,
                        table: { ...template.layout.agent.table, zebra: checked }
                      }
                    })}
                  />
                  <Label htmlFor="agentZebra">Zébrage tableau agent</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="keepTogether"
                    checked={template.layout.closing.keepTogether}
                    onCheckedChange={(checked) => updateLayout({
                      closing: { ...template.layout.closing, keepTogether: checked }
                    })}
                  />
                  <Label htmlFor="keepTogether">Totaux indivisibles</Label>
                </div>
              </CardContent>
            </Card>

            {/* Signature sur intro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page d'introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showSignatureOnIntro"
                    checked={template.layout.intro.showSellerSignatureOnIntro}
                    onCheckedChange={(checked) => updateLayout({
                      intro: { ...template.layout.intro, showSellerSignatureOnIntro: checked }
                    })}
                  />
                  <Label htmlFor="showSignatureOnIntro">Signature vendeur sur l'intro</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} className="flex items-center gap-2">
            Sauvegarder la configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};