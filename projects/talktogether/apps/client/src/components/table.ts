export type PropOrGetter<T> = keyof T | ((row: T) => string);

export type SortFunction<T> = (a: T, b: T) => number

export type ColumnDesc<T = Record<string, unknown>, K extends PropOrGetter<T> = PropOrGetter<T>> = {
  property: PropOrGetter<T>,
  headerName: string,
  headerCellClass?: string,
  sortable?: boolean,
  sortFunction?: SortFunction<T>,
  cellClass?: (row: T, prop: K) => string,
  onClick?: (value: K, row: T, rowIndex: number, columnIndex: number) => void | Promise<void>,
}
