import type { AgentDescription } from '@/types';

/**
 * Renders the agent description as HTML for PDF generation
 */
export function renderAgentDescriptionToPDF(description: AgentDescription): string {
  const fields = [
    { label: 'Nature de la prestation', value: description.nature },
    { label: 'Lieu', value: description.lieu },
    { label: 'Effectif', value: description.effectif },
    { label: 'Dates', value: description.dates },
    { label: 'Missions', value: description.missions, isMultiLine: true },
    { label: 'Déplacement', value: description.deplacement },
    { label: 'Pause', value: description.pause },
    { label: 'Durée de la prestation', value: description.duree },
  ];

  // Only include fields that have content
  const filledFields = fields.filter(field => field.value && field.value.trim());
  const customSections = description.autre?.filter(section => 
    section.title.trim() || section.content.trim()
  ) || [];

  // If no content at all, don't render the page
  if (filledFields.length === 0 && customSections.length === 0) {
    return '';
  }

  let html = `
    <div class="description-prestations-page" style="
      page-break-before: always;
      min-height: 100vh;
      padding: 40px 60px;
      font-family: Arial, sans-serif;
      background: white;
    ">
      <h1 style="
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        color: #1a1a1a;
        margin: 0 0 40px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #f59e0b;
      ">Description des prestations</h1>
      
      <div style="max-width: 800px; margin: 0 auto;">
  `;

  // Render filled fields
  if (filledFields.length > 0) {
    html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">`;
    
    filledFields.forEach(field => {
      const colSpan = field.isMultiLine ? 'grid-column: 1 / -1;' : '';
      
      html += `
        <div style="${colSpan} margin-bottom: 15px;">
          <div style="
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
            font-size: 14px;
          ">${field.label} :</div>
          <div style="
            color: #1f2937;
            line-height: 1.5;
            font-size: 13px;
            ${field.isMultiLine ? 'white-space: pre-line;' : ''}
          ">${field.value}</div>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  // Render custom sections
  if (customSections.length > 0) {
    customSections.forEach(section => {
      if (section.title.trim() || section.content.trim()) {
        html += `
          <div style="margin-bottom: 25px;">
            <h3 style="
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 10px 0;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            ">${section.title || 'Section personnalisée'}</h3>
            <div style="
              color: #374151;
              line-height: 1.6;
              font-size: 13px;
              white-space: pre-line;
              padding-left: 10px;
            ">${section.content}</div>
          </div>
        `;
      }
    });
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Check if agent description has any content
 */
export function hasAgentDescriptionContent(description?: AgentDescription): boolean {
  if (!description) return false;

  const standardFields = [
    description.nature,
    description.lieu,
    description.effectif,
    description.dates,
    description.missions,
    description.deplacement,
    description.pause,
    description.duree
  ];

  const hasStandardContent = standardFields.some(field => field && field.trim());
  const hasCustomContent = description.autre?.some(section => 
    section.title.trim() || section.content.trim()
  );

  return hasStandardContent || !!hasCustomContent;
}