-- Config version snapshots (one row per save before overwrite)
CREATE TABLE "config_snapshots" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "config_id"  UUID        NOT NULL,
  "version"    INTEGER     NOT NULL,
  "name"       VARCHAR(100) NOT NULL,
  "data"       JSONB       NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "config_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "config_snapshots_config_id_fkey"
    FOREIGN KEY ("config_id") REFERENCES "configurations"("id") ON DELETE CASCADE
);
CREATE INDEX "config_snapshots_config_id_idx" ON "config_snapshots" ("config_id");

-- Delete oldest snapshots so we keep at most 20 per config (trigger)
-- (enforced in application code via DELETE with limit instead)

-- Collections (user playlists)
CREATE TABLE "collections" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID         NOT NULL,
  "name"        VARCHAR(100) NOT NULL,
  "description" VARCHAR(500),
  "is_public"   BOOLEAN      NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "collections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "collections_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "collections_user_id_idx" ON "collections" ("user_id");

-- Collection items (junction)
CREATE TABLE "collection_items" (
  "collection_id" UUID        NOT NULL,
  "config_id"     UUID        NOT NULL,
  "added_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "collection_items_pkey" PRIMARY KEY ("collection_id", "config_id"),
  CONSTRAINT "collection_items_collection_id_fkey"
    FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE,
  CONSTRAINT "collection_items_config_id_fkey"
    FOREIGN KEY ("config_id") REFERENCES "configurations"("id") ON DELETE CASCADE
);
CREATE INDEX "collection_items_collection_id_idx" ON "collection_items" ("collection_id");
CREATE INDEX "collection_items_config_id_idx"     ON "collection_items" ("config_id");

-- GIN index on configurations.config JSONB for fast JSON path queries
-- (powers the SP version filter and future JSON-level searches)
CREATE INDEX "configurations_config_gin"
  ON "configurations" USING GIN ("config" jsonb_path_ops);

-- Composite index for explore "recent" sort (shared configs ordered by sharedAt)
CREATE INDEX "configurations_shared_shared_at_idx"
  ON "configurations" ("is_shared", "shared_at" DESC)
  WHERE "is_shared" = true;
