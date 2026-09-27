import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { AuthServiceClient as _schemaforge_v1_AuthServiceClient, AuthServiceDefinition as _schemaforge_v1_AuthServiceDefinition } from './schemaforge/v1/AuthService';
import type { LoginRequest as _schemaforge_v1_LoginRequest, LoginRequest__Output as _schemaforge_v1_LoginRequest__Output } from './schemaforge/v1/LoginRequest';
import type { LoginResponse as _schemaforge_v1_LoginResponse, LoginResponse__Output as _schemaforge_v1_LoginResponse__Output } from './schemaforge/v1/LoginResponse';
import type { RefreshTokenRequest as _schemaforge_v1_RefreshTokenRequest, RefreshTokenRequest__Output as _schemaforge_v1_RefreshTokenRequest__Output } from './schemaforge/v1/RefreshTokenRequest';
import type { RefreshTokenResponse as _schemaforge_v1_RefreshTokenResponse, RefreshTokenResponse__Output as _schemaforge_v1_RefreshTokenResponse__Output } from './schemaforge/v1/RefreshTokenResponse';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  schemaforge: {
    v1: {
      AuthService: SubtypeConstructor<typeof grpc.Client, _schemaforge_v1_AuthServiceClient> & { service: _schemaforge_v1_AuthServiceDefinition }
      LoginRequest: MessageTypeDefinition<_schemaforge_v1_LoginRequest, _schemaforge_v1_LoginRequest__Output>
      LoginResponse: MessageTypeDefinition<_schemaforge_v1_LoginResponse, _schemaforge_v1_LoginResponse__Output>
      RefreshTokenRequest: MessageTypeDefinition<_schemaforge_v1_RefreshTokenRequest, _schemaforge_v1_RefreshTokenRequest__Output>
      RefreshTokenResponse: MessageTypeDefinition<_schemaforge_v1_RefreshTokenResponse, _schemaforge_v1_RefreshTokenResponse__Output>
    }
  }
}

