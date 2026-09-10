const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['jobseeker', 'employer']).default('jobseeker'), // admins are never self-registered
  language: z.enum(['en', 'ha', 'yo', 'ig']).default('en'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Wraps a Zod schema into Express middleware. Bad input never reaches a controller.
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

const { SCHOLARSHIP_CLASSIFICATIONS } = require('../models/Job');

const jobBaseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  company: z.string().min(2),
  location: z.string().optional(),
  type: z.enum(['onsite', 'remote', 'hybrid', 'scholarship']),
  classification: z.enum(SCHOLARSHIP_CLASSIFICATIONS).optional(),
});

// .refine() wraps a schema in ZodEffects, which doesn't have .partial() —
// so the base object schema is what gets .partial()'d for updates, and the
// refine (classification required when type is scholarship) is applied
// separately to each version below.
const requiresClassificationForScholarship = (data) =>
  data.type !== 'scholarship' || !!data.classification;

const jobSchema = jobBaseSchema.refine(requiresClassificationForScholarship, {
  message: 'classification is required when type is scholarship',
  path: ['classification'],
});

// On a partial update, data.type is only checked if this request is actually
// setting it — if type isn't included in the patch, the condition is
// trivially satisfied rather than demanding classification unprompted.
const jobUpdateSchema = jobBaseSchema.partial().refine(requiresClassificationForScholarship, {
  message: 'classification is required when type is scholarship',
  path: ['classification'],
});

const moderationSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().optional(),
});

const applicationSchema = z.object({
  resumeSnapshot: z.record(z.any()),
  resumeFormat: z.enum(['pdf', 'docx']),
  coverNote: z.string().max(2000).optional(),
});

const applicationStatusSchema = z.object({
  status: z.enum(['reviewed', 'shortlisted', 'rejected', 'accepted']),
  note: z.string().optional(),
});

const { ALLOWED_FONTS, ALLOWED_ACCENT_COLORS, SECTION_TYPES } = require('../models/Resume');

const resumeSectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  title: z.string().optional(),
  visible: z.boolean().default(true),
  order: z.number(),
  items: z.any(),
});

const resumeSchema = z.object({
  title: z.string().min(1).default('My Resume'),
  personalInfo: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  }),
  theme: z
    .object({
      font: z.enum(ALLOWED_FONTS).optional(),
      accentColor: z.enum(ALLOWED_ACCENT_COLORS).optional(),
    })
    .optional(),
  sections: z.array(resumeSectionSchema).default([]),
});

const resumeUpdateSchema = resumeSchema.partial();

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  language: z.enum(['en', 'ha', 'yo', 'ig']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  jobSchema,
  jobUpdateSchema,
  moderationSchema,
  applicationSchema,
  applicationStatusSchema,
  resumeSchema,
  resumeUpdateSchema,
  validateBody,
};
