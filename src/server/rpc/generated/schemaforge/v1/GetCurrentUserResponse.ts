// Original file: auth.proto

import type { Permission as _schemaforge_v1_Permission, Permission__Output as _schemaforge_v1_Permission__Output } from '../../schemaforge/v1/Permission';

export interface GetCurrentUserResponse {
  'id'?: (string);
  'email'?: (string);
  'name'?: (string);
  'avatarUrl'?: (string);
  'roles'?: (string)[];
  'permissions'?: (_schemaforge_v1_Permission)[];
}

export interface GetCurrentUserResponse__Output {
  'id': (string);
  'email': (string);
  'name': (string);
  'avatarUrl': (string);
  'roles': (string)[];
  'permissions': (_schemaforge_v1_Permission__Output)[];
}
