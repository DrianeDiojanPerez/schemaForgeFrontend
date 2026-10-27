// Original file: schema.proto

import type { ComparisonCategory as _schemaforge_v1_ComparisonCategory, ComparisonCategory__Output as _schemaforge_v1_ComparisonCategory__Output } from '../../schemaforge/v1/ComparisonCategory';

export interface ComparisonCounts {
  'category'?: (_schemaforge_v1_ComparisonCategory);
  'matched'?: (number);
  'missing'?: (number);
  'extra'?: (number);
  'changed'?: (number);
  'precision'?: (number | string);
  'recall'?: (number | string);
}

export interface ComparisonCounts__Output {
  'category': (_schemaforge_v1_ComparisonCategory__Output);
  'matched': (number);
  'missing': (number);
  'extra': (number);
  'changed': (number);
  'precision': (number);
  'recall': (number);
}
