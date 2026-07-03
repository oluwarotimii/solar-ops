import { NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Validation failed", errors: parsed.error.errors }, { status: 400 });
    }
    const { name, email, phone, password } = parsed.data;
    
    const sql = getDbSql();
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return Response.json({ message: 'User with this email already exists' }, { status: 400 });
    }
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Get Super Admin role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = 'Super Admin'
    `;
    
    if (roleResult.length === 0) {
      return Response.json({ message: 'Super Admin role not found' }, { status: 500 });
    }
    
    const roleId = roleResult[0].id;
    
    // Insert user
    await sql`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id)
      VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${hashedPassword}, ${roleId})
    `;
    
    return Response.json({ message: 'Super Admin user created successfully' });
  } catch (error) {
    return Response.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}