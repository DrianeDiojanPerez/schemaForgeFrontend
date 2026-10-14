// Original file: schema.proto

export const ImportFormat = {
  IMPORT_FORMAT_UNSPECIFIED: 'IMPORT_FORMAT_UNSPECIFIED',
  IMPORT_FORMAT_JSON: 'IMPORT_FORMAT_JSON',
  IMPORT_FORMAT_SQL: 'IMPORT_FORMAT_SQL',
} as const;

export type ImportFormat =
  | 'IMPORT_FORMAT_UNSPECIFIED'
  | 0
  | 'IMPORT_FORMAT_JSON'
  | 1
  | 'IMPORT_FORMAT_SQL'
  | 2

export type ImportFormat__Output = typeof ImportFormat[keyof typeof ImportFormat]
