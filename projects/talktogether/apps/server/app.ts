import { createApplication, DataSource, Logger, SelectFunctionDefinitions, selectFunctionDefinitions } from '@s-core/core';
import { ConsoleLogger, Database, PostgresDialect } from '@s-core/server';
import { tables } from "@s-core/talktogether";
import path from 'path';
import { argv } from 'process';
import { serverFactory } from './src/serverFactory';


export const imgPath = path.join(__dirname, 'images'); // Ensure this path is correct

const dbName = process.env.DB_NAME || argv[3] || "talktogether";
const dbUser = process.env.DB_USER || argv[4] || "postgres";
const dbPassword = process.env.DB_PASSWORD || argv[5] || "password";
const dbPort = parseInt(process.env.DB_PORT || argv[6] || "5432", 10);
const dbHost = process.env.DB_HOST || argv[7] || "localhost";

export const appCollection = createApplication()
    .addModule("db", async () => {
        const db = new Database({
            tables: tables,
            host: dbHost,
            database: dbName,
            user: dbUser,
            password: dbPassword,
            port: dbPort,
            dialect: new PostgresDialect(),
            functions: selectFunctionDefinitions,
        })
        await db.connect();
        return db as DataSource<typeof tables, SelectFunctionDefinitions>;
    })
    .addModule<"logger", Logger>("logger", () => new ConsoleLogger())
    .addModule("server", serverFactory);

appCollection.configProvider.setValue("server", "port", process.env.NODE_PORT);

console.log(`Environment: DB_NAME: ${dbName}, DB_USER: ${dbUser}, DB_HOST: ${dbHost}, DB_PORT: ${dbPort}`);

appCollection.build().then(async builtApp => {
    await builtApp.start();
}).catch(e => {
    console.error("Failed to build application", e);
    process.exit(1);
});