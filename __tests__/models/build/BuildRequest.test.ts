import { BuildRequest } from '../../../src/models/build'

describe('BuildRequest', () => {
  it('should have the correct properties', () => {
    const buildRequest: BuildRequest = {
      applicationCode: 'appCode',
      branch: 'release/v1.0.0',
      name: 'Release v1.0.0'
    };

    expect(buildRequest).toHaveProperty('applicationCode', 'appCode');
    expect(buildRequest).toHaveProperty('branch', 'release/v1.0.0');
    expect(buildRequest).toHaveProperty('name', 'Release v1.0.0');
  });
});