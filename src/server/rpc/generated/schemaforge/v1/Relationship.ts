// Original file: schema.proto

import type { Cardinality as _schemaforge_v1_Cardinality, Cardinality__Output as _schemaforge_v1_Cardinality__Output } from '../../schemaforge/v1/Cardinality';

export interface Relationship {
  'id'?: (string);
  'name'?: (string);
  'description'?: (string);
  'fromEntityId'?: (string);
  'fromAttributeId'?: (string);
  'toEntityId'?: (string);
  'toAttributeId'?: (string);
  'cardinality'?: (_schemaforge_v1_Cardinality);
}

export interface Relationship__Output {
  'id': (string);
  'name': (string);
  'description': (string);
  'fromEntityId': (string);
  'fromAttributeId': (string);
  'toEntityId': (string);
  'toAttributeId': (string);
  'cardinality': (_schemaforge_v1_Cardinality__Output);
}
