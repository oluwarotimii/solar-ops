import { neon } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required")
    console.log("Please set your DATABASE_URL in your .env.local file")
    console.log("Get your Neon connection string from: https://neon.tech")
    process.exit(1)
  }

  try {
    console.log("🔗 Connecting to Neon database...")
    const sql = neon(process.env.DATABASE_URL)

    // Test the connection
    await sql`SELECT 1`
    console.log("✅ Database connection successful")

    // Read and execute the table creation script
    console.log("📋 Creating tables...")
    const createTablesPath = path.join(process.cwd(), "scripts", "01-create-tables.sql")

    if (!fs.existsSync(createTablesPath)) {
      console.error(`❌ File not found: ${createTablesPath}`)
      process.exit(1)
    }

    const createTablesSQL = fs.readFileSync(createTablesPath, "utf8")

    // Execute the entire SQL script
    await sql.unsafe(createTablesSQL)
    console.log("✅ Tables created successfully")

    // Read and execute the seed data script
    console.log("🌱 Seeding demo data...")
    const seedDataPath = path.join(process.cwd(), "scripts", "02-seed-data.sql")

    if (!fs.existsSync(seedDataPath)) {
      console.error(`❌ File not found: ${seedDataPath}`)
      process.exit(1)
    }

    const seedDataSQL = fs.readFileSync(seedDataPath, "utf8")

    // Execute the entire seed script
    await sql.unsafe(seedDataSQL)
    console.log("✅ Demo data seeded successfully")

    console.log("🎉 Database setup completed!")
    console.log("\n📋 Demo Accounts (password: demo123):")
    console.log("  Super Admin: superadmin@demo.com")
    console.log("  Admin:       admin@demo.com")
    console.log("  Supervisor:  supervisor@demo.com")
    console.log("  Technicians: tech1@demo.com, tech2@demo.com, tech3@demo.com, tech4@demo.com")
    console.log("\n🇳🇬 Nigerian Context:")
    console.log("  Currency:    Nigerian Naira (₦)")
    console.log("  Timezone:    Africa/Lagos")
    console.log("  Phone:       Nigerian format (+234)")
    console.log("\nYou can now:")
    console.log("1. Run 'npm run dev' to start the development server")
    console.log("2. Visit http://localhost:3000/login")
    console.log("3. Login with any demo account above")
  } catch (error) {
    console.error("❌ Database setup failed:")
    console.error(error)

    if (error instanceof Error) {
      if (error.message.includes("connect")) {
        console.log("\n💡 Connection tips:")
        console.log("- Make sure your DATABASE_URL is correct")
        console.log("- Get your connection string from https://neon.tech")
        console.log("- Check that your Neon database is active")
      }
    }

    process.exit(1)
  }
}

// Run the setup
setupDatabase()
