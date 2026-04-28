import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddInvoiceColumns1777368000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add invoice_type column if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                ADD COLUMN IF NOT EXISTS "invoice_type" smallint DEFAULT 1;
        `);

        // Add user_id column if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                ADD COLUMN IF NOT EXISTS "user_id" int;
        `);

        // Add foreign key constraint for user_id if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                ADD CONSTRAINT "FK_invoices_user_id" 
                FOREIGN KEY ("user_id") REFERENCES "users" ("id") 
                ON DELETE SET NULL
                ON UPDATE NO ACTION;
        `).catch(() => {
            // Constraint might already exist, ignore error
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                DROP CONSTRAINT IF EXISTS "FK_invoices_user_id";
        `);

        // Remove columns
        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                DROP COLUMN IF EXISTS "user_id";
        `);

        await queryRunner.query(`
            ALTER TABLE IF EXISTS public."invoices"
                DROP COLUMN IF EXISTS "invoice_type";
        `);
    }

}
