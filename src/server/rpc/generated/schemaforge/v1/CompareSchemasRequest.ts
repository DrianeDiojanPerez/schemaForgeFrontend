// Original file: schema.proto

import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from '../../schemaforge/v1/Schema';

export interface CompareSchemasRequest {
  'expectedId'?: (string);
  'expectedDraft'?: (_schemaforge_v1_Schema | null);
  'actualId'?: (string);
  'actualDraft'?: (_schemaforge_v1_Schema | null);
  'includePositions'?: (boolean);
  'expected'?: "expectedId"|"expectedDraft";
  'actual'?: "actualId"|"actualDraft";
  '_includePositions'?: "includePositions";
}

export interface CompareSchemasRequest__Output {
  'expectedId'?: (string);
  'expectedDraft'?: (_schemaforge_v1_Schema__Output | null);
  'actualId'?: (string);
  'actualDraft'?: (_schemaforge_v1_Schema__Output | null);
  'includePositions'?: (boolean);
}
