// Original file: schema.proto

import type { Member as _schemaforge_v1_Member, Member__Output as _schemaforge_v1_Member__Output } from '../../schemaforge/v1/Member';
import type { Invitation as _schemaforge_v1_Invitation, Invitation__Output as _schemaforge_v1_Invitation__Output } from '../../schemaforge/v1/Invitation';

export interface ListPeopleResponse {
  'members'?: (_schemaforge_v1_Member)[];
  'invitations'?: (_schemaforge_v1_Invitation)[];
}

export interface ListPeopleResponse__Output {
  'members': (_schemaforge_v1_Member__Output)[];
  'invitations': (_schemaforge_v1_Invitation__Output)[];
}
