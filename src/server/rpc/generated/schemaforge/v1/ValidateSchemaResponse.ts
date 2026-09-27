// Original file: schema.proto

import type { Diagnostic as _schemaforge_v1_Diagnostic, Diagnostic__Output as _schemaforge_v1_Diagnostic__Output } from '../../schemaforge/v1/Diagnostic';

export interface ValidateSchemaResponse {
  'valid'?: (boolean);
  'diagnostics'?: (_schemaforge_v1_Diagnostic)[];
}

export interface ValidateSchemaResponse__Output {
  'valid': (boolean);
  'diagnostics': (_schemaforge_v1_Diagnostic__Output)[];
}
