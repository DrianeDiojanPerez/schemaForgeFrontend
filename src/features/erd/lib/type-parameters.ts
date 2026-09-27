import type { TableColumn } from "../types/erd"

const LENGTH_TYPES = new Set(["varchar", "char"])
const PRECISION_TYPES = new Set(["numeric", "decimal"])

export const takesLength = (format: string): boolean => LENGTH_TYPES.has(format)

export const takesPrecision = (format: string): boolean =>
  PRECISION_TYPES.has(format)

export function typeLabel(column: TableColumn): string {
  if (takesLength(column.format) && column.length !== undefined) {
    return `${column.format}(${column.length})`
  }

  if (takesPrecision(column.format) && column.precision !== undefined) {
    return column.scale === undefined
      ? `${column.format}(${column.precision})`
      : `${column.format}(${column.precision}, ${column.scale})`
  }

  return column.format
}
