import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, Quote, QuoteItem, Subscription } from '@/types';

interface AppState {
  settings: Settings;
  currentQuote: Quote | null;
  quotes: Quote[];
  
  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addType: (type: string) => void;
  deleteType: (type: string) => void;
  
  // Quote actions
  createNewQuote: () => void;
  updateQuote: (quote: Partial<Quote>) => void;
  addQuoteItem: (item: Omit<QuoteItem, 'id'>) => void;
  updateQuoteItem: (id: string, item: Partial<QuoteItem>) => void;
  deleteQuoteItem: (id: string) => void;
  duplicateQuoteItem: (id: string) => void;
}

const defaultSettings: Settings = {
  tvaPct: 8.10,
  priceInputModeDefault: 'TTC',
  logoUrl: '',
  pdfTitle: 'Devis Technique',
  pdfFooter: 'Mentions légales - #NousRendonsLaSuisseSure',
  defaultComment: 'Merci de votre confiance.',
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
  defaults: {
    feesInstallHT: 150,
    feesDossierHT: 50,
    showFeesAsLines: true
  }
};

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
  discountPct: 0,
  items: []
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      currentQuote: createDefaultQuote(),
      quotes: [],

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
    }),
    {
      name: 'devis-app-storage',
    }
  )
);