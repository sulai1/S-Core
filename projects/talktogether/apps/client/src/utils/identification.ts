import type { Identification } from '@s-core/talktogether';
import { datasource } from 'src/boot/di';

function toIsoMonthsFromNow(months: number): string {
    return new Date(new Date().setMonth(new Date().getMonth() + months)).toISOString();
}

export async function createOrRenewIdentificationForSalesman(salesmanId: number): Promise<Identification> {
    const validTo = toIsoMonthsFromNow(9);
    const activeThreshold = toIsoMonthsFromNow(-6);
    const now = new Date().toISOString();

    const existing = await datasource.find('Identification', {
        where: [
            { function: '=', params: ['salesman', { value: salesmanId }] },
            { function: '>', params: ['validTo', { value: activeThreshold }] },
        ],
        orderBy: [['validTo', 'desc']],
        limit: 1,
    });

    const existingEntry = (existing?.[0] as Identification | undefined) ?? undefined;
    if (existingEntry?.id) {
        await datasource.update('Identification', {
            validTo,
            updatedAt: now,
        }, [
            { function: '=', params: ['id', { value: existingEntry.id }] },
        ]);

        return {
            ...existingEntry,
            validTo,
            updatedAt: now,
        };
    }

    const usedRows = await datasource.find('Identification', {
        attributes: { id_nr: 'id_nr' },
        where: [
            { function: '>', params: ['validTo', { value: activeThreshold }] },
        ],
        orderBy: [['id_nr', 'asc']],
    });

    const usedIds = new Set(
        (usedRows as Array<{ id_nr: number }>)
            .map((row) => Number(row.id_nr))
            .filter((id) => Number.isInteger(id) && id > 0),
    );

    let freeId = 1;
    while (usedIds.has(freeId)) {
        freeId += 1;
    }

    const createdAt = now;
    const inserted = await datasource.insert('Identification', [{
        salesman: salesmanId,
        id_nr: freeId,
        validTo,
        createdAt,
        updatedAt: now,
    }]);

    const insertedId = Number((inserted?.[0] as { id?: number } | undefined)?.id ?? 0);

    return {
        id: insertedId,
        salesman: salesmanId,
        id_nr: freeId,
        validTo,
        createdAt,
        updatedAt: now,
    };
}
