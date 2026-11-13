import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { AcceptInvitationRequest as _schemaforge_v1_AcceptInvitationRequest, AcceptInvitationRequest__Output as _schemaforge_v1_AcceptInvitationRequest__Output } from './schemaforge/v1/AcceptInvitationRequest';
import type { AcceptInvitationResponse as _schemaforge_v1_AcceptInvitationResponse, AcceptInvitationResponse__Output as _schemaforge_v1_AcceptInvitationResponse__Output } from './schemaforge/v1/AcceptInvitationResponse';
import type { Attribute as _schemaforge_v1_Attribute, Attribute__Output as _schemaforge_v1_Attribute__Output } from './schemaforge/v1/Attribute';
import type { CancelInvitationRequest as _schemaforge_v1_CancelInvitationRequest, CancelInvitationRequest__Output as _schemaforge_v1_CancelInvitationRequest__Output } from './schemaforge/v1/CancelInvitationRequest';
import type { CancelInvitationResponse as _schemaforge_v1_CancelInvitationResponse, CancelInvitationResponse__Output as _schemaforge_v1_CancelInvitationResponse__Output } from './schemaforge/v1/CancelInvitationResponse';
import type { ChangeShareRoleRequest as _schemaforge_v1_ChangeShareRoleRequest, ChangeShareRoleRequest__Output as _schemaforge_v1_ChangeShareRoleRequest__Output } from './schemaforge/v1/ChangeShareRoleRequest';
import type { ChangeShareRoleResponse as _schemaforge_v1_ChangeShareRoleResponse, ChangeShareRoleResponse__Output as _schemaforge_v1_ChangeShareRoleResponse__Output } from './schemaforge/v1/ChangeShareRoleResponse';
import type { Collaborator as _schemaforge_v1_Collaborator, Collaborator__Output as _schemaforge_v1_Collaborator__Output } from './schemaforge/v1/Collaborator';
import type { CompareSchemasRequest as _schemaforge_v1_CompareSchemasRequest, CompareSchemasRequest__Output as _schemaforge_v1_CompareSchemasRequest__Output } from './schemaforge/v1/CompareSchemasRequest';
import type { CompareSchemasResponse as _schemaforge_v1_CompareSchemasResponse, CompareSchemasResponse__Output as _schemaforge_v1_CompareSchemasResponse__Output } from './schemaforge/v1/CompareSchemasResponse';
import type { ComparisonCounts as _schemaforge_v1_ComparisonCounts, ComparisonCounts__Output as _schemaforge_v1_ComparisonCounts__Output } from './schemaforge/v1/ComparisonCounts';
import type { CreateSchemaRequest as _schemaforge_v1_CreateSchemaRequest, CreateSchemaRequest__Output as _schemaforge_v1_CreateSchemaRequest__Output } from './schemaforge/v1/CreateSchemaRequest';
import type { CreateSchemaResponse as _schemaforge_v1_CreateSchemaResponse, CreateSchemaResponse__Output as _schemaforge_v1_CreateSchemaResponse__Output } from './schemaforge/v1/CreateSchemaResponse';
import type { DataType as _schemaforge_v1_DataType, DataType__Output as _schemaforge_v1_DataType__Output } from './schemaforge/v1/DataType';
import type { DeleteSchemaRequest as _schemaforge_v1_DeleteSchemaRequest, DeleteSchemaRequest__Output as _schemaforge_v1_DeleteSchemaRequest__Output } from './schemaforge/v1/DeleteSchemaRequest';
import type { DeleteSchemaResponse as _schemaforge_v1_DeleteSchemaResponse, DeleteSchemaResponse__Output as _schemaforge_v1_DeleteSchemaResponse__Output } from './schemaforge/v1/DeleteSchemaResponse';
import type { Diagnostic as _schemaforge_v1_Diagnostic, Diagnostic__Output as _schemaforge_v1_Diagnostic__Output } from './schemaforge/v1/Diagnostic';
import type { Entity as _schemaforge_v1_Entity, Entity__Output as _schemaforge_v1_Entity__Output } from './schemaforge/v1/Entity';
import type { ExportSchemaRequest as _schemaforge_v1_ExportSchemaRequest, ExportSchemaRequest__Output as _schemaforge_v1_ExportSchemaRequest__Output } from './schemaforge/v1/ExportSchemaRequest';
import type { ExportSchemaResponse as _schemaforge_v1_ExportSchemaResponse, ExportSchemaResponse__Output as _schemaforge_v1_ExportSchemaResponse__Output } from './schemaforge/v1/ExportSchemaResponse';
import type { ForeignKeyRef as _schemaforge_v1_ForeignKeyRef, ForeignKeyRef__Output as _schemaforge_v1_ForeignKeyRef__Output } from './schemaforge/v1/ForeignKeyRef';
import type { GenerateDdlRequest as _schemaforge_v1_GenerateDdlRequest, GenerateDdlRequest__Output as _schemaforge_v1_GenerateDdlRequest__Output } from './schemaforge/v1/GenerateDdlRequest';
import type { GenerateDdlResponse as _schemaforge_v1_GenerateDdlResponse, GenerateDdlResponse__Output as _schemaforge_v1_GenerateDdlResponse__Output } from './schemaforge/v1/GenerateDdlResponse';
import type { GetSchemaRequest as _schemaforge_v1_GetSchemaRequest, GetSchemaRequest__Output as _schemaforge_v1_GetSchemaRequest__Output } from './schemaforge/v1/GetSchemaRequest';
import type { GetSchemaResponse as _schemaforge_v1_GetSchemaResponse, GetSchemaResponse__Output as _schemaforge_v1_GetSchemaResponse__Output } from './schemaforge/v1/GetSchemaResponse';
import type { ImportSchemaRequest as _schemaforge_v1_ImportSchemaRequest, ImportSchemaRequest__Output as _schemaforge_v1_ImportSchemaRequest__Output } from './schemaforge/v1/ImportSchemaRequest';
import type { ImportSchemaResponse as _schemaforge_v1_ImportSchemaResponse, ImportSchemaResponse__Output as _schemaforge_v1_ImportSchemaResponse__Output } from './schemaforge/v1/ImportSchemaResponse';
import type { Invitation as _schemaforge_v1_Invitation, Invitation__Output as _schemaforge_v1_Invitation__Output } from './schemaforge/v1/Invitation';
import type { ListPeopleRequest as _schemaforge_v1_ListPeopleRequest, ListPeopleRequest__Output as _schemaforge_v1_ListPeopleRequest__Output } from './schemaforge/v1/ListPeopleRequest';
import type { ListPeopleResponse as _schemaforge_v1_ListPeopleResponse, ListPeopleResponse__Output as _schemaforge_v1_ListPeopleResponse__Output } from './schemaforge/v1/ListPeopleResponse';
import type { ListSchemasRequest as _schemaforge_v1_ListSchemasRequest, ListSchemasRequest__Output as _schemaforge_v1_ListSchemasRequest__Output } from './schemaforge/v1/ListSchemasRequest';
import type { ListSchemasResponse as _schemaforge_v1_ListSchemasResponse, ListSchemasResponse__Output as _schemaforge_v1_ListSchemasResponse__Output } from './schemaforge/v1/ListSchemasResponse';
import type { ListSharedSchemasRequest as _schemaforge_v1_ListSharedSchemasRequest, ListSharedSchemasRequest__Output as _schemaforge_v1_ListSharedSchemasRequest__Output } from './schemaforge/v1/ListSharedSchemasRequest';
import type { ListSharedSchemasResponse as _schemaforge_v1_ListSharedSchemasResponse, ListSharedSchemasResponse__Output as _schemaforge_v1_ListSharedSchemasResponse__Output } from './schemaforge/v1/ListSharedSchemasResponse';
import type { Member as _schemaforge_v1_Member, Member__Output as _schemaforge_v1_Member__Output } from './schemaforge/v1/Member';
import type { Position as _schemaforge_v1_Position, Position__Output as _schemaforge_v1_Position__Output } from './schemaforge/v1/Position';
import type { Relationship as _schemaforge_v1_Relationship, Relationship__Output as _schemaforge_v1_Relationship__Output } from './schemaforge/v1/Relationship';
import type { RevokeShareRequest as _schemaforge_v1_RevokeShareRequest, RevokeShareRequest__Output as _schemaforge_v1_RevokeShareRequest__Output } from './schemaforge/v1/RevokeShareRequest';
import type { RevokeShareResponse as _schemaforge_v1_RevokeShareResponse, RevokeShareResponse__Output as _schemaforge_v1_RevokeShareResponse__Output } from './schemaforge/v1/RevokeShareResponse';
import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from './schemaforge/v1/Schema';
import type { SchemaDifference as _schemaforge_v1_SchemaDifference, SchemaDifference__Output as _schemaforge_v1_SchemaDifference__Output } from './schemaforge/v1/SchemaDifference';
import type { SchemaServiceClient as _schemaforge_v1_SchemaServiceClient, SchemaServiceDefinition as _schemaforge_v1_SchemaServiceDefinition } from './schemaforge/v1/SchemaService';
import type { SchemaSummary as _schemaforge_v1_SchemaSummary, SchemaSummary__Output as _schemaforge_v1_SchemaSummary__Output } from './schemaforge/v1/SchemaSummary';
import type { ShareSchemaRequest as _schemaforge_v1_ShareSchemaRequest, ShareSchemaRequest__Output as _schemaforge_v1_ShareSchemaRequest__Output } from './schemaforge/v1/ShareSchemaRequest';
import type { ShareSchemaResponse as _schemaforge_v1_ShareSchemaResponse, ShareSchemaResponse__Output as _schemaforge_v1_ShareSchemaResponse__Output } from './schemaforge/v1/ShareSchemaResponse';
import type { SharedSchema as _schemaforge_v1_SharedSchema, SharedSchema__Output as _schemaforge_v1_SharedSchema__Output } from './schemaforge/v1/SharedSchema';
import type { UpdateSchemaRequest as _schemaforge_v1_UpdateSchemaRequest, UpdateSchemaRequest__Output as _schemaforge_v1_UpdateSchemaRequest__Output } from './schemaforge/v1/UpdateSchemaRequest';
import type { UpdateSchemaResponse as _schemaforge_v1_UpdateSchemaResponse, UpdateSchemaResponse__Output as _schemaforge_v1_UpdateSchemaResponse__Output } from './schemaforge/v1/UpdateSchemaResponse';
import type { ValidateSchemaRequest as _schemaforge_v1_ValidateSchemaRequest, ValidateSchemaRequest__Output as _schemaforge_v1_ValidateSchemaRequest__Output } from './schemaforge/v1/ValidateSchemaRequest';
import type { ValidateSchemaResponse as _schemaforge_v1_ValidateSchemaResponse, ValidateSchemaResponse__Output as _schemaforge_v1_ValidateSchemaResponse__Output } from './schemaforge/v1/ValidateSchemaResponse';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  schemaforge: {
    v1: {
      AcceptInvitationRequest: MessageTypeDefinition<_schemaforge_v1_AcceptInvitationRequest, _schemaforge_v1_AcceptInvitationRequest__Output>
      AcceptInvitationResponse: MessageTypeDefinition<_schemaforge_v1_AcceptInvitationResponse, _schemaforge_v1_AcceptInvitationResponse__Output>
      Attribute: MessageTypeDefinition<_schemaforge_v1_Attribute, _schemaforge_v1_Attribute__Output>
      CancelInvitationRequest: MessageTypeDefinition<_schemaforge_v1_CancelInvitationRequest, _schemaforge_v1_CancelInvitationRequest__Output>
      CancelInvitationResponse: MessageTypeDefinition<_schemaforge_v1_CancelInvitationResponse, _schemaforge_v1_CancelInvitationResponse__Output>
      Cardinality: EnumTypeDefinition
      ChangeShareRoleRequest: MessageTypeDefinition<_schemaforge_v1_ChangeShareRoleRequest, _schemaforge_v1_ChangeShareRoleRequest__Output>
      ChangeShareRoleResponse: MessageTypeDefinition<_schemaforge_v1_ChangeShareRoleResponse, _schemaforge_v1_ChangeShareRoleResponse__Output>
      Collaborator: MessageTypeDefinition<_schemaforge_v1_Collaborator, _schemaforge_v1_Collaborator__Output>
      CompareSchemasRequest: MessageTypeDefinition<_schemaforge_v1_CompareSchemasRequest, _schemaforge_v1_CompareSchemasRequest__Output>
      CompareSchemasResponse: MessageTypeDefinition<_schemaforge_v1_CompareSchemasResponse, _schemaforge_v1_CompareSchemasResponse__Output>
      ComparisonCategory: EnumTypeDefinition
      ComparisonCounts: MessageTypeDefinition<_schemaforge_v1_ComparisonCounts, _schemaforge_v1_ComparisonCounts__Output>
      CreateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_CreateSchemaRequest, _schemaforge_v1_CreateSchemaRequest__Output>
      CreateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_CreateSchemaResponse, _schemaforge_v1_CreateSchemaResponse__Output>
      DataType: MessageTypeDefinition<_schemaforge_v1_DataType, _schemaforge_v1_DataType__Output>
      DataTypeKind: EnumTypeDefinition
      DeleteSchemaRequest: MessageTypeDefinition<_schemaforge_v1_DeleteSchemaRequest, _schemaforge_v1_DeleteSchemaRequest__Output>
      DeleteSchemaResponse: MessageTypeDefinition<_schemaforge_v1_DeleteSchemaResponse, _schemaforge_v1_DeleteSchemaResponse__Output>
      Diagnostic: MessageTypeDefinition<_schemaforge_v1_Diagnostic, _schemaforge_v1_Diagnostic__Output>
      Dialect: EnumTypeDefinition
      DifferenceKind: EnumTypeDefinition
      Entity: MessageTypeDefinition<_schemaforge_v1_Entity, _schemaforge_v1_Entity__Output>
      ExportFormat: EnumTypeDefinition
      ExportSchemaRequest: MessageTypeDefinition<_schemaforge_v1_ExportSchemaRequest, _schemaforge_v1_ExportSchemaRequest__Output>
      ExportSchemaResponse: MessageTypeDefinition<_schemaforge_v1_ExportSchemaResponse, _schemaforge_v1_ExportSchemaResponse__Output>
      ForeignKeyRef: MessageTypeDefinition<_schemaforge_v1_ForeignKeyRef, _schemaforge_v1_ForeignKeyRef__Output>
      GenerateDdlRequest: MessageTypeDefinition<_schemaforge_v1_GenerateDdlRequest, _schemaforge_v1_GenerateDdlRequest__Output>
      GenerateDdlResponse: MessageTypeDefinition<_schemaforge_v1_GenerateDdlResponse, _schemaforge_v1_GenerateDdlResponse__Output>
      GetSchemaRequest: MessageTypeDefinition<_schemaforge_v1_GetSchemaRequest, _schemaforge_v1_GetSchemaRequest__Output>
      GetSchemaResponse: MessageTypeDefinition<_schemaforge_v1_GetSchemaResponse, _schemaforge_v1_GetSchemaResponse__Output>
      ImportFormat: EnumTypeDefinition
      ImportSchemaRequest: MessageTypeDefinition<_schemaforge_v1_ImportSchemaRequest, _schemaforge_v1_ImportSchemaRequest__Output>
      ImportSchemaResponse: MessageTypeDefinition<_schemaforge_v1_ImportSchemaResponse, _schemaforge_v1_ImportSchemaResponse__Output>
      Invitation: MessageTypeDefinition<_schemaforge_v1_Invitation, _schemaforge_v1_Invitation__Output>
      ListPeopleRequest: MessageTypeDefinition<_schemaforge_v1_ListPeopleRequest, _schemaforge_v1_ListPeopleRequest__Output>
      ListPeopleResponse: MessageTypeDefinition<_schemaforge_v1_ListPeopleResponse, _schemaforge_v1_ListPeopleResponse__Output>
      ListSchemasRequest: MessageTypeDefinition<_schemaforge_v1_ListSchemasRequest, _schemaforge_v1_ListSchemasRequest__Output>
      ListSchemasResponse: MessageTypeDefinition<_schemaforge_v1_ListSchemasResponse, _schemaforge_v1_ListSchemasResponse__Output>
      ListSharedSchemasRequest: MessageTypeDefinition<_schemaforge_v1_ListSharedSchemasRequest, _schemaforge_v1_ListSharedSchemasRequest__Output>
      ListSharedSchemasResponse: MessageTypeDefinition<_schemaforge_v1_ListSharedSchemasResponse, _schemaforge_v1_ListSharedSchemasResponse__Output>
      Member: MessageTypeDefinition<_schemaforge_v1_Member, _schemaforge_v1_Member__Output>
      Position: MessageTypeDefinition<_schemaforge_v1_Position, _schemaforge_v1_Position__Output>
      Relationship: MessageTypeDefinition<_schemaforge_v1_Relationship, _schemaforge_v1_Relationship__Output>
      RevokeShareRequest: MessageTypeDefinition<_schemaforge_v1_RevokeShareRequest, _schemaforge_v1_RevokeShareRequest__Output>
      RevokeShareResponse: MessageTypeDefinition<_schemaforge_v1_RevokeShareResponse, _schemaforge_v1_RevokeShareResponse__Output>
      Schema: MessageTypeDefinition<_schemaforge_v1_Schema, _schemaforge_v1_Schema__Output>
      SchemaDifference: MessageTypeDefinition<_schemaforge_v1_SchemaDifference, _schemaforge_v1_SchemaDifference__Output>
      SchemaService: SubtypeConstructor<typeof grpc.Client, _schemaforge_v1_SchemaServiceClient> & { service: _schemaforge_v1_SchemaServiceDefinition }
      SchemaSummary: MessageTypeDefinition<_schemaforge_v1_SchemaSummary, _schemaforge_v1_SchemaSummary__Output>
      Severity: EnumTypeDefinition
      ShareRole: EnumTypeDefinition
      ShareSchemaRequest: MessageTypeDefinition<_schemaforge_v1_ShareSchemaRequest, _schemaforge_v1_ShareSchemaRequest__Output>
      ShareSchemaResponse: MessageTypeDefinition<_schemaforge_v1_ShareSchemaResponse, _schemaforge_v1_ShareSchemaResponse__Output>
      SharedSchema: MessageTypeDefinition<_schemaforge_v1_SharedSchema, _schemaforge_v1_SharedSchema__Output>
      UpdateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_UpdateSchemaRequest, _schemaforge_v1_UpdateSchemaRequest__Output>
      UpdateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_UpdateSchemaResponse, _schemaforge_v1_UpdateSchemaResponse__Output>
      ValidateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_ValidateSchemaRequest, _schemaforge_v1_ValidateSchemaRequest__Output>
      ValidateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_ValidateSchemaResponse, _schemaforge_v1_ValidateSchemaResponse__Output>
    }
  }
}

