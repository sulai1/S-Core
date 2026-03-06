import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateTriggers1772139816182 implements MigrationInterface {
    name = 'AddDateTriggers1772139816182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create trigger function for setting createdAt
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION set_created_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."createdAt" = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create trigger function for updating updatedAt
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."updatedAt" = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Add trigger to salesmans
        await queryRunner.query(`
            CREATE TRIGGER set_salesmans_created_at BEFORE INSERT ON "Salesmans"
            FOR EACH ROW EXECUTE FUNCTION set_created_at_column();
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_salesmans_updated_at BEFORE UPDATE ON "Salesmans"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        // Add trigger to identifications
        await queryRunner.query(`
            CREATE TRIGGER set_identifications_created_at BEFORE INSERT ON "Identifications"
            FOR EACH ROW EXECUTE FUNCTION set_created_at_column();
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_identifications_updated_at BEFORE UPDATE ON "Identifications"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        // Add trigger to items
        await queryRunner.query(`
            CREATE TRIGGER set_items_created_at BEFORE INSERT ON "Items"
            FOR EACH ROW EXECUTE FUNCTION set_created_at_column();
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON "Items"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS set_salesmans_created_at ON "Salesmans"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_salesmans_updated_at ON "Salesmans"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS set_identifications_created_at ON "Identifications"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_identifications_updated_at ON "Identifications"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS set_items_created_at ON "Items"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_items_updated_at ON "Items"`);

        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS set_created_at_column()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
    }
}
