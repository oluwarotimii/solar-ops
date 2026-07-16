import { Pool } from "pg"

async function testConnection() {
  console.log("🧪 Testing database connection...")

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables")
    console.log("Make sure you have a .env.local file with:")
    console.log("DATABASE_URL=your-postgres-connection-string")
    return
  }

  console.log("📝 DATABASE_URL found:", process.env.DATABASE_URL.substring(0, 30) + "...")

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const client = await pool.connect()

    const result = await client.query("SELECT 1 as test")
    console.log("✅ Connection successful!")
    console.log("📊 Test query result:", result.rows)

    const tablesResult = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    )
    const tables = tablesResult.rows

    console.log(`\n📋 Found ${tables.length} tables:`)
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`)
    })

    if (tables.length === 0) {
      console.log("⚠️  No tables found. Run the setup script to create them.")
    } else {
      console.log("\n🔍 Testing key tables:")

      try {
        const roles = await client.query("SELECT COUNT(*) as count FROM roles")
        console.log(`  ✅ Roles: ${roles.rows[0].count} records`)
      } catch {
        console.log("  ❌ Roles table issue")
      }

      try {
        const users = await client.query("SELECT COUNT(*) as count FROM users")
        console.log(`  ✅ Users: ${users.rows[0].count} records`)
      } catch {
        console.log("  ❌ Users table issue")
      }

      try {
        const jobTypes = await client.query("SELECT COUNT(*) as count FROM job_types")
        console.log(`  ✅ Job Types: ${jobTypes.rows[0].count} records`)
      } catch {
        console.log("  ❌ Job Types table issue")
      }

      try {
        const jobs = await client.query("SELECT COUNT(*) as count FROM jobs")
        console.log(`  ✅ Jobs: ${jobs.rows[0].count} records`)
      } catch {
        console.log("  ❌ Jobs table issue")
      }
    }

    client.release()
  } catch (error) {
    console.error("❌ Connection failed:")
    console.error(error)

    if (error instanceof Error) {
      if (error.message.includes("getaddrinfo ENOTFOUND")) {
        console.log("\n💡 This looks like a network/DNS issue")
        console.log("- Check your internet connection")
        console.log("- Verify your database URL is correct")
      } else if (error.message.includes("password authentication failed")) {
        console.log("\n💡 Authentication failed")
        console.log("- Check your database credentials")
      }
    }
  } finally {
    await pool.end()
  }
}

testConnection()
