// Original file: schema.proto

import type { Collaborator as _schemaforge_v1_Collaborator, Collaborator__Output as _schemaforge_v1_Collaborator__Output } from '../../schemaforge/v1/Collaborator';
import type { ShareRole as _schemaforge_v1_ShareRole, ShareRole__Output as _schemaforge_v1_ShareRole__Output } from '../../schemaforge/v1/ShareRole';

export interface Member {
  'user'?: (_schemaforge_v1_Collaborator | null);
  'role'?: (_schemaforge_v1_ShareRole);
  'sharedBy'?: (string);
  'createdAt'?: (string);
  'updatedAt'?: (string);
}

export interface Member__Output {
  'user': (_schemaforge_v1_Collaborator__Output | null);
  'role': (_schemaforge_v1_ShareRole__Output);
  'sharedBy': (string);
  'createdAt': (string);
  'updatedAt': (string);
}
