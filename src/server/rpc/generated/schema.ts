import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { Attribute as _schemaforge_v1_Attribute, Attribute__Output as _schemaforge_v1_Attribute__Output } from './schemaforge/v1/Attribute';
import type { CreateSchemaRequest as _schemaforge_v1_CreateSchemaRequest, CreateSchemaRequest__Output as _schemaforge_v1_CreateSchemaRequest__Output } from './schemaforge/v1/CreateSchemaRequest';
import type { CreateSchemaResponse as _schemaforge_v1_CreateSchemaResponse, CreateSchemaResponse__Output as _schemaforge_v1_CreateSchemaResponse__Output } from './schemaforge/v1/CreateSchemaResponse';
import type { DataType as _schemaforge_v1_DataType, DataType__Output as _schemaforge_v1_DataType__Output } from './schemaforge/v1/DataType';
import type { DeleteSchemaRequest as _schemaforge_v1_DeleteSchemaRequest, DeleteSchemaRequest__Output as _schemaforge_v1_DeleteSchemaRequest__Output } from './schemaforge/v1/DeleteSchemaRequest';
import type { DeleteSchemaResponse as _schemaforge_v1_DeleteSchemaResponse, DeleteSchemaResponse__Output as _schemaforge_v1_DeleteSchemaResponse__Output } from './schemaforge/v1/DeleteSchemaResponse';
import type { Diagnostic as _schemaforge_v1_Diagnostic, Diagnostic__Output as _schemaforge_v1_Diagnostic__Output } from './schemaforge/v1/Diagnostic';
import type { Entity as _schemaforge_v1_Entity, Entity__Output as _schemaforge_v1_Entity__Output } from './schemaforge/v1/Entity';
import type { ForeignKeyRef as _schemaforge_v1_ForeignKeyRef, ForeignKeyRef__Output as _schemaforge_v1_ForeignKeyRef__Output } from './schemaforge/v1/ForeignKeyRef';
import type { GenerateDdlRequest as _schemaforge_v1_GenerateDdlRequest, GenerateDdlRequest__Output as _schemaforge_v1_GenerateDdlRequest__Output } from './schemaforge/v1/GenerateDdlRequest';
import type { GenerateDdlResponse as _schemaforge_v1_GenerateDdlResponse, GenerateDdlResponse__Output as _schemaforge_v1_GenerateDdlResponse__Output } from './schemaforge/v1/GenerateDdlResponse';
import type { GetSchemaRequest as _schemaforge_v1_GetSchemaRequest, GetSchemaRequest__Output as _schemaforge_v1_GetSchemaRequest__Output } from './schemaforge/v1/GetSchemaRequest';
import type { GetSchemaResponse as _schemaforge_v1_GetSchemaResponse, GetSchemaResponse__Output as _schemaforge_v1_GetSchemaResponse__Output } from './schemaforge/v1/GetSchemaResponse';
import type { ListSchemasRequest as _schemaforge_v1_ListSchemasRequest, ListSchemasRequest__Output as _schemaforge_v1_ListSchemasRequest__Output } from './schemaforge/v1/ListSchemasRequest';
import type { ListSchemasResponse as _schemaforge_v1_ListSchemasResponse, ListSchemasResponse__Output as _schemaforge_v1_ListSchemasResponse__Output } from './schemaforge/v1/ListSchemasResponse';
import type { Position as _schemaforge_v1_Position, Position__Output as _schemaforge_v1_Position__Output } from './schemaforge/v1/Position';
import type { Relationship as _schemaforge_v1_Relationship, Relationship__Output as _schemaforge_v1_Relationship__Output } from './schemaforge/v1/Relationship';
import type { Schema as _schemaforge_v1_Schema, Schema__Output as _schemaforge_v1_Schema__Output } from './schemaforge/v1/Schema';
import type { SchemaServiceClient as _schemaforge_v1_SchemaServiceClient, SchemaServiceDefinition as _schemaforge_v1_SchemaServiceDefinition } from './schemaforge/v1/SchemaService';
import type { SchemaSummary as _schemaforge_v1_SchemaSummary, SchemaSummary__Output as _schemaforge_v1_SchemaSummary__Output } from './schemaforge/v1/SchemaSummary';
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
      Attribute: MessageTypeDefinition<_schemaforge_v1_Attribute, _schemaforge_v1_Attribute__Output>
      Cardinality: EnumTypeDefinition
      CreateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_CreateSchemaRequest, _schemaforge_v1_CreateSchemaRequest__Output>
      CreateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_CreateSchemaResponse, _schemaforge_v1_CreateSchemaResponse__Output>
      DataType: MessageTypeDefinition<_schemaforge_v1_DataType, _schemaforge_v1_DataType__Output>
      DataTypeKind: EnumTypeDefinition
      DeleteSchemaRequest: MessageTypeDefinition<_schemaforge_v1_DeleteSchemaRequest, _schemaforge_v1_DeleteSchemaRequest__Output>
      DeleteSchemaResponse: MessageTypeDefinition<_schemaforge_v1_DeleteSchemaResponse, _schemaforge_v1_DeleteSchemaResponse__Output>
      Diagnostic: MessageTypeDefinition<_schemaforge_v1_Diagnostic, _schemaforge_v1_Diagnostic__Output>
      Dialect: EnumTypeDefinition
      Entity: MessageTypeDefinition<_schemaforge_v1_Entity, _schemaforge_v1_Entity__Output>
      ForeignKeyRef: MessageTypeDefinition<_schemaforge_v1_ForeignKeyRef, _schemaforge_v1_ForeignKeyRef__Output>
      GenerateDdlRequest: MessageTypeDefinition<_schemaforge_v1_GenerateDdlRequest, _schemaforge_v1_GenerateDdlRequest__Output>
      GenerateDdlResponse: MessageTypeDefinition<_schemaforge_v1_GenerateDdlResponse, _schemaforge_v1_GenerateDdlResponse__Output>
      GetSchemaRequest: MessageTypeDefinition<_schemaforge_v1_GetSchemaRequest, _schemaforge_v1_GetSchemaRequest__Output>
      GetSchemaResponse: MessageTypeDefinition<_schemaforge_v1_GetSchemaResponse, _schemaforge_v1_GetSchemaResponse__Output>
      ListSchemasRequest: MessageTypeDefinition<_schemaforge_v1_ListSchemasRequest, _schemaforge_v1_ListSchemasRequest__Output>
      ListSchemasResponse: MessageTypeDefinition<_schemaforge_v1_ListSchemasResponse, _schemaforge_v1_ListSchemasResponse__Output>
      Position: MessageTypeDefinition<_schemaforge_v1_Position, _schemaforge_v1_Position__Output>
      Relationship: MessageTypeDefinition<_schemaforge_v1_Relationship, _schemaforge_v1_Relationship__Output>
      Schema: MessageTypeDefinition<_schemaforge_v1_Schema, _schemaforge_v1_Schema__Output>
      SchemaService: SubtypeConstructor<typeof grpc.Client, _schemaforge_v1_SchemaServiceClient> & { service: _schemaforge_v1_SchemaServiceDefinition }
      SchemaSummary: MessageTypeDefinition<_schemaforge_v1_SchemaSummary, _schemaforge_v1_SchemaSummary__Output>
      Severity: EnumTypeDefinition
      UpdateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_UpdateSchemaRequest, _schemaforge_v1_UpdateSchemaRequest__Output>
      UpdateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_UpdateSchemaResponse, _schemaforge_v1_UpdateSchemaResponse__Output>
      ValidateSchemaRequest: MessageTypeDefinition<_schemaforge_v1_ValidateSchemaRequest, _schemaforge_v1_ValidateSchemaRequest__Output>
      ValidateSchemaResponse: MessageTypeDefinition<_schemaforge_v1_ValidateSchemaResponse, _schemaforge_v1_ValidateSchemaResponse__Output>
    }
  }
}

