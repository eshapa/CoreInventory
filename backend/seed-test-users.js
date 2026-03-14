/**
 * Seed Script: Creates test Manager and Staff users in the DB.
 * Run: node seed-test-users.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, getPool } = require('./config/db');

const testUsers = [
  {
    name: 'Test Manager',
    email: 'manager@test.com',
    password: 'Test@1234',
    roleName: 'manager',
    status: 'active',
  },
  {
    name: 'Test Staff',
    email: 'staff@test.com',
    password: 'Test@1234',
    roleName: 'staff',
    status: 'active',
  },
];

(async () => {
  try {
    await connectDB();
    const pool = getPool();

    console.log('\n🌱 Starting test user seed...\n');

    for (const user of testUsers) {
      // Check if user already exists
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);

      if (existing.length > 0) {
        console.log(`⚠️  User already exists: ${user.email} — skipping.`);
        continue;
      }

      // Get role ID
      const [roles] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [user.roleName]);
      if (roles.length === 0) {
        console.error(`❌  Role "${user.roleName}" not found in roles table. Skipping ${user.email}.`);
        continue;
      }

      const roleId = roles[0].id;
      const hashedPassword = await bcrypt.hash(user.password, 12);

      await pool.query(
        'INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, hashedPassword, roleId, user.status]
      );

      console.log(`✅  Created: ${user.email} (${user.roleName}) — password: ${user.password}`);
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('╔══════════════════════════════════╗');
    console.log('║       LOGIN TEST CREDENTIALS      ║');
    console.log('╠══════════════════════════════════╣');
    console.log('║  Manager:                         ║');
    console.log('║    Email:  manager@test.com        ║');
    console.log('║    Pass:   Test@1234               ║');
    console.log('║                                   ║');
    console.log('║  Staff:                           ║');
    console.log('║    Email:  staff@test.com          ║');
    console.log('║    Pass:   Test@1234               ║');
    console.log('╚══════════════════════════════════╝\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
