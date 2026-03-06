import { mkdirSync } from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { Database } from "./database.js";

export class Migration {
    name!: string;
}

export type Migrator = {
    list(): Promise<Migration[]>;
    applied(): Promise<Migration[]>;
    available(): Promise<Migration[]>;
    migrate(name: string, up: boolean): Promise<{ message: string, success: boolean }>;
    migrateAll(): Promise<{ message: string, success: boolean }>;
}

export class SimpleMigrator implements Migrator {

    constructor(private dataBase: Database, private path: string, options: { createTable?: boolean }) {
        mkdirSync(this.path, { recursive: true });
        if (options.createTable) {
            this.dataBase.query(`CREATE TABLE IF NOT EXISTS "Migration" (
                name VARCHAR(255) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (name)
            )`).catch((res: unknown) => {
                throw new Error((res as { error: string }).error);
            })
        }
    }

    async list(): Promise<Migration[]> {
        const migrations = await readdir(this.path);
        return migrations
            .filter(m => m.endsWith(".up.sql"))
            .map(m => { return { name: m.replace(".up.sql", "") } })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    async applied(): Promise<Migration[]> {
        const migrations = await this.dataBase.query<Migration[]>('SELECT * FROM "Migration" ORDER BY name');
        return migrations ? migrations : [];
    }

    async available(): Promise<Migration[]> {
        const applied = await this.applied();
        const list = await this.list();
        return list.filter(m => !applied.find(a => a.name === m.name)).sort((a, b) => a.name.localeCompare(b.name));
    }

    async migrate(name: string, up: boolean = true): Promise<{ message: string, success: boolean }> {

        const file = await readFile(path.join(this.path, name + (up ? ".up" : ".down") + ".sql"));
        const sql = file.toString();
        const cleanedSql = sql.replace(/--.*\n/g, ''); // Remove comment lines
        const queries = cleanedSql.split(";").filter(s => s.trim() !== "");
        const info: { message: string, success: boolean } = { message: "", success: true };
        for (const query of queries) // Remove empty lines
        {
            try {
                console.log("Executing: ", query);
                await this.dataBase.query(query);
            } catch (error) {
                console.error("Error executing query: ", query, error);
                info.message = JSON.stringify(error);
                info.success = false;
            }
        }
        if (info.success) {
            if (up) {
                await this.dataBase.query(`INSERT INTO 'Migration' (name) VALUES ('${name}')`);
            } else {
                await this.dataBase.query(`DELETE FROM 'Migration' WHERE name = '${name}'`);
            }
        }
        return info;
    }

    async migrateAll() {
        const available = await this.available();
        const info = { message: "", success: true };
        for (const migration of available) {
            const inf = await this.migrate(migration.name);
            if (!inf.success) {
                info.message += inf.message + "\n";
                info.success = false;
            }
        }
        return info;
    }
}

export default (dataBase: Database, path: string, options: { createTable?: boolean }) => new SimpleMigrator(dataBase, path, options);