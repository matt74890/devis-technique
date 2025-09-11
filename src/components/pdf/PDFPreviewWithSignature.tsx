import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileDown, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/components/SettingsProvider';
import { calculateQuoteTotals } from '@/utils/calculations';
import { Quote, Settings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from '../signature/SignatureCanvas';
import ServiceDescription from '../agent/ServiceDescription';

interface PDFPreviewWithSignatureProps {
  quote: Quote;
  settings: Settings;
}

const PDFPreviewWithSignatureContent = ({ quote, settings }: PDFPreviewWithSignatureProps) => {
  const totals = calculateQuoteTotals(quote, settings.tvaPct);
  const colors = settings.templateColors || { primary: '#2563eb', secondary: '#64748b', accent: '#059669' };
  
  const hasAgentItems = quote.items.some(item => item.kind === 'AGENT');
  const hasTechItems = quote.items.some(item => item.kind === 'TECH');
  const isMixedQuote = hasAgentItems && hasTechItems;
  const isAgentOnlyQuote = hasAgentItems && !hasTechItems;
  const isTechOnlyQuote = hasTechItems && !hasAgentItems;

  // Determine quote title
  const getQuoteTitle = () => {
    if (isAgentOnlyQuote) return 'Devis Agent';
    if (isTechOnlyQuote) return 'Devis Technique';
    return 'Devis Technique et Agent';
  };

  // Use agent letter template if it's agent or mixed quote
  const letterTemplate = (hasAgentItems && settings.agentQuoteSettings?.letterTemplate) 
    ? settings.agentQuoteSettings.letterTemplate 
    : settings.letterTemplate;

  return (
    <div className="max-w-4xl mx-auto bg-white text-black space-y-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Page 1: Lettre de présentation */}
      {letterTemplate?.enabled && (
        <div className="page-break p-8 space-y-6">
          {/* En-tête avec logo seulement */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-20 mb-4" />
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm font-semibold">Réf: {quote.ref}</p>
            </div>
          </div>

          {/* Adresse client - uniquement dans la lettre */}
          <div className="mb-8">
            <p className="text-sm mb-4">À l'attention de :</p>
            <div className="ml-4 space-y-1">
              <p className="font-semibold">{quote.addresses.contact.company}</p>
              <p>{quote.addresses.contact.name}</p>
              <p>{quote.addresses.contact.street}</p>
              <p>{quote.addresses.contact.postalCode} {quote.addresses.contact.city}</p>
              <p>{quote.addresses.contact.country}</p>
            </div>
          </div>

          {/* Lieu et date */}
          <div className="text-right mb-6">
            <p>{settings.sellerInfo?.location || ''}, le {new Date(quote.date).toLocaleDateString('fr-CH')}</p>
          </div>

          {/* Objet */}
          <div className="mb-6">
            <p className={letterTemplate.boldOptions?.subject ? 'font-bold' : ''}
               style={{ textAlign: letterTemplate.textAlignment }}>
              Objet: {letterTemplate.subject}
            </p>
          </div>

          {/* Formule de politesse sans prénom */}
          <div className="mb-6">
            <p>{quote.clientCivility === 'Madame' ? 'Chère Madame,' : 'Cher Monsieur,'}</p>
          </div>

          {/* Corps de la lettre */}
          <div className="space-y-4">
            <p className={letterTemplate.boldOptions?.opening ? 'font-bold' : ''}
               style={{ textAlign: letterTemplate.textAlignment }}>
              {letterTemplate.opening}
            </p>

            <div className={letterTemplate.boldOptions?.body ? 'font-bold' : ''}
                 style={{ textAlign: letterTemplate.textAlignment, whiteSpace: 'pre-line' }}>
              {letterTemplate.body}
            </div>

            <p className={letterTemplate.boldOptions?.closing ? 'font-bold' : ''}
               style={{ textAlign: letterTemplate.textAlignment }}>
              {letterTemplate.closing}
            </p>
          </div>

          {/* Signature vendeur */}
          <div className="mt-12">
            <p className="mb-4">Cordialement,</p>
            <div className="space-y-2">
              <p className="font-semibold">{settings.sellerInfo?.name}</p>
              <p>{settings.sellerInfo?.title}</p>
              {settings.sellerInfo?.signature && (
                <img src={settings.sellerInfo.signature} alt="Signature" className="h-16" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page 2: Description de la prestation (uniquement pour les devis avec agents) */}
      {hasAgentItems && (
        <div className="page-break p-8 space-y-6">
          {/* En-tête avec logo et référence */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-20 mb-4" />
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm font-semibold">Réf: {quote.ref}</p>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center py-6" style={{ borderTop: `3px solid ${colors.primary}`, borderBottom: `1px solid ${colors.secondary}` }}>
            <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>Description de la prestation</h1>
          </div>

          {/* Contenu de la description */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Nature de la prestation</h3>
                <p className="text-sm border p-3 rounded bg-gray-50 min-h-16">
                  {quote.serviceDescription?.nature || 'Nature de la prestation à définir'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Lieu de prestation</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.lieu || quote.site || 'Lieu à définir'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Période</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.periode || 'Période à définir'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Horaires</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.horaires || 'Horaires à définir'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Tenue</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.tenue || 'Tenue standard'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Pause</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.pause || 'Pause selon convention'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Déplacement</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.deplacement || 'Frais de déplacement inclus'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Remarque</h3>
                <p className="text-sm border p-3 rounded bg-gray-50">
                  {quote.serviceDescription?.remarque || 'Aucune remarque particulière'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page 3: Devis proprement dit */}
      <div className="page-break p-8 space-y-6">
        {/* En-tête avec logo et adresse client (pour signature) */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-20 mb-4" />
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm font-semibold mb-4">Réf: {quote.ref}</p>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{quote.addresses.contact.company}</p>
              <p>{quote.addresses.contact.name}</p>
              <p>{quote.addresses.contact.street}</p>
              <p>{quote.addresses.contact.postalCode} {quote.addresses.contact.city}</p>
              <p>{quote.addresses.contact.country}</p>
            </div>
          </div>
        </div>

        {/* Titre du devis */}
        <div className="text-center py-6" style={{ borderTop: `3px solid ${colors.primary}`, borderBottom: `1px solid ${colors.secondary}` }}>
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>{getQuoteTitle()}</h1>
          <p className="text-lg mt-2" style={{ color: colors.secondary }}>Devis N° {quote.ref}</p>
          <p className="text-gray-500">Date: {new Date(quote.date).toLocaleDateString('fr-CH')}</p>
        </div>

        {/* Informations complémentaires */}
        {(quote.site || quote.contact || quote.canton) && (
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>Détails du projet</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {quote.site && <p><span className="font-medium">Site:</span> {quote.site}</p>}
              {quote.contact && <p><span className="font-medium">Contact:</span> {quote.contact}</p>}
              {quote.canton && <p><span className="font-medium">Canton:</span> {quote.canton}</p>}
            </div>
          </div>
        )}

        {/* Prestations TECH (si présentes) */}
        {hasTechItems && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>
              {isMixedQuote ? 'Prestations techniques' : 'Prestations'}
            </h3>
            <table className="w-full border-collapse" style={{ border: `1px solid ${colors.secondary}` }}>
              <thead>
                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                  <th className="px-3 py-3 text-left font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Type</th>
                  <th className="px-3 py-3 text-left font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Référence</th>
                  <th className="px-3 py-3 text-center font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Mode</th>
                  <th className="px-3 py-3 text-center font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Qté</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>PU TTC</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.filter(item => item.kind === 'TECH').map((item, index) => (
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td className="px-3 py-2" style={{ border: `1px solid ${colors.secondary}` }}>{item.type}</td>
                    <td className="px-3 py-2" style={{ border: `1px solid ${colors.secondary}` }}>{item.reference}</td>
                    <td className="px-3 py-2 text-center" style={{ border: `1px solid ${colors.secondary}` }}>
                      <span className="px-2 py-1 rounded text-xs" style={{ 
                        backgroundColor: item.mode === 'mensuel' ? colors.accent : colors.secondary,
                        color: 'white'
                      }}>
                        {item.mode === 'mensuel' ? 'Mensuel' : 'Unique'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center" style={{ border: `1px solid ${colors.secondary}` }}>{item.qty}</td>
                    <td className="px-3 py-2 text-right" style={{ border: `1px solid ${colors.secondary}` }}>{item.puTTC?.toFixed(2)} CHF</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ border: `1px solid ${colors.secondary}`, color: colors.primary }}>
                      {item.totalTTC?.toFixed(2)} CHF{item.mode === 'mensuel' ? '/mois' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section séparée pour les agents si devis mixte */}
        {hasAgentItems && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>
              {isMixedQuote ? 'Devis Agents' : 'Prestations d\'agents de sécurité'}
            </h3>
            <table className="w-full border-collapse" style={{ border: `1px solid ${colors.secondary}` }}>
              <thead>
                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                  <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Date début</th>
                  <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Heure début</th>
                  <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Date fin</th>
                  <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Heure fin</th>
                  <th className="px-2 py-3 text-left font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Type</th>
                  <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H norm.</th>
                  <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H nuit</th>
                  <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H dim.</th>
                  <th className="px-2 py-3 text-center font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>H JF</th>
                  <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Tarif CHF/h</th>
                  <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>Dépl.</th>
                  <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>HT</th>
                  <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>TVA</th>
                  <th className="px-2 py-3 text-right font-semibold text-xs" style={{ border: `1px solid ${colors.secondary}` }}>TTC</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.filter(item => item.kind === 'AGENT').map((item, index) => (
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.dateStart ? new Date(item.dateStart).toLocaleDateString('fr-CH') : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.timeStart || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.dateEnd ? new Date(item.dateEnd).toLocaleDateString('fr-CH') : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.timeEnd || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={{ border: `1px solid ${colors.secondary}` }}>{item.agentType || '-'}</td>
                    <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.hoursNormal?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.hoursNight?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.hoursSunday?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.hoursHoliday?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.rateCHFh?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.travelCHF?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.lineHT?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs" style={{ border: `1px solid ${colors.secondary}` }}>
                      {item.lineTVA?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold" style={{ border: `1px solid ${colors.secondary}`, color: colors.primary }}>
                      {item.lineTTC?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totaux sur une ligne avec codes couleurs */}
        <div className="flex flex-wrap justify-center gap-4 py-4">
          {/* Unique */}
          {(totals.unique.totalTTC > 0 && hasTechItems) && (
            <div className="p-3 rounded-lg border-2 bg-blue-50" style={{ borderColor: colors.secondary }}>
              <h4 className="font-semibold text-center text-sm" style={{ color: colors.secondary }}>Achat unique</h4>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: colors.secondary }}>
                  {totals.unique.totalTTC.toFixed(2)} CHF
                </p>
              </div>
            </div>
          )}

          {/* Mensuel */}
          {(totals.mensuel.totalTTC > 0 && hasTechItems) && (
            <div className="p-3 rounded-lg border-2 bg-green-50" style={{ borderColor: colors.accent }}>
              <h4 className="font-semibold text-center text-sm" style={{ color: colors.accent }}>Mensuel</h4>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: colors.accent }}>
                  {totals.mensuel.totalTTC.toFixed(2)} CHF/mois
                </p>
              </div>
            </div>
          )}

          {/* Agents */}
          {totals.agents.totalTTC > 0 && (
            <div className="p-3 rounded-lg border-2 bg-amber-50" style={{ borderColor: '#f59e0b' }}>
              <h4 className="font-semibold text-center text-sm" style={{ color: '#f59e0b' }}>Agents</h4>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: '#f59e0b' }}>
                  {totals.agents.totalTTC.toFixed(2)} CHF
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Total général */}
        <div className="p-6 rounded-lg text-center" style={{ 
          border: `3px solid ${colors.primary}`, 
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.accent}08)` 
        }}>
          <h4 className="font-bold text-2xl mb-4" style={{ color: colors.primary }}>TOTAL GÉNÉRAL</h4>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm" style={{ color: colors.secondary }}>Total HT</p>
              <p className="text-xl font-semibold" style={{ color: colors.primary }}>{totals.global.htAfterDiscount.toFixed(2)} CHF</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.secondary }}>TVA totale</p>
              <p className="text-xl font-semibold" style={{ color: colors.primary }}>{totals.global.tva.toFixed(2)} CHF</p>
            </div>
          </div>
          <div className="pt-4" style={{ borderTop: `2px solid ${colors.primary}` }}>
            <p className="text-3xl font-bold" style={{ color: colors.primary }}>
              {totals.global.totalTTC.toFixed(2)} CHF
            </p>
            {totals.mensuel.totalTTC > 0 && (
              <p className="text-xl font-semibold mt-2" style={{ color: colors.accent }}>
                + {totals.mensuel.totalTTC.toFixed(2)} CHF/mois
              </p>
            )}
          </div>
        </div>

        {/* Commentaire */}
        {quote.comment && (
          <div>
            <h4 className="font-semibold text-lg mb-3" style={{ color: colors.primary }}>Commentaires</h4>
            <div className="p-4 rounded-lg" style={{ border: `1px solid ${colors.secondary}`, backgroundColor: '#f8fafc' }}>
              <p className="whitespace-pre-wrap">{quote.comment}</p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Signature vendeur */}
          <div className="text-center p-4 border-2 border-dashed" style={{ borderColor: colors.secondary }}>
            <h4 className="font-semibold mb-4" style={{ color: colors.primary }}>Signature du vendeur</h4>
            <div className="space-y-2">
              <p className="font-medium">{settings.sellerInfo?.name}</p>
              <p className="text-sm">{settings.sellerInfo?.title}</p>
              {settings.sellerInfo?.signature && (
                <div className="flex justify-center">
                  <img src={settings.sellerInfo.signature} alt="Signature vendeur" className="h-16" />
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                <p>{settings.sellerInfo?.location}, le {new Date().toLocaleDateString('fr-CH')}</p>
              </div>
            </div>
          </div>

          {/* Signature client */}
          <div className="text-center p-4 border-2 border-dashed" style={{ borderColor: colors.secondary }}>
            <h4 className="font-semibold mb-4" style={{ color: colors.primary }}>Signature du client</h4>
            <div className="space-y-2">
              <p className="font-medium">{quote.client}</p>
              {quote.clientSignature?.signature && (
                <div className="flex justify-center">
                  <img src={quote.clientSignature.signature} alt="Signature client" className="h-16" />
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                {quote.clientSignature && (
                  <p>{quote.clientSignature.location}, le {new Date(quote.clientSignature.date).toLocaleDateString('fr-CH')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center text-sm pt-6 mt-8" style={{ borderTop: `2px solid ${colors.primary}`, color: colors.secondary }}>
          <p className="font-medium">{settings.pdfFooter}</p>
          <p className="mt-2">Devis valable 30 jours - Conditions générales disponibles sur demande</p>
        </div>
      </div>
    </div>
  );
};

const PDFPreviewWithSignature = () => {
  const { currentQuote, updateQuote } = useStore();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [showServiceDescription, setShowServiceDescription] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  if (!currentQuote) return null;

  const hasAgentItems = currentQuote.items.some(item => item.kind === 'AGENT');

  const handleSignatureChange = (signature: string) => {
    if (signature) {
      updateQuote({
        clientSignature: {
          signature,
          date: new Date().toISOString(),
          location: settings.sellerInfo?.location || ''
        }
      });
    } else {
      updateQuote({ clientSignature: undefined });
    }
  };

  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector('.pdf-content');
      
      if (!element) return;

      const opt = {
        margin: 0.5,
        filename: `devis_${currentQuote.client.replace(/\s+/g, '_')}_${currentQuote.date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
      
      toast({
        title: "PDF téléchargé",
        description: "Le PDF a été généré et téléchargé avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF.",
        variant: "destructive",
      });
    }
  };

  const downloadWord = () => {
    try {
      const element = document.querySelector('.pdf-content');
      if (!element) return;

      const htmlContent = element.innerHTML;
      const wordDocument = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset='utf-8'><title>Devis</title></head>
        <body>${htmlContent}</body>
        </html>
      `;

      const blob = new Blob(['\ufeff', wordDocument], {
        type: 'application/msword'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis_${currentQuote.client.replace(/\s+/g, '_')}_${currentQuote.date}.doc`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Word téléchargé",
        description: "Le document Word a été généré et téléchargé avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erreur Word:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du document Word.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Options avant génération */}
      <div className="flex flex-wrap gap-4">
        {hasAgentItems && (
          <Button
            variant="outline"
            onClick={() => setShowServiceDescription(!showServiceDescription)}
          >
            {showServiceDescription ? 'Masquer' : 'Configurer'} description de prestation
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => setShowSignature(!showSignature)}
        >
          {showSignature ? 'Masquer' : 'Ajouter'} signature client
        </Button>
      </div>

      {/* Configuration de la description de prestation */}
      {showServiceDescription && hasAgentItems && (
        <ServiceDescription
          quote={currentQuote}
          settings={settings}
          onUpdateDescription={(description) => updateQuote({ serviceDescription: description })}
        />
      )}

      {/* Zone de signature client */}
      {showSignature && (
        <div className="flex justify-center">
          <SignatureCanvas
            onSignatureChange={handleSignatureChange}
            existingSignature={currentQuote.clientSignature?.signature}
            title="Signature du client"
          />
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Aperçu</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du devis complet</DialogTitle>
            </DialogHeader>
            <div className="pdf-content">
              <PDFPreviewWithSignatureContent quote={currentQuote} settings={settings} />
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={downloadPDF} className="flex items-center space-x-2">
          <FileDown className="h-4 w-4" />
          <span>Télécharger PDF</span>
        </Button>

        <Button onClick={downloadWord} variant="outline" className="flex items-center space-x-2">
          <FileDown className="h-4 w-4" />
          <span>Télécharger Word</span>
        </Button>
      </div>

      {/* Contenu caché pour la génération PDF */}
      <div className="pdf-content" style={{ display: 'none' }}>
        <PDFPreviewWithSignatureContent quote={currentQuote} settings={settings} />
      </div>
    </div>
  );
};

export default PDFPreviewWithSignature;