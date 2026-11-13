// Original file: schema.proto

import type { ShareRole as _schemaforge_v1_ShareRole, ShareRole__Output as _schemaforge_v1_ShareRole__Output } from '../../schemaforge/v1/ShareRole';

export interface ShareSchemaRequest {
  'schemaId'?: (string);
  'email'?: (string);
  'role'?: (_schemaforge_v1_ShareRole);
  'callbackUri'?: (string);
}

export interface ShareSchemaRequest__Output {
  'schemaId': (string);
  'email': (string);
  'role': (_schemaforge_v1_ShareRole__Output);
  'callbackUri': (string);
}
