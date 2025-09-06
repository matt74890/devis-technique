import { create } from 'zustand';
import { Settings, Quote, QuoteItem, Subscription, Product, PDFConfig, Currency, Address, LetterTemplate, SellerInfo, TemplateColors } from '@/types';

interface AppState {
  // Local state (non-persisted)
  currentQuote: Quote | null;
  quotes: Quote[];
  
  // Settings (will be managed by useUserSettings hook)
  settings: Settings;
  setSettings: (settings: Settings) => void;
  
  // Settings actions (deprecated - use useUserSettings hook instead)
  updateSettings: (settings: Partial<Settings>) => void;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addType: (type: string) => void;
  deleteType: (type: string) => void;
  
  // Product actions (deprecated - use useUserSettings hook instead)
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Address actions (deprecated - now in quotes)
  updateAddresses: () => void;
  
  // PDF Config actions (deprecated - use useUserSettings hook instead)
  updatePDFConfig: (config: PDFConfig) => void;
  
  // Quote actions
  createNewQuote: () => void;
  updateQuote: (quote: Partial<Quote>) => void;
  addQuoteItem: (item: Omit<QuoteItem, 'id'>) => void;
  updateQuoteItem: (id: string, item: Partial<QuoteItem>) => void;
  deleteQuoteItem: (id: string) => void;
  duplicateQuoteItem: (id: string) => void;
}

const defaultCurrency: Currency = {
  code: 'CHF',
  symbol: 'CHF',
  name: 'Franc suisse',
  position: 'after'
};

const defaultAddress: Address = {
  company: '',
  name: '',
  street: '',
  city: '',
  postalCode: '',
  country: 'Suisse',
  email: '',
  phone: ''
};

const defaultPDFConfig: PDFConfig = {
  sections: {
    header: {
      enabled: true,
      title: 'En-tête',
      fields: [
        { id: '1', label: 'Logo', enabled: true, text: '', order: 0 },
        { id: '2', label: 'Titre', enabled: true, text: 'DEVIS TECHNIQUE', order: 1 },
        { id: '3', label: 'Date', enabled: true, text: '', order: 2 }
      ]
    },
    clientInfo: {
      enabled: true,
      title: 'Informations Client',
      fields: [
        { id: '4', label: 'Client', enabled: true, text: '', order: 0 },
        { id: '5', label: 'Site', enabled: true, text: '', order: 1 },
        { id: '6', label: 'Contact', enabled: true, text: '', order: 2 }
      ]
    },
    itemsTable: {
      enabled: true,
      title: 'Détail des Prestations',
      fields: [
        { id: '7', label: 'Type', enabled: true, text: '', order: 0 },
        { id: '8', label: 'Référence', enabled: true, text: '', order: 1 },
        { id: '9', label: 'Quantité', enabled: true, text: '', order: 2 },
        { id: '10', label: 'Prix unitaire', enabled: true, text: '', order: 3 },
        { id: '11', label: 'Total', enabled: true, text: '', order: 4 }
      ]
    },
    totals: {
      enabled: true,
      title: 'Totaux',
      fields: [
        { id: '12', label: 'Sous-total HT', enabled: true, text: '', order: 0 },
        { id: '13', label: 'TVA', enabled: true, text: '', order: 1 },
        { id: '14', label: 'Total TTC', enabled: true, text: '', order: 2 }
      ]
    },
    comments: {
      enabled: true,
      title: 'Commentaires',
      fields: [
        { id: '15', label: 'Commentaire', enabled: true, text: '', order: 0 }
      ]
    },
    footer: {
      enabled: true,
      title: 'Pied de page',
      fields: [
        { id: '16', label: 'Mentions légales', enabled: true, text: '#NousRendonsLaSuisseSure', order: 0 }
      ]
    }
  },
  customTexts: {
    'conditions': 'Conditions générales de vente disponibles sur demande.',
    'validite': 'Devis valable 30 jours.',
    'paiement': 'Paiement à 30 jours net.'
  }
};

const defaultSellerInfo: SellerInfo = {
  name: '',
  title: '',
  email: '',
  phone: ''
};

const defaultLetterTemplate: LetterTemplate = {
  enabled: false,
  companyName: '',
  contactName: '',
  contactTitle: '',
  contactPhone: '',
  contactEmail: '',
  companyAddress: '',
  subject: 'Proposition commerciale - Sécurité technique',
  opening: 'Madame, Monsieur,\n\nSuite à votre demande, nous avons le plaisir de vous adresser notre proposition commerciale.',
  body: 'Notre entreprise, spécialisée dans les solutions de sécurité technique, vous propose une offre adaptée à vos besoins spécifiques.\n\nVous trouverez ci-joint notre devis détaillé comprenant l\'ensemble des prestations et équipements nécessaires.',
  closing: 'Nous restons à votre disposition pour tout complément d\'information et espérons que notre proposition retiendra votre attention.\n\nDans l\'attente de votre retour, nous vous prions d\'agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.'
};

const defaultTemplateColors: TemplateColors = {
  primary: '#2563eb',
  secondary: '#64748b', 
  accent: '#059669'
};

const defaultSettings: Settings = {
  tvaPct: 8.10,
  priceInputModeDefault: 'TTC',
  currency: defaultCurrency,
  logoUrl: '',
  pdfTitle: 'Devis Technique',
  pdfFooter: 'Mentions légales - #NousRendonsLaSuisseSure',
  defaultComment: 'Merci de votre confiance.',
  letterTemplate: defaultLetterTemplate,
  sellerInfo: defaultSellerInfo,
  templateColors: defaultTemplateColors,
  subscriptions: [
    {
      id: '1',
      label: 'Raccordement alarme',
      puTTC: 50.00,
      active: true,
      defaultType: 'Autre',
      defaultRef: 'Raccordement alarme'
    },
    {
      id: '2', 
      label: 'Raccordement + interventions illimitées',
      puTTC: 109.00,
      active: true,
      defaultType: 'Autre',
      defaultRef: 'Raccordement + interventions'
    }
  ],
  types: [
    'Caméra', 'Détecteur', 'Centrale', 'Enregistreur', 
    'Serveur', 'Alimentation', 'Câblage', 'Installation', 'Autre'
  ],
  models: [],
  catalog: [],
  pdfConfig: defaultPDFConfig,
  defaults: {
    feesInstallHT: 150,
    feesDossierHT: 50,
    showFeesAsLines: true
  }
};

export { defaultSettings };

const createDefaultQuote = (): Quote => ({
  id: crypto.randomUUID(),
  ref: '',
  date: new Date().toISOString().split('T')[0],
  client: '',
  site: '',
  contact: '',
  canton: '',
  comment: '',
  discountMode: 'per_line',
  discountPct: undefined,
  items: [],
  addresses: {
    contact: { ...defaultAddress },
    billing: { ...defaultAddress },
    installation: { ...defaultAddress },
    useSeparateAddresses: false
  }
});

export const useStore = create<AppState>()((set, get) => ({
      settings: defaultSettings,
      currentQuote: createDefaultQuote(),
      quotes: [],

      setSettings: (settings) => set({ settings }),

      updateSettings: (newSettings) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),

      addSubscription: (subscription) =>
        set((state) => ({
          settings: {
            ...state.settings,
            subscriptions: [...state.settings.subscriptions, { 
              ...subscription, 
              id: crypto.randomUUID() 
            }]
          }
        })),

      updateSubscription: (id, subscription) =>
        set((state) => ({
          settings: {
            ...state.settings,
            subscriptions: state.settings.subscriptions.map(s => 
              s.id === id ? { ...s, ...subscription } : s
            )
          }
        })),

      deleteSubscription: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            subscriptions: state.settings.subscriptions.filter(s => s.id !== id)
          }
        })),

      addType: (type) =>
        set((state) => ({
          settings: {
            ...state.settings,
            types: [...state.settings.types, type]
          }
        })),

      deleteType: (type) =>
        set((state) => ({
          settings: {
            ...state.settings,
            types: state.settings.types.filter(t => t !== type)
          }
        })),

      // Product actions
      addProduct: (product) =>
        set((state) => ({
          settings: {
            ...state.settings,
            catalog: [...state.settings.catalog, { ...product, id: crypto.randomUUID() }]
          }
        })),

      updateProduct: (id, product) =>
        set((state) => ({
          settings: {
            ...state.settings,
            catalog: state.settings.catalog.map(p => 
              p.id === id ? { ...p, ...product } : p
            )
          }
        })),

      deleteProduct: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            catalog: state.settings.catalog.filter(p => p.id !== id)
          }
        })),

      // Address actions (deprecated - now in quotes)
      updateAddresses: () => set({}), // Kept for compatibility

      // PDF Config actions
      updatePDFConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            pdfConfig: config
          }
        })),

      createNewQuote: () => 
        set({ currentQuote: createDefaultQuote() }),

      updateQuote: (quote) =>
        set((state) => ({
          currentQuote: state.currentQuote ? { ...state.currentQuote, ...quote } : null
        })),

      addQuoteItem: (item) =>
        set((state) => ({
          currentQuote: state.currentQuote ? {
            ...state.currentQuote,
            items: [...state.currentQuote.items, { ...item, id: crypto.randomUUID() }]
          } : null
        })),

      updateQuoteItem: (id, item) =>
        set((state) => ({
          currentQuote: state.currentQuote ? {
            ...state.currentQuote,
            items: state.currentQuote.items.map(i => 
              i.id === id ? { ...i, ...item } : i
            )
          } : null
        })),

      deleteQuoteItem: (id) =>
        set((state) => ({
          currentQuote: state.currentQuote ? {
            ...state.currentQuote,
            items: state.currentQuote.items.filter(i => i.id !== id)
          } : null
        })),

      duplicateQuoteItem: (id) =>
        set((state) => {
          const item = state.currentQuote?.items.find(i => i.id === id);
          if (!item || !state.currentQuote) return state;
          
          return {
            currentQuote: {
              ...state.currentQuote,
              items: [...state.currentQuote.items, { 
                ...item, 
                id: crypto.randomUUID() 
              }]
            }
          };
        })
    }));