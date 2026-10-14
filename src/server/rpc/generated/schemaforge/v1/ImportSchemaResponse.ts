// Original file: schema.proto

import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from '../../schemaforge/v1/Schema';
import type { Diagnostic as _schemaforge_v1_Diagnostic, Diagnostic__Output as _schemaforge_v1_Diagnostic__Output } from '../../schemaforge/v1/Diagnostic';

export interface ImportSchemaResponse {
  'draft'?: (_schemaforge_v1_Schema | null);
  'diagnostics'?: (_schemaforge_v1_Diagnostic)[];
}

export interface ImportSchemaResponse__Output {
  'draft': (_schemaforge_v1_Schema__Output | null);
  'diagnostics': (_schemaforge_v1_Diagnostic__Output)[];
}
