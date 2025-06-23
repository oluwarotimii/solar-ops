-- Insert default roles
INSERT INTO roles (id, name, description, is_admin, permissions) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'Full system access', true, '{"all": true}'),
('550e8400-e29b-41d4-a716-446655440002', 'Admin', 'Administrative access', true, '{"jobs": true, "users": true, "reports": true, "maintenance": true}'),
('550e8400-e29b-41d4-a716-446655440003', 'Supervisor', 'Supervisor access', false, '{"jobs": true, "technician_tracking": true, "reports": true}'),
('550e8400-e29b-41d4-a716-446655440004', 'Technician', 'Field worker access', false, '{"jobs": "assigned_only", "checkin": true, "media_upload": true}')
ON CONFLICT (id) DO NOTHING;

-- Insert job types with Nigerian context and default percentages
INSERT INTO job_types (id, name, description, base_value, default_percentage, color) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Solar Installation', 'New solar panel installation', 500000.00, 60.00, '#10B981'),
('550e8400-e29b-41d4-a716-446655440012', 'Maintenance Check', 'Routine maintenance and inspection', 75000.00, 70.00, '#F59E0B'),
('550e8400-e29b-41d4-a716-446655440013', 'Repair Service', 'Equipment repair and troubleshooting', 150000.00, 65.00, '#EF4444'),
('550e8400-e29b-41d4-a716-446655440014', 'System Inspection', 'Comprehensive system evaluation', 100000.00, 55.00, '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440015', 'Emergency Call', 'Urgent repair or service call', 200000.00, 70.00, '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- Insert demo users (password for all is 'demo123')
-- Super Admin
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'superadmin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Super', 'Admin', '+234-801-234-5001', '550e8400-e29b-41d4-a716-446655440001', 'active')
ON CONFLICT (id) DO NOTHING;

-- Admin
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440022', 'admin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'John', 'Admin', '+234-801-234-5002', '550e8400-e29b-41d4-a716-446655440002', 'active')
ON CONFLICT (id) DO NOTHING;

-- Supervisor
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440023', 'supervisor@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Sarah', 'Supervisor', '+234-801-234-5003', '550e8400-e29b-41d4-a716-446655440003', 'active')
ON CONFLICT (id) DO NOTHING;

-- Technicians
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440031', 'tech1@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Emeka', 'Okafor', '+234-803-123-4001', '550e8400-e29b-41d4-a716-446655440004', 'active'),
('550e8400-e29b-41d4-a716-446655440032', 'tech2@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Adebayo', 'Adeyemi', '+234-803-123-4002', '550e8400-e29b-41d4-a716-446655440004', 'active'),
('550e8400-e29b-41d4-a716-446655440033', 'tech3@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Fatima', 'Ibrahim', '+234-803-123-4003', '550e8400-e29b-41d4-a716-446655440004', 'active'),
('550e8400-e29b-41d4-a716-446655440034', 'tech4@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ckstG.', 'Chinedu', 'Okwu', '+234-803-123-4004', '550e8400-e29b-41d4-a716-446655440004', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert some demo jobs
INSERT INTO jobs (id, title, description, job_type_id, created_by, status, priority, location_address, location_lat, location_lng, scheduled_date, estimated_duration, job_value, total_technician_share, instructions) VALUES
('550e8400-e29b-41d4-a716-446655440041', 'Solar Panel Installation - Residential Lagos', 'Install 20 solar panels on residential rooftop in Victoria Island', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440022', 'assigned', 'high', '15 Ahmadu Bello Way, Victoria Island, Lagos', 6.4281, 3.4219, CURRENT_DATE + INTERVAL '2 days', 480, 750000.00, 100.00, 'Customer will be home after 9 AM. Panels are already delivered to site.'),
('550e8400-e29b-41d4-a716-446655440042', 'Quarterly Maintenance Check - Abuja', 'Routine quarterly maintenance and performance check', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440023', 'in_progress', 'medium', '123 Gimbiya Street, Area 11, Garki, Abuja', 9.0579, 7.4951, CURRENT_DATE, 120, 85000.00, 100.00, 'Check inverter performance and clean panels. Customer has reported slight decrease in output.'),
('550e8400-e29b-41d4-a716-446655440043', 'Emergency Inverter Repair - Port Harcourt', 'Inverter failure - system completely down', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440022', 'assigned', 'urgent', '45 Aba Road, Port Harcourt, Rivers State', 4.8156, 7.0498, CURRENT_DATE + INTERVAL '1 day', 180, 180000.00, 100.00, 'URGENT: Complete system failure. Customer is without power. Replacement inverter may be needed.')
ON CONFLICT (id) DO NOTHING;

-- Insert job technician assignments
INSERT INTO job_technicians (job_id, technician_id, share_percentage, role, rating) VALUES
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', 60.00, 'lead', 4.8),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440032', 40.00, 'assistant', 4.5),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440033', 100.00, 'lead', 4.9),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440034', 100.00, 'lead', 4.7)
ON CONFLICT DO NOTHING;

-- Insert some demo maintenance tasks
INSERT INTO maintenance_tasks (id, title, description, site_location, assigned_to, created_by, status, priority, scheduled_date, recurrence_type, recurrence_interval) VALUES
('550e8400-e29b-41d4-a716-446655440051', 'Monthly Panel Cleaning - Lagos Site', 'Clean all solar panels and check for debris', '100 Herbert Macaulay Way, Yaba, Lagos', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440023', 'scheduled', 'medium', CURRENT_DATE + INTERVAL '5 days', 'monthly', 1),
('550e8400-e29b-41d4-a716-446655440052', 'Quarterly Inverter Check - Abuja Site', 'Inspect inverters and electrical connections', '200 Cadastral Zone, Wuse II, Abuja', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 'overdue', 'high', CURRENT_DATE - INTERVAL '2 days', 'monthly', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert some demo accrued values
INSERT INTO accrued_values (user_id, job_id, job_value, share_percentage, earned_amount, rating, month, year) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440041', 750000.00, 60.00, 450000.00, 4.8, 1, 2024),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440041', 750000.00, 40.00, 300000.00, 4.5, 1, 2024),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440042', 85000.00, 100.00, 85000.00, 4.9, 1, 2024)
ON CONFLICT DO NOTHING;

-- Insert some demo notifications
INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id) VALUES
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440022', 'New Job Assignment', 'You have been assigned a new emergency repair job in Port Harcourt.', 'job_assignment', '550e8400-e29b-41d4-a716-446655440043'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 'Maintenance Task Overdue', 'Your quarterly inverter check at Abuja Site is now overdue.', 'maintenance_reminder')
ON CONFLICT DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'Solar Field Operations Nigeria', 'Company name displayed in the system'),
('default_job_duration', '240', 'Default estimated job duration in minutes'),
('gps_logging_interval', '30', 'GPS logging interval in seconds'),
('notification_retention_days', '30', 'Days to retain notifications'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('currency', 'NGN', 'System currency (Nigerian Naira)'),
('timezone', 'Africa/Lagos', 'System timezone')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
