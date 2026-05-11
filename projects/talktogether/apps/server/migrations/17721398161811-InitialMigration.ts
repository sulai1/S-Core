import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1772139816181 implements MigrationInterface {
    name = 'InitialMigration1772139816181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Salesmans" (
                "id" SERIAL NOT NULL,
                "first" character varying NOT NULL,
                "last" character varying NOT NULL,
                "phone" character varying,
                "image" character varying,
                "message" character varying,
                "createdAt" timestamp NOT NULL,
                "updatedAt" timestamp NOT NULL,
                CONSTRAINT "PK_f960b1d339ec486037d4ad813de" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(`
            CREATE TABLE "Identifications" (
                "id" SERIAL NOT NULL,
                "id_nr" integer NOT NULL,
                "salesman" integer NOT NULL,
                "createdAt" timestamp NOT NULL,
                "updatedAt" timestamp NOT NULL,
                "validTo" timestamp NOT NULL,
                CONSTRAINT "PK_4c4f716e96651b63e7369a42aeb" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(`
            CREATE TABLE "Items" (
                "id" SERIAL NOT NULL,
                "edition" integer NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "cost" integer NOT NULL,
                "price" integer NOT NULL,
                "quantity" integer NOT NULL,
                "createdAt" timestamp NOT NULL,
                "updatedAt" timestamp NOT NULL,
                "validTo" timestamp NOT NULL,
                CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(`
            CREATE TABLE "Transactions" (
                "id" SERIAL NOT NULL,
                "item" integer NOT NULL,
                "date" timestamp NOT NULL,
                "salesman" integer NOT NULL,
                "quantity" integer NOT NULL,
                "price" integer NOT NULL,
                "total" integer NOT NULL,
                CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(`
            ALTER TABLE "Identifications"
            ADD CONSTRAINT "FK_identifications_salesman"
            FOREIGN KEY ("salesman")
            REFERENCES "Salesmans"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Transactions"
            ADD CONSTRAINT "FK_transactions_salesman"
            FOREIGN KEY ("salesman")
            REFERENCES "Salesmans"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "Transactions"
            ADD CONSTRAINT "FK_transactions_item"
            FOREIGN KEY ("item")
            REFERENCES "Items"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_transactions_item"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_transactions_salesman"`);
        await queryRunner.query(`ALTER TABLE "Identifications" DROP CONSTRAINT "FK_identifications_salesman"`);
        await queryRunner.query(`DROP TABLE "Transactions"`);
        await queryRunner.query(`DROP TABLE "Items"`);
        await queryRunner.query(`DROP TABLE "Identifications"`);
        await queryRunner.query(`DROP TABLE "Salesmans"`);
    }

}
