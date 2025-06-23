import { neon } from "@neondatabase/serverless"

async function testConnection() {
  console.log("🧪 Testing database connection...")

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables")
    console.log("Make sure you have a .env.local file with:")
    console.log("DATABASE_URL=your-neon-connection-string")
    return
  }

  console.log("📝 DATABASE_URL found:", process.env.DATABASE_URL.substring(0, 30) + "...")

  try {
    const sql = neon(process.env.DATABASE_URL)

    // Test basic connection
    const result = await sql`SELECT 1 as test`
    console.log("✅ Connection successful!")
    console.log("📊 Test query result:", result)

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(`📋 Found ${tables.length} tables:`)
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`)
    })

    if (tables.length === 0) {
      console.log("⚠️  No tables found. Run the setup script to create them.")
    } else {
      // Test some key tables
      console.log("\n🔍 Testing key tables:")

      try {
        const roles = await sql`SELECT COUNT(*) as count FROM roles`
        console.log(`  ✅ Roles: ${roles[0].count} records`)
      } catch (e) {
        console.log("  ❌ Roles table issue")
      }

      try {
        const users = await sql`SELECT COUNT(*) as count FROM users`
        console.log(`  ✅ Users: ${users[0].count} records`)
      } catch (e) {
        console.log("  ❌ Users table issue")
      }

      try {
        const jobTypes = await sql`SELECT COUNT(*) as count FROM job_types`
        console.log(`  ✅ Job Types: ${jobTypes[0].count} records`)
      } catch (e) {
        console.log("  ❌ Job Types table issue")
      }

      try {
        const jobs = await sql`SELECT COUNT(*) as count FROM jobs`
        console.log(`  ✅ Jobs: ${jobs[0].count} records`)
      } catch (e) {
        console.log("  ❌ Jobs table issue")
      }
    }
  } catch (error) {
    console.error("❌ Connection failed:")
    console.error(error)

    if (error instanceof Error) {
      if (error.message.includes("getaddrinfo ENOTFOUND")) {
        console.log("\n💡 This looks like a network/DNS issue")
        console.log("- Check your internet connection")
        console.log("- Verify your Neon database URL is correct")
      } else if (error.message.includes("password authentication failed")) {
        console.log("\n💡 Authentication failed")
        console.log("- Check your database credentials")
        console.log("- Make sure your Neon database is active")
      }
    }
  }
}

testConnection()
