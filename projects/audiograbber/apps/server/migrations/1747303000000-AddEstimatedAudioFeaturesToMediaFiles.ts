import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEstimatedAudioFeaturesToMediaFiles1747303000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "estimatedBpm" float`);
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "estimatedKey" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "estimatedKey"`);
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "estimatedBpm"`);
    }
}
