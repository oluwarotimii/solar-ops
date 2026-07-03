import { neon } from "@neondatabase/serverless"

export async function isSetupComplete() {
  try {
    if (!process.env.DATABASE_URL) return false
    const sql = neon(process.env.DATABASE_URL)
    const result = await sql`
      SELECT COUNT(*) as count FROM users
    `
    return parseInt(result[0].count) > 0
  } catch (error) {
    return false
  }
}