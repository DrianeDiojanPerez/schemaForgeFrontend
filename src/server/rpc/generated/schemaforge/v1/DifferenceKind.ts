// Original file: schema.proto

export const DifferenceKind = {
  DIFFERENCE_KIND_UNSPECIFIED: 'DIFFERENCE_KIND_UNSPECIFIED',
  DIFFERENCE_KIND_MISSING: 'DIFFERENCE_KIND_MISSING',
  DIFFERENCE_KIND_EXTRA: 'DIFFERENCE_KIND_EXTRA',
  DIFFERENCE_KIND_CHANGED: 'DIFFERENCE_KIND_CHANGED',
} as const;

export type DifferenceKind =
  | 'DIFFERENCE_KIND_UNSPECIFIED'
  | 0
  | 'DIFFERENCE_KIND_MISSING'
  | 1
  | 'DIFFERENCE_KIND_EXTRA'
  | 2
  | 'DIFFERENCE_KIND_CHANGED'
  | 3

export type DifferenceKind__Output = typeof DifferenceKind[keyof typeof DifferenceKind]
