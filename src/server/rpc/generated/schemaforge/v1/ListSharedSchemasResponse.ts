// Original file: schema.proto

import type { SharedSchema as _schemaforge_v1_SharedSchema, SharedSchema__Output as _schemaforge_v1_SharedSchema__Output } from '../../schemaforge/v1/SharedSchema';
import type { Long } from '@grpc/proto-loader';

export interface ListSharedSchemasResponse {
  'schemas'?: (_schemaforge_v1_SharedSchema)[];
  'page'?: (number);
  'perPage'?: (number);
  'total'?: (number | string | Long);
}

export interface ListSharedSchemasResponse__Output {
  'schemas': (_schemaforge_v1_SharedSchema__Output)[];
  'page': (number);
  'perPage': (number);
  'total': (number);
}
