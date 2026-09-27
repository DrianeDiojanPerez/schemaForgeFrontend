// Original file: schema.proto

export const Severity = {
  SEVERITY_UNSPECIFIED: 'SEVERITY_UNSPECIFIED',
  SEVERITY_WARNING: 'SEVERITY_WARNING',
  SEVERITY_ERROR: 'SEVERITY_ERROR',
} as const;

export type Severity =
  | 'SEVERITY_UNSPECIFIED'
  | 0
  | 'SEVERITY_WARNING'
  | 1
  | 'SEVERITY_ERROR'
  | 2

export type Severity__Output = typeof Severity[keyof typeof Severity]
