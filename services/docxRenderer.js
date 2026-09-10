const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink,
} = require('docx');
const { formatSectionItems, SECTION_LABELS } = require('./resumeContent');

// Word doesn't take arbitrary hex the way CSS does in every context, but
// docx's shading/color options do accept hex without the '#'.
function hex(color) {
  return color.replace('#', '');
}

function buildDocxDocument(resume) {
  const { personalInfo, theme, sections } = resume;
  const accent = hex(theme.accentColor);
  const visibleSections = [...sections].filter((s) => s.visible).sort((a, b) => a.order - b.order);

  const children = [
    new Paragraph({
      children: [new TextRun({ text: personalInfo.fullName, bold: true, size: 32, font: theme.font })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' · '),
          size: 20,
          color: '6B7280',
          font: theme.font,
        }),
      ],
    }),
  ];

  (personalInfo.links || []).forEach((l) => {
    children.push(
      new Paragraph({
        children: [
          new ExternalHyperlink({
            link: l.url,
            children: [new TextRun({ text: l.label, style: 'Hyperlink', font: theme.font })],
          }),
        ],
      })
    );
  });

  visibleSections.forEach((section) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: (section.title || SECTION_LABELS[section.type]).toUpperCase(),
            color: accent,
            bold: true,
            font: theme.font,
          }),
        ],
        spacing: { before: 300, after: 120 },
      })
    );

    const blocks = formatSectionItems(section.type, section.items);
    blocks.forEach((b) => {
      if (b.text) {
        children.push(new Paragraph({ children: [new TextRun({ text: b.text, font: theme.font })] }));
        return;
      }
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.heading, bold: true, font: theme.font })],
        })
      );
      if (b.subheading) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: b.subheading, italics: true, color: '6B7280', font: theme.font })],
          })
        );
      }
      (b.bullets || []).forEach((line) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: line, font: theme.font })],
          })
        );
      });
    });
  });

  return new Document({ sections: [{ children }] });
}

async function renderResumeToDocx(resume) {
  const doc = buildDocxDocument(resume);
  return Packer.toBuffer(doc);
}

module.exports = { renderResumeToDocx };
