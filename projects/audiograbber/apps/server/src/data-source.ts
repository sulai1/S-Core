import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";
import { UserEntity } from "./database/entities/user.entity.js";
import { MediaFileEntity } from "./database/entities/media-file.entity.js";
import { JobEntity } from "./database/entities/job.entity.js";
import { AudioFingerprintEntity } from "./database/entities/audio-fingerprint.entity.js";
import { TagEntity } from "./database/entities/tag.entity.js";
import { MediaTagEntity } from "./database/entities/media-tag.entity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432"),
    username: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "audiograbber",
    synchronize: false,
    logging: false,
    entities: [UserEntity, MediaFileEntity, JobEntity, AudioFingerprintEntity, TagEntity, MediaTagEntity],
    migrations: [
        path.join(__dirname, "../migrations/*.ts"),
        path.join(__dirname, "../migrations/*.js"),
    ],
    migrationsRun: true,
});
