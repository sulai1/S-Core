import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYearToMediaFiles1747302000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "year" int`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "year"`);
    }
}
