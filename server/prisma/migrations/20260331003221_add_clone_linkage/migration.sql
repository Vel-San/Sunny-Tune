-- AlterTable
ALTER TABLE "configurations" ADD COLUMN     "cloned_from_id" UUID;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_cloned_from_id_fkey" FOREIGN KEY ("cloned_from_id") REFERENCES "configurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
