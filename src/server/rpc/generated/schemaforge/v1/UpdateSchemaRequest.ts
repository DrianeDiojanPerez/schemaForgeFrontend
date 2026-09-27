// Original file: schema.proto

import type { Entity as _schemaforge_v1_Entity, Entity__Output as _schemaforge_v1_Entity__Output } from '../../schemaforge/v1/Entity';
import type { Relationship as _schemaforge_v1_Relationship, Relationship__Output as _schemaforge_v1_Relationship__Output } from '../../schemaforge/v1/Relationship';

export interface UpdateSchemaRequest {
  'id'?: (string);
  'name'?: (string);
  'description'?: (string);
  'entities'?: (_schemaforge_v1_Entity)[];
  'relationships'?: (_schemaforge_v1_Relationship)[];
}

export interface UpdateSchemaRequest__Output {
  'id': (string);
  'name': (string);
  'description': (string);
  'entities': (_schemaforge_v1_Entity__Output)[];
  'relationships': (_schemaforge_v1_Relationship__Output)[];
}
