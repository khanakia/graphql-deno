import { NamedTypeNode, ListTypeNode, NonNullTypeNode } from '../language/ast.d.ts';
import { GraphQLSchema } from '../type/schema.d.ts';
import {
  GraphQLNamedType,
  GraphQLList,
  GraphQLNonNull,
} from '../type/definition.d.ts';

/**
 * Given a Schema and an AST node describing a type, return a GraphQLType
 * definition which applies to that type. For example, if provided the parsed
 * AST node for `[User]`, a GraphQLList instance will be returned, containing
 * the type called "User" found in the schema. If a type called "User" is not
 * found in the schema, then undefined will be returned.
 */
export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: NamedTypeNode,
): GraphQLNamedType | undefined;

export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: ListTypeNode,
): GraphQLList<any> | undefined;

export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: NonNullTypeNode,
): GraphQLNonNull<any> | undefined;
