export type PropOrGetter<T> = keyof T | ((row: T) => string);

export type SortFunction<T> = (a: T, b: T) => number

export type ColumnDesc<T, K extends PropOrGetter<T>> = {
  property: PropOrGetter<T>,
  headerName: string,
  type?: FieldType,
  headerCellClass?: string,
  sortable?: boolean,
  sortFunction?: SortFunction<T>,
  cellClass?: string | ((row: T, prop: K) => string),
  onClick?: (value: K, row: T, rowIndex: number, columnIndex: number) => void,
}

export function join<Left extends object, Right extends object>(
  left: Left[],
  right: Right[],
  leftKey: PropOrGetter<Left>,
  rightKey: PropOrGetter<Right>
): (Left & Right)[] {
  const rightKeyGetter = typeof rightKey === 'function'
    ? rightKey
    : (row: Right) => row[rightKey];
  const rightMap = new Map<string, Right>();
  for (const r of right) {
    const key = rightKeyGetter(r) as string;
    rightMap.set(key, r);
  }

  const leftKeyGetter = typeof leftKey === 'function' ? leftKey : (row: Left) => row[leftKey];

  const result: (Left & Right)[] = [];
  for (const l of left) {
    const key = leftKeyGetter(l) as string;
    const r = rightMap.get(key);
    if (r) {
      result.push({ ...l, ...r });
    }
  }
  return result;
}


export type FieldType = "text" | "link" | "icon" | "boolean" | "object" | "number" | "date" | "datetime" | "array";
