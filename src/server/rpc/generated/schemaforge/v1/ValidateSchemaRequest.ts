// Original file: schema.proto

import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from '../../schemaforge/v1/Schema';

export interface ValidateSchemaRequest {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema | null);
  'target'?: "id"|"draft";
}

export interface ValidateSchemaRequest__Output {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema__Output | null);
}
