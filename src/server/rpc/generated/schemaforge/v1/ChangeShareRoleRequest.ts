// Original file: schema.proto

import type { ShareRole as _schemaforge_v1_ShareRole, ShareRole__Output as _schemaforge_v1_ShareRole__Output } from '../../schemaforge/v1/ShareRole';

export interface ChangeShareRoleRequest {
  'schemaId'?: (string);
  'userId'?: (string);
  'role'?: (_schemaforge_v1_ShareRole);
}

export interface ChangeShareRoleRequest__Output {
  'schemaId': (string);
  'userId': (string);
  'role': (_schemaforge_v1_ShareRole__Output);
}
