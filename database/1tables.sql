-- Solar Field Operations Database Schema
-- Run this script in your database SQL editor

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
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_types table (no dependencies)
CREATE TABLE IF NOT EXISTS job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_value DECIMAL(12,2) DEFAULT 0,
    default_percentage DECIMAL(5,2) DEFAULT 50.00,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table (depends on job_types and users)
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

-- Create job_technicians table (many-to-many relationship)
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

-- Create GPS tracking logs
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

-- Create check-in/check-out logs
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

-- Create job media table
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
);

-- Create maintenance tasks
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

-- Create accrued values table
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

-- Create notifications table
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

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_technicians_job_id ON job_technicians(job_id);
CREATE INDEX IF NOT EXISTS idx_job_technicians_technician_id ON job_technicians(technician_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp ON gps_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_scheduled_date ON maintenance_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_accrued_values_user_id ON accrued_values(user_id);
CREATE INDEX IF NOT EXISTS idx_accrued_values_month_year ON accrued_values(month, year);
