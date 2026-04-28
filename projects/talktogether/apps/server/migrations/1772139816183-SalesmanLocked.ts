import { MigrationInterface, QueryRunner } from "typeorm";

export class SalesmanLocked1777367000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Salesmans" ADD COLUMN IF NOT EXISTS locked boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Salesmans" DROP COLUMN IF EXISTS locked`);
    }
}
