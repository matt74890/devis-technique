import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportProfessionalPDF } from '@/utils/professionalPDFRenderer';
import type { Quote, Settings } from '@/types';
import { toast } from 'sonner';

interface ProfessionalPDFExportProps {
  quote: Quote;
  settings: Settings;
  variant?: 'technique' | 'agent' | 'mixte';
}

const ProfessionalPDFExport = ({ quote, settings }: ProfessionalPDFExportProps) => {
  const handleExport = async () => {
    try {
      await exportProfessionalPDF(quote, settings);
      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <Button onClick={handleExport} className="bg-primary text-primary-foreground hover:bg-primary/90">
      <Download className="h-4 w-4 mr-2" />
      Télécharger PDF
    </Button>
  );
};

export default ProfessionalPDFExport;