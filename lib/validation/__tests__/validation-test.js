import { expect } from 'chai.js';
import { describe, it } from 'mocha.js';
import { GraphQLError } from '../../error/GraphQLError.js';
import { parse } from '../../language/parser.js';
import { TypeInfo } from '../../utilities/TypeInfo.js';
import { buildSchema } from '../../utilities/buildASTSchema.js';
import { validate } from '../validate.js';
import { testSchema } from './harness.js';
describe('Validate: Supports full validation', () => {
  it('rejects invalid documents', () => {
    // $DisableFlowOnNegativeTest
    expect(() => validate(testSchema, null)).to.throw('Must provide document.');
  });
  it('validates queries', () => {
    const doc = parse(`
      query {
        catOrDog {
          ... on Cat {
            furColor
          }
          ... on Dog {
            isHouseTrained
          }
        }
      }
    `);
    const errors = validate(testSchema, doc);
    expect(errors).to.deep.equal([]);
  });
  it('detects bad scalar parse', () => {
    const doc = parse(`
      query {
        invalidArg(arg: "bad value")
      }
    `);
    const errors = validate(testSchema, doc);
    expect(errors).to.deep.equal([{
      locations: [{
        line: 3,
        column: 25
      }],
      message: 'Expected value of type "Invalid", found "bad value"; Invalid scalar is always invalid: "bad value"'
    }]);
  }); // NOTE: experimental

  it('validates using a custom TypeInfo', () => {
    // This TypeInfo will never return a valid field.
    const typeInfo = new TypeInfo(testSchema, () => null);
    const doc = parse(`
      query {
        catOrDog {
          ... on Cat {
            furColor
          }
          ... on Dog {
            isHouseTrained
          }
        }
      }
    `);
    const errors = validate(testSchema, doc, undefined, typeInfo);
    const errorMessages = errors.map(err => err.message);
    expect(errorMessages).to.deep.equal(['Cannot query field "catOrDog" on type "QueryRoot". Did you mean "catOrDog"?', 'Cannot query field "furColor" on type "Cat". Did you mean "furColor"?', 'Cannot query field "isHouseTrained" on type "Dog". Did you mean "isHouseTrained"?']);
  });
  it('validates using a custom rule', () => {
    const schema = buildSchema(`
      directive @custom(arg: String) on FIELD

      type Query {
        foo: String
      }
    `);
    const doc = parse(`
      query {
        name @custom
      }
    `);

    function customRule(context) {
      return {
        Directive(node) {
          const directiveDef = context.getDirective();
          const error = new GraphQLError('Reporting directive: ' + String(directiveDef), node);
          context.reportError(error);
        }

      };
    }

    const errors = validate(schema, doc, [customRule]);
    expect(errors).to.deep.equal([{
      message: 'Reporting directive: @custom',
      locations: [{
        line: 3,
        column: 14
      }]
    }]);
  });
});
describe('Validate: Limit maximum number of validation errors', () => {
  const query = `
    {
      firstUnknownField
      secondUnknownField
      thirdUnknownField
    }
  `;
  const doc = parse(query, {
    noLocation: true
  });

  function validateDocument(options) {
    return validate(testSchema, doc, undefined, undefined, options);
  }

  function invalidFieldError(fieldName) {
    return {
      message: `Cannot query field "${fieldName}" on type "QueryRoot".`,
      locations: []
    };
  }

  it('when maxErrors is equal to number of errors', () => {
    const errors = validateDocument({
      maxErrors: 3
    });
    expect(errors).to.be.deep.equal([invalidFieldError('firstUnknownField'), invalidFieldError('secondUnknownField'), invalidFieldError('thirdUnknownField')]);
  });
  it('when maxErrors is less than number of errors', () => {
    const errors = validateDocument({
      maxErrors: 2
    });
    expect(errors).to.be.deep.equal([invalidFieldError('firstUnknownField'), invalidFieldError('secondUnknownField'), {
      message: 'Too many validation errors, error limit reached. Validation aborted.'
    }]);
  });
  it('passthrough exceptions from rules', () => {
    function customRule() {
      return {
        Field() {
          throw new Error('Error from custom rule!');
        }

      };
    }

    expect(() => validate(testSchema, doc, [customRule], undefined, {
      maxErrors: 1
    })).to.throw(/^Error from custom rule!$/);
  });
});