import { prisma } from "@/lib/db"

export async function isSetupComplete() {
  try {
    if (!process.env.DATABASE_URL) return false
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM users
    `
    return Number(result[0].count) > 0
  } catch (error) {
    return false
  }
}