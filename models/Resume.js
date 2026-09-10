const mongoose = require('mongoose');

// Default whitelist — swap these arrays any time, nothing else depends on
// the specific values. Fonts chosen because they render consistently in
// both Puppeteer (web fonts) and the docx library (system/embedded fonts).
const ALLOWED_FONTS = ['Inter', 'Georgia', 'Merriweather', 'Roboto Slab'];
const ALLOWED_ACCENT_COLORS = ['#2563EB', '#16A34A', '#7C3AED', '#DC2626', '#0D9488', '#111827'];
const SECTION_TYPES = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
  'languages',
  'references',
];

const sectionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: SECTION_TYPES, required: true },
    title: { type: String, trim: true }, // optional override, e.g. "Work History" instead of "Experience"
    visible: { type: Boolean, default: true },
    order: { type: Number, required: true },
    // Structure varies by type (experience entries vs skill tags vs plain text
    // summary) — kept as Mixed since locking a fixed shape per type here would
    // duplicate validation the renderer already has to do anyway.
    items: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'My Resume', trim: true }, // lets a user keep more than one variant

    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      location: { type: String },
      links: [{ label: String, url: String }], // LinkedIn, portfolio, GitHub, etc.
    },

    theme: {
      font: { type: String, enum: ALLOWED_FONTS, default: ALLOWED_FONTS[0] },
      accentColor: { type: String, enum: ALLOWED_ACCENT_COLORS, default: ALLOWED_ACCENT_COLORS[0] },
    },

    sections: [sectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
module.exports.ALLOWED_FONTS = ALLOWED_FONTS;
module.exports.ALLOWED_ACCENT_COLORS = ALLOWED_ACCENT_COLORS;
module.exports.SECTION_TYPES = SECTION_TYPES;
