import { z } from "zod"

import { takesLength, takesPrecision } from "./type-parameters"
import type { TableColumn } from "../types/erd"

/**
 * The dialogs hold every box as text, since a number box can be empty and
 * "nothing entered" has to survive to the save. These check the text is a
 * whole number when there is any, and the shaping into numbers happens once,
 * on submit.
 */
const whole = (least: number) =>
  z.string().refine(
    (text) => {
      const trimmed = text.trim()

      return (
        trimmed === "" || (/^\d+$/.test(trimmed) && Number(trimmed) >= least)
      )
    },
    { message: `A whole number of ${least} or more` }
  )

const text = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim()

const number = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value)

export const descriptionSchema = z.object({
  name: z.string(),
  description: z.string(),
})

export type DescriptionValues = z.infer<typeof descriptionSchema>

export type Details = { name?: string; description?: string }

export function descriptionValues(details: Details): DescriptionValues {
  return { name: details.name ?? "", description: details.description ?? "" }
}

export function toDetails(
  values: DescriptionValues,
  withName: boolean
): Details {
  return {
    ...(withName && { name: text(values.name) }),
    description: text(values.description),
  }
}

export const columnDetailsSchema = z.object({
  length: whole(1),
  precision: whole(1),
  scale: whole(0),
  defaultValue: z.string(),
  description: z.string(),
})

export type ColumnDetailsValues = z.infer<typeof columnDetailsSchema>

export function columnDetailsValues(column: TableColumn): ColumnDetailsValues {
  return {
    length: column.length?.toString() ?? "",
    precision: column.precision?.toString() ?? "",
    scale: column.scale?.toString() ?? "",
    defaultValue: column.defaultValue ?? "",
    description: column.description ?? "",
  }
}

export function toColumnPatch(
  values: ColumnDetailsValues,
  format: TableColumn["format"]
): Partial<TableColumn> {
  return {
    description: text(values.description),
    length: takesLength(format) ? number(values.length) : undefined,
    precision: takesPrecision(format) ? number(values.precision) : undefined,
    scale: takesPrecision(format) ? number(values.scale) : undefined,
    defaultValue: text(values.defaultValue),
  }
}
