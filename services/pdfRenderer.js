const puppeteer = require('puppeteer');
const { formatSectionItems, SECTION_LABELS } = require('./resumeContent');

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function buildHtml(resume) {
  const { personalInfo, theme, sections } = resume;
  const visibleSections = [...sections].filter((s) => s.visible).sort((a, b) => a.order - b.order);

  const sectionsHtml = visibleSections
    .map((section) => {
      const label = escapeHtml(section.title || SECTION_LABELS[section.type]);
      const blocks = formatSectionItems(section.type, section.items);

      const blocksHtml = blocks
        .map((b) => {
          if (b.text) return `<p>${escapeHtml(b.text)}</p>`;
          const bullets = (b.bullets || [])
            .map((line) => `<li>${escapeHtml(line)}</li>`)
            .join('');
          return `
            <div class="entry">
              <div class="entry-heading">${escapeHtml(b.heading)}</div>
              <div class="entry-subheading">${escapeHtml(b.subheading)}</div>
              ${bullets ? `<ul>${bullets}</ul>` : ''}
            </div>`;
        })
        .join('');

      return `<section><h2>${label}</h2>${blocksHtml}</section>`;
    })
    .join('');

  const links = (personalInfo.links || [])
    .map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
    .join(' &middot; ');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: '${theme.font}', sans-serif; color: #1f2937; padding: 40px; }
          h1 { margin-bottom: 0; }
          .contact { color: #4b5563; margin-top: 4px; }
          h2 { color: ${theme.accentColor}; border-bottom: 2px solid ${theme.accentColor};
               padding-bottom: 4px; margin-top: 24px; font-size: 15px; text-transform: uppercase; }
          .entry-heading { font-weight: 600; margin-top: 10px; }
          .entry-subheading { color: #6b7280; font-size: 13px; }
          ul { margin: 4px 0 8px 20px; }
          a { color: ${theme.accentColor}; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        <div class="contact">
          ${escapeHtml(personalInfo.email)} ${personalInfo.phone ? '· ' + escapeHtml(personalInfo.phone) : ''}
          ${personalInfo.location ? '· ' + escapeHtml(personalInfo.location) : ''}
        </div>
        <div class="contact">${links}</div>
        ${sectionsHtml}
      </body>
    </html>`;
}

// NOTE on deployment: full Puppeteer bundles Chromium (~300MB) and needs
// real memory headroom to launch a browser per request. On Render's smaller
// instance tiers this is a genuine risk — slow cold starts or OOM kills
// under concurrent PDF requests. Worth load-testing before launch, or
// switching to puppeteer-core + @sparticuz/chromium (a slimmer, serverless-
// oriented Chromium build) if Render's plan doesn't have the memory for it.
async function renderResumeToPdf(resume) {
  // If PUPPETEER_EXECUTABLE_PATH is set (e.g. pointing at an existing Chrome
  // install — "C:\Program Files\Google\Chrome\Application\chrome.exe" on
  // Windows), use that instead of requiring Puppeteer's own bundled Chromium
  // download to have succeeded. Useful when that download is blocked by a
  // firewall/proxy, or simply hasn't been run yet — this makes the feature
  // work either way rather than hard-depending on one install path.
  const launchOptions = { args: ['--no-sandbox'] };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(resume), { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
  } finally {
    await browser.close();
  }
}

module.exports = { renderResumeToPdf, buildHtml };
