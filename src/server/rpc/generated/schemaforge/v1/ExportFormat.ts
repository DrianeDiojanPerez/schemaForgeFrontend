// Original file: schema.proto

export const ExportFormat = {
  EXPORT_FORMAT_UNSPECIFIED: 'EXPORT_FORMAT_UNSPECIFIED',
  EXPORT_FORMAT_JSON: 'EXPORT_FORMAT_JSON',
  EXPORT_FORMAT_SQL: 'EXPORT_FORMAT_SQL',
} as const;

export type ExportFormat =
  | 'EXPORT_FORMAT_UNSPECIFIED'
  | 0
  | 'EXPORT_FORMAT_JSON'
  | 1
  | 'EXPORT_FORMAT_SQL'
  | 2

export type ExportFormat__Output = typeof ExportFormat[keyof typeof ExportFormat]
