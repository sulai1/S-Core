import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumMetadataAndTags1747307000000 implements MigrationInterface {
    name = "AddAlbumMetadataAndTags1747307000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "label" text`);
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "catalogue" text`);
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "genre" text`);
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "style" text`);
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "format" text`);
        await queryRunner.query(`ALTER TABLE "albums" ADD COLUMN "releaseDate" timestamptz`);

        await queryRunner.query(`
            CREATE TABLE "album_tags" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "albumId" uuid NOT NULL REFERENCES "albums"("id") ON DELETE CASCADE,
                "tagId" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_album_tags_albumId_tagId" UNIQUE ("albumId", "tagId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_album_tags_albumId" ON "album_tags"("albumId")`);
        await queryRunner.query(`CREATE INDEX "IDX_album_tags_tagId" ON "album_tags"("tagId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_album_tags_tagId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_album_tags_albumId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "album_tags"`);

        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "releaseDate"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "format"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "style"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "genre"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "catalogue"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN IF EXISTS "label"`);
    }
}