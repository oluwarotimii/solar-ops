import { getDbSql } from './db';

export async function isSetupComplete() {
  try {
    const sql = getDbSql();
    // Check if the users table exists and has at least one user
    const result = await sql`
      SELECT COUNT(*) as count FROM users
    `;
    
    return parseInt(result[0].count) > 0;
  } catch (error) {
    // If there's an error (e.g., table doesn't exist), setup is not complete
    return false;
  }
}