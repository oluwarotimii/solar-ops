
INSERT INTO roles (name, description, is_admin, permissions) VALUES
('Super Admin', 'Full system access', true, '{"all": true}'),
('Admin', 'Administrative access', true, '{"jobs": true, "users": true, "reports": true, "maintenance": true}'),
('Supervisor', 'Supervisor access', false, '{"jobs": true, "technician_tracking": true, "reports": true}'),
('Technician', 'Field worker access', false, '{"jobs": "assigned_only", "checkin": true, "media_upload": true}')
ON CONFLICT (name) DO NOTHING;


INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, status) 
SELECT 
    'admin@solar.com',
    '$2b$12$4O.j59ckScBmbC7qKovs9ujwOBIaIYGB4QX5mjfQsev1YqVKAXFIC',
    'System',
    'Administrator',
    '+234-800-000-0000',
    r.id,
    'active'
FROM roles r 
WHERE r.name = 'Super Admin'
ON CONFLICT (email) DO NOTHING;


INSERT INTO job_types (name, description, base_value, default_percentage, color) VALUES
('Solar Installation', 'New solar panel installation', 500000.00, 60.00, '#10B981'),
('Maintenance Check', 'Routine maintenance and inspection', 75000.00, 70.00, '#F59E0B'),
('Repair Service', 'Equipment repair and troubleshooting', 150000.00, 65.00, '#EF4444'),
('System Inspection', 'Comprehensive system evaluation', 100000.00, 55.00, '#3B82F6'),
('Emergency Call', 'Urgent repair or service call', 200000.00, 70.00, '#DC2626')
ON CONFLICT (name) DO NOTHING;


INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'Solar Field Operations', 'Company name displayed in the system'),
('default_job_duration', '240', 'Default estimated job duration in minutes'),
('gps_logging_interval', '30', 'GPS logging interval in seconds'),
('notification_retention_days', '30', 'Days to retain notifications'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('currency', 'NGN', 'System currency (Nigerian Naira)'),
('timezone', 'Africa/Lagos', 'System timezone')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
