import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { AuthServiceClient as _schemaforge_v1_AuthServiceClient, AuthServiceDefinition as _schemaforge_v1_AuthServiceDefinition } from './schemaforge/v1/AuthService';
import type { GetCurrentUserRequest as _schemaforge_v1_GetCurrentUserRequest, GetCurrentUserRequest__Output as _schemaforge_v1_GetCurrentUserRequest__Output } from './schemaforge/v1/GetCurrentUserRequest';
import type { GetCurrentUserResponse as _schemaforge_v1_GetCurrentUserResponse, GetCurrentUserResponse__Output as _schemaforge_v1_GetCurrentUserResponse__Output } from './schemaforge/v1/GetCurrentUserResponse';
import type { GoogleLoginUrlRequest as _schemaforge_v1_GoogleLoginUrlRequest, GoogleLoginUrlRequest__Output as _schemaforge_v1_GoogleLoginUrlRequest__Output } from './schemaforge/v1/GoogleLoginUrlRequest';
import type { GoogleLoginUrlResponse as _schemaforge_v1_GoogleLoginUrlResponse, GoogleLoginUrlResponse__Output as _schemaforge_v1_GoogleLoginUrlResponse__Output } from './schemaforge/v1/GoogleLoginUrlResponse';
import type { LoginRequest as _schemaforge_v1_LoginRequest, LoginRequest__Output as _schemaforge_v1_LoginRequest__Output } from './schemaforge/v1/LoginRequest';
import type { LoginResponse as _schemaforge_v1_LoginResponse, LoginResponse__Output as _schemaforge_v1_LoginResponse__Output } from './schemaforge/v1/LoginResponse';
import type { LoginWithGoogleRequest as _schemaforge_v1_LoginWithGoogleRequest, LoginWithGoogleRequest__Output as _schemaforge_v1_LoginWithGoogleRequest__Output } from './schemaforge/v1/LoginWithGoogleRequest';
import type { Permission as _schemaforge_v1_Permission, Permission__Output as _schemaforge_v1_Permission__Output } from './schemaforge/v1/Permission';
import type { RefreshTokenRequest as _schemaforge_v1_RefreshTokenRequest, RefreshTokenRequest__Output as _schemaforge_v1_RefreshTokenRequest__Output } from './schemaforge/v1/RefreshTokenRequest';
import type { RefreshTokenResponse as _schemaforge_v1_RefreshTokenResponse, RefreshTokenResponse__Output as _schemaforge_v1_RefreshTokenResponse__Output } from './schemaforge/v1/RefreshTokenResponse';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  schemaforge: {
    v1: {
      AuthService: SubtypeConstructor<typeof grpc.Client, _schemaforge_v1_AuthServiceClient> & { service: _schemaforge_v1_AuthServiceDefinition }
      GetCurrentUserRequest: MessageTypeDefinition<_schemaforge_v1_GetCurrentUserRequest, _schemaforge_v1_GetCurrentUserRequest__Output>
      GetCurrentUserResponse: MessageTypeDefinition<_schemaforge_v1_GetCurrentUserResponse, _schemaforge_v1_GetCurrentUserResponse__Output>
      GoogleLoginUrlRequest: MessageTypeDefinition<_schemaforge_v1_GoogleLoginUrlRequest, _schemaforge_v1_GoogleLoginUrlRequest__Output>
      GoogleLoginUrlResponse: MessageTypeDefinition<_schemaforge_v1_GoogleLoginUrlResponse, _schemaforge_v1_GoogleLoginUrlResponse__Output>
      LoginRequest: MessageTypeDefinition<_schemaforge_v1_LoginRequest, _schemaforge_v1_LoginRequest__Output>
      LoginResponse: MessageTypeDefinition<_schemaforge_v1_LoginResponse, _schemaforge_v1_LoginResponse__Output>
      LoginWithGoogleRequest: MessageTypeDefinition<_schemaforge_v1_LoginWithGoogleRequest, _schemaforge_v1_LoginWithGoogleRequest__Output>
      Permission: MessageTypeDefinition<_schemaforge_v1_Permission, _schemaforge_v1_Permission__Output>
      RefreshTokenRequest: MessageTypeDefinition<_schemaforge_v1_RefreshTokenRequest, _schemaforge_v1_RefreshTokenRequest__Output>
      RefreshTokenResponse: MessageTypeDefinition<_schemaforge_v1_RefreshTokenResponse, _schemaforge_v1_RefreshTokenResponse__Output>
    }
  }
}

