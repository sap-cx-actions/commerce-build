import { Property } from '../../../src/models/build';

describe('Property', () => {
  it('should have a key property', () => {
    const property: Property = { key: 'exampleKey', value: 'exampleValue' };
    expect(property).toHaveProperty('key', 'exampleKey');
  });

  it('should have a value property', () => {
    const property: Property = { key: 'exampleKey', value: 'exampleValue' };
    expect(property).toHaveProperty('value', 'exampleValue');
  });
});