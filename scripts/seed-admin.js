require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Create default roles
    console.log('Creating default roles...');
    const roles = [
      { name: 'Super Admin', description: 'Full system access', is_admin: true, permissions: { all: true } },
      { name: 'User', description: 'Default role for new users', is_admin: false, permissions: { 'job_types:read': true } },
      { name: 'Technician', description: 'Technician role with job-specific permissions', is_admin: false, permissions: { 'jobs:create': true, 'jobs:read': true, 'jobs:update': true, 'maintenance:create': true, 'maintenance:read': true, 'maintenance:update': true, 'job_types:read': true } },
    ];

    for (const role of roles) {
      await prisma.$executeRaw`
        INSERT INTO roles (name, description, is_admin, permissions)
        VALUES (${role.name}, ${role.description}, ${role.is_admin}, ${JSON.stringify(role.permissions)})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log('  ✓ Roles created');

    // 2. Get Super Admin role ID
    const roleResult = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = 'Super Admin'
    `;
    if (!roleResult[0]) {
      console.error('Super Admin role not found after insert');
      process.exit(1);
    }
    const roleId = roleResult[0].id;

    // 3. Check if admin already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = ${'oluwarotimiadewumi@gmail.com'}
    `;
    if (existing.length > 0) {
      console.log('  ✓ Admin user already exists, skipping creation');
    } else {
      // 4. Create admin user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.$executeRaw`
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id)
        VALUES (${'Oluwarotimi'}, ${'Adewumi'}, ${'oluwarotimiadewumi@gmail.com'}, ${'N/A'}, ${hashedPassword}, ${roleId})
      `;
      console.log('  ✓ Admin user created');
    }

    console.log('\n✅ Seed complete!');
    console.log('   Email: oluwarotimiadewumi@gmail.com');
    console.log('   Password: password123');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
