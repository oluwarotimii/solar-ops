import { neon } from "@neondatabase/serverless"

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
  }

  try {
    console.log("🔗 Connecting to database...")
    const sql = neon(process.env.DATABASE_URL)

    // Test connection
    await sql`SELECT 1`
    console.log("✅ Database connection successful")

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log("\n📋 Found ${tables.length} tables:") 
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`)
    })

    // Check if we have any roles
    const roleCount = await sql`SELECT COUNT(*) as count FROM roles`
    console.log(`
👥 Roles in database: ${roleCount[0].count}`)

    // Check if we have any users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log(`👤 Users in database: ${userCount[0].count}`)

    // Check if we have any job types
    const jobTypeCount = await sql`SELECT COUNT(*) as count FROM job_types`
    console.log(`🔧 Job types in database: ${jobTypeCount[0].count}`)

    if (tables.length === 0) {
      console.log("\n⚠️  No tables found. Run 'npm run setup-db' to create them.")
    } else if (roleCount[0].count === 0) {
      console.log("\n⚠️  No roles found. Run 'npm run setup-db' to seed initial data.")
    } else {
      console.log("\n🎉 Database appears to be set up correctly!")
    }
  } catch (error) {
    console.error("❌ Database check failed:")
    console.error(error)
    process.exit(1)
  }
}

checkDatabase()
