import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required for PrismaClient")
    }
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  return globalForPrisma.prisma
}

export const prisma = getPrisma()

export function getDbSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return (strings: TemplateStringsArray, ...values: any[]) =>
    prisma.$queryRaw(strings, ...values) as Promise<any[]>
}

// Helper function to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== "object" || obj instanceof Date) return obj;

  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = toCamelCase(value);
  }
  return camelObj;
}

// Helper function to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== "object") return obj;

  const snakeObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = toSnakeCase(value);
  }
  return snakeObj;
}