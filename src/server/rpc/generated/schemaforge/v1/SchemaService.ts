// Original file: schema.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { CreateSchemaRequest as _schemaforge_v1_CreateSchemaRequest, CreateSchemaRequest__Output as _schemaforge_v1_CreateSchemaRequest__Output } from '../../schemaforge/v1/CreateSchemaRequest';
import type { CreateSchemaResponse as _schemaforge_v1_CreateSchemaResponse, CreateSchemaResponse__Output as _schemaforge_v1_CreateSchemaResponse__Output } from '../../schemaforge/v1/CreateSchemaResponse';
import type { DeleteSchemaRequest as _schemaforge_v1_DeleteSchemaRequest, DeleteSchemaRequest__Output as _schemaforge_v1_DeleteSchemaRequest__Output } from '../../schemaforge/v1/DeleteSchemaRequest';
import type { DeleteSchemaResponse as _schemaforge_v1_DeleteSchemaResponse, DeleteSchemaResponse__Output as _schemaforge_v1_DeleteSchemaResponse__Output } from '../../schemaforge/v1/DeleteSchemaResponse';
import type { GenerateDdlRequest as _schemaforge_v1_GenerateDdlRequest, GenerateDdlRequest__Output as _schemaforge_v1_GenerateDdlRequest__Output } from '../../schemaforge/v1/GenerateDdlRequest';
import type { GenerateDdlResponse as _schemaforge_v1_GenerateDdlResponse, GenerateDdlResponse__Output as _schemaforge_v1_GenerateDdlResponse__Output } from '../../schemaforge/v1/GenerateDdlResponse';
import type { GetSchemaRequest as _schemaforge_v1_GetSchemaRequest, GetSchemaRequest__Output as _schemaforge_v1_GetSchemaRequest__Output } from '../../schemaforge/v1/GetSchemaRequest';
import type { GetSchemaResponse as _schemaforge_v1_GetSchemaResponse, GetSchemaResponse__Output as _schemaforge_v1_GetSchemaResponse__Output } from '../../schemaforge/v1/GetSchemaResponse';
import type { ListSchemasRequest as _schemaforge_v1_ListSchemasRequest, ListSchemasRequest__Output as _schemaforge_v1_ListSchemasRequest__Output } from '../../schemaforge/v1/ListSchemasRequest';
import type { ListSchemasResponse as _schemaforge_v1_ListSchemasResponse, ListSchemasResponse__Output as _schemaforge_v1_ListSchemasResponse__Output } from '../../schemaforge/v1/ListSchemasResponse';
import type { UpdateSchemaRequest as _schemaforge_v1_UpdateSchemaRequest, UpdateSchemaRequest__Output as _schemaforge_v1_UpdateSchemaRequest__Output } from '../../schemaforge/v1/UpdateSchemaRequest';
import type { UpdateSchemaResponse as _schemaforge_v1_UpdateSchemaResponse, UpdateSchemaResponse__Output as _schemaforge_v1_UpdateSchemaResponse__Output } from '../../schemaforge/v1/UpdateSchemaResponse';
import type { ValidateSchemaRequest as _schemaforge_v1_ValidateSchemaRequest, ValidateSchemaRequest__Output as _schemaforge_v1_ValidateSchemaRequest__Output } from '../../schemaforge/v1/ValidateSchemaRequest';
import type { ValidateSchemaResponse as _schemaforge_v1_ValidateSchemaResponse, ValidateSchemaResponse__Output as _schemaforge_v1_ValidateSchemaResponse__Output } from '../../schemaforge/v1/ValidateSchemaResponse';

export interface SchemaServiceClient extends grpc.Client {
  CreateSchema(argument: _schemaforge_v1_CreateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  CreateSchema(argument: _schemaforge_v1_CreateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  CreateSchema(argument: _schemaforge_v1_CreateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  CreateSchema(argument: _schemaforge_v1_CreateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  createSchema(argument: _schemaforge_v1_CreateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  createSchema(argument: _schemaforge_v1_CreateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  createSchema(argument: _schemaforge_v1_CreateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  createSchema(argument: _schemaforge_v1_CreateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_CreateSchemaResponse__Output>): grpc.ClientUnaryCall;
  
  DeleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  DeleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  DeleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  DeleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  deleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  deleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  deleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  deleteSchema(argument: _schemaforge_v1_DeleteSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_DeleteSchemaResponse__Output>): grpc.ClientUnaryCall;
  
  GenerateDdl(argument: _schemaforge_v1_GenerateDdlRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  GenerateDdl(argument: _schemaforge_v1_GenerateDdlRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  GenerateDdl(argument: _schemaforge_v1_GenerateDdlRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  GenerateDdl(argument: _schemaforge_v1_GenerateDdlRequest, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  generateDdl(argument: _schemaforge_v1_GenerateDdlRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  generateDdl(argument: _schemaforge_v1_GenerateDdlRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  generateDdl(argument: _schemaforge_v1_GenerateDdlRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  generateDdl(argument: _schemaforge_v1_GenerateDdlRequest, callback: grpc.requestCallback<_schemaforge_v1_GenerateDdlResponse__Output>): grpc.ClientUnaryCall;
  
  GetSchema(argument: _schemaforge_v1_GetSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  GetSchema(argument: _schemaforge_v1_GetSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  GetSchema(argument: _schemaforge_v1_GetSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  GetSchema(argument: _schemaforge_v1_GetSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  getSchema(argument: _schemaforge_v1_GetSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  getSchema(argument: _schemaforge_v1_GetSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  getSchema(argument: _schemaforge_v1_GetSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  getSchema(argument: _schemaforge_v1_GetSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_GetSchemaResponse__Output>): grpc.ClientUnaryCall;
  
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  
  UpdateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  UpdateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  UpdateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  UpdateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  updateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  updateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  updateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  updateSchema(argument: _schemaforge_v1_UpdateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_UpdateSchemaResponse__Output>): grpc.ClientUnaryCall;
  
  ValidateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  ValidateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  ValidateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  ValidateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  validateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  validateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  validateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  validateSchema(argument: _schemaforge_v1_ValidateSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ValidateSchemaResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface SchemaServiceHandlers extends grpc.UntypedServiceImplementation {
  CreateSchema: grpc.handleUnaryCall<_schemaforge_v1_CreateSchemaRequest__Output, _schemaforge_v1_CreateSchemaResponse>;
  
  DeleteSchema: grpc.handleUnaryCall<_schemaforge_v1_DeleteSchemaRequest__Output, _schemaforge_v1_DeleteSchemaResponse>;
  
  GenerateDdl: grpc.handleUnaryCall<_schemaforge_v1_GenerateDdlRequest__Output, _schemaforge_v1_GenerateDdlResponse>;
  
  GetSchema: grpc.handleUnaryCall<_schemaforge_v1_GetSchemaRequest__Output, _schemaforge_v1_GetSchemaResponse>;
  
  ListSchemas: grpc.handleUnaryCall<_schemaforge_v1_ListSchemasRequest__Output, _schemaforge_v1_ListSchemasResponse>;
  
  UpdateSchema: grpc.handleUnaryCall<_schemaforge_v1_UpdateSchemaRequest__Output, _schemaforge_v1_UpdateSchemaResponse>;
  
  ValidateSchema: grpc.handleUnaryCall<_schemaforge_v1_ValidateSchemaRequest__Output, _schemaforge_v1_ValidateSchemaResponse>;
  
}

export interface SchemaServiceDefinition extends grpc.ServiceDefinition {
  CreateSchema: MethodDefinition<_schemaforge_v1_CreateSchemaRequest, _schemaforge_v1_CreateSchemaResponse, _schemaforge_v1_CreateSchemaRequest__Output, _schemaforge_v1_CreateSchemaResponse__Output>
  DeleteSchema: MethodDefinition<_schemaforge_v1_DeleteSchemaRequest, _schemaforge_v1_DeleteSchemaResponse, _schemaforge_v1_DeleteSchemaRequest__Output, _schemaforge_v1_DeleteSchemaResponse__Output>
  GenerateDdl: MethodDefinition<_schemaforge_v1_GenerateDdlRequest, _schemaforge_v1_GenerateDdlResponse, _schemaforge_v1_GenerateDdlRequest__Output, _schemaforge_v1_GenerateDdlResponse__Output>
  GetSchema: MethodDefinition<_schemaforge_v1_GetSchemaRequest, _schemaforge_v1_GetSchemaResponse, _schemaforge_v1_GetSchemaRequest__Output, _schemaforge_v1_GetSchemaResponse__Output>
  ListSchemas: MethodDefinition<_schemaforge_v1_ListSchemasRequest, _schemaforge_v1_ListSchemasResponse, _schemaforge_v1_ListSchemasRequest__Output, _schemaforge_v1_ListSchemasResponse__Output>
  UpdateSchema: MethodDefinition<_schemaforge_v1_UpdateSchemaRequest, _schemaforge_v1_UpdateSchemaResponse, _schemaforge_v1_UpdateSchemaRequest__Output, _schemaforge_v1_UpdateSchemaResponse__Output>
  ValidateSchema: MethodDefinition<_schemaforge_v1_ValidateSchemaRequest, _schemaforge_v1_ValidateSchemaResponse, _schemaforge_v1_ValidateSchemaRequest__Output, _schemaforge_v1_ValidateSchemaResponse__Output>
}
