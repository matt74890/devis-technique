import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Download, Settings, Eye } from 'lucide-react';
import { PDFAnalyzer } from '@/components/pdf/PDFAnalyzer';
import { MappingAssistant } from '@/components/pdf/MappingAssistant';
import { FidelityChecker } from '@/components/pdf/FidelityChecker';
import { toast } from 'sonner';
import type { PDFLayoutConfig } from '@/types/layout';

export const PDFCopierScreen = () => {
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null);
  const [analyzedLayout, setAnalyzedLayout] = useState<PDFLayoutConfig | null>(null);
  const [mappedLayout, setMappedLayout] = useState<PDFLayoutConfig | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState<'upload' | 'analyze' | 'mapping' | 'verify'>('upload');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedPDF(file);
      setActiveStep('analyze');
      toast.success('PDF importé avec succès');
    } else {
      toast.error('Veuillez sélectionner un fichier PDF valide');
    }
  };

  const handleAnalyzeComplete = (layout: PDFLayoutConfig) => {
    setAnalyzedLayout(layout);
    setActiveStep('mapping');
    toast.success('Analyse PDF terminée');
  };

  const handleMappingComplete = (layout: PDFLayoutConfig) => {
    setMappedLayout(layout);
    setActiveStep('verify');
    toast.success('Mapping des tokens terminé');
  };

  const handleExportLayout = () => {
    if (!mappedLayout) return;
    
    const dataStr = JSON.stringify(mappedLayout, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `layout_copie_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Layout exporté avec succès');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Copieur de PDF</h1>
          <p className="text-muted-foreground mt-2">
            Importez un PDF modèle et générez automatiquement un layout identique mappé à vos données
          </p>
        </div>
      </div>

      <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" disabled={!uploadedPDF && activeStep !== 'upload'}>
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </TabsTrigger>
          <TabsTrigger value="analyze" disabled={!uploadedPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Analyser
          </TabsTrigger>
          <TabsTrigger value="mapping" disabled={!analyzedLayout}>
            <Settings className="w-4 h-4 mr-2" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="verify" disabled={!mappedLayout}>
            <Eye className="w-4 h-4 mr-2" />
            Vérifier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importer un PDF modèle</CardTitle>
              <CardDescription>
                Sélectionnez un fichier PDF à utiliser comme modèle pour générer un layout identique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Glissez votre PDF ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="mt-4 block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/80"
                />
              </div>
              {uploadedPDF && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Fichier sélectionné :</p>
                  <p className="text-sm text-muted-foreground">{uploadedPDF.name}</p>
                  <p className="text-sm text-muted-foreground">Taille : {(uploadedPDF.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <PDFAnalyzer 
            file={uploadedPDF}
            onAnalyzeComplete={handleAnalyzeComplete}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <MappingAssistant
            analyzedLayout={analyzedLayout}
            onMappingComplete={handleMappingComplete}
          />
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <FidelityChecker
            originalFile={uploadedPDF}
            reconstructedLayout={mappedLayout}
          />
          
          {mappedLayout && (
            <div className="flex gap-4">
              <Button onClick={handleExportLayout} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Exporter comme layout
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};