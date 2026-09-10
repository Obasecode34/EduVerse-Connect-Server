// Renders section items into plain lines/paragraphs, independent of output
// format. Both the PDF (HTML) and DOCX renderers call this to decide *what*
// to say per section type — they differ only in *how* they format it.
function formatSectionItems(type, items) {
  switch (type) {
    case 'summary':
      return [{ text: items?.text || '' }];

    case 'experience':
      return (items || []).map((e) => ({
        heading: `${e.role} — ${e.company}`,
        subheading: [e.startDate, e.endDate || 'Present'].filter(Boolean).join(' – '),
        bullets: e.bullets || [],
      }));

    case 'education':
      return (items || []).map((e) => ({
        heading: `${e.degree}, ${e.institution}`,
        subheading: [e.startDate, e.endDate].filter(Boolean).join(' – '),
        bullets: e.notes ? [e.notes] : [],
      }));

    case 'skills':
      return [{ text: (items || []).map((s) => s.name || s).join(' • ') }];

    case 'certifications':
    case 'projects':
      return (items || []).map((e) => ({
        heading: e.title || e.name,
        subheading: e.issuer || e.date || '',
        bullets: e.description ? [e.description] : [],
      }));

    case 'languages':
      return [{ text: (items || []).map((l) => `${l.name} (${l.level})`).join(' • ') }];

    case 'references':
      return (items || []).map((r) => ({
        heading: r.name,
        subheading: [r.role, r.contact].filter(Boolean).join(' — '),
        bullets: [],
      }));

    default:
      return [];
  }
}

const SECTION_LABELS = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
  languages: 'Languages',
  references: 'References',
};

module.exports = { formatSectionItems, SECTION_LABELS };
