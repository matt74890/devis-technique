// Types pour le système de layout PDF
export type LayoutVariant = 'technique' | 'agent' | 'mixte';

export interface LayoutBlock {
  id: string;
  type: 'header' | 'footer' | 'intent' | 'letter' | 'description' | 'table_tech' | 'table_agent' | 'table_service' | 'totals' | 'signatures' | 'text' | 'image' | 'separator';
  x: number; // Position X en mm
  y: number; // Position Y en mm
  width: number; // Largeur en mm
  height: number; // Hauteur en mm
  visible: boolean;
  locked: boolean;
  zIndex: number;
  
  // Style
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    color: string;
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    padding: number;
    lineHeight: number;
  };
  
  // Contenu et liaisons de données
  content?: string;
  bindings: { [key: string]: string }; // Ex: {text: "{{quoteRef}}", left: "GPA Sécurité"}
  
  // Conditions d'affichage
  visibleIf?: string; // Ex: "hasTech", "page.index===0"
  
  // Configuration spécifique pour les tableaux
  tableConfig?: {
    dataset: 'items.tech' | 'items.agent' | 'items.service';
    columns: TableColumn[];
    repeatHeader: boolean;
    showTotals: boolean;
  };
  
  // Options de pagination
  pageBreak?: {
    before: boolean;
    after: boolean;
    avoidBreak: boolean;
  };
}

export interface TableColumn {
  id: string;
  label: string;
  binding: string; // Ex: "reference", "quantity", "unitPrice"
  width: number; // Largeur en mm ou pourcentage
  widthUnit: 'mm' | '%';
  align: 'left' | 'center' | 'right';
  format?: 'currency' | 'date' | 'hours' | 'number';
  visible: boolean;
  visibleIf?: string; // Condition d'affichage
  order: number;
}

export interface PDFLayoutConfig {
  id: string;
  name: string;
  variant: LayoutVariant;
  
  // Configuration de page
  page: {
    size: 'A4';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    grid: number; // Taille de la grille en mm
    unit: 'mm';
  };
  
  // Blocs de layout
  blocks: LayoutBlock[];
  
  // Règles de visibilité
  visibilityRules: { [key: string]: string }; // Ex: {"hasTech": "items.tech.length>0"}
  
  // Métadonnées
  metadata: {
    description: string;
    createdAt: string;
    updatedAt: string;
    isDefault?: boolean;
  };
}

// Configuration par défaut pour chaque variante
export const getDefaultLayoutForVariant = (variant: LayoutVariant): PDFLayoutConfig => {
  const baseConfig = {
    id: `default_${variant}`,
    name: `Devis ${variant === 'technique' ? 'Technique' : variant === 'agent' ? 'Agent' : 'Mixte'} (par défaut)`,
    variant,
    page: {
      size: 'A4' as const,
      orientation: 'portrait' as const,
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
      grid: 5,
      unit: 'mm' as const
    },
    visibilityRules: {
      hasTech: 'items.tech.length > 0',
      hasAgents: 'items.agent.length > 0',
      hasServices: 'items.service.length > 0',
      isFirstPage: 'page.index === 0',
      isLastPage: 'page.index === page.total - 1'
    },
    metadata: {
      description: `Mise en page par défaut pour les devis ${variant}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true
    }
  };

  // Blocs communs
  const commonBlocks: LayoutBlock[] = [
    // En-tête
    {
      id: 'header',
      type: 'header',
      x: 12, y: 10, width: 186, height: 18,
      visible: true, locked: false, zIndex: 1,
      style: {
        fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.4
      },
      bindings: {
        left: 'GPA Sécurité',
        right: 'Réf. : {{quoteRef}} • {{quoteDate}}'
      }
    },
    
    // Pied de page
    {
      id: 'footer',
      type: 'footer',
      x: 12, y: 277, width: 186, height: 10,
      visible: true, locked: false, zIndex: 1,
      style: {
        fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#666666', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.2
      },
      bindings: {
        left: 'GPA SA – Sécurité privée',
        right: 'Page {{currentPage}} / {{totalPages}}'
      }
    },
    
    // À l'intention de (page 1 uniquement)
    {
      id: 'intent',
      type: 'intent',
      x: 12, y: 34, width: 120, height: 28,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'isFirstPage',
      style: {
        fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 8, lineHeight: 1.4
      },
      bindings: {
        civility: '{{client.civility}}',
        company: '{{client.company}}',
        name: '{{client.name}}',
        address: '{{client.address}}'
      }
    },
    
    // Totaux
    {
      id: 'totals',
      type: 'totals',
      x: 112, y: 250, width: 86, height: 30,
      visible: true, locked: false, zIndex: 2,
      style: {
        fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'right', color: '#000000', backgroundColor: '#f8f9fa',
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, padding: 8, lineHeight: 1.4
      },
      bindings: {
        ht: '{{totals.global.ht}}',
        tva: '{{totals.global.tva}}',
        ttc: '{{totals.global.ttc}}'
      }
    },
    
    // Signatures
    {
      id: 'signatures',
      type: 'signatures',
      x: 12, y: 266, width: 186, height: 20,
      visible: true, locked: false, zIndex: 2,
      style: {
        fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.4
      },
      bindings: {
        vendorTitle: 'Le vendeur',
        clientTitle: 'Le client',
        date: '{{signatureDate}}',
        location: '{{signatureLocation}}'
      }
    }
  ];

  // Blocs spécifiques par variante
  let specificBlocks: LayoutBlock[] = [];
  let currentY = 70; // Position Y courante

  if (variant === 'technique' || variant === 'mixte') {
    // Lettre de présentation technique
    specificBlocks.push({
      id: 'letter_tech',
      type: 'letter',
      x: 12, y: currentY, width: 186, height: 40,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasTech',
      style: {
        fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'justify', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.5
      },
      bindings: {
        text: '{{introLetterTech}}'
      }
    });
    currentY += 50;

    // Titre technique
    specificBlocks.push({
      id: 'title_tech',
      type: 'text',
      x: 12, y: currentY, width: 186, height: 10,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasTech',
      style: {
        fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
        textAlign: 'left', color: '#2563eb', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.2
      },
      content: 'Matériel & prestations techniques',
      bindings: {}
    });
    currentY += 15;

    // Tableau technique
    specificBlocks.push({
      id: 'table_tech',
      type: 'table_tech',
      x: 12, y: currentY, width: 186, height: 60,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasTech',
      style: {
        fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 0, padding: 0, lineHeight: 1.3
      },
      bindings: {},
      tableConfig: {
        dataset: 'items.tech',
        repeatHeader: true,
        showTotals: true,
        columns: [
          { id: 'type', label: 'Type', binding: 'type', width: 15, widthUnit: '%', align: 'left', visible: true, order: 0 },
          { id: 'reference', label: 'Référence', binding: 'reference', width: 30, widthUnit: '%', align: 'left', visible: true, order: 1 },
          { id: 'mode', label: 'Mode', binding: 'mode', width: 10, widthUnit: '%', align: 'center', visible: true, order: 2 },
          { id: 'qty', label: 'Qté', binding: 'qty', width: 10, widthUnit: '%', align: 'center', visible: true, order: 3 },
          { id: 'puTTC', label: 'PU TTC', binding: 'puTTC', width: 15, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 4 },
          { id: 'totalTTC', label: 'Total TTC', binding: 'totalTTC', width: 20, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 5 }
        ]
      }
    });
    currentY += 70;
  }

  if (variant === 'agent' || variant === 'mixte') {
    // Description de la prestation agents
    specificBlocks.push({
      id: 'description_agents',
      type: 'description',
      x: 12, y: currentY, width: 186, height: 30,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasAgents',
      style: {
        fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: '#f8f9fa',
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, padding: 8, lineHeight: 1.4
      },
      bindings: {
        nature: '{{agentDescription.nature}}',
        lieu: '{{agentDescription.lieu}}',
        periode: '{{agentDescription.periode}}',
        horaires: '{{agentDescription.horaires}}',
        tenue: '{{agentDescription.tenue}}',
        pause: '{{agentDescription.pause}}',
        deplacement: '{{agentDescription.deplacement}}',
        remarque: '{{agentDescription.remarque}}'
      }
    });
    currentY += 40;

    // Titre agents
    specificBlocks.push({
      id: 'title_agents',
      type: 'text',
      x: 12, y: currentY, width: 186, height: 10,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasAgents',
      style: {
        fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
        textAlign: 'left', color: '#f59e0b', backgroundColor: 'transparent',
        borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.2
      },
      content: 'Agents de sécurité (vacations)',
      bindings: {}
    });
    currentY += 15;

    // Tableau agents
    specificBlocks.push({
      id: 'table_agents',
      type: 'table_agent',
      x: 12, y: currentY, width: 186, height: 80,
      visible: true, locked: false, zIndex: 2,
      visibleIf: 'hasAgents',
      style: {
        fontSize: 9, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 0, padding: 0, lineHeight: 1.2
      },
      bindings: {},
      tableConfig: {
        dataset: 'items.agent',
        repeatHeader: true,
        showTotals: true,
        columns: [
          { id: 'dateStart', label: 'Date début', binding: 'dateStart', width: 12, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 0 },
          { id: 'timeStart', label: 'H début', binding: 'timeStart', width: 8, widthUnit: '%', align: 'center', visible: true, order: 1 },
          { id: 'dateEnd', label: 'Date fin', binding: 'dateEnd', width: 12, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 2 },
          { id: 'timeEnd', label: 'H fin', binding: 'timeEnd', width: 8, widthUnit: '%', align: 'center', visible: true, order: 3 },
          { id: 'agentType', label: 'Type', binding: 'agentType', width: 10, widthUnit: '%', align: 'left', visible: true, order: 4 },
          { id: 'hoursNormal', label: 'H norm.', binding: 'hoursNormal', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 5 },
          { id: 'hoursNight', label: 'H nuit', binding: 'hoursNight', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 6 },
          { id: 'hoursSunday', label: 'H dim.', binding: 'hoursSunday', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 7 },
          { id: 'hoursHoliday', label: 'H JF', binding: 'hoursHoliday', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 8 },
          { id: 'rateCHFh', label: 'CHF/h', binding: 'rateCHFh', width: 8, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 9 },
          { id: 'lineTTC', label: 'Total TTC', binding: 'lineTTC', width: 10, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 10 }
        ]
      }
    });
  }

  return {
    ...baseConfig,
    blocks: [...commonBlocks, ...specificBlocks]
  };
};