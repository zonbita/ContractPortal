import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

async function seed() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@contractportal.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const exists = await User.findOne({ email: adminEmail }).select('+password');

  if (exists) {
    exists.password = adminPassword;
    exists.role = 'admin';
    exists.isActive = true;
    await exists.save();
    console.log('Admin user updated:', adminEmail);
    process.exit(0);
  }

  await User.create({
    name: 'Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });

  console.log('Admin user created:', adminEmail);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
