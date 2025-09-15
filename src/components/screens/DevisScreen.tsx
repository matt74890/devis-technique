import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Plus, Copy, Trash2, Users, FileDown, Eye, UserCheck, Shield } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateQuoteItem, calculateQuoteTotals } from '@/utils/calculations';
import { QuoteItem } from '@/types';
import ProductSelector from '@/components/catalog/ProductSelector';
import ClientSelector from '@/components/clients/ClientSelector';
import PDFPreview from '@/components/pdf/PDFPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AgentVacationRow from '@/components/vacation/AgentVacationRow';
import VacationSeriesGenerator from '@/components/vacation/VacationSeriesGenerator';
import SavedQuoteManager from '@/components/vacation/SavedQuoteManager';
import AgentDescriptionEditor from '@/components/agent/AgentDescriptionEditor';
import { renderPDFFromLayout } from "@/components/pdf/renderPDFFromLayout";
import { exportDomAsPDF } from "@/utils/pdfRenderer";

const DevisScreen = () => {
  const { toast } = useToast();
  const { 
    currentQuote, 
    settings, 
    updateQuote, 
    addQuoteItem, 
    updateQuoteItem, 
    deleteQuoteItem, 
    duplicateQuoteItem,
    saveQuoteForClient
  } = useStore();

  const [newItemMode, setNewItemMode] = useState<'unique' | 'mensuel'>('unique');
  const [newItemKind, setNewItemKind] = useState<'TECH' | 'AGENT'>('TECH');
  const [emailRaw, setEmailRaw] = useState('');
  const [isProcessingEmail, setIsProcessingEmail] = useState(false);
  const [showVacationGenerator, setShowVacationGenerator] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Auto-save when client changes
  useEffect(() => {
    if (currentQuote?.client && currentQuote.items.length > 0) {
      const timer = setTimeout(() => {
        saveQuoteForClient(currentQuote.client);
      }, 2000); // Save 2 seconds after changes
      
      return () => clearTimeout(timer);
    }
  }, [currentQuote?.client, currentQuote?.items, saveQuoteForClient]);

  const addSubscriptionQuick = (subscriptionId: string) => {
    const subscription = settings.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) return;

    const newItem: Omit<QuoteItem, 'id'> = {
      kind: 'TECH',
      type: subscription.defaultType,
      reference: subscription.defaultRef,
      mode: 'mensuel',
      qty: 1,
      unitPriceValue: subscription.puTTC || 0,
      unitPriceMode: 'TTC',
      lineDiscountPct: undefined,
      puHT: undefined,
      puTTC: undefined,
      totalHT_brut: undefined,
      discountHT: undefined,
      totalHT_net: undefined,
      totalTTC: undefined
    };

    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    addQuoteItem(calculatedItem);
    toast({
      title: "Abonnement ajouté",
      description: `"${subscription.label}" ajouté au devis`,
    });
  };

  const addDefaultFeeQuick = (feeType: 'install' | 'dossier') => {
    const feeValue = feeType === 'install' ? settings.defaults.feesInstallHT : settings.defaults.feesDossierHT;
    const feeLabel = feeType === 'install' ? 'Frais d\'installation' : 'Frais de dossier';
    
    const newItem: Omit<QuoteItem, 'id'> = {
      kind: 'TECH',
      type: 'Installation',
      reference: feeLabel,
      mode: 'unique',
      qty: 1,
      unitPriceValue: feeValue,
      unitPriceMode: 'HT',
      lineDiscountPct: undefined,
      puHT: undefined,
      puTTC: undefined,
      totalHT_brut: undefined,
      discountHT: undefined,
      totalHT_net: undefined,
      totalTTC: undefined
    };
    
    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    addQuoteItem(calculatedItem);
    toast({
      title: "Frais ajouté",
      description: `${feeLabel} ajouté au devis (HT)`,
    });
  };

  const addNewItem = () => {
    if (newItemKind === 'AGENT') {
      const newVacation: Omit<QuoteItem, 'id'> = {
        kind: 'AGENT',
        type: 'Sécurité',
        reference: 'Vacation sécurité',
        mode: 'unique',
        dateStart: new Date().toISOString().split('T')[0],
        timeStart: '08:00',
        dateEnd: new Date().toISOString().split('T')[0],
        timeEnd: '16:00',
        agentType: 'Sécurité',
        rateCHFh: settings.agentSettings?.agentTypes?.find(t => t.type === 'Sécurité')?.suggestedRate || 50,
        pauseMinutes: 60,
        pausePaid: false,
        travelCHF: 0,
        canton: 'GE',
        unitPriceMode: settings.priceInputModeDefault
      };
      
      const calculatedVacation = calculateQuoteItem(newVacation as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line', settings);
      addQuoteItem(calculatedVacation);
      
      toast({
        title: "Vacation ajoutée",
        description: "Nouvelle vacation ajoutée au devis",
      });
      return;
    }

    const newItem: Omit<QuoteItem, 'id'> = {
      kind: 'TECH',
      type: settings.types[0] || 'Autre',
      reference: '',
      mode: newItemMode,
      qty: 1,
      unitPriceValue: undefined,
      unitPriceMode: settings.priceInputModeDefault,
      lineDiscountPct: undefined,
      puHT: undefined,
      puTTC: undefined,
      totalHT_brut: undefined,
      discountHT: undefined,
      totalHT_net: undefined,
      totalTTC: undefined
    };

    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    addQuoteItem(calculatedItem);
  };

  const addVacationSeries = (vacations: QuoteItem[]) => {
    // Import du calcul d'agent pour calculer correctement les heures et prix
    import('@/utils/agentCalculations').then(({ calculateAgentVacation }) => {
      vacations.forEach(vacation => {
        // Pour les items AGENT, utiliser le calcul spécialisé
        const calculatedItem = vacation.kind === 'AGENT' 
          ? calculateAgentVacation(vacation, settings)
          : calculateQuoteItem(vacation, settings.tvaPct, false);
        addQuoteItem(calculatedItem);
      });
    });
    
    toast({
      title: "Série créée",
      description: `${vacations.length} vacations ajoutées avec succès.`,
    });
  };

  async function handleDownloadPdf(quote: any, settings: any, variant: "technique"|"agent"|"mixte") {
    if (exporting) return;
    setExporting(true);
    try {
      const dom = await renderPDFFromLayout(quote, settings, variant);
      const filename = `devis_${quote.ref || "sans_ref"}_${new Date().toISOString().slice(0,10)}.pdf`;
      await exportDomAsPDF(dom, filename);
      toast({ title: "PDF téléchargé" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  const handleItemUpdate = (itemId: string, field: string, value: any) => {
    const item = currentQuote.items.find(i => i.id === itemId);
    if (!item) return;

    const updates = { [field]: value };
    const updatedItem = { ...item, ...updates };
    const calculatedItem = calculateQuoteItem(updatedItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    updateQuoteItem(itemId, calculatedItem);
  };

  const processEmailExtraction = async () => {
    if (!emailRaw.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller un e-mail ou un texte avant d'extraire.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-email-to-quote', {
        body: { emailContent: emailRaw }
      });

      if (error) throw error;

      const { client, addresses, items, subscriptions, feesInstallHT, feesDossierHT, discountMode } = data;

      // Mise à jour du devis avec les informations extraites
      const updates: any = {};
      
      if (client?.civility) updates.clientCivility = client.civility;
      if (client?.site) updates.site = client.site;
      if (client?.contact) updates.contact = client.contact;
      if (client?.canton) updates.canton = client.canton;
      if (discountMode) updates.discountMode = discountMode;

      if (addresses?.contact) {
        const newContactAddress = {
          company: addresses.contact.company || '',
          name: addresses.contact.name || client?.name || '',
          email: addresses.contact.email || '',
          phone: addresses.contact.phone || '',
          street: addresses.contact.street || '',
          city: addresses.contact.city || '',
          postalCode: addresses.contact.postalCode || '',
          country: addresses.contact.country || 'Suisse'
        };
        
        updates.addresses = { 
          ...currentQuote.addresses, 
          contact: newContactAddress,
          billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newContactAddress,
          installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newContactAddress
        };
      }

      updateQuote(updates);

      // Ajout des abonnements
      if (subscriptions?.raccordement50TTC) {
        const raccordement50Item: Omit<QuoteItem, 'id'> = {
          kind: 'TECH',
          type: 'Autre',
          reference: 'Raccordement alarme',
          mode: 'mensuel',
          qty: 1,
          unitPriceValue: 50.00,
          unitPriceMode: 'TTC',
          lineDiscountPct: undefined,
          puHT: undefined,
          puTTC: undefined,
          totalHT_brut: undefined,
          discountHT: undefined,
          totalHT_net: undefined,
          totalTTC: undefined
        };
        const calculatedItem = calculateQuoteItem(raccordement50Item as QuoteItem, settings.tvaPct, discountMode === 'per_line');
        addQuoteItem(calculatedItem);
      }

      if (subscriptions?.raccordement109TTC) {
        const raccordement109Item: Omit<QuoteItem, 'id'> = {
          kind: 'TECH',
          type: 'Autre',
          reference: 'Raccordement + interventions illimitées',
          mode: 'mensuel',
          qty: 1,
          unitPriceValue: 109.00,
          unitPriceMode: 'TTC',
          lineDiscountPct: undefined,
          puHT: undefined,
          puTTC: undefined,
          totalHT_brut: undefined,
          discountHT: undefined,
          totalHT_net: undefined,
          totalTTC: undefined
        };
        const calculatedItem = calculateQuoteItem(raccordement109Item as QuoteItem, settings.tvaPct, discountMode === 'per_line');
        addQuoteItem(calculatedItem);
      }

      // Ajout des items extraits
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const newItem: Omit<QuoteItem, 'id'> = {
            kind: 'TECH',
            type: item.type || 'Autre',
            reference: item.reference || '',
            mode: item.mode || 'unique',
            qty: item.qty || 1,
            unitPriceValue: item.unitPriceValue || 0,
            unitPriceMode: item.unitPriceMode || 'TTC',
            lineDiscountPct: (discountMode === 'per_line' && item.lineDiscountPct > 0) ? item.lineDiscountPct : undefined,
            puHT: undefined,
            puTTC: undefined,
            totalHT_brut: undefined,
            discountHT: undefined,
            totalHT_net: undefined,
            totalTTC: undefined
          };
          const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, discountMode === 'per_line');
          addQuoteItem(calculatedItem);
        }
      }

      // Ajout des frais
      if (feesInstallHT > 0) {
        const installItem: Omit<QuoteItem, 'id'> = {
          kind: 'TECH',
          type: 'Installation',
          reference: 'Frais d\'installation',
          mode: 'unique',
          qty: 1,
          unitPriceValue: feesInstallHT,
          unitPriceMode: 'HT',
          lineDiscountPct: undefined,
          puHT: undefined,
          puTTC: undefined,
          totalHT_brut: undefined,
          discountHT: undefined,
          totalHT_net: undefined,
          totalTTC: undefined
        };
        const calculatedItem = calculateQuoteItem(installItem as QuoteItem, settings.tvaPct, discountMode === 'per_line');
        addQuoteItem(calculatedItem);
      }

      if (feesDossierHT > 0) {
        const dossierItem: Omit<QuoteItem, 'id'> = {
          kind: 'TECH',
          type: 'Autre',
          reference: 'Frais de dossier',
          mode: 'unique',
          qty: 1,
          unitPriceValue: feesDossierHT,
          unitPriceMode: 'HT',
          lineDiscountPct: undefined,
          puHT: undefined,
          puTTC: undefined,
          totalHT_brut: undefined,
          discountHT: undefined,
          totalHT_net: undefined,
          totalTTC: undefined
        };
        const calculatedItem = calculateQuoteItem(dossierItem as QuoteItem, settings.tvaPct, discountMode === 'per_line');
        addQuoteItem(calculatedItem);
      }

      setEmailRaw('');
      toast({
        title: "Extraction réussie",
        description: "Les informations ont été extraites et ajoutées au devis.",
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'extraction:', error);
      toast({
        title: "Erreur d'extraction",
        description: error.message || "Une erreur est survenue lors de l'extraction.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEmail(false);
    }
  };

  const handleClientSelect = (client: any) => {
    if (client) {
      const newContactAddress = {
        company: client.company || '',
        name: client.name,
        firstName: client.firstName || client.first_name || '',
        lastName: client.lastName || client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        street: client.address || '',
        city: client.city || '',
        postalCode: client.postal_code || '',
        country: client.country || 'Suisse'
      };
      
      updateQuote({ 
        client: client.name,
        addresses: { 
          ...currentQuote.addresses, 
          contact: newContactAddress,
          // Si pas d'adresses séparées, propager à tous
          billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newContactAddress,
          installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newContactAddress
        } 
      });
    }
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    const currentItem = currentQuote.items.find(item => item.id === id);
    if (!currentItem) return;

    const updatedItem = { ...currentItem, ...updates };
    const calculatedItem = calculateQuoteItem(updatedItem, settings.tvaPct, currentQuote.discountMode === 'per_line');
    updateQuoteItem(id, calculatedItem);
  };

  const activeSubscriptions = settings.subscriptions.filter(s => s.active);

  const saveClientToDatabase = async () => {
    const contact = currentQuote.addresses.contact;
    
    // Validation des données minimales
    if (!contact.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du client est obligatoire pour sauvegarder",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          name: contact.name,
          first_name: contact.firstName || null,
          last_name: contact.lastName || null,
          company: contact.company || null,
          email: contact.email || null,
          phone: contact.phone || null,
          address: contact.street || null,
          city: contact.city || null,
          postal_code: contact.postalCode || null,
          country: contact.country || 'Suisse'
        }]);

      if (error) throw error;
      
      toast({
        title: "Client sauvegardé",
        description: `"${contact.name}" sauvegardé avec succès`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du client:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({
          title: "Erreur",
          description: "Ce client existe déjà dans la base de données",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la sauvegarde du client",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Import automatique depuis e-mail */}
      {settings.importEmail.enabled && (
        <Card className="shadow-soft border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Extraction automatique d'informations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailRaw">Coller l'e-mail ou un texte client</Label>
              <Textarea
                id="emailRaw"
                value={emailRaw}
                onChange={(e) => setEmailRaw(e.target.value)}
                placeholder={settings.importEmail.helpText}
                rows={6}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={processEmailExtraction} 
              disabled={isProcessingEmail || !emailRaw.trim()}
              className="w-full bg-primary hover:bg-primary-hover"
            >
              {isProcessingEmail ? 'Extraction en cours...' : 'Extraire les informations'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card className="shadow-soft border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-accent" />
              <span>Actions rapides</span>
            </div>
            <div className="flex items-center space-x-2">
              {currentQuote && (
              <PDFPreview 
                quote={currentQuote} 
                settings={settings} 
                variant={currentQuote.items.some(i => i.kind === 'TECH') && currentQuote.items.some(i => i.kind === 'AGENT') ? 'mixte' : currentQuote.items.some(i => i.kind === 'AGENT') ? 'agent' : 'technique'} 
              />
              )}
              <Button 
                onClick={() => currentQuote && handleDownloadPdf(currentQuote, settings, currentQuote.items.some(i => i.kind === 'TECH') && currentQuote.items.some(i => i.kind === 'AGENT') ? 'mixte' : currentQuote.items.some(i => i.kind === 'AGENT') ? 'agent' : 'technique')} 
                variant="outline"
                disabled={exporting}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {exporting ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Numéro de devis</Label>
              <Input
                id="ref"
                value={currentQuote.ref}
                onChange={(e) => updateQuote({ ref: e.target.value })}
                placeholder="DEV-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={currentQuote.date}
                onChange={(e) => updateQuote({ date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informations client</span>
            <div className="flex items-center space-x-2">
              <ClientSelector onSelect={handleClientSelect} />
              <Button onClick={saveClientToDatabase} variant="outline" size="sm">
                Sauvegarder client
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientCivility">Civilité</Label>
              <Select
                value={currentQuote.clientCivility}
                onValueChange={(value: 'Monsieur' | 'Madame') => updateQuote({ clientCivility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monsieur">Monsieur</SelectItem>
                  <SelectItem value="Madame">Madame</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Site/Lieu</Label>
              <Input
                id="site"
                value={currentQuote.site}
                onChange={(e) => updateQuote({ site: e.target.value })}
                placeholder="Lieu d'intervention"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact sur site</Label>
              <Input
                id="contact"
                value={currentQuote.contact}
                onChange={(e) => updateQuote({ contact: e.target.value })}
                placeholder="Nom du contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canton">Canton</Label>
              <Select
                value={currentQuote.canton}
                onValueChange={(value) => updateQuote({ canton: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner canton" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GE">Genève (GE)</SelectItem>
                  <SelectItem value="VD">Vaud (VD)</SelectItem>
                  <SelectItem value="VS">Valais (VS)</SelectItem>
                  <SelectItem value="FR">Fribourg (FR)</SelectItem>
                  <SelectItem value="NE">Neuchâtel (NE)</SelectItem>
                  <SelectItem value="JU">Jura (JU)</SelectItem>
                  <SelectItem value="BE">Berne (BE)</SelectItem>
                  <SelectItem value="SO">Soleure (SO)</SelectItem>
                  <SelectItem value="BL">Bâle-Campagne (BL)</SelectItem>
                  <SelectItem value="BS">Bâle-Ville (BS)</SelectItem>
                  <SelectItem value="AG">Argovie (AG)</SelectItem>
                  <SelectItem value="ZH">Zurich (ZH)</SelectItem>
                  <SelectItem value="SH">Schaffhouse (SH)</SelectItem>
                  <SelectItem value="TG">Thurgovie (TG)</SelectItem>
                  <SelectItem value="SG">Saint-Gall (SG)</SelectItem>
                  <SelectItem value="AI">Appenzell Rhodes-Intérieures (AI)</SelectItem>
                  <SelectItem value="AR">Appenzell Rhodes-Extérieures (AR)</SelectItem>
                  <SelectItem value="GL">Glaris (GL)</SelectItem>
                  <SelectItem value="GR">Grisons (GR)</SelectItem>
                  <SelectItem value="TI">Tessin (TI)</SelectItem>
                  <SelectItem value="UR">Uri (UR)</SelectItem>
                  <SelectItem value="SZ">Schwyz (SZ)</SelectItem>
                  <SelectItem value="OW">Obwald (OW)</SelectItem>
                  <SelectItem value="NW">Nidwald (NW)</SelectItem>
                  <SelectItem value="LU">Lucerne (LU)</SelectItem>  
                  <SelectItem value="ZG">Zoug (ZG)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Adresse de contact (toujours présente) */}
          <div>
            <h4 className="font-medium mb-3 text-primary flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Adresse de contact</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-company">Société</Label>
                <Input
                  id="contact-company"
                  value={currentQuote.addresses.contact.company}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, company: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        // Si pas d'adresses séparées, propager à tous
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Nom de la société"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-firstName">Prénom</Label>
                <Input
                  id="contact-firstName"
                  value={currentQuote.addresses.contact.firstName || ''}
                  onChange={(e) => {
                    const newAddress = { 
                      ...currentQuote.addresses.contact, 
                      firstName: e.target.value,
                      name: `${e.target.value} ${currentQuote.addresses.contact.lastName || ''}`.trim()
                    };
                    updateQuote({ 
                      client: newAddress.name,
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-lastName">Nom de famille</Label>
                <Input
                  id="contact-lastName"
                  value={currentQuote.addresses.contact.lastName || ''}
                  onChange={(e) => {
                    const newAddress = { 
                      ...currentQuote.addresses.contact, 
                      lastName: e.target.value,
                      name: `${currentQuote.addresses.contact.firstName || ''} ${e.target.value}`.trim()
                    };
                    updateQuote({ 
                      client: newAddress.name,
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Nom de famille"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={currentQuote.addresses.contact.email}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, email: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="contact@exemple.ch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={currentQuote.addresses.contact.phone}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, phone: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="+41 21 XXX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-street">Adresse</Label>
                <Input
                  id="contact-street"
                  value={currentQuote.addresses.contact.street}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, street: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Rue et numéro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-postal">Code postal</Label>
                <Input
                  id="contact-postal"
                  value={currentQuote.addresses.contact.postalCode}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, postalCode: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-city">Ville</Label>
                <Input
                  id="contact-city"
                  value={currentQuote.addresses.contact.city}
                  onChange={(e) => {
                    const newAddress = { ...currentQuote.addresses.contact, city: e.target.value };
                    updateQuote({ 
                      addresses: { 
                        ...currentQuote.addresses, 
                        contact: newAddress,
                        billing: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.billing : newAddress,
                        installation: currentQuote.addresses.useSeparateAddresses ? currentQuote.addresses.installation : newAddress
                      } 
                    });
                  }}
                  placeholder="Lausanne"
                />
              </div>
            </div>
          </div>

          {/* Adresses séparées si activées */}
          {currentQuote.addresses.useSeparateAddresses && (
            <>
              <Separator />
              
              {/* Adresse de facturation */}
              <div>
                <h4 className="font-medium mb-3 text-success flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Adresse de facturation</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-company">Société</Label>
                    <Input
                      id="billing-company"
                      value={currentQuote.addresses.billing.company}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, company: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom de la société"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-name">Contact</Label>
                    <Input
                      id="billing-name"
                      value={currentQuote.addresses.billing.name}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, name: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={currentQuote.addresses.billing.email}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, email: e.target.value } 
                          } 
                        })
                      }
                      placeholder="facture@exemple.ch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-phone">Téléphone</Label>
                    <Input
                      id="billing-phone"
                      type="tel"
                      value={currentQuote.addresses.billing.phone}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, phone: e.target.value } 
                          } 
                        })
                      }
                      placeholder="+41 21 XXX XX XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-street">Adresse</Label>
                    <Input
                      id="billing-street"
                      value={currentQuote.addresses.billing.street}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, street: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Rue et numéro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-postal">Code postal</Label>
                    <Input
                      id="billing-postal"
                      value={currentQuote.addresses.billing.postalCode}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, postalCode: e.target.value } 
                          } 
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">Ville</Label>
                    <Input
                      id="billing-city"
                      value={currentQuote.addresses.billing.city}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            billing: { ...currentQuote.addresses.billing, city: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Lausanne"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Adresse d'installation */}
              <div>
                <h4 className="font-medium mb-3 text-warning flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Adresse d'installation</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="install-company">Société</Label>
                    <Input
                      id="install-company"
                      value={currentQuote.addresses.installation.company}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, company: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom de la société"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-name">Contact</Label>
                    <Input
                      id="install-name"
                      value={currentQuote.addresses.installation.name}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, name: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-email">Email</Label>
                    <Input
                      id="install-email"
                      type="email"
                      value={currentQuote.addresses.installation.email}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, email: e.target.value } 
                          } 
                        })
                      }
                      placeholder="installation@exemple.ch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-phone">Téléphone</Label>
                    <Input
                      id="install-phone"
                      type="tel"
                      value={currentQuote.addresses.installation.phone}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, phone: e.target.value } 
                          } 
                        })
                      }
                      placeholder="+41 21 XXX XX XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-street">Adresse</Label>
                    <Input
                      id="install-street"
                      value={currentQuote.addresses.installation.street}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, street: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Rue et numéro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-postal">Code postal</Label>
                    <Input
                      id="install-postal"
                      value={currentQuote.addresses.installation.postalCode}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, postalCode: e.target.value } 
                          } 
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="install-city">Ville</Label>
                    <Input
                      id="install-city"
                      value={currentQuote.addresses.installation.city}
                      onChange={(e) => 
                        updateQuote({ 
                          addresses: { 
                            ...currentQuote.addresses, 
                            installation: { ...currentQuote.addresses.installation, city: e.target.value } 
                          } 
                        })
                      }
                      placeholder="Lausanne"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Description des prestations Agent */}
      {currentQuote.items.some(item => item.kind === 'AGENT') && (
        <AgentDescriptionEditor
          description={currentQuote.agentDescription || {}}
          onUpdate={(description) => updateQuote({ agentDescription: description })}
          onPreview={async () => {
            try {
              // Créer un quote temporaire avec seulement la description d'agent
              const previewQuote = {
                ...currentQuote,
                items: [], // Pas d'items pour le preview de la description seule
                agentDescription: currentQuote.agentDescription
              };
              
              // Générer le DOM de preview
              const dom = await renderPDFFromLayout(previewQuote, settings, 'agent');
              
              // Créer une nouvelle fenêtre pour afficher le preview
              const previewWindow = window.open('', '_blank', 'width=800,height=600');
              if (previewWindow) {
                previewWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Aperçu Description Agent</title>
                      <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                        .preview-container { max-width: 800px; margin: 0 auto; }
                      </style>
                    </head>
                    <body>
                      <div class="preview-container">
                        ${dom.outerHTML}
                      </div>
                    </body>
                  </html>
                `);
                previewWindow.document.close();
              }
            } catch (error) {
              toast({
                title: "Erreur",
                description: "Impossible de générer l'aperçu PDF",
                variant: "destructive"
              });
            }
          }}
        />
      )}

      {/* Boutons rapides frais par défaut */}
      {(settings.defaults.feesInstallHT > 0 || settings.defaults.feesDossierHT > 0) && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-warning" />
              <span>Frais par défaut (HT)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {settings.defaults.feesInstallHT > 0 && (
                <Button
                  variant="outline"
                  onClick={() => addDefaultFeeQuick('install')}
                  className="bg-warning-light text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  Frais d'installation - {settings.defaults.feesInstallHT.toFixed(2)} CHF
                </Button>
              )}
              {settings.defaults.feesDossierHT > 0 && (
                <Button
                  variant="outline"
                  onClick={() => addDefaultFeeQuick('dossier')}
                  className="bg-warning-light text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  Frais de dossier - {settings.defaults.feesDossierHT.toFixed(2)} CHF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons rapides abonnements */}
      {activeSubscriptions.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Abonnements mensuels (TTC/mois)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeSubscriptions.map((subscription) => (
                <Button
                  key={subscription.id}
                  variant="outline"
                  onClick={() => addSubscriptionQuick(subscription.id)}
                  className="bg-success-light text-success hover:bg-success hover:text-success-foreground"
                >
                  {subscription.label} - {(subscription.puTTC || 0).toFixed(2)} CHF
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matériel & prestations */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Matériel & prestations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section Nature de prestation */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <Label className="font-semibold text-primary mb-3 block">Nature de prestation :</Label>
            <div className="flex gap-2">
              <Button
                variant={newItemKind === 'TECH' ? 'default' : 'outline'}
                onClick={() => setNewItemKind('TECH')}
                size="sm"
                className="transition-all"
              >
                <Shield className="h-4 w-4 mr-2" />
                Technique
              </Button>
              <Button
                variant={newItemKind === 'AGENT' ? 'default' : 'outline'}
                onClick={() => setNewItemKind('AGENT')}
                size="sm"
                className="transition-all bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white border-amber-300"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Agent
              </Button>
            </div>
          </div>

          {/* Mémoire dernier devis */}
          <SavedQuoteManager currentClient={currentQuote.client} />

          {/* Boutons rapides pour TECH */}
          {newItemKind === 'TECH' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Prestations techniques</h4>
                {(settings.catalog?.length > 0) ? 
                  <ProductSelector 
                    onProductSelect={(item) => addQuoteItem(item)} 
                    mode={newItemMode} 
                  /> : 
                  <div className="text-sm text-muted-foreground">
                    Aucun produit configuré. Allez dans les Paramètres pour configurer le catalogue.
                  </div>
                }
              </div>
            </div>
          )}

          {/* Générateur de vacations pour AGENT */}
          {newItemKind === 'AGENT' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-amber-800">Vacations d'agents</h4>
                  <Button
                    onClick={() => setShowVacationGenerator(true)}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Série de vacations
                  </Button>
                </div>
                
                {showVacationGenerator && (
                <VacationSeriesGenerator
                  settings={settings}
                  onAddVacations={addVacationSeries}
                />
                )}
              </div>
            </div>
          )}

          {/* Mode de remise */}
          <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <Label>Mode de remise</Label>
              <Select
                value={currentQuote.discountMode}
                onValueChange={(value: 'per_line' | 'global') => updateQuote({ discountMode: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_line">Remise par ligne</SelectItem>
                  <SelectItem value="global">Remise globale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentQuote.discountMode === 'global' && (
              <div className="space-y-2">
                <Label htmlFor="globalDiscount">Remise globale (%)</Label>
                 <Input
                   id="globalDiscount"
                   type="number"
                   step="0.01"
                   value={currentQuote.discountPct || ''}
                   onChange={(e) => updateQuote({ discountPct: parseFloat(e.target.value) || undefined })}
                   className="w-24"
                   placeholder="0"
                 />
              </div>
            )}
          </div>

          {/* Tableau des items */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">  
                  <th className="p-2 text-left border border-border font-medium">Nature</th>
                  <th className="p-2 text-left border border-border font-medium">Type</th>
                  <th className="p-2 text-left border border-border font-medium">Référence</th>
                  <th className="p-2 text-center border border-border font-medium">Mode</th>
                  <th className="p-2 text-center border border-border font-medium">Qté</th>
                  <th className="p-2 text-center border border-border font-medium">Prix unitaire</th>
                  <th className="p-2 text-center border border-border font-medium">Mode prix</th>
                  {currentQuote.discountMode === 'per_line' && (
                    <th className="p-2 text-center border border-border font-medium">Remise %</th>
                  )}
                  <th className="p-2 text-right border border-border font-medium">Total HT</th>
                  <th className="p-2 text-right border border-border font-medium">Total TTC</th>
                  <th className="p-2 text-center border border-border font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item) => (
                  item.kind === 'TECH' ? (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="p-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">TECH</Badge>
                      </td>
                      <td className="p-2">
                        {item.type?.includes('Autre - ') ? (
                          <div className="flex items-center">
                            <Input
                              value={item.type.replace('Autre - ', '')}
                              onChange={(e) => updateItem(item.id, { type: `Autre - ${e.target.value}` })}
                              className="w-full"
                              onBlur={() => {
                                if (item.type === 'Autre - ') {
                                  updateItem(item.id, { type: 'Autre' });
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateItem(item.id, { type: 'Autre' })}
                              className="ml-2 p-1"
                            >
                              Retour
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={item.type}
                            onValueChange={(value) => {
                              if (value === 'Autre') {
                                updateItem(item.id, { type: 'Autre - ' });
                              } else {
                                updateItem(item.id, { type: value });
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {settings.types.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.reference}
                          onChange={(e) => updateItem(item.id, { reference: e.target.value })}
                          className="w-40"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={item.mode}
                          onValueChange={(value: 'unique' | 'mensuel') => updateItem(item.id, { mode: value })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unique">Unique</SelectItem>
                            <SelectItem value="mensuel">Mensuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty || ''}
                          onChange={(e) => updateItem(item.id, { qty: parseInt(e.target.value) || undefined })}
                          className="w-20"
                          placeholder="Qté"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPriceValue || ''}
                          onChange={(e) => updateItem(item.id, { unitPriceValue: parseFloat(e.target.value) || undefined })}
                          className="w-24"
                          placeholder="Prix"
                        />
                      </td>
                      <td className="p-2">
                        <Switch
                          checked={item.unitPriceMode === 'HT'}
                          onCheckedChange={(checked) => updateItem(item.id, { unitPriceMode: checked ? 'HT' : 'TTC' })}
                        />
                      </td>
                      {currentQuote.discountMode === 'per_line' && (
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.lineDiscountPct || ''}
                            onChange={(e) => updateItem(item.id, { lineDiscountPct: parseFloat(e.target.value) || undefined })}
                            className="w-20"
                            placeholder="%"
                          />
                        </td>
                      )}
                      <td className="p-2 font-medium">
                        {(item.totalHT_net || 0).toFixed(2)} CHF
                      </td>
                      <td className="p-2 font-medium">
                        {(item.totalTTC || 0).toFixed(2)} CHF
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateQuoteItem(item.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteQuoteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AgentVacationRow
                      key={item.id}
                      item={item}
                      settings={settings}
                      onUpdate={(id, updates) => updateQuoteItem(id, updates)}
                      onDuplicate={() => duplicateQuoteItem(item.id)}
                      onDelete={() => deleteQuoteItem(item.id)}
                    />
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* Ajouter ligne */}
          <div className="flex items-center gap-4 flex-wrap">
            {newItemKind === 'TECH' && (
              <>
                <Select value={newItemMode} onValueChange={(value: 'unique' | 'mensuel') => setNewItemMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unique">Unique</SelectItem>
                    <SelectItem value="mensuel">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addNewItem} className="bg-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter ligne technique
                </Button>
              </>
            )}
            {newItemKind === 'AGENT' && (
              <Button onClick={addNewItem} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter vacation d'agent
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commentaire */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Commentaire du devis</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentQuote.comment}
            onChange={(e) => updateQuote({ comment: e.target.value })}
            placeholder={settings.defaultComment}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Bouton Reset */}
      <Card className="shadow-soft border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                const { createNewQuote } = useStore.getState();
                createNewQuote();
                toast({
                  title: "Devis réinitialisé",
                  description: "Tous les champs ont été remis à zéro.",
                });
              }}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Réinitialiser le devis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevisScreen;
