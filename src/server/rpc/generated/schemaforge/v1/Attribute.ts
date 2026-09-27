// Original file: schema.proto

import type { DataType as _schemaforge_v1_DataType, DataType__Output as _schemaforge_v1_DataType__Output } from '../../schemaforge/v1/DataType';
import type { ForeignKeyRef as _schemaforge_v1_ForeignKeyRef, ForeignKeyRef__Output as _schemaforge_v1_ForeignKeyRef__Output } from '../../schemaforge/v1/ForeignKeyRef';

export interface Attribute {
  'id'?: (string);
  'name'?: (string);
  'description'?: (string);
  'dataType'?: (_schemaforge_v1_DataType | null);
  'nullable'?: (boolean);
  'primaryKey'?: (boolean);
  'unique'?: (boolean);
  'foreignKey'?: (_schemaforge_v1_ForeignKeyRef | null);
  'defaultValue'?: (string);
  '_foreignKey'?: "foreignKey";
  '_defaultValue'?: "defaultValue";
}

export interface Attribute__Output {
  'id': (string);
  'name': (string);
  'description': (string);
  'dataType': (_schemaforge_v1_DataType__Output | null);
  'nullable': (boolean);
  'primaryKey': (boolean);
  'unique': (boolean);
  'foreignKey'?: (_schemaforge_v1_ForeignKeyRef__Output | null);
  'defaultValue'?: (string);
}
