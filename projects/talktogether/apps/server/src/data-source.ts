// src/data-source.ts
import "reflect-metadata";
import { DataSource, EntitySchema } from "typeorm";
import { tables } from "api";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "talktogether",
    synchronize: false,
    migrations: ["migrations/*{.ts,.js}"],
    entities: [
        new EntitySchema(tables.Salesman),
        new EntitySchema(tables.Identification),
        new EntitySchema(tables.Item),
        new EntitySchema(tables.Transaction),
        new EntitySchema(tables.User)
    ],
});