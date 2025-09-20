import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL);

export { sql };

export function getDbSql() {
  if (!process.env.DATABASE_URL) {
    console.error("[DB Debug] DATABASE_URL environment variable is not set!");
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log("[DB Debug] Database connection successfully created");
    return sql;
  } catch (error) {
    console.error("[DB Debug] Failed to create database connection:", error);
    throw new Error("Failed to initialize database connection");
  }
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