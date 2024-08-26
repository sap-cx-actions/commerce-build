import { BuildResponse, BuildStatus, Property } from '../../../src/models/build'

describe('BuildResponse', () => {
  it('should have the correct properties', () => {
    const buildResponse: BuildResponse = {
      applicationCode: 'commerce-cloud',
      applicationDefinitionVersion: '2501-3',
      branch: 'release/v1.0.0',
      buildEndTimestamp: new Date(),
      buildStartTimestamp: new Date(),
      buildVersion: '2211.27-2211-20240809-020242-20240825.1ea95e74-release/v1.0.0',
      code: '20240823.3',
      createdBy: 'S0023123456',
      deployed: true,
      hasSnapshot: false,
      isPreview: false,
      name: 'Release v1.0.0',
      properties: [] as Property[],
      status: BuildStatus.BUILDING,
      subscriptionCode: '458eba4f7e7cdaa9f9275c22c2dc9cbc'
    };

    expect(buildResponse).toHaveProperty('applicationCode', 'commerce-cloud');
    expect(buildResponse).toHaveProperty('applicationDefinitionVersion', '2501-3');
    expect(buildResponse).toHaveProperty('branch', 'release/v1.0.0');
    expect(buildResponse).toHaveProperty('buildEndTimestamp');
    expect(buildResponse).toHaveProperty('buildStartTimestamp');
    expect(buildResponse).toHaveProperty('buildVersion', '2211.27-2211-20240809-020242-20240825.1ea95e74-release/v1.0.0');
    expect(buildResponse).toHaveProperty('code', '20240823.3');
    expect(buildResponse).toHaveProperty('createdBy', 'S0023123456');
    expect(buildResponse).toHaveProperty('deployed', true);
    expect(buildResponse).toHaveProperty('hasSnapshot', false);
    expect(buildResponse).toHaveProperty('isPreview', false);
    expect(buildResponse).toHaveProperty('name', 'Release v1.0.0');
    expect(buildResponse).toHaveProperty('properties', []);
    expect(buildResponse).toHaveProperty('status', BuildStatus.BUILDING);
    expect(buildResponse).toHaveProperty('subscriptionCode', '458eba4f7e7cdaa9f9275c22c2dc9cbc');
  });
});