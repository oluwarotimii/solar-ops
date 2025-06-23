# Database Setup Guide

This guide will help you set up the database for the Solar Field Operations platform.

## Quick Setup (Recommended)

1. **Set up your database connection**
   
   Create a `.env.local` file in your project root:
   \`\`\`bash
   DATABASE_URL=your-database-connection-string
   JWT_SECRET=your-secret-key-here
   CRON_SECRET=your-cron-secret-here
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up the database**
   \`\`\`bash
   npm run setup-db
   \`\`\`

4. **Verify the setup**
   \`\`\`bash
   npm run check-db
   \`\`\`

5. **Start the application**
   \`\`\`bash
   npm run dev
   \`\`\`

## Database Options

### Option 1: Neon PostgreSQL (Recommended for Testing)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from your dashboard
4. Use it as your `DATABASE_URL`

Example:
\`\`\`
DATABASE_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
\`\`\`

### Option 2: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   \`\`\`sql
   CREATE DATABASE solar_ops;
   \`\`\`
3. Use a local connection string:
   \`\`\`
   DATABASE_URL=postgresql://postgres:password@localhost:5432/solar_ops
   \`\`\`

### Option 3: Other PostgreSQL Providers

You can use any PostgreSQL-compatible database:
- Supabase
- Railway
- PlanetScale (with PostgreSQL)
- AWS RDS
- Google Cloud SQL
- Self-hosted PostgreSQL

## Manual Database Setup

If the automated setup doesn't work, you can set up the database manually:

1. **Connect to your database** using a tool like:
   - pgAdmin
   - DBeaver
   - psql command line
   - Your hosting provider's web interface

2. **Run the SQL scripts** in order:
   - First: `scripts/01-create-tables.sql`
   - Then: `scripts/02-seed-data.sql`

## Troubleshooting

### Connection Issues

**Error: "connect ECONNREFUSED"**
- Check that your database server is running
- Verify your connection string is correct
- Make sure the port is accessible

**Error: "password authentication failed"**
- Check your username and password
- Verify the database name exists

**Error: "SSL connection required"**
- Add `?sslmode=require` to your connection string
- Or use `?sslmode=disable` for local development

### Permission Issues

**Error: "permission denied"**
- Make sure your database user has CREATE privileges
- For production, create a dedicated user with appropriate permissions

### Schema Issues

**Error: "relation does not exist"**
- Run `npm run setup-db` to create the tables
- Check that all SQL scripts executed successfully

## Verification

After setup, you should see these tables in your database:

- `roles` - User roles and permissions
- `users` - User accounts
- `job_types` - Types of jobs (installation, maintenance, etc.)
- `jobs` - Individual job records
- `gps_logs` - GPS tracking data
- `checkin_logs` - Check-in/out records
- `job_media` - Photos and documents
- `maintenance_tasks` - Scheduled maintenance
- `accrued_values` - Performance tracking (admin only)
- `notifications` - Push notifications
- `system_settings` - Application settings

## Default Data

The setup creates these default roles:
- **Super Admin** - Full system access
- **Admin** - Administrative access
- **Supervisor** - Supervisor access
- **Technician** - Field worker access

And these job types:
- Solar Installation
- Maintenance Check
- Repair Service
- System Inspection
- Emergency Call

## Next Steps

1. Visit `http://localhost:3000/register` to create your first admin account
2. Login at `http://localhost:3000/login`
3. Start creating jobs and managing technicians!

## Migration

To migrate from a test database to production:

\`\`\`bash
export SOURCE_DATABASE_URL=your-test-db-url
export TARGET_DATABASE_URL=your-production-db-url
npm run migrate-db
