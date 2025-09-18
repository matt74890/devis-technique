import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Settings, Download, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { LayoutVariant, getDefaultLayoutForVariant } from '@/types/layout';
import { toast } from 'sonner';

const PDFConfiguration = () => {
  const { settings, updateSettings } = useStore();

  // Obtenir les layouts disponibles
  const layouts = settings.pdfLayouts || {};
  const activePDFLayouts = settings.activePDFLayouts || {};

  const handleVariantChange = (variant: LayoutVariant, layoutId: string) => {
    updateSettings({
      activePDFLayouts: {
        ...activePDFLayouts,
        [variant]: layoutId
      }
    });
    toast.success(`Disposition ${variant} mise à jour`);
  };

  const exportSettings = () => {
    const exportData = {
      pdfLayouts: layouts,
      activePDFLayouts: activePDFLayouts,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dispositions_pdf.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Dispositions PDF exportées');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        updateSettings({
          pdfLayouts: importData.pdfLayouts || {},
          activePDFLayouts: importData.activePDFLayouts || {}
        });
        
        toast.success('Dispositions PDF importées');
      } catch (error) {
        toast.error('Erreur lors de l\'importation - fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const variants: Array<{ key: LayoutVariant; label: string; description: string }> = [
    { key: 'technique', label: 'Devis Technique', description: 'Matériel et prestations techniques uniquement' },
    { key: 'agent', label: 'Devis Agent', description: 'Vacations d\'agents de sécurité uniquement' },
    { key: 'mixte', label: 'Devis Mixte', description: 'Technique + Agents de sécurité' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Disposition PDF</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Sélectionnez la disposition PDF active pour chaque type de devis. 
            Utilisez l'éditeur de disposition pour créer vos propres modèles.
          </p>
          
          <div className="space-y-4">
            {variants.map((variant) => {
              const availableLayouts = layouts[variant.key] || [];
              const activeLayoutId = activePDFLayouts[variant.key] || 'default';
              const currentLayout = availableLayouts.find(l => l.id === activeLayoutId) || getDefaultLayoutForVariant(variant.key);
              
              return (
                <div key={variant.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{variant.label}</h4>
                      <p className="text-sm text-muted-foreground">{variant.description}</p>
                    </div>
                    {currentLayout.metadata.isDefault && (
                      <Badge variant="secondary">Par défaut</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Disposition active:</Label>
                    <Select 
                      value={activeLayoutId} 
                      onValueChange={(value) => handleVariantChange(variant.key, value)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Par défaut</SelectItem>
                        {availableLayouts.map((layout) => (
                          <SelectItem key={layout.id} value={layout.id}>
                            {layout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions d'import/export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Gestion des dispositions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Exporter toutes les dispositions
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importer dispositions
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Exportez vos dispositions pour les sauvegarder ou les partager. 
            Importez des dispositions depuis un fichier JSON.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFConfiguration;