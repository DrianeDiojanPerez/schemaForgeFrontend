// Original file: schema.proto

import type { ComparisonCounts as _schemaforge_v1_ComparisonCounts, ComparisonCounts__Output as _schemaforge_v1_ComparisonCounts__Output } from '../../schemaforge/v1/ComparisonCounts';
import type { SchemaDifference as _schemaforge_v1_SchemaDifference, SchemaDifference__Output as _schemaforge_v1_SchemaDifference__Output } from '../../schemaforge/v1/SchemaDifference';

export interface CompareSchemasResponse {
  'equal'?: (boolean);
  'counts'?: (_schemaforge_v1_ComparisonCounts)[];
  'differences'?: (_schemaforge_v1_SchemaDifference)[];
}

export interface CompareSchemasResponse__Output {
  'equal': (boolean);
  'counts': (_schemaforge_v1_ComparisonCounts__Output)[];
  'differences': (_schemaforge_v1_SchemaDifference__Output)[];
}
