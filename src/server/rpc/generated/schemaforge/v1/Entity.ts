// Original file: schema.proto

import type { Attribute as _schemaforge_v1_Attribute, Attribute__Output as _schemaforge_v1_Attribute__Output } from '../../schemaforge/v1/Attribute';
import type { Position as _schemaforge_v1_Position, Position__Output as _schemaforge_v1_Position__Output } from '../../schemaforge/v1/Position';

export interface Entity {
  'id'?: (string);
  'name'?: (string);
  'description'?: (string);
  'attributes'?: (_schemaforge_v1_Attribute)[];
  'position'?: (_schemaforge_v1_Position | null);
}

export interface Entity__Output {
  'id': (string);
  'name': (string);
  'description': (string);
  'attributes': (_schemaforge_v1_Attribute__Output)[];
  'position': (_schemaforge_v1_Position__Output | null);
}
