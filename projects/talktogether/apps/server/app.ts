import path from 'path';
import { argv } from 'process';
import { createApplication, DataSource, SelectFunctionDefinitions, selectFunctionDefinitions } from '@s-core/core';
import { Database, PostgreDialect } from '@s-core/server';
import { tables } from "@s-core/talktogether";
import { serverFactory } from './src/serverFactory';

const env = process.env.NODE_ENV || 'development';

export const imgPath = path.join(__dirname, 'images'); // Ensure this path is correct

process.env.DB_NAME = process.env.DB_NAME || argv[3];
process.env.DB_USER = process.env.DB_USER || argv[4];
process.env.DB_PASSWORD = process.env.DB_PASSWORD || argv[5];
process.env.DB_PORT = process.env.DB_PORT || argv[6];
process.env.DB_HOST = process.env.DB_HOST || argv[7];

const appCollection = createApplication()
    .addModule("db", async () => {
        const db = new Database({
            tables: tables,
            host: process.env.DB_HOST || "localhost",
            database: process.env.DB_NAME || "talktogether",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD,
            dialect: new PostgreDialect(),
            functions: selectFunctionDefinitions,
        })
        await db.connect();
        return db as DataSource<typeof tables, SelectFunctionDefinitions>;
    })
    .addModule("server", serverFactory);

appCollection.configProvider.setValue("server", "port", process.env.NODE_PORT);

console.log(`Environment: DB_NAME: ${process.env.DB_NAME}, DB_USER: ${process.env.DB_USER}, DB_HOST: ${process.env.DB_HOST}, DB_PORT: ${process.env.DB_PORT}`);
export const app = appCollection.build().then(async app => {
    await app.start();
}).catch(e => {
    console.error("Failed to build application", e);
    process.exit(1);
});