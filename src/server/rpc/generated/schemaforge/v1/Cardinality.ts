// Original file: schema.proto

export const Cardinality = {
  CARDINALITY_UNSPECIFIED: 'CARDINALITY_UNSPECIFIED',
  CARDINALITY_ONE_TO_ONE: 'CARDINALITY_ONE_TO_ONE',
  CARDINALITY_ONE_TO_MANY: 'CARDINALITY_ONE_TO_MANY',
  CARDINALITY_MANY_TO_MANY: 'CARDINALITY_MANY_TO_MANY',
} as const;

export type Cardinality =
  | 'CARDINALITY_UNSPECIFIED'
  | 0
  | 'CARDINALITY_ONE_TO_ONE'
  | 1
  | 'CARDINALITY_ONE_TO_MANY'
  | 2
  | 'CARDINALITY_MANY_TO_MANY'
  | 3

export type Cardinality__Output = typeof Cardinality[keyof typeof Cardinality]
