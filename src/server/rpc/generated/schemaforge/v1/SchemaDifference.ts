// Original file: schema.proto

import type { DifferenceKind as _schemaforge_v1_DifferenceKind, DifferenceKind__Output as _schemaforge_v1_DifferenceKind__Output } from '../../schemaforge/v1/DifferenceKind';

export interface SchemaDifference {
  'kind'?: (_schemaforge_v1_DifferenceKind);
  'path'?: (string);
  'expected'?: (string);
  'actual'?: (string);
}

export interface SchemaDifference__Output {
  'kind': (_schemaforge_v1_DifferenceKind__Output);
  'path': (string);
  'expected': (string);
  'actual': (string);
}
