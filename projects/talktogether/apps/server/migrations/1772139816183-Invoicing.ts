import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class Invoicing1772139816183 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.createTable(new Table({
            name: "invoices",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "period_start",
                    type: "timestamp",
                    isNullable: true,
                },
                {
                    name: "period_end",
                    type: "timestamp",
                    isNullable: true,
                },
                {
                    name: "total",
                    type: "Numeric",
                    precision: 12,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "state",
                    type: "smallint",
                    default: 0,
                },
                {
                    name: "description",
                    type: "varchar",
                    length: "255",
                    isNullable: true,
                }
            ],
        }), true);

        await queryRunner.createTable(new Table({
            name: "invoice_items",
            columns: [
                {
                    name: "invoice_id",
                    type: "int",
                    isPrimary: true,
                },
                {
                    name: "transaction_id",
                    type: "int",
                    isPrimary: true,
                },
            ],
            foreignKeys: [
                {
                    columnNames: ["invoice_id"],
                    referencedTableName: "invoices",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                },
                {
                    columnNames: ["transaction_id"],
                    referencedTableName: "Transactions",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                },
            ],
        }), true);

        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."Transactions"
                ADD COLUMN IF NOT EXISTS state smallint DEFAULT 0;
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."Transactions"
                DROP COLUMN IF EXISTS state;
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS public."invoice_items";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS public."invoices";
        `);

    }

}
