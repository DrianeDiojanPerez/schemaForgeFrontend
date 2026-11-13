// Original file: schema.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AcceptInvitationRequest as _schemaforge_v1_AcceptInvitationRequest, AcceptInvitationRequest__Output as _schemaforge_v1_AcceptInvitationRequest__Output } from '../../schemaforge/v1/AcceptInvitationRequest';
import type { AcceptInvitationResponse as _schemaforge_v1_AcceptInvitationResponse, AcceptInvitationResponse__Output as _schemaforge_v1_AcceptInvitationResponse__Output } from '../../schemaforge/v1/AcceptInvitationResponse';
import type { CancelInvitationRequest as _schemaforge_v1_CancelInvitationRequest, CancelInvitationRequest__Output as _schemaforge_v1_CancelInvitationRequest__Output } from '../../schemaforge/v1/CancelInvitationRequest';
import type { CancelInvitationResponse as _schemaforge_v1_CancelInvitationResponse, CancelInvitationResponse__Output as _schemaforge_v1_CancelInvitationResponse__Output } from '../../schemaforge/v1/CancelInvitationResponse';
import type { ChangeShareRoleRequest as _schemaforge_v1_ChangeShareRoleRequest, ChangeShareRoleRequest__Output as _schemaforge_v1_ChangeShareRoleRequest__Output } from '../../schemaforge/v1/ChangeShareRoleRequest';
import type { ChangeShareRoleResponse as _schemaforge_v1_ChangeShareRoleResponse, ChangeShareRoleResponse__Output as _schemaforge_v1_ChangeShareRoleResponse__Output } from '../../schemaforge/v1/ChangeShareRoleResponse';
import type { CompareSchemasRequest as _schemaforge_v1_CompareSchemasRequest, CompareSchemasRequest__Output as _schemaforge_v1_CompareSchemasRequest__Output } from '../../schemaforge/v1/CompareSchemasRequest';
import type { CompareSchemasResponse as _schemaforge_v1_CompareSchemasResponse, CompareSchemasResponse__Output as _schemaforge_v1_CompareSchemasResponse__Output } from '../../schemaforge/v1/CompareSchemasResponse';
import type { CreateSchemaRequest as _schemaforge_v1_CreateSchemaRequest, CreateSchemaRequest__Output as _schemaforge_v1_CreateSchemaRequest__Output } from '../../schemaforge/v1/CreateSchemaRequest';
import type { CreateSchemaResponse as _schemaforge_v1_CreateSchemaResponse, CreateSchemaResponse__Output as _schemaforge_v1_CreateSchemaResponse__Output } from '../../schemaforge/v1/CreateSchemaResponse';
import type { DeleteSchemaRequest as _schemaforge_v1_DeleteSchemaRequest, DeleteSchemaRequest__Output as _schemaforge_v1_DeleteSchemaRequest__Output } from '../../schemaforge/v1/DeleteSchemaRequest';
import type { DeleteSchemaResponse as _schemaforge_v1_DeleteSchemaResponse, DeleteSchemaResponse__Output as _schemaforge_v1_DeleteSchemaResponse__Output } from '../../schemaforge/v1/DeleteSchemaResponse';
import type { ExportSchemaRequest as _schemaforge_v1_ExportSchemaRequest, ExportSchemaRequest__Output as _schemaforge_v1_ExportSchemaRequest__Output } from '../../schemaforge/v1/ExportSchemaRequest';
import type { ExportSchemaResponse as _schemaforge_v1_ExportSchemaResponse, ExportSchemaResponse__Output as _schemaforge_v1_ExportSchemaResponse__Output } from '../../schemaforge/v1/ExportSchemaResponse';
import type { GenerateDdlRequest as _schemaforge_v1_GenerateDdlRequest, GenerateDdlRequest__Output as _schemaforge_v1_GenerateDdlRequest__Output } from '../../schemaforge/v1/GenerateDdlRequest';
import type { GenerateDdlResponse as _schemaforge_v1_GenerateDdlResponse, GenerateDdlResponse__Output as _schemaforge_v1_GenerateDdlResponse__Output } from '../../schemaforge/v1/GenerateDdlResponse';
import type { GetSchemaRequest as _schemaforge_v1_GetSchemaRequest, GetSchemaRequest__Output as _schemaforge_v1_GetSchemaRequest__Output } from '../../schemaforge/v1/GetSchemaRequest';
import type { GetSchemaResponse as _schemaforge_v1_GetSchemaResponse, GetSchemaResponse__Output as _schemaforge_v1_GetSchemaResponse__Output } from '../../schemaforge/v1/GetSchemaResponse';
import type { ImportSchemaRequest as _schemaforge_v1_ImportSchemaRequest, ImportSchemaRequest__Output as _schemaforge_v1_ImportSchemaRequest__Output } from '../../schemaforge/v1/ImportSchemaRequest';
import type { ImportSchemaResponse as _schemaforge_v1_ImportSchemaResponse, ImportSchemaResponse__Output as _schemaforge_v1_ImportSchemaResponse__Output } from '../../schemaforge/v1/ImportSchemaResponse';
import type { ListPeopleRequest as _schemaforge_v1_ListPeopleRequest, ListPeopleRequest__Output as _schemaforge_v1_ListPeopleRequest__Output } from '../../schemaforge/v1/ListPeopleRequest';
import type { ListPeopleResponse as _schemaforge_v1_ListPeopleResponse, ListPeopleResponse__Output as _schemaforge_v1_ListPeopleResponse__Output } from '../../schemaforge/v1/ListPeopleResponse';
import type { ListSchemasRequest as _schemaforge_v1_ListSchemasRequest, ListSchemasRequest__Output as _schemaforge_v1_ListSchemasRequest__Output } from '../../schemaforge/v1/ListSchemasRequest';
import type { ListSchemasResponse as _schemaforge_v1_ListSchemasResponse, ListSchemasResponse__Output as _schemaforge_v1_ListSchemasResponse__Output } from '../../schemaforge/v1/ListSchemasResponse';
import type { ListSharedSchemasRequest as _schemaforge_v1_ListSharedSchemasRequest, ListSharedSchemasRequest__Output as _schemaforge_v1_ListSharedSchemasRequest__Output } from '../../schemaforge/v1/ListSharedSchemasRequest';
import type { ListSharedSchemasResponse as _schemaforge_v1_ListSharedSchemasResponse, ListSharedSchemasResponse__Output as _schemaforge_v1_ListSharedSchemasResponse__Output } from '../../schemaforge/v1/ListSharedSchemasResponse';
import type { RevokeShareRequest as _schemaforge_v1_RevokeShareRequest, RevokeShareRequest__Output as _schemaforge_v1_RevokeShareRequest__Output } from '../../schemaforge/v1/RevokeShareRequest';
import type { RevokeShareResponse as _schemaforge_v1_RevokeShareResponse, RevokeShareResponse__Output as _schemaforge_v1_RevokeShareResponse__Output } from '../../schemaforge/v1/RevokeShareResponse';
import type { ShareSchemaRequest as _schemaforge_v1_ShareSchemaRequest, ShareSchemaRequest__Output as _schemaforge_v1_ShareSchemaRequest__Output } from '../../schemaforge/v1/ShareSchemaRequest';
import type { ShareSchemaResponse as _schemaforge_v1_ShareSchemaResponse, ShareSchemaResponse__Output as _schemaforge_v1_ShareSchemaResponse__Output } from '../../schemaforge/v1/ShareSchemaResponse';
import type { UpdateSchemaRequest as _schemaforge_v1_UpdateSchemaRequest, UpdateSchemaRequest__Output as _schemaforge_v1_UpdateSchemaRequest__Output } from '../../schemaforge/v1/UpdateSchemaRequest';
import type { UpdateSchemaResponse as _schemaforge_v1_UpdateSchemaResponse, UpdateSchemaResponse__Output as _schemaforge_v1_UpdateSchemaResponse__Output } from '../../schemaforge/v1/UpdateSchemaResponse';
import type { ValidateSchemaRequest as _schemaforge_v1_ValidateSchemaRequest, ValidateSchemaRequest__Output as _schemaforge_v1_ValidateSchemaRequest__Output } from '../../schemaforge/v1/ValidateSchemaRequest';
import type { ValidateSchemaResponse as _schemaforge_v1_ValidateSchemaResponse, ValidateSchemaResponse__Output as _schemaforge_v1_ValidateSchemaResponse__Output } from '../../schemaforge/v1/ValidateSchemaResponse';

export interface SchemaServiceClient extends grpc.Client {
  AcceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  AcceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  AcceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  AcceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  acceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  acceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  acceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  acceptInvitation(argument: _schemaforge_v1_AcceptInvitationRequest, callback: grpc.requestCallback<_schemaforge_v1_AcceptInvitationResponse__Output>): grpc.ClientUnaryCall;
  
  CancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  CancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  CancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  CancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  cancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  cancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  cancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  cancelInvitation(argument: _schemaforge_v1_CancelInvitationRequest, callback: grpc.requestCallback<_schemaforge_v1_CancelInvitationResponse__Output>): grpc.ClientUnaryCall;
  
  ChangeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  ChangeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  ChangeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  ChangeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  changeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  changeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  changeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  changeShareRole(argument: _schemaforge_v1_ChangeShareRoleRequest, callback: grpc.requestCallback<_schemaforge_v1_ChangeShareRoleResponse__Output>): grpc.ClientUnaryCall;
  
  CompareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  CompareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  CompareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  CompareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  compareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  compareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  compareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  compareSchemas(argument: _schemaforge_v1_CompareSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_CompareSchemasResponse__Output>): grpc.ClientUnaryCall;
  
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
  
  ExportSchema(argument: _schemaforge_v1_ExportSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ExportSchema(argument: _schemaforge_v1_ExportSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ExportSchema(argument: _schemaforge_v1_ExportSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ExportSchema(argument: _schemaforge_v1_ExportSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  exportSchema(argument: _schemaforge_v1_ExportSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  exportSchema(argument: _schemaforge_v1_ExportSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  exportSchema(argument: _schemaforge_v1_ExportSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  exportSchema(argument: _schemaforge_v1_ExportSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ExportSchemaResponse__Output>): grpc.ClientUnaryCall;
  
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
  
  ImportSchema(argument: _schemaforge_v1_ImportSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ImportSchema(argument: _schemaforge_v1_ImportSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ImportSchema(argument: _schemaforge_v1_ImportSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  ImportSchema(argument: _schemaforge_v1_ImportSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  importSchema(argument: _schemaforge_v1_ImportSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  importSchema(argument: _schemaforge_v1_ImportSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  importSchema(argument: _schemaforge_v1_ImportSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  importSchema(argument: _schemaforge_v1_ImportSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ImportSchemaResponse__Output>): grpc.ClientUnaryCall;
  
  ListPeople(argument: _schemaforge_v1_ListPeopleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  ListPeople(argument: _schemaforge_v1_ListPeopleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  ListPeople(argument: _schemaforge_v1_ListPeopleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  ListPeople(argument: _schemaforge_v1_ListPeopleRequest, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  listPeople(argument: _schemaforge_v1_ListPeopleRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  listPeople(argument: _schemaforge_v1_ListPeopleRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  listPeople(argument: _schemaforge_v1_ListPeopleRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  listPeople(argument: _schemaforge_v1_ListPeopleRequest, callback: grpc.requestCallback<_schemaforge_v1_ListPeopleResponse__Output>): grpc.ClientUnaryCall;
  
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSchemas(argument: _schemaforge_v1_ListSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSchemas(argument: _schemaforge_v1_ListSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSchemasResponse__Output>): grpc.ClientUnaryCall;
  
  ListSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  ListSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  listSharedSchemas(argument: _schemaforge_v1_ListSharedSchemasRequest, callback: grpc.requestCallback<_schemaforge_v1_ListSharedSchemasResponse__Output>): grpc.ClientUnaryCall;
  
  RevokeShare(argument: _schemaforge_v1_RevokeShareRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  RevokeShare(argument: _schemaforge_v1_RevokeShareRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  RevokeShare(argument: _schemaforge_v1_RevokeShareRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  RevokeShare(argument: _schemaforge_v1_RevokeShareRequest, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  revokeShare(argument: _schemaforge_v1_RevokeShareRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  revokeShare(argument: _schemaforge_v1_RevokeShareRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  revokeShare(argument: _schemaforge_v1_RevokeShareRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  revokeShare(argument: _schemaforge_v1_RevokeShareRequest, callback: grpc.requestCallback<_schemaforge_v1_RevokeShareResponse__Output>): grpc.ClientUnaryCall;
  
  ShareSchema(argument: _schemaforge_v1_ShareSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  ShareSchema(argument: _schemaforge_v1_ShareSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  ShareSchema(argument: _schemaforge_v1_ShareSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  ShareSchema(argument: _schemaforge_v1_ShareSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  shareSchema(argument: _schemaforge_v1_ShareSchemaRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  shareSchema(argument: _schemaforge_v1_ShareSchemaRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  shareSchema(argument: _schemaforge_v1_ShareSchemaRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  shareSchema(argument: _schemaforge_v1_ShareSchemaRequest, callback: grpc.requestCallback<_schemaforge_v1_ShareSchemaResponse__Output>): grpc.ClientUnaryCall;
  
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
  AcceptInvitation: grpc.handleUnaryCall<_schemaforge_v1_AcceptInvitationRequest__Output, _schemaforge_v1_AcceptInvitationResponse>;
  
  CancelInvitation: grpc.handleUnaryCall<_schemaforge_v1_CancelInvitationRequest__Output, _schemaforge_v1_CancelInvitationResponse>;
  
  ChangeShareRole: grpc.handleUnaryCall<_schemaforge_v1_ChangeShareRoleRequest__Output, _schemaforge_v1_ChangeShareRoleResponse>;
  
  CompareSchemas: grpc.handleUnaryCall<_schemaforge_v1_CompareSchemasRequest__Output, _schemaforge_v1_CompareSchemasResponse>;
  
  CreateSchema: grpc.handleUnaryCall<_schemaforge_v1_CreateSchemaRequest__Output, _schemaforge_v1_CreateSchemaResponse>;
  
  DeleteSchema: grpc.handleUnaryCall<_schemaforge_v1_DeleteSchemaRequest__Output, _schemaforge_v1_DeleteSchemaResponse>;
  
  ExportSchema: grpc.handleUnaryCall<_schemaforge_v1_ExportSchemaRequest__Output, _schemaforge_v1_ExportSchemaResponse>;
  
  GenerateDdl: grpc.handleUnaryCall<_schemaforge_v1_GenerateDdlRequest__Output, _schemaforge_v1_GenerateDdlResponse>;
  
  GetSchema: grpc.handleUnaryCall<_schemaforge_v1_GetSchemaRequest__Output, _schemaforge_v1_GetSchemaResponse>;
  
  ImportSchema: grpc.handleUnaryCall<_schemaforge_v1_ImportSchemaRequest__Output, _schemaforge_v1_ImportSchemaResponse>;
  
  ListPeople: grpc.handleUnaryCall<_schemaforge_v1_ListPeopleRequest__Output, _schemaforge_v1_ListPeopleResponse>;
  
  ListSchemas: grpc.handleUnaryCall<_schemaforge_v1_ListSchemasRequest__Output, _schemaforge_v1_ListSchemasResponse>;
  
  ListSharedSchemas: grpc.handleUnaryCall<_schemaforge_v1_ListSharedSchemasRequest__Output, _schemaforge_v1_ListSharedSchemasResponse>;
  
  RevokeShare: grpc.handleUnaryCall<_schemaforge_v1_RevokeShareRequest__Output, _schemaforge_v1_RevokeShareResponse>;
  
  ShareSchema: grpc.handleUnaryCall<_schemaforge_v1_ShareSchemaRequest__Output, _schemaforge_v1_ShareSchemaResponse>;
  
  UpdateSchema: grpc.handleUnaryCall<_schemaforge_v1_UpdateSchemaRequest__Output, _schemaforge_v1_UpdateSchemaResponse>;
  
  ValidateSchema: grpc.handleUnaryCall<_schemaforge_v1_ValidateSchemaRequest__Output, _schemaforge_v1_ValidateSchemaResponse>;
  
}

export interface SchemaServiceDefinition extends grpc.ServiceDefinition {
  AcceptInvitation: MethodDefinition<_schemaforge_v1_AcceptInvitationRequest, _schemaforge_v1_AcceptInvitationResponse, _schemaforge_v1_AcceptInvitationRequest__Output, _schemaforge_v1_AcceptInvitationResponse__Output>
  CancelInvitation: MethodDefinition<_schemaforge_v1_CancelInvitationRequest, _schemaforge_v1_CancelInvitationResponse, _schemaforge_v1_CancelInvitationRequest__Output, _schemaforge_v1_CancelInvitationResponse__Output>
  ChangeShareRole: MethodDefinition<_schemaforge_v1_ChangeShareRoleRequest, _schemaforge_v1_ChangeShareRoleResponse, _schemaforge_v1_ChangeShareRoleRequest__Output, _schemaforge_v1_ChangeShareRoleResponse__Output>
  CompareSchemas: MethodDefinition<_schemaforge_v1_CompareSchemasRequest, _schemaforge_v1_CompareSchemasResponse, _schemaforge_v1_CompareSchemasRequest__Output, _schemaforge_v1_CompareSchemasResponse__Output>
  CreateSchema: MethodDefinition<_schemaforge_v1_CreateSchemaRequest, _schemaforge_v1_CreateSchemaResponse, _schemaforge_v1_CreateSchemaRequest__Output, _schemaforge_v1_CreateSchemaResponse__Output>
  DeleteSchema: MethodDefinition<_schemaforge_v1_DeleteSchemaRequest, _schemaforge_v1_DeleteSchemaResponse, _schemaforge_v1_DeleteSchemaRequest__Output, _schemaforge_v1_DeleteSchemaResponse__Output>
  ExportSchema: MethodDefinition<_schemaforge_v1_ExportSchemaRequest, _schemaforge_v1_ExportSchemaResponse, _schemaforge_v1_ExportSchemaRequest__Output, _schemaforge_v1_ExportSchemaResponse__Output>
  GenerateDdl: MethodDefinition<_schemaforge_v1_GenerateDdlRequest, _schemaforge_v1_GenerateDdlResponse, _schemaforge_v1_GenerateDdlRequest__Output, _schemaforge_v1_GenerateDdlResponse__Output>
  GetSchema: MethodDefinition<_schemaforge_v1_GetSchemaRequest, _schemaforge_v1_GetSchemaResponse, _schemaforge_v1_GetSchemaRequest__Output, _schemaforge_v1_GetSchemaResponse__Output>
  ImportSchema: MethodDefinition<_schemaforge_v1_ImportSchemaRequest, _schemaforge_v1_ImportSchemaResponse, _schemaforge_v1_ImportSchemaRequest__Output, _schemaforge_v1_ImportSchemaResponse__Output>
  ListPeople: MethodDefinition<_schemaforge_v1_ListPeopleRequest, _schemaforge_v1_ListPeopleResponse, _schemaforge_v1_ListPeopleRequest__Output, _schemaforge_v1_ListPeopleResponse__Output>
  ListSchemas: MethodDefinition<_schemaforge_v1_ListSchemasRequest, _schemaforge_v1_ListSchemasResponse, _schemaforge_v1_ListSchemasRequest__Output, _schemaforge_v1_ListSchemasResponse__Output>
  ListSharedSchemas: MethodDefinition<_schemaforge_v1_ListSharedSchemasRequest, _schemaforge_v1_ListSharedSchemasResponse, _schemaforge_v1_ListSharedSchemasRequest__Output, _schemaforge_v1_ListSharedSchemasResponse__Output>
  RevokeShare: MethodDefinition<_schemaforge_v1_RevokeShareRequest, _schemaforge_v1_RevokeShareResponse, _schemaforge_v1_RevokeShareRequest__Output, _schemaforge_v1_RevokeShareResponse__Output>
  ShareSchema: MethodDefinition<_schemaforge_v1_ShareSchemaRequest, _schemaforge_v1_ShareSchemaResponse, _schemaforge_v1_ShareSchemaRequest__Output, _schemaforge_v1_ShareSchemaResponse__Output>
  UpdateSchema: MethodDefinition<_schemaforge_v1_UpdateSchemaRequest, _schemaforge_v1_UpdateSchemaResponse, _schemaforge_v1_UpdateSchemaRequest__Output, _schemaforge_v1_UpdateSchemaResponse__Output>
  ValidateSchema: MethodDefinition<_schemaforge_v1_ValidateSchemaRequest, _schemaforge_v1_ValidateSchemaResponse, _schemaforge_v1_ValidateSchemaRequest__Output, _schemaforge_v1_ValidateSchemaResponse__Output>
}
