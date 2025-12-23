# Permissions System in SolarOps

## Overview
The SolarOps platform implements a role-based access control (RBAC) system where permissions are stored directly in the database within the `roles` table. This system uses JSONB to store flexible permission structures that can be dynamically updated without schema changes.

## Database Structure

### Roles Table
The permissions system is built around the `roles` table with the following structure:

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The key column for permissions is `permissions` which is of type JSONB (JSON Binary). This allows for efficient storage and querying of JSON data.

## Where Permissions Are Stored and How They Work

There are actually TWO aspects to permissions in SolarOps:

### 1. Available Permissions (Defined in Code)
- The complete set of possible permissions is defined in code (specifically in `/components/role-edit-dialog.tsx` as the `allPermissions` constant)
- This creates a "permission schema" that defines what permissions are available for assignment
- Example from the code:
  ```javascript
  const allPermissions = {
    jobs: ["create", "read", "read:all", "read:team", "update", "delete", "archive"],
    job_types: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete", "reset_password"],
    // ... and more
  };
  ```
- These available permissions exist in the codebase and determine what permissions can be assigned to roles

### 2. Assigned Permissions (Stored in Database)
- Actual permission assignments to roles are stored in the `permissions` column of the `roles` table as JSONB
- This is the dynamic part that allows for management without code changes
- When a user account is created, they are assigned a `role_id` that links to a role in the `roles` table
- The user's effective permissions are retrieved by joining the `users` table to the `roles` table via the `role_id` foreign key

### 2. Initial Setup and Default Roles
When the database is initialized via `/app/api/setup/init/route.ts`, default roles with their permission sets are inserted into the `roles` table:

```sql
INSERT INTO roles (name, description, is_admin, permissions) 
VALUES 
  ('Super Admin', 'Full system access', true, '{"all": true}'),
  ('User', 'Default role for new users', false, '{"job_types:read": true}'),
  ('Technician', 'Technician role with job-specific permissions', false, '{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}')
ON CONFLICT (name) DO NOTHING
```

### 3. How Permissions Are Retrieved and Used

#### User Authentication Process
1. When a user logs in, the system retrieves the user's information from the `users` table
2. The `users` table is joined with the `roles` table to fetch the role information including permissions
3. In `/lib/auth.ts`, the `getUserById` function executes this query:
   ```sql
   SELECT u.*, r.name as role_name, r.description as role_description, 
          r.is_admin as role_is_admin, r.permissions as role_permissions
   FROM users u
   LEFT JOIN roles r ON u.role_id = r.id
   WHERE u.id = ${id} AND u.status = 'active'
   ```

4. The `role_permissions` (which comes from the `permissions` JSONB column) is parsed from JSON string to object if it's stored as a string in the database, and attached to the user's role object

#### Permission Checking Process
1. When checking permissions in the application, the `hasPermission` function (in both client and server contexts) follows this logic:
   - First, it checks if the user has a role with permissions
   - Then, for Super Admins (when `permissions.all === true`), it grants all access
   - For regular roles, it checks if `user.role.permissions[permission] === true`
   - It also supports nested permissions using colon notation (e.g., `jobs:read`)

2. In client-side React components, the `PermissionContext` (in `/contexts/permission-context.tsx`) provides a `hasPermission` function that performs these same checks using the authenticated user's role permissions

### 4. Permission Management Interface

The system includes a role management UI in `/components/role-edit-dialog.tsx` that:

- Defines all possible permissions in a constant object:
  ```javascript
  const allPermissions = {
    jobs: ["create", "read", "read:all", "read:team", "update", "delete", "archive"],
    job_types: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete", "reset_password"],
    // ... and more
  };
  ```

- Allows administrators to toggle individual permissions for each role via checkboxes
- When a role is saved, the updated permissions object is sent to the API endpoints in `/app/api/roles/[id]/route.ts`
- The API updates the `permissions` JSONB column in the database with the new permission structure

### 5. API Endpoints for Permissions

- `GET /api/roles` - Retrieves all roles with their permissions
- `POST /api/roles` - Creates a new role with specified permissions
- `PUT /api/roles/[id]` - Updates a role's permissions
- `GET /api/users` and `GET /api/users/[id]` - Retrieve user information along with their role permissions

### 6. Real-time Permission Updates

A key feature of this system is that when permissions are updated:

1. An administrator changes a role's permissions via the UI
2. The role's `permissions` JSONB column in the database is updated
3. Any users with that role will have the updated permissions applied immediately upon their next permission check
4. For active sessions, the user must refresh or re-authenticate to get the updated permissions (since they're loaded at login time)
5. For new sessions, the updated permissions are immediately available

## Permission Format

- Permissions are stored as key-value pairs in JSON format in the database
- The key represents the action/resource (e.g., "jobs:create", "jobs:read")
- The value is a boolean indicating whether the role has that permission
- Nested permissions are supported using colon notation (e.g., "users:read:all")
- Example: `{"jobs:create": true, "jobs:read": true, "users:read": false}`

## Default Permission Sets

### Super Admin
- Permissions: `{"all": true}`
- This is a special permission that grants full access to all system features
- The `is_admin` flag is also set to `true`

### User
- Permissions: `{"job_types:read": true}`
- Limited to read-only access for job types

### Technician
- Permissions: `{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}`
- Has permissions to create, read, and update jobs and maintenance tasks, plus read job types

## Advantages of DB-based Permissions

1. **Flexibility**: Permissions can be updated without code deployment
2. **Scalability**: Changes to role permissions affect all users with that role
3. **Dynamic Management**: Administrators can modify permissions via admin interfaces
4. **Audit Trail**: Changes to permissions can be logged and tracked
5. **Complex Structures**: JSONB allows for complex permission hierarchies if needed

## Security Considerations

1. Only trusted administrators should be able to modify role permissions
2. Permission changes should be logged in the audit trail system
3. Regular permission audits should be performed to ensure principle of least privilege
4. Default permissions should be carefully reviewed before production deployment
5. Super Admin roles with `"all": true` should be assigned sparingly
6. The system has built-in checks to prevent unauthorized permission escalation

## Future Extensibility

The JSONB format allows for future enhancements such as:
- Conditional permissions based on resource ownership
- Time-based permissions
- Hierarchical permission structures
- Granular resource-level permissions
- Permission inheritance across role hierarchies