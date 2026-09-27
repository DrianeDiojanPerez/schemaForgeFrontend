// Original file: schema.proto

import type { Diagnostic as _schemaforge_v1_Diagnostic, Diagnostic__Output as _schemaforge_v1_Diagnostic__Output } from '../../schemaforge/v1/Diagnostic';

export interface GenerateDdlResponse {
  'ddl'?: (string);
  'diagnostics'?: (_schemaforge_v1_Diagnostic)[];
}

export interface GenerateDdlResponse__Output {
  'ddl': (string);
  'diagnostics': (_schemaforge_v1_Diagnostic__Output)[];
}
