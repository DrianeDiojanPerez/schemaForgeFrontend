// Original file: schema.proto

import type { SchemaSummary as _schemaforge_v1_SchemaSummary, SchemaSummary__Output as _schemaforge_v1_SchemaSummary__Output } from '../../schemaforge/v1/SchemaSummary';
import type { Long } from '@grpc/proto-loader';

export interface ListSchemasResponse {
  'schemas'?: (_schemaforge_v1_SchemaSummary)[];
  'page'?: (number);
  'perPage'?: (number);
  'total'?: (number | string | Long);
}

export interface ListSchemasResponse__Output {
  'schemas': (_schemaforge_v1_SchemaSummary__Output)[];
  'page': (number);
  'perPage': (number);
  'total': (number);
}
