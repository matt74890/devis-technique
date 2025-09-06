import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileDown, Calculator, Euro } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateQuoteTotals } from '@/utils/calculations';
import { toast } from 'sonner';
import PDFPreview from '@/components/pdf/PDFPreview';

const RecapScreen = () => {
  const { currentQuote, settings } = useStore();

  if (!currentQuote) return null;

  const totals = calculateQuoteTotals(currentQuote, settings.tvaPct);
  
  const generatePDF = () => {
    console.log('Début génération PDF');
    
    // Validation des données requises
    if (!currentQuote.ref) {
      console.log('Erreur: Référence manquante');
      toast.error('Veuillez renseigner une référence pour le devis');
      return;
    }
    
    if (!currentQuote.client) {
      console.log('Erreur: Client manquant');  
      toast.error('Veuillez sélectionner ou renseigner un client');
      return;
    }
    
    if (currentQuote.items.length === 0) {
      console.log('Erreur: Aucune ligne dans le devis');
      toast.error('Veuillez ajouter au moins une ligne au devis');
      return;
    }
    
    console.log('Validation passée, génération du contenu PDF');
    
    let pdfContent = '';
    
    // Ajouter la lettre de présentation si activée
    if (settings.letterTemplate?.enabled) {
      const letterDate = new Date().toLocaleDateString('fr-FR');
      const clientAddress = currentQuote.addresses.contact;
      
      pdfContent += `${settings.letterTemplate.companyName}
${settings.letterTemplate.companyAddress}
${settings.letterTemplate.contactName} - ${settings.letterTemplate.contactTitle}
Tél: ${settings.letterTemplate.contactPhone}
Email: ${settings.letterTemplate.contactEmail}

                                                    ${letterDate}

À l'attention de :
${clientAddress.company || ''}
${clientAddress.name}
${clientAddress.street}
${clientAddress.postalCode} ${clientAddress.city}

Objet: ${settings.letterTemplate.subject}

${settings.letterTemplate.opening}

${settings.letterTemplate.body}

${settings.letterTemplate.closing}

Cordialement,

${settings.sellerInfo?.name || settings.letterTemplate.contactName}
${settings.sellerInfo?.title || settings.letterTemplate.contactTitle}
${settings.sellerInfo?.email || settings.letterTemplate.contactEmail}
${settings.sellerInfo?.phone || settings.letterTemplate.contactPhone}


═══════════════════════════════════════════════════════════════
                            DEVIS DÉTAILLÉ
═══════════════════════════════════════════════════════════════

`;
    }
    
    // Ajouter le devis avec informations vendeur
    pdfContent += `DEVIS ${currentQuote.ref}
Date: ${new Date(currentQuote.date).toLocaleDateString('fr-CH')}
Client: ${currentQuote.client}

${settings.sellerInfo?.name ? `Votre conseiller: ${settings.sellerInfo.name}${settings.sellerInfo.title ? ` - ${settings.sellerInfo.title}` : ''}
Contact direct: ${settings.sellerInfo.email || ''} | ${settings.sellerInfo.phone || ''}

` : ''}DÉTAIL DES LIGNES:
${currentQuote.items.map(item => 
  `${item.reference} - ${item.qty} x ${item.puTTC.toFixed(2)} CHF = ${item.totalTTC.toFixed(2)} CHF`
).join('\n')}

TOTAL: ${totals.global.totalTTC.toFixed(2)} CHF
${totals.mensuel.totalTTC > 0 ? `+ ${totals.mensuel.totalTTC.toFixed(2)} CHF/mois` : ''}

${settings.sellerInfo?.name ? `─────────────────────────────────────────────────────
Pour toute question concernant ce devis :
${settings.sellerInfo.name}${settings.sellerInfo.title ? ` - ${settings.sellerInfo.title}` : ''}
${settings.sellerInfo.email || ''} | ${settings.sellerInfo.phone || ''}` : ''}
    `;
    
    try {
      console.log('Création du blob et téléchargement');
      // Simuler le téléchargement
      const blob = new Blob([pdfContent], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settings.letterTemplate?.enabled ? 'lettre-et-devis' : 'devis'}-${currentQuote.ref || 'nouveau'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('PDF généré avec succès');
      toast.success(`${settings.letterTemplate?.enabled ? 'Lettre de présentation et devis' : 'Devis'} généré avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec infos devis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Récapitulatif du devis</span>
            </div>
            <div className="flex space-x-2">
              <PDFPreview />
              <Button onClick={generatePDF} className="bg-primary hover:bg-primary-hover">
                <FileDown className="h-4 w-4 mr-2" />
                Générer PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Informations générales</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{currentQuote.ref || 'Non définie'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{currentQuote.client || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(currentQuote.date).toLocaleDateString('fr-CH')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA</p>
                  <p className="font-medium">{settings.tvaPct}%</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Adresses</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Contact</p>
                  <p className="text-sm">{currentQuote.addresses.contact.company}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.name}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.street}</p>
                  <p className="text-sm">{currentQuote.addresses.contact.postalCode} {currentQuote.addresses.contact.city}</p>
                  {currentQuote.addresses.contact.email && (
                    <p className="text-sm text-primary">{currentQuote.addresses.contact.email}</p>
                  )}
                  {currentQuote.addresses.contact.phone && (
                    <p className="text-sm">{currentQuote.addresses.contact.phone}</p>
                  )}
                </div>
                
                {currentQuote.addresses.useSeparateAddresses && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Facturation</p>
                      <p className="text-sm">{currentQuote.addresses.billing.company}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.name}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.street}</p>
                      <p className="text-sm">{currentQuote.addresses.billing.postalCode} {currentQuote.addresses.billing.city}</p>
                      {currentQuote.addresses.billing.email && (
                        <p className="text-sm text-success">{currentQuote.addresses.billing.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Installation</p>
                      <p className="text-sm">{currentQuote.addresses.installation.company}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.name}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.street}</p>
                      <p className="text-sm">{currentQuote.addresses.installation.postalCode} {currentQuote.addresses.installation.city}</p>
                      {currentQuote.addresses.installation.email && (
                        <p className="text-sm text-warning">{currentQuote.addresses.installation.email}</p>
                      )}
                    </div>
                  </>
                )}
                
                {!currentQuote.addresses.useSeparateAddresses && (
                  <Badge variant="outline" className="text-xs">
                    Même adresse pour facturation et installation
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes du devis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Détail des lignes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Référence</th>
                  <th className="text-left p-2">Mode</th>
                  <th className="text-left p-2">Qté</th>
                  <th className="text-left p-2">PU TTC</th>
                  <th className="text-left p-2">Remise</th>
                  <th className="text-left p-2">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <Badge variant="outline">{item.type}</Badge>
                    </td>
                    <td className="p-2">{item.reference}</td>
                    <td className="p-2">
                      <Badge variant={item.mode === 'mensuel' ? 'default' : 'secondary'}>
                        {item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                      </Badge>
                    </td>
                    <td className="p-2">{item.qty}</td>
                    <td className="p-2">{item.puTTC.toFixed(2)} CHF</td>
                    <td className="p-2">
                      {currentQuote.discountMode === 'per_line' 
                        ? `${item.lineDiscountPct}%` 
                        : 'Globale'
                      }
                    </td>
                    <td className="p-2 font-medium">{item.totalTTC.toFixed(2)} CHF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totaux séparés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achat unique */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-primary" />
              <span>Achat unique (one-shot)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.unique.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>Remise</span>
              <span className="font-medium text-success">-{totals.unique.discountHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>HT après remise</span>
              <span className="font-medium">{totals.unique.htAfterDiscount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({settings.tvaPct}%)</span>
              <span className="font-medium">{totals.unique.tva.toFixed(2)} CHF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total TTC (Unique)</span>
              <span className="text-primary">{totals.unique.totalTTC.toFixed(2)} CHF</span>
            </div>
          </CardContent>
        </Card>

        {/* Mensuel */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-success" />
              <span>Mensuel (abonnements)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.mensuel.subtotalHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>Remise</span>
              <span className="font-medium text-success">-{totals.mensuel.discountHT.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>HT après remise</span>
              <span className="font-medium">{totals.mensuel.htAfterDiscount.toFixed(2)} CHF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({settings.tvaPct}%)</span>
              <span className="font-medium">{totals.mensuel.tva.toFixed(2)} CHF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total TTC (Mensuel)</span>
              <span className="text-success">{totals.mensuel.totalTTC.toFixed(2)} CHF / mois</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total général */}
      <Card className="shadow-medium bg-gradient-card border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-xl">Total général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Sous-total HT global</p>
              <p className="text-lg font-semibold">{totals.global.subtotalHT.toFixed(2)} CHF</p>
            </div>
            {currentQuote.discountMode === 'global' && (
              <div>
                <p className="text-sm text-muted-foreground">Remise globale ({currentQuote.discountPct}%)</p>
                <p className="text-lg font-semibold text-success">-{totals.global.globalDiscountHT.toFixed(2)} CHF</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">HT après remise</p>
              <p className="text-lg font-semibold">{totals.global.htAfterDiscount.toFixed(2)} CHF</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">TVA totale ({settings.tvaPct}%)</p>
              <p className="text-xl font-semibold">{totals.global.tva.toFixed(2)} CHF</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total TTC global</p>
              <p className="text-2xl font-bold text-primary">{totals.global.totalTTC.toFixed(2)} CHF</p>
            </div>
          </div>
          
          {totals.mensuel.totalTTC > 0 && (
            <div className="text-center p-4 bg-success-light rounded-lg">
              <p className="text-sm text-success font-medium">
                + {totals.mensuel.totalTTC.toFixed(2)} CHF / mois récurrent
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commentaire */}
      {currentQuote.comment && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Commentaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {currentQuote.comment}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecapScreen;