import { ASTVisitor } from '../../language/visitor.d.ts';
import { ASTValidationContext } from '../ValidationContext.d.ts';

/**
 * Unique directive names per location
 *
 * A GraphQL document is only valid if all directives at a given location
 * are uniquely named.
 */
export function UniqueDirectivesPerLocationRule(
  context: ASTValidationContext,
): ASTVisitor;
