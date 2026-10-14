// Original file: schema.proto

import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from '../../schemaforge/v1/Schema';
import type { ExportFormat as _schemaforge_v1_ExportFormat, ExportFormat__Output as _schemaforge_v1_ExportFormat__Output } from '../../schemaforge/v1/ExportFormat';

export interface ExportSchemaRequest {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema | null);
  'format'?: (_schemaforge_v1_ExportFormat);
  'includePositions'?: (boolean);
  'target'?: "id"|"draft";
  '_includePositions'?: "includePositions";
}

export interface ExportSchemaRequest__Output {
  'id'?: (string);
  'draft'?: (_schemaforge_v1_Schema__Output | null);
  'format': (_schemaforge_v1_ExportFormat__Output);
  'includePositions'?: (boolean);
}
