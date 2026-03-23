import { describe, test } from "vitest";
import { selectFunctionDefinitions } from "@s-core/core";
import { Database, PostgresDialect } from "../../../src/database/index.js";

describe('connect', () => {
    test('should connect to the database', async () => {
        const db = new Database({
            host: process.env.DB_HOST || "localhost",
            database: "talktogether",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || undefined,
            dialect: new PostgresDialect(),
            functions: selectFunctionDefinitions,
            tables: {
                Salesman: {
                    name: "Salesmans",
                    columns: {
                        id: {
                            type: Number,
                            primary: true,
                        },
                        first: {
                            type: String,
                        },
                    },
                },
            },
        })
        await db.connect();
        const res = await db.select({ s: "Salesman" }, {
            where: [{
                function: "in",
                params: ["s.id", { value: [1, 2, 3] }],
            }]
        });
        console.log(res);
    });
});