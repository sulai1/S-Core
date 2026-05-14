export type TrackedJobKind = 'download' | 'sync';

export interface TrackedJob {
    id: string;
    label: string;
    kind: TrackedJobKind;
    createdAt: string;
}

const KEY = 'audiograbber.jobs.tracked';

export const getTrackedJobs = (): TrackedJob[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as TrackedJob[];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed;
    } catch {
        return [];
    }
};

export const saveTrackedJobs = (jobs: TrackedJob[]): void => {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, 100)));
};

export const addTrackedJob = (job: TrackedJob): TrackedJob[] => {
    const jobs = getTrackedJobs();
    const next = [job, ...jobs.filter((j) => j.id !== job.id)].slice(0, 100);
    saveTrackedJobs(next);
    return next;
};

export const removeTrackedJob = (id: string): TrackedJob[] => {
    const next = getTrackedJobs().filter((j) => j.id !== id);
    saveTrackedJobs(next);
    return next;
};
