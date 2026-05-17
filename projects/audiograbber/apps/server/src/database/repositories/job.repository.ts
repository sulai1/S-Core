import { DataSource, Repository } from "typeorm";
import { DbJob, DbJobKind, DbJobState, JobEntity } from "../entities/job.entity.js";

export type CreateJobData = {
    kind: DbJobKind;
    ownerId?: string | null;
    channelId?: string | null;
    scheduleId?: string | null;
};

export class JobRepository {
    private readonly repo: Repository<DbJob>;

    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(JobEntity);
    }

    async findById(id: string): Promise<DbJob | null> {
        return this.repo.findOneBy({ id });
    }

    async create(data: CreateJobData): Promise<DbJob> {
        const job = this.repo.create({
            kind: data.kind,
            state: "queued" as DbJobState,
            progress: 0,
            ownerId: data.ownerId ?? null,
            channelId: data.channelId ?? null,
            scheduleId: data.scheduleId ?? null,
            videosDownloaded: null,
            mediaFileId: null,
            externalJobId: null,
            error: null,
        });
        return this.repo.save(job);
    }

    async patch(
        id: string,
        patch: Partial<Pick<DbJob, "state" | "progress" | "externalJobId" | "error" | "videosDownloaded">>,
    ): Promise<void> {
        await this.repo.update(id, patch);
    }

    async listSyncJobsForSchedules(scheduleIds: string[], maxRows: number): Promise<DbJob[]> {
        if (scheduleIds.length === 0 || maxRows <= 0) {
            return [];
        }

        return this.repo.createQueryBuilder("job")
            .where('job."kind" = :kind', { kind: "sync" })
            .andWhere('job."scheduleId" IN (:...scheduleIds)', { scheduleIds })
            .orderBy('job."createdAt"', "DESC")
            .limit(maxRows)
            .getMany();
    }
}
