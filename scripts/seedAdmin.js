// Run with: node scripts/seedAdmin.js <email> <password> "<Full Name>"
// Or via env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
//
// Idempotent: if the email already exists, it's promoted to admin (password
// left untouched) rather than erroring — safe to re-run this after a fresh
// deploy without worrying whether it ran before.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  const fullName = process.argv[4] || process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('Usage: node scripts/seedAdmin.js <email> <password> "<Full Name>"');
    console.error('   or: set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME and run with no args.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    await User.create({ fullName, email, password, role: 'admin' });
    console.log(`Created new admin account: ${email}`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
