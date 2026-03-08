import path from "path";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "talktogether",
    synchronize: false,
    logging: false,
    migrations: [path.join(__dirname, "../migrations/*.ts"), path.join(__dirname, "../migrations/*.js")],
    migrationsRun: true,
});
