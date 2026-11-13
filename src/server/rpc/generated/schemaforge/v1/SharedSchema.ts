// Original file: schema.proto

import type { SchemaSummary as _schemaforge_v1_SchemaSummary, SchemaSummary__Output as _schemaforge_v1_SchemaSummary__Output } from '../../schemaforge/v1/SchemaSummary';
import type { ShareRole as _schemaforge_v1_ShareRole, ShareRole__Output as _schemaforge_v1_ShareRole__Output } from '../../schemaforge/v1/ShareRole';
import type { Collaborator as _schemaforge_v1_Collaborator, Collaborator__Output as _schemaforge_v1_Collaborator__Output } from '../../schemaforge/v1/Collaborator';

export interface SharedSchema {
  'schema'?: (_schemaforge_v1_SchemaSummary | null);
  'role'?: (_schemaforge_v1_ShareRole);
  'owner'?: (_schemaforge_v1_Collaborator | null);
}

export interface SharedSchema__Output {
  'schema': (_schemaforge_v1_SchemaSummary__Output | null);
  'role': (_schemaforge_v1_ShareRole__Output);
  'owner': (_schemaforge_v1_Collaborator__Output | null);
}
