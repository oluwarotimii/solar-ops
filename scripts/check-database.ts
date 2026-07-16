import { Pool } from "pg"

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    console.log("🔗 Connecting to database...")

    const client = await pool.connect()
    await client.query("SELECT 1")
    console.log("✅ Database connection successful")

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

    const roleResult = await client.query("SELECT COUNT(*) as count FROM roles")
    console.log(`\n👥 Roles in database: ${roleResult.rows[0].count}`)

    const userResult = await client.query("SELECT COUNT(*) as count FROM users")
    console.log(`👤 Users in database: ${userResult.rows[0].count}`)

    const jobTypeResult = await client.query("SELECT COUNT(*) as count FROM job_types")
    console.log(`🔧 Job types in database: ${jobTypeResult.rows[0].count}`)

    if (tables.length === 0) {
      console.log("\n⚠️  No tables found. Run 'npm run setup-db' to create them.")
    } else if (parseInt(roleResult.rows[0].count) === 0) {
      console.log("\n⚠️  No roles found. Run 'npm run setup-db' to seed initial data.")
    } else {
      console.log("\n🎉 Database appears to be set up correctly!")
    }

    client.release()
  } catch (error) {
    console.error("❌ Database check failed:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkDatabase()
