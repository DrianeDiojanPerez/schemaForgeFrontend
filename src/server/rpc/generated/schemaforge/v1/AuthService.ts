// Original file: auth.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetCurrentUserRequest as _schemaforge_v1_GetCurrentUserRequest, GetCurrentUserRequest__Output as _schemaforge_v1_GetCurrentUserRequest__Output } from '../../schemaforge/v1/GetCurrentUserRequest';
import type { GetCurrentUserResponse as _schemaforge_v1_GetCurrentUserResponse, GetCurrentUserResponse__Output as _schemaforge_v1_GetCurrentUserResponse__Output } from '../../schemaforge/v1/GetCurrentUserResponse';
import type { GoogleLoginUrlRequest as _schemaforge_v1_GoogleLoginUrlRequest, GoogleLoginUrlRequest__Output as _schemaforge_v1_GoogleLoginUrlRequest__Output } from '../../schemaforge/v1/GoogleLoginUrlRequest';
import type { GoogleLoginUrlResponse as _schemaforge_v1_GoogleLoginUrlResponse, GoogleLoginUrlResponse__Output as _schemaforge_v1_GoogleLoginUrlResponse__Output } from '../../schemaforge/v1/GoogleLoginUrlResponse';
import type { LoginRequest as _schemaforge_v1_LoginRequest, LoginRequest__Output as _schemaforge_v1_LoginRequest__Output } from '../../schemaforge/v1/LoginRequest';
import type { LoginResponse as _schemaforge_v1_LoginResponse, LoginResponse__Output as _schemaforge_v1_LoginResponse__Output } from '../../schemaforge/v1/LoginResponse';
import type { LoginWithGoogleRequest as _schemaforge_v1_LoginWithGoogleRequest, LoginWithGoogleRequest__Output as _schemaforge_v1_LoginWithGoogleRequest__Output } from '../../schemaforge/v1/LoginWithGoogleRequest';
import type { RefreshTokenRequest as _schemaforge_v1_RefreshTokenRequest, RefreshTokenRequest__Output as _schemaforge_v1_RefreshTokenRequest__Output } from '../../schemaforge/v1/RefreshTokenRequest';
import type { RefreshTokenResponse as _schemaforge_v1_RefreshTokenResponse, RefreshTokenResponse__Output as _schemaforge_v1_RefreshTokenResponse__Output } from '../../schemaforge/v1/RefreshTokenResponse';

export interface AuthServiceClient extends grpc.Client {
  GetCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  GetCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  GetCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  GetCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  getCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  getCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  getCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  getCurrentUser(argument: _schemaforge_v1_GetCurrentUserRequest, callback: grpc.requestCallback<_schemaforge_v1_GetCurrentUserResponse__Output>): grpc.ClientUnaryCall;
  
  GoogleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  GoogleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  GoogleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  GoogleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  googleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  googleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  googleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  googleLoginUrl(argument: _schemaforge_v1_GoogleLoginUrlRequest, callback: grpc.requestCallback<_schemaforge_v1_GoogleLoginUrlResponse__Output>): grpc.ClientUnaryCall;
  
  Login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  Login(argument: _schemaforge_v1_LoginRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  login(argument: _schemaforge_v1_LoginRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  
  LoginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  LoginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  LoginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  LoginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  loginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  loginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  loginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  loginWithGoogle(argument: _schemaforge_v1_LoginWithGoogleRequest, callback: grpc.requestCallback<_schemaforge_v1_LoginResponse__Output>): grpc.ClientUnaryCall;
  
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
  GetCurrentUser: grpc.handleUnaryCall<_schemaforge_v1_GetCurrentUserRequest__Output, _schemaforge_v1_GetCurrentUserResponse>;
  
  GoogleLoginUrl: grpc.handleUnaryCall<_schemaforge_v1_GoogleLoginUrlRequest__Output, _schemaforge_v1_GoogleLoginUrlResponse>;
  
  Login: grpc.handleUnaryCall<_schemaforge_v1_LoginRequest__Output, _schemaforge_v1_LoginResponse>;
  
  LoginWithGoogle: grpc.handleUnaryCall<_schemaforge_v1_LoginWithGoogleRequest__Output, _schemaforge_v1_LoginResponse>;
  
  RefreshToken: grpc.handleUnaryCall<_schemaforge_v1_RefreshTokenRequest__Output, _schemaforge_v1_RefreshTokenResponse>;
  
}

export interface AuthServiceDefinition extends grpc.ServiceDefinition {
  GetCurrentUser: MethodDefinition<_schemaforge_v1_GetCurrentUserRequest, _schemaforge_v1_GetCurrentUserResponse, _schemaforge_v1_GetCurrentUserRequest__Output, _schemaforge_v1_GetCurrentUserResponse__Output>
  GoogleLoginUrl: MethodDefinition<_schemaforge_v1_GoogleLoginUrlRequest, _schemaforge_v1_GoogleLoginUrlResponse, _schemaforge_v1_GoogleLoginUrlRequest__Output, _schemaforge_v1_GoogleLoginUrlResponse__Output>
  Login: MethodDefinition<_schemaforge_v1_LoginRequest, _schemaforge_v1_LoginResponse, _schemaforge_v1_LoginRequest__Output, _schemaforge_v1_LoginResponse__Output>
  LoginWithGoogle: MethodDefinition<_schemaforge_v1_LoginWithGoogleRequest, _schemaforge_v1_LoginResponse, _schemaforge_v1_LoginWithGoogleRequest__Output, _schemaforge_v1_LoginResponse__Output>
  RefreshToken: MethodDefinition<_schemaforge_v1_RefreshTokenRequest, _schemaforge_v1_RefreshTokenResponse, _schemaforge_v1_RefreshTokenRequest__Output, _schemaforge_v1_RefreshTokenResponse__Output>
}
