import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { CheckRequest as _schemaforge_v1_CheckRequest, CheckRequest__Output as _schemaforge_v1_CheckRequest__Output } from './schemaforge/v1/CheckRequest';
import type { CheckResponse as _schemaforge_v1_CheckResponse, CheckResponse__Output as _schemaforge_v1_CheckResponse__Output } from './schemaforge/v1/CheckResponse';
import type { HealthServiceClient as _schemaforge_v1_HealthServiceClient, HealthServiceDefinition as _schemaforge_v1_HealthServiceDefinition } from './schemaforge/v1/HealthService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  schemaforge: {
    v1: {
      CheckRequest: MessageTypeDefinition<_schemaforge_v1_CheckRequest, _schemaforge_v1_CheckRequest__Output>
      CheckResponse: MessageTypeDefinition<_schemaforge_v1_CheckResponse, _schemaforge_v1_CheckResponse__Output>
      HealthService: SubtypeConstructor<typeof grpc.Client, _schemaforge_v1_HealthServiceClient> & { service: _schemaforge_v1_HealthServiceDefinition }
    }
  }
}

