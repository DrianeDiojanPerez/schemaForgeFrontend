// Original file: auth.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { LoginRequest as _schemaforge_v1_LoginRequest, LoginRequest__Output as _schemaforge_v1_LoginRequest__Output } from '../../schemaforge/v1/LoginRequest';
import type { LoginResponse as _schemaforge_v1_LoginResponse, LoginResponse__Output as _schemaforge_v1_LoginResponse__Output } from '../../schemaforge/v1/LoginResponse';
import type { RefreshTokenRequest as _schemaforge_v1_RefreshTokenRequest, RefreshTokenRequest__Output as _schemaforge_v1_RefreshTokenRequest__Output } from '../../schemaforge/v1/RefreshTokenRequest';
import type { RefreshTokenResponse as _schemaforge_v1_RefreshTokenResponse, RefreshTokenResponse__Output as _schemaforge_v1_RefreshTokenResponse__Output } from '../../schemaforge/v1/RefreshTokenResponse';

export interface AuthServiceClient extends grpc.Client {
  Login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  
  RefreshToken(argument: _schemaforge_v1_RefreshTokenRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  RefreshToken(argument: _schemaforge_v1_RefreshTokenRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  RefreshToken(argument: _schemaforge_v1_RefreshTokenRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  RefreshToken(argument: _schemaforge_v1_RefreshTokenRequest, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  refreshToken(argument: _schemaforge_v1_RefreshTokenRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  refreshToken(argument: _schemaforge_v1_RefreshTokenRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  refreshToken(argument: _schemaforge_v1_RefreshTokenRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  refreshToken(argument: _schemaforge_v1_RefreshTokenRequest, callback: grpc.requestCallback<_schemaforge_v1_RefreshTokenResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface AuthServiceHandlers extends grpc.UntypedServiceImplementation {
  Login: grpc.handleUnaryCall<_schemaforge_v1_LoginRequest__Output, _schemaforge_v1_LoginResponse>;
  
  RefreshToken: grpc.handleUnaryCall<_schemaforge_v1_RefreshTokenRequest__Output, _schemaforge_v1_RefreshTokenResponse>;
  
}

export interface AuthServiceDefinition extends grpc.ServiceDefinition {
  Login: MethodDefinition<_schemaforge_v1_LoginRequest, _schemaforge_v1_LoginResponse, _schemaforge_v1_LoginRequest__Output, _schemaforge_v1_LoginResponse__Output>
  RefreshToken: MethodDefinition<_schemaforge_v1_RefreshTokenRequest, _schemaforge_v1_RefreshTokenResponse, _schemaforge_v1_RefreshTokenRequest__Output, _schemaforge_v1_RefreshTokenResponse__Output>
}
