-- AlterTable
ALTER TABLE "access_token" ADD COLUMN     "expires_in" INTEGER,
ADD COLUMN     "token_type" VARCHAR(50);
