import { PDFLayoutConfig, LayoutVariant } from '@/types/layout';

// Templates préfabriqués pour chaque variante
export const createPrebuiltTemplates = (): PDFLayoutConfig[] => {
  return [
    // Template Technique Standard
    {
      id: 'template_tech_standard',
      name: 'Technique Standard - Mise en page classique',
      variant: 'technique',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 12, right: 12, bottom: 12, left: 12 },
        grid: 5,
        unit: 'mm'
      },
      blocks: [
        // En-tête avec logo
        {
          id: 'header_logo',
          type: 'header',
          x: 12, y: 8, width: 186, height: 20,
          visible: true, locked: false, zIndex: 1,
          style: {
            fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#2563eb', backgroundColor: '#f8fafc',
            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 8, lineHeight: 1.4
          },
          bindings: {
            left: 'GPA Sécurité - Solutions techniques',
            right: 'Devis n° {{quoteRef}} du {{quoteDate}}'
          }
        },
        
        // Informations client
        {
          id: 'client_info',
          type: 'intent',
          x: 12, y: 35, width: 120, height: 35,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'isFirstPage',
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 8, lineHeight: 1.5
          },
          bindings: {
            title: 'À l\'attention de :',
            civility: '{{client.civility}}',
            company: '{{client.company}}',
            name: '{{client.name}}',
            address: '{{client.address}}',
            site: 'Site : {{client.site}}'
          }
        },
        
        // Lettre technique
        {
          id: 'letter_intro',
          type: 'letter',
          x: 12, y: 78, width: 186, height: 45,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'justify', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.6
          },
          bindings: {
            text: 'Suite à votre demande, nous avons le plaisir de vous présenter notre proposition technique pour l\'installation d\'un système de sécurité adapté à vos besoins.\n\nNotre solution comprend des équipements de dernière génération, une installation professionnelle et un service de maintenance complet.'
          }
        },
        
        // Titre tableau technique
        {
          id: 'tech_title',
          type: 'text',
          x: 12, y: 130, width: 186, height: 12,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#2563eb', backgroundColor: '#f1f5f9',
            borderWidth: 0, borderColor: '#000000', borderRadius: 4, padding: 6, lineHeight: 1.2
          },
          content: '■ MATÉRIEL ET PRESTATIONS TECHNIQUES',
          bindings: {}
        },
        
        // Tableau technique
        {
          id: 'table_tech',
          type: 'table_tech',
          x: 12, y: 148, width: 186, height: 80,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 0, padding: 0, lineHeight: 1.3
          },
          bindings: {},
          tableConfig: {
            dataset: 'items.tech',
            repeatHeader: true,
            showTotals: true,
            columns: [
              { id: 'type', label: 'Type', binding: 'type', width: 18, widthUnit: '%', align: 'left', visible: true, order: 0 },
              { id: 'reference', label: 'Référence produit', binding: 'reference', width: 32, widthUnit: '%', align: 'left', visible: true, order: 1 },
              { id: 'mode', label: 'Mode', binding: 'mode', width: 12, widthUnit: '%', align: 'center', visible: true, order: 2 },
              { id: 'qty', label: 'Qté', binding: 'qty', width: 8, widthUnit: '%', align: 'center', visible: true, order: 3 },
              { id: 'puTTC', label: 'Prix unit. TTC', binding: 'puTTC', width: 15, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 4 },
              { id: 'totalTTC', label: 'Total TTC', binding: 'totalTTC', width: 15, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 5 }
            ]
          }
        },
        
        // Totaux
        {
          id: 'totals_box',
          type: 'totals',
          x: 120, y: 235, width: 78, height: 35,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'right', color: '#1e293b', backgroundColor: '#f8fafc',
            borderWidth: 2, borderColor: '#2563eb', borderRadius: 6, padding: 8, lineHeight: 1.4
          },
          bindings: {
            subtitleHT: 'Sous-total HT :',
            ht: '{{totals.global.ht}}',
            subtitleTVA: 'TVA ({{tvaPct}}%) :',
            tva: '{{totals.global.tva}}',
            subtitleTTC: 'TOTAL TTC :',
            ttc: '{{totals.global.ttc}}'
          }
        },
        
        // Signatures
        {
          id: 'signatures',
          type: 'signatures',
          x: 12, y: 276, width: 186, height: 15,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#64748b', backgroundColor: 'transparent',
            borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.3
          },
          bindings: {
            vendorTitle: 'Le prestataire',
            clientTitle: 'Le client',
            date: 'Date : {{signatureDate}}',
            location: 'Lieu : {{signatureLocation}}'
          }
        }
      ],
      visibilityRules: {
        hasTech: 'items.tech.length > 0',
        hasAgents: 'items.agent.length > 0',
        isFirstPage: 'page.index === 0',
        isLastPage: 'page.index === page.total - 1'
      },
      metadata: {
        description: 'Template professionnel pour devis techniques avec mise en page moderne',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      }
    },
    
    // Template Agent Standard
    {
      id: 'template_agent_standard',
      name: 'Agent Standard - Vacations sécurité',
      variant: 'agent',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 12, right: 12, bottom: 12, left: 12 },
        grid: 5,
        unit: 'mm'
      },
      blocks: [
        // En-tête
        {
          id: 'header_agent',
          type: 'header',
          x: 12, y: 8, width: 186, height: 18,
          visible: true, locked: false, zIndex: 1,
          style: {
            fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#f59e0b', backgroundColor: '#fffbeb',
            borderWidth: 1, borderColor: '#fbbf24', borderRadius: 4, padding: 6, lineHeight: 1.4
          },
          bindings: {
            left: 'GPA Sécurité - Services d\'agents',
            right: 'Devis n° {{quoteRef}} du {{quoteDate}}'
          }
        },
        
        // Informations client
        {
          id: 'client_info_agent',
          type: 'intent',
          x: 12, y: 32, width: 120, height: 30,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'isFirstPage',
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 8, lineHeight: 1.5
          },
          bindings: {
            civility: '{{client.civility}}',
            company: '{{client.company}}',
            name: '{{client.name}}',
            address: '{{client.address}}'
          }
        },
        
        // Description de la prestation
        {
          id: 'agent_description',
          type: 'description',
          x: 12, y: 68, width: 186, height: 40,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#374151', backgroundColor: '#f9fafb',
            borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 10, lineHeight: 1.5
          },
          bindings: {
            title: 'Description de la prestation :',
            nature: 'Nature : {{agentDescription.nature}}',
            lieu: 'Lieu : {{agentDescription.lieu}}',
            periode: 'Période : {{agentDescription.periode}}',
            horaires: 'Horaires : {{agentDescription.horaires}}',
            tenue: 'Tenue : {{agentDescription.tenue}}',
            remarque: 'Remarques : {{agentDescription.remarque}}'
          }
        },
        
        // Titre tableau agents
        {
          id: 'agents_title',
          type: 'text',
          x: 12, y: 115, width: 186, height: 12,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#f59e0b', backgroundColor: '#fffbeb',
            borderWidth: 0, borderColor: '#000000', borderRadius: 4, padding: 6, lineHeight: 1.2
          },
          content: '■ PLANNING DES VACATIONS',
          bindings: {}
        },
        
        // Tableau agents
        {
          id: 'table_agents',
          type: 'table_agent',
          x: 12, y: 133, width: 186, height: 100,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 9, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#374151', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#d1d5db', borderRadius: 0, padding: 0, lineHeight: 1.2
          },
          bindings: {},
          tableConfig: {
            dataset: 'items.agent',
            repeatHeader: true,
            showTotals: true,
            columns: [
              { id: 'dateStart', label: 'Date début', binding: 'dateStart', width: 13, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 0 },
              { id: 'timeStart', label: 'H début', binding: 'timeStart', width: 8, widthUnit: '%', align: 'center', visible: true, order: 1 },
              { id: 'dateEnd', label: 'Date fin', binding: 'dateEnd', width: 13, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 2 },
              { id: 'timeEnd', label: 'H fin', binding: 'timeEnd', width: 8, widthUnit: '%', align: 'center', visible: true, order: 3 },
              { id: 'agentType', label: 'Type agent', binding: 'agentType', width: 12, widthUnit: '%', align: 'left', visible: true, order: 4 },
              { id: 'hoursNormal', label: 'H norm.', binding: 'hoursNormal', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 5 },
              { id: 'hoursNight', label: 'H nuit', binding: 'hoursNight', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 6 },
              { id: 'hoursSunday', label: 'H dim.', binding: 'hoursSunday', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 7 },
              { id: 'hoursHoliday', label: 'H JF', binding: 'hoursHoliday', width: 8, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 8 },
              { id: 'rateCHFh', label: 'CHF/h', binding: 'rateCHFh', width: 8, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 9 },
              { id: 'lineTTC', label: 'Total TTC', binding: 'lineTTC', width: 10, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 10 }
            ]
          }
        },
        
        // Totaux
        {
          id: 'totals_agents',
          type: 'totals',
          x: 120, y: 240, width: 78, height: 30,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'right', color: '#92400e', backgroundColor: '#fffbeb',
            borderWidth: 2, borderColor: '#f59e0b', borderRadius: 6, padding: 8, lineHeight: 1.4
          },
          bindings: {
            ht: '{{totals.global.ht}}',
            tva: '{{totals.global.tva}}',
            ttc: '{{totals.global.ttc}}'
          }
        },
        
        // Signatures
        {
          id: 'signatures_agents',
          type: 'signatures',
          x: 12, y: 276, width: 186, height: 15,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#64748b', backgroundColor: 'transparent',
            borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.3
          },
          bindings: {
            vendorTitle: 'Le prestataire',
            clientTitle: 'Le client',
            date: '{{signatureDate}}',
            location: '{{signatureLocation}}'
          }
        }
      ],
      visibilityRules: {
        hasTech: 'items.tech.length > 0',
        hasAgents: 'items.agent.length > 0',
        isFirstPage: 'page.index === 0',
        isLastPage: 'page.index === page.total - 1'
      },
      metadata: {
        description: 'Template spécialisé pour les devis d\'agents de sécurité avec planning détaillé',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      }
    },
    
    // Template Mixte Complet
    {
      id: 'template_mixte_complete',
      name: 'Mixte Complet - Technique + Agents',
      variant: 'mixte',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        grid: 5,
        unit: 'mm'
      },
      blocks: [
        // En-tête
        {
          id: 'header_mixte',
          type: 'header',
          x: 10, y: 5, width: 190, height: 16,
          visible: true, locked: false, zIndex: 1,
          style: {
            fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#1e40af', backgroundColor: '#dbeafe',
            borderWidth: 1, borderColor: '#3b82f6', borderRadius: 4, padding: 6, lineHeight: 1.3
          },
          bindings: {
            left: 'GPA Sécurité - Solution complète technique + agents',
            right: 'Réf. {{quoteRef}} • {{quoteDate}}'
          }
        },
        
        // Client (compact)
        {
          id: 'client_mixte',
          type: 'intent',
          x: 10, y: 26, width: 100, height: 25,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'isFirstPage',
          style: {
            fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 3, padding: 6, lineHeight: 1.4
          },
          bindings: {
            civility: '{{client.civility}}',
            company: '{{client.company}}',
            name: '{{client.name}}'
          }
        },
        
        // Section technique
        {
          id: 'tech_section_title',
          type: 'text',
          x: 10, y: 56, width: 190, height: 8,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'hasTech',
          style: {
            fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#2563eb', backgroundColor: '#f1f5f9',
            borderWidth: 0, borderColor: '#000000', borderRadius: 3, padding: 4, lineHeight: 1.2
          },
          content: '■ MATÉRIEL TECHNIQUE',
          bindings: {}
        },
        
        // Tableau technique (compact)
        {
          id: 'table_tech_mixte',
          type: 'table_tech',
          x: 10, y: 68, width: 190, height: 50,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'hasTech',
          style: {
            fontSize: 9, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#334155', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 0, padding: 0, lineHeight: 1.2
          },
          bindings: {},
          tableConfig: {
            dataset: 'items.tech',
            repeatHeader: false,
            showTotals: true,
            columns: [
              { id: 'type', label: 'Type', binding: 'type', width: 16, widthUnit: '%', align: 'left', visible: true, order: 0 },
              { id: 'reference', label: 'Référence', binding: 'reference', width: 34, widthUnit: '%', align: 'left', visible: true, order: 1 },
              { id: 'qty', label: 'Qté', binding: 'qty', width: 10, widthUnit: '%', align: 'center', visible: true, order: 2 },
              { id: 'puTTC', label: 'PU TTC', binding: 'puTTC', width: 20, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 3 },
              { id: 'totalTTC', label: 'Total TTC', binding: 'totalTTC', width: 20, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 4 }
            ]
          }
        },
        
        // Section agents
        {
          id: 'agents_section_title',
          type: 'text',
          x: 10, y: 125, width: 190, height: 8,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'hasAgents',
          style: {
            fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'left', color: '#f59e0b', backgroundColor: '#fffbeb',
            borderWidth: 0, borderColor: '#000000', borderRadius: 3, padding: 4, lineHeight: 1.2
          },
          content: '■ PRESTATIONS AGENTS',
          bindings: {}
        },
        
        // Description agents (compact)
        {
          id: 'agent_desc_mixte',
          type: 'description',
          x: 10, y: 137, width: 190, height: 25,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'hasAgents',
          style: {
            fontSize: 9, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#374151', backgroundColor: '#f9fafb',
            borderWidth: 1, borderColor: '#d1d5db', borderRadius: 3, padding: 6, lineHeight: 1.3
          },
          bindings: {
            nature: '{{agentDescription.nature}}',
            lieu: '{{agentDescription.lieu}}',
            periode: '{{agentDescription.periode}}'
          }
        },
        
        // Tableau agents (compact)
        {
          id: 'table_agents_mixte',
          type: 'table_agent',
          x: 10, y: 167, width: 190, height: 60,
          visible: true, locked: false, zIndex: 2,
          visibleIf: 'hasAgents',
          style: {
            fontSize: 8, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#374151', backgroundColor: 'transparent',
            borderWidth: 1, borderColor: '#d1d5db', borderRadius: 0, padding: 0, lineHeight: 1.1
          },
          bindings: {},
          tableConfig: {
            dataset: 'items.agent',
            repeatHeader: false,
            showTotals: true,
            columns: [
              { id: 'dateStart', label: 'Début', binding: 'dateStart', width: 15, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 0 },
              { id: 'dateEnd', label: 'Fin', binding: 'dateEnd', width: 15, widthUnit: '%', align: 'left', format: 'date', visible: true, order: 1 },
              { id: 'agentType', label: 'Type', binding: 'agentType', width: 15, widthUnit: '%', align: 'left', visible: true, order: 2 },
              { id: 'hoursTotal', label: 'H total', binding: 'hoursTotal', width: 12, widthUnit: '%', align: 'center', format: 'hours', visible: true, order: 3 },
              { id: 'rateCHFh', label: 'CHF/h', binding: 'rateCHFh', width: 15, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 4 },
              { id: 'lineTTC', label: 'Total TTC', binding: 'lineTTC', width: 18, widthUnit: '%', align: 'right', format: 'currency', visible: true, order: 5 }
            ]
          }
        },
        
        // Totaux généraux
        {
          id: 'totals_mixte',
          type: 'totals',
          x: 125, y: 235, width: 75, height: 40,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontStyle: 'normal',
            textAlign: 'right', color: '#1e293b', backgroundColor: '#f8fafc',
            borderWidth: 2, borderColor: '#1e40af', borderRadius: 6, padding: 8, lineHeight: 1.3
          },
          bindings: {
            techHT: 'Technique HT : {{totals.tech.ht}}',
            agentHT: 'Agents HT : {{totals.agent.ht}}',
            totalHT: 'Total HT : {{totals.global.ht}}',
            tva: 'TVA : {{totals.global.tva}}',
            ttc: 'TOTAL TTC : {{totals.global.ttc}}'
          }
        },
        
        // Signatures
        {
          id: 'signatures_mixte',
          type: 'signatures',
          x: 10, y: 282, width: 190, height: 12,
          visible: true, locked: false, zIndex: 2,
          style: {
            fontSize: 9, fontFamily: 'Arial, sans-serif', fontWeight: 'normal', fontStyle: 'normal',
            textAlign: 'left', color: '#64748b', backgroundColor: 'transparent',
            borderWidth: 0, borderColor: '#000000', borderRadius: 0, padding: 0, lineHeight: 1.2
          },
          bindings: {
            vendorTitle: 'Le prestataire',
            clientTitle: 'Le client',
            date: '{{signatureDate}}',
            location: '{{signatureLocation}}'
          }
        }
      ],
      visibilityRules: {
        hasTech: 'items.tech.length > 0',
        hasAgents: 'items.agent.length > 0',
        isFirstPage: 'page.index === 0',
        isLastPage: 'page.index === page.total - 1'
      },
      metadata: {
        description: 'Template optimisé pour les devis mixtes avec sections technique et agents sur une page',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      }
    }
  ];
};