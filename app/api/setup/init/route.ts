import { NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const sql = getDbSql();
    
    // Create roles table first (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create users table (depends on roles)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role_id UUID REFERENCES roles(id),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create job_types table (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS job_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          base_value DECIMAL(12,2) DEFAULT 0,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create jobs table (depends on job_types and users)
    await sql`
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
          scheduled_time TIME,
          job_value DECIMAL(12,2) DEFAULT 0,
          instructions TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          is_archived BOOLEAN DEFAULT FALSE,
          archived_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create job_technicians table (many-to-many relationship)
    await sql`
      CREATE TABLE IF NOT EXISTS job_technicians (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
          technician_id UUID REFERENCES users(id),
          role VARCHAR(20) DEFAULT 'assistant',
          rating DECIMAL(3,2),
          feedback TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create GPS tracking logs
    await sql`
      CREATE TABLE IF NOT EXISTS gps_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          accuracy DECIMAL(8, 2),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          journey_type VARCHAR(20) DEFAULT 'active'
      )
    `;
    
    // Create check-in/check-out logs
    await sql`
      CREATE TABLE IF NOT EXISTS checkin_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          type VARCHAR(10) NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          notes TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create job media table
    await sql`
      CREATE TABLE IF NOT EXISTS job_media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID REFERENCES jobs(id),
          uploaded_by UUID REFERENCES users(id),
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          file_size INTEGER,
          storage_path TEXT NOT NULL,
          caption TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create maintenance templates (the rule)
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          site_location TEXT,
          job_value DECIMAL(12,2) DEFAULT 0,
          assigned_to UUID REFERENCES users(id),
          created_by UUID REFERENCES users(id),
          recurrence_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
          recurrence_interval INTEGER DEFAULT 1,
          day_of_week INTEGER, -- For weekly recurrence (0-6, Sunday-Saturday)
          day_of_month INTEGER, -- For monthly recurrence (1-31)
          month_of_year INTEGER, -- For yearly recurrence (1-12)
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create maintenance occurrences (the actual jobs)
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_occurrences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID REFERENCES maintenance_templates(id) ON DELETE CASCADE,
          scheduled_date DATE NOT NULL,
          assigned_to UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, missed
          priority VARCHAR(10) DEFAULT 'medium',
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create accrued values table
    await sql`
      CREATE TABLE IF NOT EXISTS accrued_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          maintenance_occurrence_id UUID REFERENCES maintenance_occurrences(id),
          job_value DECIMAL(12,2) NOT NULL,
          earned_amount DECIMAL(12,2) NOT NULL,
          rating DECIMAL(3,2),
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (job_id, user_id),
          UNIQUE (maintenance_occurrence_id, user_id)
      )
    `;
    
    // Create notifications table
    await sql`
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
      )
    `;
    
    // Create system settings table
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create push notification subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, endpoint)
      )
    `;
    
    // Create audit trail table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(100),
          target_id UUID,
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create time_entries table
    await sql`
      CREATE TABLE IF NOT EXISTS time_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          clock_out TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_technicians_job_id ON job_technicians(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_technicians_technician_id ON job_technicians(technician_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp ON gps_logs(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_templates_assigned_to ON maintenance_templates(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_template_id ON maintenance_occurrences(template_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_assigned_to ON maintenance_occurrences(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_scheduled_date ON maintenance_occurrences(scheduled_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_status ON maintenance_occurrences(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accrued_values_user_id ON accrued_values(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accrued_values_month_year ON accrued_values(month, year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)`;
    
    // Insert default roles
    await sql`
      INSERT INTO roles (name, description, is_admin, permissions) 
      VALUES 
        ('Super Admin', 'Full system access', true, '{"all": true}'),
        ('User', 'Default role for new users', false, '{"job_types:read": true}'),
        ('Technician', 'Technician role with job-specific permissions', false, '{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}')
      ON CONFLICT (name) DO NOTHING
    `;
    
    return Response.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return Response.json({ message: 'Failed to initialize database', error: error.message }, { status: 500 });
  }
}