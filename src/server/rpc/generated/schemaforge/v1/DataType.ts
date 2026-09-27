// Original file: schema.proto

import type { DataTypeKind as _schemaforge_v1_DataTypeKind, DataTypeKind__Output as _schemaforge_v1_DataTypeKind__Output } from '../../schemaforge/v1/DataTypeKind';

export interface DataType {
  'kind'?: (_schemaforge_v1_DataTypeKind);
  'length'?: (number);
  'precision'?: (number);
  'scale'?: (number);
  '_length'?: "length";
  '_precision'?: "precision";
  '_scale'?: "scale";
}

export interface DataType__Output {
  'kind': (_schemaforge_v1_DataTypeKind__Output);
  'length'?: (number);
  'precision'?: (number);
  'scale'?: (number);
}
