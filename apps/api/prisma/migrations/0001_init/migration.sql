CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'RH_PRO', 'CANDIDATE', 'RECRUITER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE "ProfileCompletionStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "Locale" AS ENUM ('FR', 'EN');
CREATE TYPE "CvStatus" AS ENUM ('DRAFT', 'ACTIVE', 'HIDDEN', 'DELETED');
CREATE TYPE "FileType" AS ENUM ('PDF', 'DOCX');
CREATE TYPE "ReviewRequestStatus" AS ENUM ('OPEN', 'ASSIGNED', 'SUBMITTED', 'CLOSED');
CREATE TYPE "ReportTargetType" AS ENUM ('CV', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');
CREATE TYPE "AuditAction" AS ENUM (
  'VIEW_CV',
  'DOWNLOAD_CV',
  'SEARCH_CV',
  'UPLOAD_CV',
  'DELETE_CV',
  'ASSIGN_REQUEST',
  'SUBMIT_REVIEW',
  'BAN_USER',
  'HIDE_CV',
  'APPROVE_VERIFICATION'
);

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CANDIDATE',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
  "user_id" UUID NOT NULL,
  "full_name" TEXT,
  "country" TEXT,
  "city" TEXT,
  "phone" TEXT,
  "headline" TEXT,
  "years_experience" INTEGER NOT NULL DEFAULT 0,
  "locale" "Locale" NOT NULL DEFAULT 'FR',
  "completion_status" "ProfileCompletionStatus" NOT NULL DEFAULT 'INCOMPLETE',
  "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "verified_badge" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "job_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name_fr" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cvs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_type" "FileType" NOT NULL,
  "status" "CvStatus" NOT NULL DEFAULT 'DRAFT',
  "searchable_text" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "cvs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cv_id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "status" "ReviewRequestStatus" NOT NULL DEFAULT 'OPEN',
  "assigned_rh_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "request_id" UUID NOT NULL,
  "rh_id" UUID NOT NULL,
  "score_ats" INTEGER NOT NULL,
  "score_readability" INTEGER NOT NULL,
  "score_consistency" INTEGER NOT NULL,
  "global_note" TEXT NOT NULL,
  "section_profile" TEXT NOT NULL,
  "section_experience" TEXT NOT NULL,
  "section_skills" TEXT NOT NULL,
  "suggestions" TEXT NOT NULL,
  "recommended_template" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reporter_user_id" UUID NOT NULL,
  "target_type" "ReportTargetType" NOT NULL,
  "target_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" UUID,
  "action" "AuditAction" NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "metadata" JSONB,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "job_categories_slug_key" ON "job_categories"("slug");
CREATE UNIQUE INDEX "reviews_request_id_key" ON "reviews"("request_id");

CREATE INDEX "profiles_country_city_idx" ON "profiles"("country", "city");
CREATE INDEX "profiles_years_experience_idx" ON "profiles"("years_experience");
CREATE INDEX "job_categories_is_active_sort_order_idx" ON "job_categories"("is_active", "sort_order");
CREATE INDEX "cvs_user_id_status_idx" ON "cvs"("user_id", "status");
CREATE INDEX "cvs_category_id_status_idx" ON "cvs"("category_id", "status");
CREATE INDEX "cvs_created_at_idx" ON "cvs"("created_at");
CREATE INDEX "cvs_searchable_text_tsv_idx"
  ON "cvs" USING GIN (to_tsvector('simple', COALESCE("searchable_text", '')));
CREATE INDEX "review_requests_status_created_at_idx" ON "review_requests"("status", "created_at");
CREATE INDEX "review_requests_assigned_rh_id_idx" ON "review_requests"("assigned_rh_id");
CREATE INDEX "reviews_rh_id_created_at_idx" ON "reviews"("rh_id", "created_at");
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cvs"
  ADD CONSTRAINT "cvs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cvs"
  ADD CONSTRAINT "cvs_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "job_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "review_requests"
  ADD CONSTRAINT "review_requests_cv_id_fkey"
  FOREIGN KEY ("cv_id") REFERENCES "cvs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_requests"
  ADD CONSTRAINT "review_requests_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_requests"
  ADD CONSTRAINT "review_requests_assigned_rh_id_fkey"
  FOREIGN KEY ("assigned_rh_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "review_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rh_id_fkey"
  FOREIGN KEY ("rh_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_reporter_user_id_fkey"
  FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
