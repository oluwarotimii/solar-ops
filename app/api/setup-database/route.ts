import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    console.log("🔗 Setting up database...")

    // Create tables
    await sql`
      -- Create roles table first (no dependencies)
      CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create users table (depends on roles)
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role_id UUID REFERENCES roles(id),
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create job_types table
      CREATE TABLE IF NOT EXISTS job_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          base_value DECIMAL(12,2) DEFAULT 0,
          default_percentage DECIMAL(5,2) DEFAULT 50.00,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create jobs table
      CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          job_type_id UUID REFERENCES job_types(id),
          created_by UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'assigned',
          priority VARCHAR(10) DEFAULT 'medium',
          location_address TEXT NOT NULL,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          scheduled_date DATE,
          estimated_duration INTEGER,
          job_value DECIMAL(12,2) DEFAULT 0,
          total_technician_share DECIMAL(5,2) DEFAULT 100.00,
          instructions TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create job_technicians table
      CREATE TABLE IF NOT EXISTS job_technicians (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
          technician_id UUID REFERENCES users(id),
          share_percentage DECIMAL(5,2) NOT NULL,
          role VARCHAR(20) DEFAULT 'assistant',
          rating DECIMAL(3,2),
          feedback TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create other tables
      CREATE TABLE IF NOT EXISTS gps_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          accuracy DECIMAL(8, 2),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          journey_type VARCHAR(20) DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS checkin_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          type VARCHAR(10) NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          notes TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS maintenance_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          site_location TEXT NOT NULL,
          assigned_to UUID REFERENCES users(id),
          created_by UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'scheduled',
          priority VARCHAR(10) DEFAULT 'medium',
          scheduled_date DATE NOT NULL,
          recurrence_type VARCHAR(20),
          recurrence_interval INTEGER DEFAULT 1,
          last_completed TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accrued_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          job_value DECIMAL(12,2) NOT NULL,
          share_percentage DECIMAL(5,2) NOT NULL,
          earned_amount DECIMAL(12,2) NOT NULL,
          rating DECIMAL(3,2),
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id UUID REFERENCES users(id),
          sender_id UUID REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          related_job_id UUID REFERENCES jobs(id),
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    console.log("✅ Tables created successfully")

    // Insert default roles
    await sql`
      INSERT INTO roles (id, name, description, is_admin, permissions) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'Full system access', true, '{"all": true}'),
      ('550e8400-e29b-41d4-a716-446655440002', 'Admin', 'Administrative access', true, '{"jobs": true, "users": true, "reports": true, "maintenance": true}'),
      ('550e8400-e29b-41d4-a716-446655440003', 'Supervisor', 'Supervisor access', false, '{"jobs": true, "technician_tracking": true, "reports": true}'),
      ('550e8400-e29b-41d4-a716-446655440004', 'Technician', 'Field worker access', false, '{"jobs": "assigned_only", "checkin": true, "media_upload": true}')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert job types
    await sql`
      INSERT INTO job_types (id, name, description, base_value, default_percentage, color) VALUES
      ('550e8400-e29b-41d4-a716-446655440011', 'Solar Installation', 'New solar panel installation', 500000.00, 60.00, '#10B981'),
      ('550e8400-e29b-41d4-a716-446655440012', 'Maintenance Check', 'Routine maintenance and inspection', 75000.00, 70.00, '#F59E0B'),
      ('550e8400-e29b-41d4-a716-446655440013', 'Repair Service', 'Equipment repair and troubleshooting', 150000.00, 65.00, '#EF4444'),
      ('550e8400-e29b-41d4-a716-446655440014', 'System Inspection', 'Comprehensive system evaluation', 100000.00, 55.00, '#3B82F6'),
      ('550e8400-e29b-41d4-a716-446655440015', 'Emergency Call', 'Urgent repair or service call', 200000.00, 70.00, '#DC2626')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert demo users (password: demo123)
    await sql`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, status) VALUES
      ('550e8400-e29b-41d4-a716-446655440021', 'superadmin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Super', 'Admin', '+234-801-234-5001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
      ('550e8400-e29b-41d4-a716-446655440022', 'admin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'John', 'Admin', '+234-801-234-5002', '550e8400-e29b-41d4-a716-446655440002', 'active'),
      ('550e8400-e29b-41d4-a716-446655440023', 'supervisor@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Sarah', 'Supervisor', '+234-801-234-5003', '550e8400-e29b-41d4-a716-446655440003', 'active'),
      ('550e8400-e29b-41d4-a716-446655440031', 'tech1@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Emeka', 'Okafor', '+234-803-123-4001', '550e8400-e29b-41d4-a716-446655440004', 'active'),
      ('550e8400-e29b-41d4-a716-446655440032', 'tech2@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Adebayo', 'Adeyemi', '+234-803-123-4002', '550e8400-e29b-41d4-a716-446655440004', 'active'),
      ('550e8400-e29b-41d4-a716-446655440033', 'tech3@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Fatima', 'Ibrahim', '+234-803-123-4003', '550e8400-e29b-41d4-a716-446655440004', 'active'),
      ('550e8400-e29b-41d4-a716-446655440034', 'tech4@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Chinedu', 'Okwu', '+234-803-123-4004', '550e8400-e29b-41d4-a716-446655440004', 'active')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert demo jobs
    await sql`
      INSERT INTO jobs (id, title, description, job_type_id, created_by, status, priority, location_address, location_lat, location_lng, scheduled_date, estimated_duration, job_value, total_technician_share, instructions) VALUES
      ('550e8400-e29b-41d4-a716-446655440041', 'Solar Panel Installation - Residential Lagos', 'Install 20 solar panels on residential rooftop in Victoria Island', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440022', 'assigned', 'high', '15 Ahmadu Bello Way, Victoria Island, Lagos', 6.4281, 3.4219, CURRENT_DATE + INTERVAL '2 days', 480, 750000.00, 100.00, 'Customer will be home after 9 AM. Panels are already delivered to site.'),
      ('550e8400-e29b-41d4-a716-446655440042', 'Quarterly Maintenance Check - Abuja', 'Routine quarterly maintenance and performance check', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440023', 'in_progress', 'medium', '123 Gimbiya Street, Area 11, Garki, Abuja', 9.0579, 7.4951, CURRENT_DATE, 120, 85000.00, 100.00, 'Check inverter performance and clean panels. Customer has reported slight decrease in output.'),
      ('550e8400-e29b-41d4-a716-446655440043', 'Emergency Inverter Repair - Port Harcourt', 'Inverter failure - system completely down', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440022', 'assigned', 'urgent', '45 Aba Road, Port Harcourt, Rivers State', 4.8156, 7.0498, CURRENT_DATE + INTERVAL '1 day', 180, 180000.00, 100.00, 'URGENT: Complete system failure. Customer is without power. Replacement inverter may be needed.')
      ON CONFLICT (id) DO NOTHING
    `

    // Insert job technician assignments
    await sql`
      INSERT INTO job_technicians (job_id, technician_id, share_percentage, role, rating) VALUES
      ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', 60.00, 'lead', 4.8),
      ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440032', 40.00, 'assistant', 4.5),
      ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440033', 100.00, 'lead', 4.9),
      ('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440034', 100.00, 'lead', 4.7)
      ON CONFLICT DO NOTHING
    `

    console.log("✅ Demo data seeded successfully")

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully!",
      demoAccounts: {
        superAdmin: "superadmin@demo.com",
        admin: "admin@demo.com",
        supervisor: "supervisor@demo.com",
        technicians: ["tech1@demo.com", "tech2@demo.com", "tech3@demo.com", "tech4@demo.com"],
      },
      password: "demo123",
    })
  } catch (error) {
    console.error("Database setup failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
