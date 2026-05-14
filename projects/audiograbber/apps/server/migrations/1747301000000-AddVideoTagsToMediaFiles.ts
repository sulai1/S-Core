import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoTagsToMediaFiles1747301000000 implements MigrationInterface {
    name = "AddVideoTagsToMediaFiles1747301000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "videoTags" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "videoTags"`);
    }
}
