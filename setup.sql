CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_admin" BOOLEAN DEFAULT false,
    "permissions" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role_id" UUID,
    "status" VARCHAR(20) DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role_id" ON "users"("role_id");

CREATE TABLE IF NOT EXISTS "job_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "base_value" DECIMAL(12,2) DEFAULT 0,
    "color" VARCHAR(7) DEFAULT '#3B82F6',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "job_type_id" UUID,
    "created_by" UUID,
    "status" VARCHAR(20) DEFAULT 'assigned',
    "priority" VARCHAR(10) DEFAULT 'medium',
    "location_address" TEXT NOT NULL,
    "location_lat" DECIMAL(10,8),
    "location_lng" DECIMAL(11,8),
    "scheduled_date" DATE,
    "scheduled_time" TIME(6),
    "job_value" DECIMAL(12,2) DEFAULT 0,
    "instructions" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "is_archived" BOOLEAN DEFAULT false,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_jobs_created_at" ON "jobs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "jobs"("status");

CREATE TABLE IF NOT EXISTS "job_technicians" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID,
    "technician_id" UUID,
    "role" VARCHAR(20) DEFAULT 'assistant',
    "rating" DECIMAL(3,2),
    "feedback" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_technicians_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_job_technicians_job_id" ON "job_technicians"("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_technicians_technician_id" ON "job_technicians"("technician_id");

CREATE TABLE IF NOT EXISTS "gps_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "job_id" UUID,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "accuracy" DECIMAL(8,2),
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "journey_type" VARCHAR(20) DEFAULT 'active',
    CONSTRAINT "gps_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_gps_logs_timestamp" ON "gps_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_gps_logs_user_id" ON "gps_logs"("user_id");

CREATE TABLE IF NOT EXISTS "checkin_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "job_id" UUID,
    "type" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "notes" TEXT,
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkin_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "job_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID,
    "uploaded_by" UUID,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER,
    "storage_path" TEXT NOT NULL,
    "caption" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "maintenance_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "site_location" TEXT,
    "job_value" DECIMAL(12,2) DEFAULT 0,
    "assigned_to" UUID,
    "created_by" UUID,
    "recurrence_type" VARCHAR(20) NOT NULL,
    "recurrence_interval" INTEGER DEFAULT 1,
    "day_of_week" INTEGER,
    "day_of_month" INTEGER,
    "month_of_year" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_maintenance_templates_assigned_to" ON "maintenance_templates"("assigned_to");

CREATE TABLE IF NOT EXISTS "maintenance_occurrences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID,
    "scheduled_date" DATE NOT NULL,
    "assigned_to" UUID,
    "status" VARCHAR(20) DEFAULT 'scheduled',
    "priority" VARCHAR(10) DEFAULT 'medium',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_maintenance_occurrences_assigned_to" ON "maintenance_occurrences"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_maintenance_occurrences_scheduled_date" ON "maintenance_occurrences"("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_maintenance_occurrences_status" ON "maintenance_occurrences"("status");
CREATE INDEX IF NOT EXISTS "idx_maintenance_occurrences_template_id" ON "maintenance_occurrences"("template_id");

CREATE TABLE IF NOT EXISTS "accrued_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "job_id" UUID,
    "maintenance_occurrence_id" UUID,
    "job_value" DECIMAL(12,2) NOT NULL,
    "earned_amount" DECIMAL(12,2) NOT NULL,
    "rating" DECIMAL(3,2),
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accrued_values_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_accrued_values_month_year" ON "accrued_values"("month", "year");
CREATE INDEX IF NOT EXISTS "idx_accrued_values_user_id" ON "accrued_values"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accrued_values_job_id_user_id_key" ON "accrued_values"("job_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accrued_values_maintenance_occurrence_id_user_id_key" ON "accrued_values"("maintenance_occurrence_id", "user_id");

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_id" UUID,
    "sender_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'general',
    "related_job_id" UUID,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_notifications_recipient_id" ON "notifications"("recipient_id");

CREATE TABLE IF NOT EXISTS "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(255) NOT NULL,
    "target_type" VARCHAR(100),
    "target_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_target" ON "audit_logs"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");

CREATE TABLE IF NOT EXISTS "time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "job_id" UUID,
    "clock_in" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clock_out" TIMESTAMPTZ(6),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "job_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "job_technicians" ADD CONSTRAINT "job_technicians_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "job_technicians" ADD CONSTRAINT "job_technicians_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checkin_logs" ADD CONSTRAINT "checkin_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "checkin_logs" ADD CONSTRAINT "checkin_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "job_media" ADD CONSTRAINT "job_media_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "job_media" ADD CONSTRAINT "job_media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "maintenance_templates" ADD CONSTRAINT "maintenance_templates_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "maintenance_templates" ADD CONSTRAINT "maintenance_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "maintenance_occurrences" ADD CONSTRAINT "maintenance_occurrences_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "maintenance_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "accrued_values" ADD CONSTRAINT "accrued_values_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "accrued_values" ADD CONSTRAINT "accrued_values_maintenance_occurrence_id_fkey" FOREIGN KEY ("maintenance_occurrence_id") REFERENCES "maintenance_occurrences"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "accrued_values" ADD CONSTRAINT "accrued_values_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_job_id_fkey" FOREIGN KEY ("related_job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
