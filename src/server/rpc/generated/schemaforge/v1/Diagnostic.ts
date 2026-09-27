// Original file: schema.proto

import type { Severity as _schemaforge_v1_Severity, Severity__Output as _schemaforge_v1_Severity__Output } from '../../schemaforge/v1/Severity';
import type { Position as _schemaforge_v1_Position, Position__Output as _schemaforge_v1_Position__Output } from '../../schemaforge/v1/Position';

export interface Diagnostic {
  'code'?: (string);
  'severity'?: (_schemaforge_v1_Severity);
  'message'?: (string);
  'elementIds'?: (string)[];
  'location'?: (_schemaforge_v1_Position | null);
  '_location'?: "location";
}

export interface Diagnostic__Output {
  'code': (string);
  'severity': (_schemaforge_v1_Severity__Output);
  'message': (string);
  'elementIds': (string)[];
  'location'?: (_schemaforge_v1_Position__Output | null);
}
