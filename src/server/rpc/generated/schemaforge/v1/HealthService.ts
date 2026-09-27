// Original file: health.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { CheckRequest as _schemaforge_v1_CheckRequest, CheckRequest__Output as _schemaforge_v1_CheckRequest__Output } from '../../schemaforge/v1/CheckRequest';
import type { CheckResponse as _schemaforge_v1_CheckResponse, CheckResponse__Output as _schemaforge_v1_CheckResponse__Output } from '../../schemaforge/v1/CheckResponse';

export interface HealthServiceClient extends grpc.Client {
  Check(argument: _schemaforge_v1_CheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  Check(argument: _schemaforge_v1_CheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  Check(argument: _schemaforge_v1_CheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  Check(argument: _schemaforge_v1_CheckRequest, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  check(argument: _schemaforge_v1_CheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  check(argument: _schemaforge_v1_CheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  check(argument: _schemaforge_v1_CheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  check(argument: _schemaforge_v1_CheckRequest, callback: grpc.requestCallback<_schemaforge_v1_CheckResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface HealthServiceHandlers extends grpc.UntypedServiceImplementation {
  Check: grpc.handleUnaryCall<_schemaforge_v1_CheckRequest__Output, _schemaforge_v1_CheckResponse>;
  
}

export interface HealthServiceDefinition extends grpc.ServiceDefinition {
  Check: MethodDefinition<_schemaforge_v1_CheckRequest, _schemaforge_v1_CheckResponse, _schemaforge_v1_CheckRequest__Output, _schemaforge_v1_CheckResponse__Output>
}
