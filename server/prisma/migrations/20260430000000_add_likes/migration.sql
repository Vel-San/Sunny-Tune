-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_config_id_key" ON "likes"("user_id", "config_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE INDEX "likes_config_id_idx" ON "likes"("config_id");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
