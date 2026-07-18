import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Asserts that `data` satisfies the given JSON Schema contract.
 * Throws with a readable, itemised message (which field, which rule) on
 * mismatch instead of a generic boolean failure - this is what makes a
 * failing contract test actually actionable.
 */
export function assertMatchesContract(schema: object, data: unknown): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    const details = (validate.errors ?? [])
      .map((e) => `  - ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    throw new Error(`Response does not match contract:\n${details}`);
  }
}