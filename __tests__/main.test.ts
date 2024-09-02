import * as core from '@actions/core';
import { run } from '../src/main';
import { BuildService } from '@sap-cx-actions/commerce-services';
import { BuildRequest, BuildResponse, BuildStatus } from '@sap-cx-actions/models';

jest.mock('@actions/core');
jest.mock('@sap-cx-actions/commerce-services');

describe('run', () => {
  let getInputMock: jest.SpyInstance;
  let setOutputMock: jest.SpyInstance;
  let setFailedMock: jest.SpyInstance;
  let buildServiceMock: jest.Mocked<BuildService>;

  beforeEach(() => {
    getInputMock = jest.spyOn(core, 'getInput');
    setOutputMock = jest.spyOn(core, 'setOutput');
    setFailedMock = jest.spyOn(core, 'setFailed');
    buildServiceMock = new BuildService('token', 'subscriptionCode') as jest.Mocked<BuildService>;
    (BuildService as jest.Mock).mockReturnValue(buildServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should trigger the build and set outputs correctly', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'false',
        maxRetries: '3',
        notify: 'false',
        webhookUrl: ''
      };
      return inputs[name];
    });

    const buildResponse: BuildResponse = {
      applicationCode: 'commerce-cloud',
      applicationDefinitionVersion: '1.0.0',
      branch: 'main',
      buildEndTimestamp: new Date(),
      buildStartTimestamp: new Date(),
      buildVersion: '1.0.0',
      code: 'build-code',
      createdBy: 'user',
      deployed: false,
      hasSnapshot: false,
      isPreview: false,
      name: 'test-build',
      properties: [],
      status: BuildStatus.BUILDING,
      subscriptionCode: 'test-subscription'
    };

    buildServiceMock.createBuild.mockResolvedValue(buildResponse);
    buildServiceMock.getBuild.mockResolvedValue(buildResponse);

    await run();

    expect(buildServiceMock.createBuild).toHaveBeenCalledWith({
      applicationCode: 'commerce-cloud',
      branch: 'main',
      name: 'test-build'
    } as BuildRequest);
    expect(buildServiceMock.getBuild).toHaveBeenCalledWith('build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildCode', 'build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildStatus', BuildStatus.BUILDING);
  });

  it('should handle errors during build process', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'false',
        maxRetries: '3',
        notify: 'false',
        webhookUrl: ''
      };
      return inputs[name];
    });

    const error = new Error('Build failed');
    buildServiceMock.createBuild.mockRejectedValue(error);

    await run();

    expect(setFailedMock).toHaveBeenCalledWith('Error during build process: Build failed');
  });
});
