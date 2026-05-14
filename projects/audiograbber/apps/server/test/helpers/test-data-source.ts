import { DataSource } from "typeorm";
import { ArtistEntity } from "../../src/database/entities/artist.entity.js";
import { AlbumEntity } from "../../src/database/entities/album.entity.js";
import { AlbumTagEntity } from "../../src/database/entities/album-tag.entity.js";
import { UserEntity } from "../../src/database/entities/user.entity.js";
import { MediaFileEntity } from "../../src/database/entities/media-file.entity.js";
import { JobEntity } from "../../src/database/entities/job.entity.js";
import { AudioFingerprintEntity } from "../../src/database/entities/audio-fingerprint.entity.js";

export async function createTestDataSource(): Promise<DataSource> {
    const ds = new DataSource({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [UserEntity, ArtistEntity, AlbumEntity, AlbumTagEntity, MediaFileEntity, JobEntity, AudioFingerprintEntity],
    });
    await ds.initialize();
    return ds;
}
