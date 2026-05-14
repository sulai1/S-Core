import { DataSource, Repository } from "typeorm";
import { DbJob, DbJobKind, DbJobState, JobEntity } from "../entities/job.entity.js";

export type CreateJobData = {
    kind: DbJobKind;
    ownerId?: string | null;
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
            mediaFileId: null,
            externalJobId: null,
            error: null,
        });
        return this.repo.save(job);
    }

    async patch(id: string, patch: Partial<Pick<DbJob, "state" | "progress" | "externalJobId" | "error">>): Promise<void> {
        await this.repo.update(id, patch);
    }
}
