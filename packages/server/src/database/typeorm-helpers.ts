import { DataSource } from 'typeorm';

/**
 * Extract primary key column names from a TypeORM entity
 */
export function getPrimaryKeyAttributes<T extends { new(...args: any[]): any }>(
    entity: T,
    dataSource: DataSource
): readonly (keyof InstanceType<T>)[] {
    const metadata = dataSource.getMetadata(entity);
    return metadata.primaryColumns.map(col => col.propertyName) as readonly (keyof InstanceType<T>)[];
}

/**
 * Extract creation-optional column names from a TypeORM entity
 * These include:
 * - Primary columns with generated values (@PrimaryGeneratedColumn)
 * - Columns with default values
 * - @CreateDateColumn and @UpdateDateColumn
 */
export function getCreationOptionalAttributes<T extends { new(...args: any[]): any }>(
    entity: T,
    dataSource: DataSource
): readonly (keyof InstanceType<T>)[] {
    const metadata = dataSource.getMetadata(entity);
    const optionalColumns: string[] = [];

    for (const column of metadata.columns) {
        // Primary columns that are auto-generated
        if (column.isGenerated) {
            optionalColumns.push(column.propertyName);
            continue;
        }

        // Columns with default values
        if (column.default !== undefined) {
            optionalColumns.push(column.propertyName);
            continue;
        }

        // CreateDate and UpdateDate columns
        if (column.isCreateDate || column.isUpdateDate) {
            optionalColumns.push(column.propertyName);
            continue;
        }
    }

    return optionalColumns as readonly (keyof InstanceType<T>)[];
}

/**
 * Automatically set static __primaryKey and __creationOptional on an entity class
 */
export function applyEntityMetadata<T extends { new(...args: any[]): any }>(
    entity: T,
    dataSource: DataSource
): void {
    const pk = getPrimaryKeyAttributes(entity, dataSource);
    const co = getCreationOptionalAttributes(entity, dataSource);

    (entity as { __primaryKey?: readonly (keyof InstanceType<T>)[] }).__primaryKey = pk;
    (entity as { __creationOptional?: readonly (keyof InstanceType<T>)[] }).__creationOptional = co;
}

/**
 * Apply metadata to all entities in a DataSource
 */
export function applyAllEntityMetadata(dataSource: DataSource): void {
    for (const metadata of dataSource.entityMetadatas) {
        applyEntityMetadata(metadata.target as any, dataSource);
    }
}
