-- 1. Insert default roles
INSERT INTO roles (name, description, is_admin, permissions)
VALUES
  ('Super Admin', 'Full system access', true, '{"all": true}'),
  ('User', 'Default role for new users', false, '{"job_types:read": true}'),
  ('Technician', 'Technician role with job-specific permissions', false, '{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}')
ON CONFLICT (name) DO NOTHING;

-- 2. Create admin user (password: password123)
INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id)
SELECT 'Oluwarotimi', 'Adewumi', 'oluwarotimiadewumi@gmail.com', 'N/A', '$2b$10$0tq9T7g46.c/YJGIUxrbEuXfDx8yHa/iPk7lj46UCepOsPE0vfyr2', id
FROM roles
WHERE name = 'Super Admin'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'oluwarotimiadewumi@gmail.com');
