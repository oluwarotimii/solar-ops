"use strict";(()=>{var e={};e.id=8489,e.ids=[8489],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},68972:(e,E,t)=>{t.a(e,async(e,a)=>{try{t.r(E),t.d(E,{originalPathname:()=>o,patchFetch:()=>d,requestAsyncStorage:()=>I,routeModule:()=>A,serverHooks:()=>N,staticGenerationAsyncStorage:()=>_});var i=t(73278),T=t(45002),r=t(54877),s=t(1217),n=e([s]);s=(n.then?(await n)():n)[0];let A=new i.AppRouteRouteModule({definition:{kind:T.x.APP_ROUTE,page:"/api/setup/init/route",pathname:"/api/setup/init",filename:"route",bundlePath:"app/api/setup/init/route"},resolvedPagePath:"C:\\Users\\ADMIN\\Desktop\\code\\Rotex\\solar-ops\\app\\api\\setup\\init\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:I,staticGenerationAsyncStorage:_,serverHooks:N}=A,o="/api/setup/init/route";function d(){return(0,r.patchFetch)({serverHooks:N,staticGenerationAsyncStorage:_})}a()}catch(e){a(e)}})},1217:(e,E,t)=>{t.a(e,async(e,a)=>{try{t.r(E),t.d(E,{POST:()=>r});var i=t(1035),T=e([i]);async function r(e){try{let e=(0,i.JF)();return await e`
      CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,await e`
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
    `,await e`
      CREATE TABLE IF NOT EXISTS job_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          base_value DECIMAL(12,2) DEFAULT 0,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
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
    `,await e`
      CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,await e`
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
    `,await e`
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
    `,await e`
      CREATE TABLE IF NOT EXISTS time_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
          clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          clock_out TIMESTAMP WITH TIME ZONE,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,await e`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,await e`CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)`,await e`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`,await e`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`,await e`CREATE INDEX IF NOT EXISTS idx_job_technicians_job_id ON job_technicians(job_id)`,await e`CREATE INDEX IF NOT EXISTS idx_job_technicians_technician_id ON job_technicians(technician_id)`,await e`CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id)`,await e`CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp ON gps_logs(timestamp)`,await e`CREATE INDEX IF NOT EXISTS idx_maintenance_templates_assigned_to ON maintenance_templates(assigned_to)`,await e`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_template_id ON maintenance_occurrences(template_id)`,await e`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_assigned_to ON maintenance_occurrences(assigned_to)`,await e`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_scheduled_date ON maintenance_occurrences(scheduled_date)`,await e`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_status ON maintenance_occurrences(status)`,await e`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)`,await e`CREATE INDEX IF NOT EXISTS idx_accrued_values_user_id ON accrued_values(user_id)`,await e`CREATE INDEX IF NOT EXISTS idx_accrued_values_month_year ON accrued_values(month, year)`,await e`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,await e`CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)`,await e`
      INSERT INTO roles (name, description, is_admin, permissions) 
      VALUES 
        ('Super Admin', 'Full system access', true, '{"all": true}'),
        ('User', 'Default role for new users', false, '{"job_types:read": true}'),
        ('Technician', 'Technician role with job-specific permissions', false, '{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}')
      ON CONFLICT (name) DO NOTHING
    `,Response.json({message:"Database initialized successfully"})}catch(e){return Response.json({message:"Failed to initialize database",error:e.message},{status:500})}}i=(T.then?(await T)():T)[0],a()}catch(e){a(e)}})},1035:(e,E,t)=>{t.a(e,async(e,a)=>{try{t.d(E,{JF:()=>s,_B:()=>A,zW:()=>function e(E){if(null==E)return E;if(Array.isArray(E))return E.map(e);if("object"!=typeof E||E instanceof Date)return E;let t={};for(let[a,i]of Object.entries(E))t[a.replace(/_([a-z])/g,(e,E)=>E.toUpperCase())]=e(i);return t}});var i=t(53524),T=t(23907),r=e([T]);T=(r.then?(await r)():r)[0];let d=globalThis,A=function(){if(!d.prisma){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required for PrismaClient");let e=new T.g({connectionString:process.env.DATABASE_URL});d.prisma=new i.PrismaClient({adapter:e})}return d.prisma}();function s(){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required");return(e,...E)=>A.$queryRaw(e,...E)}function n(e){if(null==e)return e;if(Array.isArray(e))return e.map(n);if("object"!=typeof e)return e;let E={};for(let[t,a]of Object.entries(e))E[t.replace(/[A-Z]/g,e=>`_${e.toLowerCase()}`)]=n(a);return E}a()}catch(e){a(e)}})}};var E=require("../../../../webpack-runtime.js");E.C(e);var t=e=>E(E.s=e),a=E.X(0,[9379,4739],()=>t(68972));module.exports=a})();