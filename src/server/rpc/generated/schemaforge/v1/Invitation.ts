// Original file: schema.proto

import type { ShareRole as _schemaforge_v1_ShareRole, ShareRole__Output as _schemaforge_v1_ShareRole__Output } from '../../schemaforge/v1/ShareRole';

export interface Invitation {
  'id'?: (string);
  'schemaId'?: (string);
  'email'?: (string);
  'role'?: (_schemaforge_v1_ShareRole);
  'invitedBy'?: (string);
  'expiresAt'?: (string);
  'createdAt'?: (string);
}

export interface Invitation__Output {
  'id': (string);
  'schemaId': (string);
  'email': (string);
  'role': (_schemaforge_v1_ShareRole__Output);
  'invitedBy': (string);
  'expiresAt': (string);
  'createdAt': (string);
}
