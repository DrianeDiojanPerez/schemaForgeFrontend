// Original file: schema.proto

import type { ImportFormat as _schemaforge_v1_ImportFormat, ImportFormat__Output as _schemaforge_v1_ImportFormat__Output } from '../../schemaforge/v1/ImportFormat';

export interface ImportSchemaRequest {
  'content'?: (string);
  'format'?: (_schemaforge_v1_ImportFormat);
  'includePositions'?: (boolean);
  '_includePositions'?: "includePositions";
}

export interface ImportSchemaRequest__Output {
  'content': (string);
  'format': (_schemaforge_v1_ImportFormat__Output);
  'includePositions'?: (boolean);
}
