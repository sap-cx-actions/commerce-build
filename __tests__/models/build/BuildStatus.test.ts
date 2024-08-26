import { BuildStatus } from '../../../src/models/build'

describe('BuildStatus', () => {
  it('should have a SUCCESS status', () => {
    expect(BuildStatus.SUCCESS).toBe('SUCCESS');
  });

  it('should have a FAIL status', () => {
    expect(BuildStatus.FAIL).toBe('FAIL');
  });

  it('should have a BUILDING status', () => {
    expect(BuildStatus.BUILDING).toBe('BUILDING');
  });

  it('should have a CANCELED status', () => {
    expect(BuildStatus.CANCELED).toBe('CANCELED');
  });
});