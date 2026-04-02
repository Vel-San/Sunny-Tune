-- ── Reply threading: add parent_id to comments ───────────────────────────────
ALTER TABLE "comments"
  ADD COLUMN "parent_id" UUID REFERENCES "comments"("id") ON DELETE SET NULL;

CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID         NOT NULL,
  "type"       VARCHAR(20)  NOT NULL,
  "config_id"  UUID,
  "payload"    JSONB,
  "read_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "notifications_user_id_fkey"    FOREIGN KEY ("user_id")   REFERENCES "users"("id")          ON DELETE CASCADE,
  CONSTRAINT "notifications_config_id_fkey"  FOREIGN KEY ("config_id") REFERENCES "configurations"("id") ON DELETE CASCADE
);

CREATE INDEX "notifications_user_id_idx"   ON "notifications"("user_id");
CREATE INDEX "notifications_config_id_idx" ON "notifications"("config_id");

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE "reports" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "reporter_id" UUID         NOT NULL,
  "target_type" VARCHAR(20)  NOT NULL,
  "target_id"   UUID         NOT NULL,
  "reason"      VARCHAR(500) NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reports_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "reports_reporter_id_target_type_target_id_key"
  ON "reports"("reporter_id", "target_type", "target_id");

CREATE INDEX "reports_target_type_target_id_idx"
  ON "reports"("target_type", "target_id");
