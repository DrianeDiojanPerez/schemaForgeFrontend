// Original file: schema.proto

import type { Member as _schemaforge_v1_Member, Member__Output as _schemaforge_v1_Member__Output } from '../../schemaforge/v1/Member';
import type { Invitation as _schemaforge_v1_Invitation, Invitation__Output as _schemaforge_v1_Invitation__Output } from '../../schemaforge/v1/Invitation';

export interface ShareSchemaResponse {
  'member'?: (_schemaforge_v1_Member | null);
  'invitation'?: (_schemaforge_v1_Invitation | null);
  'outcome'?: "member"|"invitation";
}

export interface ShareSchemaResponse__Output {
  'member'?: (_schemaforge_v1_Member__Output | null);
  'invitation'?: (_schemaforge_v1_Invitation__Output | null);
}
