// Original file: schema.proto

import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from '../../schemaforge/v1/Schema';
import type { Dialect as _schemaforge_v1_Dialect, Dialect__Output as _schemaforge_v1_Dialect__Output } from '../../schemaforge/v1/Dialect';

export interface GenerateDdlRequest {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema | null);
  'dialect'?: (_schemaforge_v1_Dialect);
  'includeComments'?: (boolean);
  'target'?: "id"|"draft";
}

export interface GenerateDdlRequest__Output {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema__Output | null);
  'dialect': (_schemaforge_v1_Dialect__Output);
  'includeComments': (boolean);
}
