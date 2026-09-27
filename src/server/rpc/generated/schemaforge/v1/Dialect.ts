// Original file: schema.proto

export const Dialect = {
  DIALECT_UNSPECIFIED: 'DIALECT_UNSPECIFIED',
  DIALECT_POSTGRES: 'DIALECT_POSTGRES',
  DIALECT_MYSQL: 'DIALECT_MYSQL',
} as const;

export type Dialect =
  | 'DIALECT_UNSPECIFIED'
  | 0
  | 'DIALECT_POSTGRES'
  | 1
  | 'DIALECT_MYSQL'
  | 2

export type Dialect__Output = typeof Dialect[keyof typeof Dialect]
